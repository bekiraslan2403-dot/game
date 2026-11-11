// Duman testi: derlenmiş oyun gerçek bir tarayıcıda açılır, bir ayın tamamı oynanır, hata yoktur.
// Önce "npm run derle" çalıştırılmış olmalıdır. Ekran görüntüleri testler/ciktilar/ altına yazılır.

import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { ayiAc, oyunuBaslat } from "../../cekirdek/ay.ts";
import { kaydet } from "../../cekirdek/kayit.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { meclisOylamasi } from "../../cekirdek/politika.ts";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SAYFA = join(KOK, "dist/index.html");
const CIKTI = join(KOK, "testler/ciktilar");
let tarayici: Browser;

before(async () => {
  assert.ok(existsSync(SAYFA), "dist/index.html yok; önce npm run derle");
  mkdirSync(CIKTI, { recursive: true });
  tarayici = await chromium.launch();
});
after(async () => {
  await tarayici?.close();
});

async function denetle(sayfa: Page, ad: string) {
  await sayfa.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); });
  const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(tasma <= 0, `${ad}: yatay taşma ${tasma}px`);
  const kucuk = await sayfa.evaluate(() =>
    [...document.querySelectorAll("button")]
      .filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height < 44; })
      .map((b) => b.textContent?.trim()),
  );
  assert.deepEqual(kucuk, [], `${ad}: 44 noktadan küçük düğme`);
  const kucukSecim = await sayfa.evaluate(() =>
    [...document.querySelectorAll("select")].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height < 44; }).length,
  );
  assert.equal(kucukSecim, 0, `${ad}: 44 noktadan küçük seçim kutusu`);
  const pencereTasma = await sayfa.evaluate(() => {
    const p = document.querySelector(".pencere");
    return p ? p.scrollWidth - p.clientWidth : 0;
  });
  assert.ok(pencereTasma <= 0, `${ad}: pencerede yatay taşma ${pencereTasma}px`);
}

/** Hazine masasının tamamının ekran görüntüsü: görüntü alanı geçici olarak uzatılır. */
async function tamGoruntu(sayfa: Page, yol: string, en: number, boy: number) {
  const yukseklik = await sayfa.evaluate(() => (document.querySelector(".pencere") as HTMLElement | null)?.scrollHeight ?? 0);
  await sayfa.setViewportSize({ width: en, height: Math.max(boy, yukseklik + 40) });
  await sayfa.waitForTimeout(200);
  await sayfa.screenshot({ path: yol });
  await sayfa.setViewportSize({ width: en, height: boy });
}

