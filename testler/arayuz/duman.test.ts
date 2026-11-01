// Duman testi: derlenmiş oyun gerçek bir tarayıcıda açılır, bir ayın tamamı oynanır, hata yoktur.
// Önce "npm run derle" çalıştırılmış olmalıdır. Ekran görüntüleri testler/ciktilar/ altına yazılır.

import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

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
      await sayfa.locator(".secenek").first().click();
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
    await sayfa.locator(".kapi").getByRole("button", { name: "Kabul et" }).first().click();
    await sayfa.locator(".kapi").getByText("Kabul edildi").waitFor();
    await sayfa.waitForTimeout(300);
    await denetle(sayfa, "ikinci ay masası");
    await sayfa.screenshot({ path: join(CIKTI, `${ad}-masa2.png`), fullPage: true });
    assert.ok((await sayfa.locator(".dosya-satir").count()) >= 3, "yeni ayın masası kurulmadı");
    assert.deepEqual(hatalar, []);
    await baglam.close();
  });
}
