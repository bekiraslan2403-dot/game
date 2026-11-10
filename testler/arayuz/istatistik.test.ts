import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser } from "playwright";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { ayiAc, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;
const key = "akkopru-2026:otomatik";
const oyunUrl = "https://akkopru.test/";
let browser: Browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

for (const [ad, width, height] of [["masaüstü", 1366, 900], ["telefon", 390, 844]] as const) {
  test(`${ad}: iki zarfın teknik bülteni seçilebilir, yanıt görünür ve talimat saklanır`, async () => {
    const d = yeniOyun(726);
    d.ay = 2;
    ayiAc(d, I);
    d.masa = [{ kart: "istatistik_baskani", ornek: `istatistik_baskani#${++d.sayac}`, degisken: {}, agir: false, ikinciGorus: false }];
    assert.ok(kararVer(d, I, d.masa[0]!.ornek, 1).ok);
    const sonuc = ayiBitir(d, I);
    assert.ok(sonuc.ok);
    const ctx = await browser.newContext({ viewport: { width, height } });
    try {
      const p = await ctx.newPage();
      await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(sonuc.durum) });
      await p.route(oyunUrl, route => route.fulfill({ path: root + "/dist/index.html", contentType: "text/html" }));
      await p.goto(oyunUrl);
      await p.getByRole("button", { name: /Aynı gün, iki ayrı rakam/ }).click();
      await p.getByRole("button", { name: /Teknik seriyi bu ay yayımla/ }).click();
      await p.locator(".sonuc .karar-tepkileri").getByText(/Bizim zarfı açtılar/).waitFor();
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
      await p.reload();
      const save = yukle(await p.evaluate(k => localStorage.getItem(k)!, key));
      assert.ok(save.ok);
      assert.equal(save.durum.bayraklar.istatistik_tek_bulten_duzelt, true);
      assert.equal(save.durum.ekonomi.istatistik, "sadik");
    } finally {
      await ctx.close();
    }
  });
}