for (const [ad, en, boy, mobil] of [
  ["masaustu", 1366, 900, false],
  ["iphone", 440, 956, true],
] as const) {
  test(`${ad}: bir ayın tamamı oynanır, rapor gelir, kayıt sayfa yenilenince korunur`, async () => {
    const baglam = await tarayici.newContext({ viewport: { width: en, height: boy }, isMobile: mobil, hasTouch: mobil, deviceScaleFactor: 2 });
    const sayfa = await baglam.newPage();
    const hatalar: string[] = [];
    sayfa.on("pageerror", (e) => hatalar.push(e.message));
    sayfa.on("console", (m) => { if (m.type() === "error") hatalar.push(m.text()); });

    await sayfa.goto("file://" + SAYFA);
    await sayfa.screenshot({ path: join(CIKTI, `${ad}-acilis.png`) });
    await sayfa.getByRole("button", { name: "Göreve başla" }).click();
    await sayfa.getByText("Kasım 2026").first().waitFor();
    await sayfa.screenshot({ path: join(CIKTI, `${ad}-masa.png`), fullPage: true });
    await denetle(sayfa, "masa");

    // Gösterge şeridinden Hazine masası açılır; bir araç kullanılır
    await sayfa.locator(".gosterge-seridi").click();
    await sayfa.locator(".hazine").waitFor();
    await sayfa.getByText(/Bütçe açığı yıllık 2,24 trilyon TL/).waitFor();
    await sayfa.waitForTimeout(300);
    await denetle(sayfa, "hazine masası");
    await tamGoruntu(sayfa, join(CIKTI, `${ad}-hazine.png`), en, boy);
    const kesinti = sayfa.locator(".arac").filter({ hasText: "Harcama kesintisi" });
    await kesinti.locator("select").selectOption("savunma");
    await kesinti.getByRole("button", { name: "Uygula" }).click();
    await kesinti.getByText("Bu ay kullanıldı").waitFor();
    await sayfa.getByText(/Bütçe açığı yıllık 2,1\d trilyon TL/).waitFor();
    await sayfa.getByRole("button", { name: "Masaya dön" }).click();
    await sayfa.locator(".hazine").waitFor({ state: "detached" });

    // Ülke ekranı: anket ortalaması ve seçmen grupları
    await sayfa.locator(".altmenu").getByRole("button", { name: "Ülke" }).click();
    await sayfa.locator(".ulke").waitFor();
    await sayfa.getByText("Anket ortalaması · üç şirket").waitFor();
    await sayfa.waitForTimeout(300);
    await denetle(sayfa, "ülke");
    await tamGoruntu(sayfa, join(CIKTI, `${ad}-ulke.png`), en, boy);
    await sayfa.getByRole("button", { name: "Masaya dön" }).click();

    // Politika dosyası: bir kararname imzalanır, imza hakkı azalır
    await sayfa.locator(".altmenu").getByRole("button", { name: /Dosyalar/ }).click();
    await sayfa.locator(".pol-dosya").waitFor();
    assert.equal(await sayfa.getByRole("button", { name: /Oyunu bırak, yeni oyun/ }).count(), 0);
    await sayfa.getByText("Bu ay 3 imza hakkınız var").waitFor();
    await sayfa.waitForTimeout(300);
    await denetle(sayfa, "politika dosyası");
    await tamGoruntu(sayfa, join(CIKTI, `${ad}-dosyalar.png`), en, boy);
    const memur = sayfa.locator(".politika").filter({ hasText: "Memur maaş artışı" });
    await memur.locator(".pol-adim.ileri").click();
    await sayfa.getByText("Bu ay 2 imza hakkınız var").waitFor();
    await memur.locator(".ses").waitFor();
    await sayfa.getByRole("button", { name: "Masaya dön" }).click();
    await sayfa.locator(".pol-dosya").waitFor({ state: "detached" });

    let ilk = true;
    for (let i = 0; i < 8; i++) {
      const dosyalar = sayfa.locator(".dosya-satir");
      if ((await dosyalar.count()) === 0) break;
      await dosyalar.first().click();
      await sayfa.locator(".karar-dosyasi").waitFor();
      if (ilk) {
        await sayfa.waitForTimeout(400);
        await sayfa.screenshot({ path: join(CIKTI, `${ad}-karar.png`) });
        await denetle(sayfa, "karar dosyası");
        ilk = false;
      }
      await sayfa.locator(".secenek:not(:disabled)").first().click();
      await sayfa.getByRole("button", { name: "Masaya dön" }).click();
    }
    await sayfa.getByRole("button", { name: "Ayı bitir" }).click();
    await sayfa.locator(".rapor").waitFor();
    await sayfa.waitForTimeout(400);
    await sayfa.screenshot({ path: join(CIKTI, `${ad}-rapor.png`) });
    await sayfa.getByRole("button", { name: /masasına geç/ }).click();
    await sayfa.getByText("Aralık 2026").first().waitFor();

    await sayfa.reload();
    await sayfa.getByText("Aralık 2026").first().waitFor();
    await sayfa.locator(".gazeteler").waitFor();
    await sayfa.locator(".kapi").getByRole("button", { name: "Görüşmeyi aç · 1 gün" }).first().click();
    await sayfa.locator(".karar-dosyasi").waitFor();
    await sayfa.locator(".karar-dosyasi .secenek").nth(2).click();
    await sayfa.getByRole("button", { name: "Masaya dön" }).click();
    await sayfa.locator(".kapi").getByText("Yanıt verildi · takip dosyası gelecek").waitFor();
    await sayfa.waitForTimeout(300);
    await denetle(sayfa, "ikinci ay masası");
    await sayfa.screenshot({ path: join(CIKTI, `${ad}-masa2.png`), fullPage: true });
    assert.ok((await sayfa.locator(".dosya-satir").count()) >= 3, "yeni ayın masası kurulmadı");
    // Sistem 2: kritik teklif, kişi düzeyinde kulis, kayıt ve gerçek oylama.
    await sayfa.getByRole("button", { name: /Meclis ve kulis/ }).click();
    await sayfa.locator(".meclis").waitFor();
    assert.equal(await sayfa.locator(".vekil").count(), 8);
    await denetle(sayfa, "meclis");
    await tamGoruntu(sayfa, join(CIKTI, `${ad}-meclis.png`), en, boy);
    await sayfa.getByRole("button", { name: "Görüş · Halime Kor" }).click();
    await sayfa.locator(".kulis-sahnesi").waitFor();
    assert.equal(await sayfa.getByRole("dialog").count(), 1, "sahnenin arkasında ikinci bir pencere var");
    await denetle(sayfa, "kulis sahnesi");
    await tamGoruntu(sayfa, join(CIKTI, `${ad}-kulis.png`), en, boy);
    await sayfa.getByRole("button", { name: /Talebine söz ver/ }).click();
    await sayfa.getByText(/Halime Kor evet sözü verdi/).first().waitFor();
    await sayfa.reload();
    await sayfa.locator(".kulis-sahnesi").waitFor();
    await sayfa.getByRole("button", { name: "Meclis'e dön" }).click();
    // Yenileme sonrası masa açılır; Meclis düğmesiyle sahne hakkı denetlenir.
    await sayfa.getByRole("button", { name: /Meclis ve kulis/ }).click();
    await sayfa.getByText("Bu ayın sahnesi kullanıldı. Oylama ay sonunda yapılacak.").waitFor();
    assert.ok(await sayfa.getByRole("button", { name: "Görüş · Halime Kor" }).isDisabled());
    await sayfa.getByRole("button", { name: "Masaya dön" }).click();
    for (let i = 0; i < 20; i++) {
      const dosyalar = sayfa.locator(".dosya-satir");
      if (!(await dosyalar.count())) break;
      await dosyalar.first().click();
      await sayfa.locator(".secenek:not(:disabled)").first().click();
      await sayfa.getByRole("button", { name: "Masaya dön" }).click();
    }
    await sayfa.getByRole("button", { name: "Ayı bitir" }).click();
    await sayfa.locator(".oylama-sahnesi").waitFor();
    await denetle(sayfa, "oylama");
    await sayfa.getByRole("button", { name: "Sayımı tamamla" }).click();
    await sayfa.getByRole("status").filter({ hasText: /Kabul edildi|Reddedildi/ }).waitFor();
    const etki = sayfa.getByLabel("Oylamanın oyundaki etkisi", { exact: true });
    await etki.getByText(/Banka mesajı gelmedi|Eczane defteri açık kaldı/).waitFor();
    const ilkEtki = await etki.innerText();
    await sayfa.getByText("Partilere göre oylar", { exact: true }).click();
    await sayfa.getByRole("table", { name: "Grup grup oylar" }).getByRole("rowheader", { name: "Yükseliş Partisi" }).waitFor();
    await denetle(sayfa, "oylama sonucu");
    await sayfa.screenshot({ path: join(CIKTI, `${ad}-oylama.png`) });
    await sayfa.getByRole("button", { name: "Devam et", exact: true }).click();
    await sayfa.locator(".rapor").waitFor();
    await sayfa.getByText(/Meclis (kabul etti|reddetti):/).first().waitFor();
    await sayfa.getByRole("button", { name: /masasına geç/ }).click();
    await sayfa.reload();
    await sayfa.getByRole("button", { name: /Meclis ve kulis/ }).click();
    await sayfa.getByText("Oylama tutanakları").waitFor();
    const kayit = await sayfa.evaluate(() => JSON.parse(localStorage.getItem("akkopru-2026:otomatik")!).durum);
    assert.equal(kayit.meclis.sonuclar[0].oylar.length, 592);
    assert.equal(kayit.meclis.sonuclar[0].evet + kayit.meclis.sonuclar[0].hayir + kayit.meclis.sonuclar[0].cekimser, 592);
    assert.equal(kayit.ekonomi.sozler.filter((s: { metin: string }) => s.metin.includes("Halime Kor")).length, 1);
    await sayfa.getByRole("dialog", { name: "Meclis", exact: true }).getByRole("button", { name: /Aralık 2026 · Emekli aylığı ve ikramiye/ }).click();
    assert.equal(await etki.innerText(), ilkEtki);
    assert.equal(await sayfa.getByRole("button", { name: "Sayımı tamamla", exact: true }).count(), 0);
    await sayfa.getByRole("button", { name: "Tutanaklara dön", exact: true }).click();
    await sayfa.getByRole("heading", { name: "Oylama tutanakları" }).waitFor();
    assert.deepEqual(hatalar, []);
    await baglam.close();
  });
}

