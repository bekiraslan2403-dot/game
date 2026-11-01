// Duman testi: derlenmiş oyun gerçek bir tarayıcıda açılır, temel akış çalışır, hata yoktur.
// Önce "npm run derle" çalıştırılmış olmalıdır.

import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser } from "playwright";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";

const SAYFA = join(dirname(fileURLToPath(import.meta.url)), "../../dist/index.html");
let tarayici: Browser;

before(async () => {
  assert.ok(existsSync(SAYFA), "dist/index.html yok; önce npm run derle");
  tarayici = await chromium.launch();
});
after(async () => {
  await tarayici?.close();
});

for (const [ad, en, boy, mobil] of [
  ["masaüstü", 1366, 900, false],
  ["iPhone 17 Pro Max", 440, 956, true],
] as const) {
  test(`${ad}: açılış, ilk ay, ay geçişi ve otomatik kayıt`, async () => {
    const baglam = await tarayici.newContext({ viewport: { width: en, height: boy }, isMobile: mobil, hasTouch: mobil });
    const sayfa = await baglam.newPage();
    const hatalar: string[] = [];
    sayfa.on("pageerror", (e) => hatalar.push(e.message));
    sayfa.on("console", (m) => { if (m.type() === "error") hatalar.push(m.text()); });

    await sayfa.goto("file://" + SAYFA);
    await sayfa.getByRole("button", { name: "Göreve başla" }).click();
    await sayfa.getByText("Kasım 2026").first().waitFor();
    await sayfa.getByRole("button", { name: "Ayı bitir" }).click();
    await sayfa.getByText("Aralık 2026").first().waitFor();

    await sayfa.reload();
    await sayfa.getByText("Aralık 2026").first().waitFor();

    const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(tasma <= 0, `yatay taşma: ${tasma}px`);
    const kucukDugme = await sayfa.evaluate(() =>
      [...document.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().height < 44).map((b) => b.textContent),
    );
    assert.deepEqual(kucukDugme, [], "44 noktadan küçük düğme var");
    assert.deepEqual(hatalar, []);
    await baglam.close();
  });
}
