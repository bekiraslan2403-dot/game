import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { ayiAc, ayiBitir } from "../../cekirdek/ay.ts";
import { yeniOyun, type MasaKarti } from "../../cekirdek/durum.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { meclisOylamasi } from "../../cekirdek/politika.ts";
import { oylamayiSay } from "../../cekirdek/meclis.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;

test("eski tutanakta 319 evet eşiği 22 aşar; aynı transfer 297 evette belirleyicidir", async () => {
  const d = yeniOyun(401);
  d.ay = 2;
  d.bayraklar.vekil_transfer_sandalye = 1;
  ayiAc(d, I);
  const r = oylamayiSay(d, I, d.meclis.oylamalar[0]!);
  d.meclis.oylamalar = [];
  d.meclisGundemi = [];
  const gecen = r.oylar.find(v => v.grup === "transfer")!;
  gecen.oy = "evet";
  gecen.fire = false;
  const kalan = r.oylar.filter(v => v !== gecen);
  const browser = await chromium.launch();
  try {
    for (const evet of [319, 297]) {
      r.evet = evet;
      r.cekimser = 9;
      r.hayir = 592 - evet - 9;
      r.sonuc = "kabul";
      kalan.forEach((v, i) => { v.oy = i < evet - 1 ? "evet" : i < evet - 1 + 9 ? "cekimser" : "hayir"; v.fire = false; });
      const save = kaydet(d);
      assert.ok(yukle(save).ok);
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      try {
        const p = await ctx.newPage();
        await p.addInitScript(s => localStorage.setItem("akkopru-2026:otomatik", s), save);
        await p.goto("file://" + root + "/dist/index.html");
        await p.getByRole("button", { name: /Meclis ve kulis/ }).click();
        await p.getByRole("button", { name: /Aralık 2026 · Emekli aylığı ve ikramiye/ }).click();
        const dialog = p.getByRole("dialog", { name: "Meclis oylaması" });
        await dialog.getByText(evet === 319 ? "Eşiğin 22 oy üzerinde" : "Tam eşikte", { exact: false }).waitFor();
        await dialog.getByText(evet === 319 ? /çekimser kalsaydı sonuç değişmezdi/ : /çekimser kalsaydı sonuç değişirdi/).waitFor();
        await dialog.getByText(/kaydedildiği eski sürümden/).waitFor();
        assert.equal(await dialog.getByLabel("Oylamanın oyundaki etkisi").count(), 0);
        const tablo = dialog.getByRole("table", { name: "Grup grup oylar" });
        assert.equal(await tablo.count(), 0);
        await dialog.getByText("Partilere göre oylar", { exact: true }).click();
        await tablo.waitFor();
        const satirlar = await tablo.locator("tbody tr").all();
        const toplamlar = [0, 0, 0];
        for (const satir of satirlar) {
          (await satir.getByRole("cell").allTextContents()).forEach((v, i) => { toplamlar[i] = toplamlar[i]! + Number(v); });
        }
        assert.deepEqual(toplamlar, [evet, r.hayir, 9]);
      } finally {
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test("Şubat tutanağından Karaburç kararına geçilir ve baskı sicile kaydedilir", async () => {
  let d = yeniOyun(1);
  for (let tohum = 1; tohum <= 80; tohum++) {
    d = yeniOyun(tohum);
    d.ay = 4;
    ayiAc(d, I);
    d.masa = [];
    const kapanis = ayiBitir(d, I);
    assert.ok(kapanis.ok);
    if (kapanis.durum.meclis.sonuclar[0]?.sonuc === "kabul") break;
  }
  const browser = await chromium.launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const key = "akkopru-2026:otomatik";
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto("file://" + root + "/dist/index.html");
    await p.getByRole("button", { name: "Ayı bitir", exact: true }).click();
    const etki = p.getByLabel("Oylamanın oyundaki etkisi", { exact: true });
    await etki.getByText("Kura listesinde iki isim eksik", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Devam et", exact: true }).click();
    await p.getByRole("button", { name: /masasına geç/ }).click();
    await p.getByRole("button", { name: /Kura listesinde iki isim eksik/ }).click();
    await p.getByRole("button", { name: /Bakanın listesini kurula kapalı yazıyla gönder/ }).click();
    await p.getByLabel("Kararın sonucu", { exact: true }).getByText(/Kurul sekreteri yazıyı giriş defterine aldı/).waitFor();
    const kayit = yukle(await p.evaluate(k => localStorage.getItem(k)!, key));
    assert.ok(kayit.ok);
    assert.ok(kayit.durum.sicil.some(s => s.tur === "baski" && s.kaynak.includes("Karaburç")));
    assert.ok(kayit.durum.bekleyen.some(k => k.kart === "yargi_oylama_liste" && k.ay === 6));
    const tarihliDosya = "Nisan 2027 · Giriş defterindeki ikinci nüsha";
    await p.getByRole("region", { name: "Sıradaki dosya", exact: true }).getByText(tarihliDosya, { exact: true }).waitFor();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.reload();
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    await p.getByRole("button", { name: "Karar ve rapor arşivi", exact: true }).click();
    await p.getByLabel("Ay seç", { exact: true }).selectOption("5");
    await p.getByRole("region", { name: "Bu kararla açılan dosya", exact: true }).getByText(tarihliDosya, { exact: true }).waitFor();
    const arsiv = p.getByRole("dialog", { name: "Karar ve rapor arşivi", exact: true });
    await arsiv.getByText(/Kurul sekreteri yazıyı giriş defterine aldı/).waitFor();
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  } finally {
    await browser.close();
  }
});

test("telefonda komisyonun imzalı eki oylama arşivinde üç ayın kararlarını birleştirir", async () => {
  let d: ReturnType<typeof yeniOyun> | undefined;
  for (let tohum = 1; tohum <= 80 && !d; tohum++) {
    const aday = yeniOyun(tohum);
    aday.ay = 4;
    ayiAc(aday, I);
    meclisOylamasi(aday, I);
    if (aday.meclis.sonuclar[0]?.sonuc === "kabul") d = aday;
  }
  assert.ok(d);
  for (const [ay, kart, sec] of [[5, "yargi_oylama_kabul", 1], [6, "yargi_oylama_liste", 1]] as const) {
    d.ay = ay;
    ayiAc(d, I);
    const dosya: MasaKarti = d.masa.find(k => k.kart === kart)!;
    assert.ok(kararVer(d, I, dosya.ornek, sec).ok);
    d.gecmis.push(d.buAy);
  }
  d.ay = 7;
  ayiAc(d, I);

  const browser = await chromium.launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const key = "akkopru-2026:otomatik";
    const url = "https://akkopru.test/";
    await p.route(url, route => route.fulfill({ path: root + "/dist/index.html", contentType: "text/html" }));
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto(url);
    await p.getByRole("button", { name: /Meclis ve kulis/ }).click();
    await p.getByRole("button", { name: /Şubat 2027 · Yargı/ }).click();
    const gecmis = p.getByRole("region", { name: "Karaburç adliyesinin uygulama geçmişi" });
    await gecmis.getByText(/Mart 2027 · Kura listesinde iki isim eksik/).waitFor();
    await gecmis.getByText(/Nisan 2027 · Giriş defterindeki ikinci nüsha/).waitFor();
    await gecmis.getByText("Masada karar bekliyor", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Tutanaklara dön", exact: true }).click();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.getByRole("button", { name: /İmzalı ekin istendiği oturum/ }).click();
    await p.getByRole("button", { name: /İmzalı eki teslim et, kişisel bilgileri ayıklayıp yetki zincirini yayımla/ }).click();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.reload();
    await p.getByRole("button", { name: /Meclis ve kulis/ }).click();
    await p.getByRole("button", { name: /Şubat 2027 · Yargı/ }).click();
    await gecmis.getByText(/Mayıs 2027 · İmzalı ekin istendiği oturum/).waitFor();
    await gecmis.getByText(/Aylin’in dava evrakı mahkemede kaldı/).waitFor();
    assert.equal(await gecmis.getByText("Masada karar bekliyor", { exact: true }).count(), 0);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  } finally {
    await browser.close();
  }
});