const I = icerikDerle(join(KOK, "icerik")).paket!;
function macKaydi(ay: number, tarih: string) {
  const d = yeniOyun(2026); d.ay = ay;
  const k = JSON.parse(kaydet(oyunuBaslat(d, I)));
  k.kayitTarihi = tarih;
  return JSON.stringify(k);
}

async function macPenceresi(asil: string | null, yedek: string | null, onbellek: string | null = null, hata = "") {
  const baglam = await tarayici.newContext({ viewport: { width: 1366, height: 900 } });
  const sayfa = await baglam.newPage();
  // Ham betik: tsx'in fonksiyon-adı yardımcıları WebView'e taşınmaz.
  await sayfa.addInitScript({ content: `(() => {
    const { asil, yedek, onbellek, hata } = ${JSON.stringify({ asil, yedek, onbellek, hata })};
    window.isTauri = true; window.testYazilar = []; window.testEtkin = 0; window.testEnCok = 0;
    if (onbellek) localStorage.setItem("akkopru-2026:otomatik", onbellek);
    window.__TAURI_INTERNALS__ = { invoke: async (cmd, args) => {
      if (cmd === "kayit_oku") { if (hata === "oku") throw new Error("Disk okunamadı"); return { asil, yedek }; }
      if (cmd === "kayit_yaz") {
        window.testEtkin++; window.testEnCok = Math.max(window.testEnCok, window.testEtkin);
        await new Promise(r => setTimeout(r, 120));
        window.testEtkin--;
        if (hata === "yaz") throw new Error("Disk dolu");
        window.testYazilar.push(args.metin);
      }
    } };
  })();` });
  await sayfa.goto("file://" + SAYFA);
  return { baglam, sayfa };
}

