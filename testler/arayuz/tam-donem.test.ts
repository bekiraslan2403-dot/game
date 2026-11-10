import { botKarari } from "../yardim/bot.ts";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { fileURLToPath } from "node:url";
import { readFileSync, mkdirSync } from "node:fs";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { secimiHazirla } from "../../cekirdek/secim.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
const root = fileURLToPath(new URL("../..", import.meta.url)),
  url = "file://" + root + "/dist/index.html";
const I = icerikDerle(root + "/icerik").paket!;
let browser: Browser;
before(async () => {
  browser = await chromium.launch();
  mkdirSync(root + "/testler/ciktilar", { recursive: true });
});
after(async () => {
  await browser?.close();
});
async function boyut(p: Page) {
  await p.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); });
  const r = await p.evaluate(() => ({
    tasma: document.documentElement.scrollWidth > innerWidth,
    pencere: [...document.querySelectorAll<HTMLElement>(".pencere")].some(
      (e) => e.scrollWidth > e.clientWidth,
    ),
    kucuk: [...document.querySelectorAll("button,select")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height < 44;
      })
      .map((e) => e.textContent),
  }));
  assert.deepEqual(r, { tasma: false, pencere: false, kucuk: [] });
}
for (const [ad, width, height] of [
  ["masaustu", 1366, 900],
  ["telefon", 440, 956],
] as const) {
  test(`${ad}: ilk gece görüşmesi güven ve belgeyi değiştirir; yenileme konuşmayı sıfırlamaz`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const p = await ctx.newPage();
    const hatalar: string[] = [];
    p.on("pageerror", e => hatalar.push(e.message));
    await p.goto(url);
    await p.getByRole("button", { name: "Göreve başla", exact: true }).click();
    await p.getByRole("button", { name: "Telefonu al", exact: true }).click();
    await p.locator(".dosya-anlatisi").waitFor();
    await p.getByText(/Masadaki belgeleri incele/).click();
    await p.getByText("Ölçüm kâğıdı", { exact: true }).waitFor();
    const beklenenGun = ad === "masaustu" ? 3 : 4;
    if (ad === "masaustu") {
      await p.getByText("Danışmana sor", { exact: true }).click();
      await p.getByRole("button", { name: "Ek değerlendirme iste · 1 gün", exact: true }).click();
      await p.getByLabel("Danışman değerlendirmesi", { exact: true }).waitFor();
    }
    await p.getByRole("button", { name: "Deniz’i dinle", exact: true }).click();
    await p.locator(".anlati-sahnesi").waitFor();
    assert.equal(await p.getByRole("dialog").count(), 1);
    await p.locator(".anlati-sahnesi .secenek").first().click();
    await p.getByRole("button", { name: "Konuşmayı sürdür", exact: true }).waitFor();
    assert.equal(await p.getByText("Sana güveniyor", { exact: true }).count(), 0);
    await p.reload();
    await p.getByRole("button", { name: "Konuşmayı sürdür", exact: true }).waitFor();
    const ilk = await p.evaluate(() => JSON.parse(localStorage.getItem("akkopru-2026:otomatik")!).durum);
    assert.equal(ilk.bosGun, beklenenGun);
    assert.equal(ilk.anlati.notlar.length, 1);
    assert.equal(ilk.anlati.sahne.adim, 0);
    await p.getByRole("button", { name: "Konuşmayı sürdür", exact: true }).click();
    await p.getByRole("button", { name: "Ham kaydı bağımsız uzmana teslim et", exact: true }).click();
    await p.getByRole("button", { name: "Konuşmayı sürdür", exact: true }).click();
    await p.getByRole("button", { name: "Durumu yazılı bildir; görev işlemlerini bakanlıktan takip ettireceğim", exact: true }).click();
    await p.waitForTimeout(200);
    await boyut(p);
    await p.screenshot({ path: root + `/testler/ciktilar/${ad}-anlati.png` });
    await p.reload();
    await p.getByRole("button", { name: "Dosyaya dön", exact: true }).click();
    await p.locator(".karar-dosyasi").waitFor();
    await p.getByText("Görüşmede öğrendiklerin · 3 not", { exact: true }).waitFor();
    await p.waitForTimeout(200);
    await boyut(p);
    assert.equal(await p.getByRole("button", { name: "Deniz’i dinle", exact: true }).count(), 0);
    await p.locator(".karar-dosyasi .secenek").first().click();
    const yanit = I.kartlar.akkopru_telefon!.secenekler[0]!.tepkiler![0]!.metin;
    await p.locator(".sonuc .karar-tepkileri").getByText(yanit, { exact: true }).waitFor();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    const metin = await p.evaluate(() => localStorage.getItem("akkopru-2026:otomatik")!);
    const kayit = yukle(metin); assert.ok(kayit.ok);
    if (kayit.ok) {
      assert.equal(kayit.durum.anlati.sahne, null);
      assert.equal(kayit.durum.bayraklar.akkopru_ham_veri, true);
      assert.equal(kayit.durum.anlati.notlar.length, 3);
      assert.equal(kayit.durum.bosGun, beklenenGun);
      assert.ok(kayit.durum.buAy.olaylar.some(o => o.startsWith("Hikâye —")));
    }
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });

  test(`${ad}: rapor arşivi eski ayı gösterir, karar arar ve kaydı değiştirmez`, async () => {
    let d = oyunuBaslat(yeniOyun(410), I);
    for (let ay = 0; ay < 2; ay++) {
      while (d.masa.length) assert.ok(botKarari(d, I, d.masa[0]!.ornek, 0).ok);
      const r = ayiBitir(d, I);
      assert.ok(r.ok);
      if (r.ok) d = r.durum;
    }
    // Bugünün değerleri tarihî raporu değiştirmemeli.
    d.gostergeler.enflasyon = 99;
    const ctx = await browser.newContext({ viewport: { width, height } });
    const p = await ctx.newPage();
    const hatalar: string[] = [];
    p.on("pageerror", e => hatalar.push(e.message));
    await p.addInitScript({ content: `if(!localStorage.getItem('akkopru-2026:otomatik'))localStorage.setItem('akkopru-2026:otomatik',${JSON.stringify(kaydet(d))});` });
    await p.goto(url);
    const once = await p.evaluate(() => JSON.parse(localStorage.getItem("akkopru-2026:otomatik")!).durum);
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    await p.getByRole("button", { name: "Karar ve rapor arşivi", exact: true }).click();
    assert.equal(await p.getByRole("dialog").count(), 1);
    await p.getByLabel("Ay seç", { exact: true }).selectOption("1");
    await p.locator(".arsiv-rapor").getByText(d.gecmis[0]!.kararlar[0]!.baslik, { exact: true }).waitFor();
    assert.ok(!(await p.locator(".arsiv-rapor").innerText()).includes("%99,0"));
    assert.ok(!(await p.locator(".arsiv-rapor").innerText()).includes("Market sepeti bu ay"));
    await p.getByLabel("Bütün kararlarda ara", { exact: true }).fill(d.gecmis[0]!.kararlar[0]!.baslik.toLocaleUpperCase("tr-TR"));
    await p.locator(".arsiv-sonuclar").getByText(d.gecmis[0]!.kararlar[0]!.secenekMetni, { exact: true }).first().waitFor();
    await p.getByLabel("Bütün kararlarda ara", { exact: true }).fill("eşleşmeyen-dosya-xyz");
    await p.getByText("Bu ifadeyle eşleşen bir karar yok.", { exact: true }).waitFor();
    await p.getByLabel("Ay seç", { exact: true }).selectOption("3");
    await p.getByText("Ay bitince sonuç raporu buraya eklenecek.", { exact: true }).waitFor();
    await p.getByLabel("Ay seç", { exact: true }).selectOption("1");
    await p.waitForTimeout(200);
    await boyut(p);
    await p.screenshot({ path: root + `/testler/ciktilar/${ad}-arsiv.png` });
    const sonra = await p.evaluate(() => JSON.parse(localStorage.getItem("akkopru-2026:otomatik")!).durum);
    assert.deepEqual(sonra, once);
    await p.getByRole("button", { name: "Menüye dön", exact: true }).click();
    await p.getByRole("button", { name: "Oyuna dön", exact: true }).click();
    await p.reload();
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    await p.getByRole("button", { name: "Karar ve rapor arşivi", exact: true }).click();
    assert.equal(await p.getByLabel("Ay seç", { exact: true }).locator("option").count(), 3);
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });

  test(`${ad}: ajanda, medya, basın, üç yuva ve dosyaya kayıt gerçek arayüzde çalışır`, async () => {
    const ctx = await browser.newContext({
      viewport: { width, height },
      acceptDownloads: true,
    });
    const p = await ctx.newPage();
    const hatalar: string[] = [];
    p.on("pageerror", (e) => hatalar.push(e.message));
    await p.goto(url);
    await p.getByRole("button", { name: "Göreve başla", exact: true }).click();
    await p.getByRole("button", { name: /Ajandayı aç/ }).click();
    await p.locator(".ajanda").waitFor();
    await p.getByLabel("Seçmen grubu", { exact: true }).selectOption("grup.genc");
    await p.getByRole("button", { name: "Anket yaptır", exact: true }).click();
    await p
      .getByText(/3 boş gün/)
      .first()
      .waitFor();
    await boyut(p);
    await p.screenshot({ path: root + `/testler/ciktilar/${ad}-ajanda.png` });
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.locator(".dosya-satir").first().click();
    await p.locator(".secenek:not(:disabled)").first().click();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p
      .getByRole("button", { name: "Gündemi takip et", exact: true })
      .click();
    await p.locator(".gundem").waitFor();
    assert.equal(await p.locator(".kurulus-listesi li").count(), 6);
    assert.equal(await p.locator(".paylasim").count(), 4);
    await boyut(p);
    await p.screenshot({ path: root + `/testler/ciktilar/${ad}-gundem.png` });
    const onceSoz = await p.evaluate(() => JSON.parse(localStorage.getItem("akkopru-2026:otomatik")!).durum.ekonomi.sozler.length);
    await p.getByRole("button", { name: "Kürsüye çık", exact: true }).click();
    await p.locator(".basin-sahnesi").waitFor();
    assert.equal(await p.getByRole("dialog").count(), 1);
    await p
      .getByRole("button", { name: /Rakamları olduğundan iyi göster/ })
      .click();
    await p.reload();
    await p.getByRole("heading", { name: "2. soru", exact: true }).waitFor();
    await boyut(p);
    await p.screenshot({ path: root + `/testler/ciktilar/${ad}-basin.png` });
    await p.getByRole("button", { name: /Yeni bir destek sözü ver/ }).click();
    await p.getByRole("button", { name: /Açık ve dürüst cevapla/ }).click();
    await p.getByRole("heading", { name: "Toplantı sona erdi" }).waitFor();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    await p
      .getByRole("button", { name: "Bu yuvaya kaydet", exact: true })
      .first()
      .click();
    await p.getByText("Oyun 1. yuvaya kaydedildi.").waitFor();
    await p.getByLabel("Tema", { exact: true }).selectOption("koyu");
    await p.getByLabel("Yazı boyutu", { exact: true }).selectOption("en-buyuk");
    await boyut(p);
    await p.screenshot({ path: root + `/testler/ciktilar/${ad}-menu.png` });
    const [download] = await Promise.all([
      p.waitForEvent("download"),
      p
        .getByRole("button", { name: "Kaydı dosyaya indir", exact: true })
        .click(),
    ]);
    const dosya = await download.path();
    assert.ok(dosya);
    const k = JSON.parse(readFileSync(dosya!, "utf8"));
    assert.equal(k.durum.bosGun, 3);
    assert.equal(k.durum.yonetim.medya.gecmis.length, 3);
    assert.equal(k.durum.ekonomi.sozler.length, onceSoz + 1);
    await p
      .getByLabel("Kayıt dosyası seç", { exact: true })
      .setInputFiles({
        name: "bozuk.json",
        mimeType: "application/json",
        buffer: Buffer.from("{}"),
      });
    await p
      .getByRole("status")
      .filter({ hasText: /bir Akköprü 2026 kaydı değil/ })
      .waitFor();
    await p.getByRole("button", { name: "Oyuna dön", exact: true }).click();
    await p.reload();
    assert.equal(
      await p.evaluate(() => document.documentElement.dataset.tema),
      "koyu",
    );
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    await p
      .getByRole("button", { name: "Bu yuvayı yükle", exact: true })
      .first()
      .click();
    await p
      .getByRole("button", { name: "Kaydı yüklemeyi onayla", exact: true })
      .click();
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    p.once("dialog", (d) => d.accept());
    await p.getByLabel("Kayıt dosyası seç", { exact: true }).setInputFiles({
      name: "gecerli.json",
      mimeType: "application/json",
      buffer: readFileSync(dosya!),
    });
    await p.locator(".oyun-menusu").waitFor({ state: "detached" });
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    await p.getByRole("button", { name: "Yeni dönem başlat", exact: true }).click();
    const eski = await p.evaluate(() => JSON.parse(localStorage.getItem("akkopru-2026:otomatik")!).durum);
    assert.equal(eski.yonetim.medya.gecmis.length, 3, "İlk tıklama oyunu değiştirmemeli");
    await p.getByRole("button", { name: "Yeni dönem başlatmayı onayla", exact: true }).click();
    await p.locator(".oyun-menusu").waitFor({ state: "detached" });
    await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
    await p.getByRole("button", { name: "Son yükleme öncesindeki oyuna dön", exact: true }).click();
    await p.getByRole("button", { name: "Önceki oyunu yüklemeyi onayla", exact: true }).click();
    await p.locator(".oyun-menusu").waitFor({ state: "detached" });
    const donus = await p.evaluate(() => JSON.parse(localStorage.getItem("akkopru-2026:otomatik")!).durum);
    assert.equal(donus.yonetim.medya.gecmis.length, 3);
    assert.equal(donus.bosGun, 3);
    assert.deepEqual(hatalar, []);
    await ctx.close();
  });
}
function sonAyaGel() {
  let d = oyunuBaslat(yeniOyun(2026), I);
  while (d.ay < 18 && !d.bitis) {
    let i = 0;
    while (d.masa.length) botKarari(d, I, d.masa[0]!.ornek, i++ % 3);
    const r = ayiBitir(d, I);
    if (!r.ok) throw Error(r.neden);
    d = r.durum;
  }
  return d;
}
test("tarayıcıda kampanyadan seçim gecesine, ikinci tura ve sonsöze tam akış", async () => {
  const d = sonAyaGel();
  assert.equal(d.ay, 18);
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 900 },
  });
  const p = await ctx.newPage();
  const hatalar: string[] = [];
  p.on("pageerror", (e) => hatalar.push(e.message));
  await p.addInitScript({
    content: `if(!localStorage.getItem('akkopru-2026:otomatik'))localStorage.setItem('akkopru-2026:otomatik',${JSON.stringify(kaydet(d))});`,
  });
  await p.goto(url);
  await p
    .getByRole("button", { name: "Kampanya karargâhı", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Geçimi birlikte düzelteceğiz", exact: true })
    .click();
  await p.getByRole("button", { name: /Miting düzenle/ }).click();
  for (let i = 0; i < 3; i++)
    await p.locator(".kampanya-sahnesi .secenek").first().click();
  await p.getByRole("button", { name: "Karargâha dön", exact: true }).click();
  await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
  for (let i = 0; i < 30; i++) {
    if (!(await p.locator(".dosya-satir").count())) break;
    await p.locator(".dosya-satir").first().click();
    await p.locator(".secenek:not(:disabled)").first().click();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
  }
  await p.getByRole("button", { name: "Ayı bitir", exact: true }).click();
  await p.locator(".rapor,.oylama-sahnesi").first().waitFor();
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator(".oylama-sahnesi").count())) break;
    await p.getByRole("button", { name: /Sayımı atla|Devam et/ }).click();
  }
  await p
    .getByRole("button", { name: "Seçim gecesine geç", exact: true })
    .click();
  await p.locator(".secim-gecesi").waitFor();
  await p.getByRole("button", { name: "Sayımı tamamla", exact: true }).click();
  if (
    await p
      .getByRole("button", {
        name: "Politika taviziyle ittifak teklif et",
        exact: true,
      })
      .count()
  ) {
    await p
      .getByRole("button", {
        name: "Politika taviziyle ittifak teklif et",
        exact: true,
      })
      .click();
    await p
      .getByRole("button", { name: "Sayımı tamamla", exact: true })
      .click();
  }
  await boyut(p);
  await p.screenshot({
    path: root + "/testler/ciktilar/secim-gecesi.png",
    fullPage: true,
  });
  await p.getByRole("button", { name: "Sonucu kabul et", exact: true }).click();
  await p
    .getByRole("heading", { name: "Beş yıl sonra", exact: true })
    .waitFor();
  const metin = await p.evaluate(
    () => localStorage.getItem("akkopru-2026:otomatik")!,
  );
  const sonuc = yukle(metin);
  assert.ok(sonuc.ok, sonuc.ok ? "" : sonuc.hata);
  assert.ok(
    sonuc.ok && sonuc.durum.bitis,
    "Sonsöz gösterilmeden kayıt kalıcı olmalı",
  );
  await p.reload();
  await p
    .getByRole("heading", { name: "Beş yıl sonra", exact: true })
    .waitFor();
  await p.getByRole("button", { name: "Oyun menüsü", exact: true }).click();
  await p.getByRole("button", { name: "Karar ve rapor arşivi", exact: true }).click();
  assert.equal(await p.getByLabel("Ay seç", { exact: true }).locator("option").count(), 18, "Son ay arşivde iki kez sayılmamalı");
  assert.deepEqual(hatalar, []);
  await ctx.close();
});

