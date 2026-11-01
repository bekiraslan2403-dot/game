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
    assert.ok((await sayfa.locator(".dosya-satir").count()) >= 3, "yeni ayın masası kurulmadı");
    assert.deepEqual(hatalar, []);
    await baglam.close();
  });
}