test("Mac kayıt köprüsü: bozuk asıl yerine geçerli yedek açılır ve kararlar sırayla diske yazılır", async () => {
  const { baglam, sayfa } = await macPenceresi("bozuk", macKaydi(2, "2026-11-01T10:00:00Z"));
  await sayfa.getByText("Aralık 2026").first().waitFor();
  assert.equal(await sayfa.getByRole("button", { name: "Göreve başla" }).count(), 0);
  await sayfa.locator(".dosya-satir").first().click();
  await sayfa.locator(".secenek:not(:disabled)").first().click();
  await sayfa.getByRole("button", { name: "Masaya dön" }).click();
  await sayfa.waitForFunction(() => (window as unknown as { testYazilar: string[] }).testYazilar.length >= 2);
  const yazilar = await sayfa.evaluate(() => {
    const w = window as unknown as { testYazilar: string[]; testEnCok: number };
    return { aylar: w.testYazilar.map(x => JSON.parse(x).durum.ay), enCok: w.testEnCok, son: JSON.parse(w.testYazilar.at(-1)!) };
  });
  assert.ok(yazilar.aylar.every((ay: number) => ay === 2));
  assert.equal(yazilar.enCok, 1, "disk yazıları üst üste binmemeli");
  assert.ok(yazilar.son.durum.buAy.kararlar.length > 0);
  await baglam.close();
});

test("Mac açılışı: daha yeni geçerli önbellek diskten sonraki kararı kurtarır", async () => {
  const { baglam, sayfa } = await macPenceresi(macKaydi(1, "2026-11-01T10:00:00Z"), null, macKaydi(3, "2026-11-01T11:00:00Z"));
  await sayfa.getByText("Ocak 2027").first().waitFor();
  await baglam.close();
});

