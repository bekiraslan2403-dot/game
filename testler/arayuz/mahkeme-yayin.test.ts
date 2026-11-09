import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser } from "playwright";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { ayiAc, ayiBitir } from "../../cekirdek/ay.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;
const key = "akkopru-2026:otomatik";
let browser: Browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

for (const [ad, width, height] of [["masaüstü", 1366, 900], ["telefon", 390, 844]] as const) {
  test(`${ad}: arşiv kapanır, yeniden açılır ve genel engel tedbiri yüklemede korunur`, async () => {
    const d = yeniOyun(401);
    d.ay = 3;
    ayiAc(d, I);
    d.masa = d.masa.filter(m => m.kart === "anayasa_mahkemesi_uyari");
    const ctx = await browser.newContext({ viewport: { width, height } });
    try {
      const p = await ctx.newPage();
      await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
      await p.goto("file://" + root + "/dist/index.html");
      await p.getByRole("button", { name: /Bir ekran görüntüsü, bütün arşiv/ }).click();
      await p.getByRole("button", { name: /Başkanı hedef al/ }).click();
      await p.locator(".sonuc .karar-tepkileri").getByText(/bütün arşiv kapalı/).waitFor();
      await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
      await p.getByRole("button", { name: "Gündemi takip et", exact: true }).click();
      await p.getByText("Arşiv kapalı · Halk TV", { exact: true }).waitFor();
      await p.getByText("Yayında · Merkez TV", { exact: true }).waitFor();
      const y = yukle(await p.evaluate(k => localStorage.getItem(k)!, key));
      assert.ok(y.ok);
      const kapanis = ayiBitir(y.durum, I);
      assert.ok(kapanis.ok);
      await p.evaluate(({ key, save }) => localStorage.setItem(key, save), { key, save: kaydet(kapanis.durum) });
      await p.reload();
      await p.getByRole("button", { name: /Engellenen kayıt başka bir adreste/ }).click();
      await p.getByRole("button", { name: /Arşivi aç, düzeltilmiş kaydı/ }).click();
      await p.locator(".sonuc .karar-tepkileri").getByText(/genel talimatı yeniden/).waitFor();
      await p.reload();
      await p.getByRole("button", { name: "Gündemi takip et", exact: true }).click();
      await p.getByText("Yayında · Halk TV", { exact: true }).waitFor();
      await p.getByLabel("Müdahale aracı", { exact: true }).selectOption("engel");
      const satir = p.locator(".kurulus-listesi li").filter({ hasText: "Halk TV" });
      await satir.getByText(/Mahkeme bu ay/).waitFor();
      assert.ok(await satir.getByRole("button", { name: "Uygula", exact: true }).isDisabled());
      assert.ok(await p.locator(".kurulus-listesi li").filter({ hasText: "Merkez TV" }).getByRole("button", { name: "Uygula", exact: true }).isEnabled());
    } finally {
      await ctx.close();
    }
  });
}

test("transferden sonra sonuç ekranı gerçek sandalye artışını ve seçmen kaybını gösterir", async () => {
  const d = yeniOyun(428);
  d.ay = 4;
  ayiAc(d, I);
  d.masa = [{ kart: "vekil_transferi", ornek: "transfer", degisken: {}, agir: false, ikinciGorus: false }];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const p = await ctx.newPage();
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto("file://" + root + "/dist/index.html");
    await p.getByRole("button", { name: /Muhalefetten üç milletvekili/ }).click();
    await p.getByRole("button", { name: /Üçünü de al/ }).click();
    const etkiler = p.getByLabel("Kararın hemen görülen etkileri", { exact: true });
    await etkiler.getByText(/278 → 281 sandalye/).waitFor();
    await etkiler.getByText("Kentli orta sınıf desteği", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Sandalye dağılımını gör", exact: true }).click();
    const liste = p.getByLabel("Sandalye dağılımı", { exact: true });
    await liste.getByText("281", { exact: true }).waitFor();
    await liste.getByText("150", { exact: true }).waitFor();
  } finally {
    await ctx.close();
  }
});