test("telefonda ilk tur hesabı ve ikinci tur aktarımı kayıttan görünür", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const p = await ctx.newPage();
    const d = yeniOyun(41);
    d.ay = 18;
    d.buAy.ay = 18;
    for (const id of Object.keys(d.gostergeler).filter(id => id.startsWith("grup."))) d.gostergeler[id] = 46;
    d.gostergeler.guven = 90;
    d.gostergeler.kutuplasma = 40;
    d.yonetim.secim.etki = 0.55;
    secimiHazirla(d, I);
    assert.ok(d.yonetim.secim.gece?.ikinciTur);
    const oyunUrl = "https://akkopru.test/";
    const key = "akkopru-2026:otomatik";
    await p.route(oyunUrl, route => route.fulfill({ path: root + "/dist/index.html", contentType: "text/html" }));
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto(oyunUrl);
    await p.getByRole("button", { name: "Sayımı tamamla", exact: true }).click();
    const ilk = p.getByRole("region", { name: "İlk tur sonucu nasıl oluştu?" });
    await ilk.getByText("+0,55 puan", { exact: true }).waitFor();
    await ilk.getByText("Seçmen gruplarını incele", { exact: true }).click();
    await ilk.getByText("Emekliler", { exact: false }).waitFor();
    await p.getByText(/yaklaşık %68 destek/).waitFor();
    await boyut(p);
    await p.getByRole("button", { name: "Kararsız seçmene ortak gelecek çağrısı yap", exact: true }).click();
    await p.getByRole("button", { name: "Sayımı tamamla", exact: true }).click();
    const ikinci = p.getByRole("region", { name: "İkinci turda oylar nasıl dağıldı?" });
    await ikinci.getByText("Bu havuzdan size gelen", { exact: true }).waitFor();
    const metin = await ikinci.innerText();
    await p.reload();
    await p.getByRole("button", { name: "Sayımı tamamla", exact: true }).click();
    assert.equal(await ikinci.innerText(), metin);
    await boyut(p);
  } finally {
    await ctx.close();
  }
});