test("Mac açılışı: bozuk kayıtlar veya okunamayan disk sessizce yeni oyunla ezilmez", async () => {
  for (const hata of ["", "oku"]) {
    const { baglam, sayfa } = await macPenceresi("bozuk", "bozuk", null, hata);
    await sayfa.getByRole("heading", { name: "Kayıt açılamadı" }).waitFor();
    assert.equal(await sayfa.getByRole("button", { name: "Göreve başla" }).count(), 0);
    assert.equal(await sayfa.evaluate(() => (window as unknown as { testYazilar: string[] }).testYazilar.length), 0);
    await baglam.close();
  }
});

test("Mac disk yazma hatası kullanıcıya gösterilir ve açık oyun kullanılabilir kalır", async () => {
  const { baglam, sayfa } = await macPenceresi(macKaydi(2, "2026-11-01T10:00:00Z"), null, null, "yaz");
  await sayfa.getByRole("alert").filter({ hasText: "Disk kaydı yazılamadı" }).waitFor();
  assert.ok(await sayfa.locator(".dosya-satir").count() > 0);
  await baglam.close();
});

test("telefon: bordro dosyasının banka sonucu oylama arşivinde yenilemeden sonra okunur", async () => {
  const ctx = await tarayici.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const I = icerikDerle(join(KOK, "icerik")).paket!;
    let d: ReturnType<typeof yeniOyun> | undefined;
    for (let tohum = 1; tohum <= 80 && !d; tohum++) {
      const aday = yeniOyun(tohum);
      aday.ay = 2;
      ayiAc(aday, I);
      meclisOylamasi(aday, I);
      if (aday.meclis.sonuclar[0]?.sonuc === "kabul") d = aday;
    }
    assert.ok(d);
    d.ay = 3;
    ayiAc(d, I);
    const ocak = d.masa.find(k => k.kart === "emekli_oylama_bordro")!;
    assert.ok(kararVer(d, I, ocak.ornek, 0).ok);
    d.gecmis.push(d.buAy);
    d.ay = 4;
    ayiAc(d, I);

    const p = await ctx.newPage();
    const url = "https://akkopru.test/";
    const key = "akkopru-2026:otomatik";
    await p.route(url, route => route.fulfill({ path: SAYFA, contentType: "text/html" }));
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto(url);
    await p.getByRole("button", { name: /Meclis ve kulis/ }).click();
    await p.getByRole("dialog", { name: "Meclis", exact: true }).getByRole("button", { name: /Aralık 2026 · Emekli aylığı ve ikramiye/ }).click();
    const takip = p.getByRole("region", { name: "Bordronun uygulama geçmişi" });
    await takip.getByText("Masada karar bekliyor", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Tutanaklara dön", exact: true }).click();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    const banka = p.locator(".dosya-satir").filter({ hasText: "Bankadan dönen iki liste" });
    await banka.getByText("Ocak 2027 · Banka mesajı gelmedi", { exact: true }).waitFor();
    await banka.click();
    const dosya = p.getByRole("dialog", { name: "Bankadan dönen iki liste", exact: true });
    const kaynak = dosya.locator("details").filter({ has: p.getByText("Neden masada?", { exact: true }) });
    assert.equal(await kaynak.evaluate(el => (el as HTMLDetailsElement).open), false);
    await kaynak.locator("summary").click();
    await kaynak.getByText("İtirazlı bordroları gönderimden önce tek tek denetlet", { exact: true }).waitFor();
    await dosya.getByRole("button", { name: /Doğrulanan farkları ayrı dosyayla bankaya gönder/ }).click();
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.reload();
    await p.getByRole("button", { name: /Meclis ve kulis/ }).click();
    await p.getByRole("dialog", { name: "Meclis", exact: true }).getByRole("button", { name: /Aralık 2026 · Emekli aylığı ve ikramiye/ }).click();
    await takip.getByText(/Naciye hesabına geçen farkı gördü/).waitFor();
    assert.equal(await takip.getByText("Masada karar bekliyor", { exact: true }).count(), 0);
    await denetle(p, "bordro oylama arşivi");
  } finally {
    await ctx.close();
  }
});
