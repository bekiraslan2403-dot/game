import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { ayiAc } from "../../cekirdek/ay.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
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