test("telefonda kapalı devir alındısı ve bekleyen bütçe kayıttan açılır", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const p = await ctx.newPage();
    const d = yeniOyun(41);
    d.ay = 18;
    d.buAy.ay = 18;
    for (const id of Object.keys(d.gostergeler).filter(id => id.startsWith("grup."))) d.gostergeler[id] = 72;
    d.meclis.butce.gecici = true;
    secimiHazirla(d, I);
    const oyunUrl = "https://akkopru.test/";
    const key = "akkopru-2026:otomatik";
    await p.route(oyunUrl, route => route.fulfill({ path: root + "/dist/index.html", contentType: "text/html" }));
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto(oyunUrl);
    await p.getByRole("button", { name: "Sayımı tamamla", exact: true }).click();
    await p.getByRole("button", { name: "Sonucu kabul et", exact: true }).click();
    const dosya = p.getByRole("region", { name: "Dönem sonu devir dosyası" });
    await dosya.getByText("Geçici bütçe yürürlükte. Yeni paket bekliyor.", { exact: true }).waitFor();
    await boyut(p);
    await dosya.getByRole("button", { name: /Kurum arşivine kapalı tutanakla teslim et/ }).click();
    await dosya.getByRole("heading", { name: "Kapalı teslim alındısı" }).waitFor();
    await p.reload();
    await dosya.getByRole("heading", { name: "Kapalı teslim alındısı" }).waitFor();
    await p.getByText(/kurumlar imzalı tutanakla hangi dosyayı kimden aldığını/).waitFor();
    assert.equal(await dosya.getByRole("button").count(), 0);
    await boyut(p);
  } finally {
    await ctx.close();
  }
});
