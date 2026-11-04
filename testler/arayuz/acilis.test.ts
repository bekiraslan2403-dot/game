import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { oyunuBaslat } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const root = fileURLToPath(new URL("../..", import.meta.url));
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;
const key = "akkopru-2026:otomatik";
let browser: Browser;
before(async () => { browser = await chromium.launch(); mkdirSync(root + "/testler/ciktilar", { recursive: true }); });
after(async () => { await browser?.close(); });
async function durum(p: Page) { const y = yukle(await p.evaluate(k => localStorage.getItem(k)!, key)); if (!y.ok) throw Error(y.hata); return y.durum; }
async function boyut(p: Page) {
  await p.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); });
  const r = await p.evaluate(() => ({
    yatay: document.documentElement.scrollWidth > innerWidth,
    pencere: [...document.querySelectorAll<HTMLElement>(".pencere")].some(e => e.scrollWidth > e.clientWidth),
    kucuk: [...document.querySelectorAll("button,select")].some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 44; }),
  })); assert.deepEqual(r, { yatay: false, pencere: false, kucuk: false });
}
for (const [ad, width, height] of [["masaustu", 1366, 900], ["telefon", 440, 956]] as const) {
  for (let gece = 0; gece < 3; gece++) {
    const sabah = [1, 0, 2][gece]!;
    test(`${ad}: ilk gece ${gece}, ertesi sabah ${sabah}; talimat görünür sonuca ve kalıcı kayda dönüşür`, async () => {
      const ctx = await browser.newContext({ viewport: { width, height } }), p = await ctx.newPage();
      const hatalar: string[] = []; p.on("pageerror", e => hatalar.push(e.message));
      await p.goto("file://" + root + "/dist/index.html"); await p.getByRole("button", { name: "Göreve başla", exact: true }).click();
      await p.getByRole("button", { name: "Telefonu al", exact: true }).click();
      if (gece === 2) {
        await p.getByRole("button", { name: "Deniz’i dinle", exact: true }).click();
        for (let i = 0; i < 3; i++) {
          await p.locator(".anlati-sahnesi .secenek").nth(0).click();
          await p.getByRole("button", { name: i === 2 ? "Dosyaya dön" : "Konuşmayı sürdür", exact: true }).click();
        }
      }
      await p.locator(".karar-dosyasi .secenek").nth(gece).click();
      await p.getByText("Gece talimatı uygulandı", { exact: true }).waitFor();
      const g = await durum(p); assert.equal(g.acilis!.gece, gece); assert.equal(g.ay, 1);
      await p.locator(".sonuc .acilis-izleme").waitFor(); await boyut(p);
      await p.getByRole("button", { name: "Sabah bağlantısını aç", exact: true }).click();
      await p.locator(".karar-dosyasi").waitFor();
      assert.equal(await p.getByRole("dialog").count(), 1);
      assert.equal(await p.locator(".karar-dosyasi .secenek").count(), 3);
      assert.equal(await p.locator(".karar-dosyasi .ifadeler").count(), 0);
      assert.equal(await p.getByRole("button", { name: /Görüşmeye git/ }).count(), 0, "sabah ikinci bir sinematik sahne istemez");
      await p.reload(); await p.locator(".karar-dosyasi").waitFor(); assert.deepEqual(await durum(p), g);
      await boyut(p); await p.locator(".pencere").screenshot({ path: root + `/testler/ciktilar/${ad}-sabah-${gece}.png` });
      await p.locator(".karar-dosyasi .secenek").nth(sabah).click();
      await p.getByText("İlk gün tamamlandı", { exact: true }).waitFor();
      assert.equal(await p.locator(".pencere").evaluate(e => e.scrollTop), 0, "sonuç baştan okunur, alt düğmeye atlamaz");
      assert.equal(await p.locator(".sonuc").evaluate(e => e === document.activeElement), true);
      const son = await durum(p); assert.equal(son.acilis!.sabah, sabah);
      assert.equal(son.bosGun, sabah === 1 ? 3 : 4); assert.equal(son.meclis.sahneAy, gece === 2 ? 1 : 0);
      assert.equal(son.acilis!.sevkiyat, gece === 0 ? "gecikti" : "hastanede");
      if (gece === 2) { assert.equal(son.acilis!.deniz, "gorevden_cekildi"); assert.ok(son.sicil.some(s => s.tur === "kirilan_soz")); }
      await p.locator(".sonuc .acilis-izleme").getByText(son.acilis!.sonuc!.baslik, { exact: true }).waitFor();
      await boyut(p); await p.locator(".pencere").screenshot({ path: root + `/testler/ciktilar/${ad}-ilk-gun-${gece}.png` });
      await p.getByRole("button", { name: "Masaya dön", exact: true }).click(); await p.reload();
      assert.equal(await p.getByRole("dialog").count(), 0);
      await p.getByLabel("Akköprü ilk gün kaydı", { exact: true }).getByText(son.acilis!.sonuc!.baslik, { exact: true }).waitFor();
      assert.deepEqual(await durum(p), son); assert.deepEqual(hatalar, []); await ctx.close();
    });
  }
}
test("sabah araştırmasının gün kilidi görünür; parasız ve günsüz eski kayıt yeni sonuç üretmez", async () => {
  const ctx = await browser.newContext(), p = await ctx.newPage(); await p.goto("file://" + root + "/dist/index.html");
  const d = oyunuBaslat(yeniOyun(912), I); kararVer(d, I, d.masa.find(m => m.kart === "akkopru_telefon")!.ornek, 0); d.bosGun = 0;
  await p.evaluate(({ key, s }) => localStorage.setItem(key, s), { key, s: kaydet(d) }); await p.reload();
  assert.ok(await p.locator(".karar-dosyasi .secenek").nth(1).isDisabled());
  await p.getByText("Bu müdahale için takvimde yeterli gün yok.", { exact: true }).waitFor();
  assert.ok(await p.locator(".karar-dosyasi .secenek").nth(0).isEnabled());
  const h = JSON.parse(kaydet(d)); delete h.durum.acilis; h.surum = 10; h.durum.surum = 10;
  h.durum.masa = h.durum.masa.filter((m: { kart: string }) => !I.kartlar[m.kart]?.acilis);
  await p.evaluate(({ key, s }) => localStorage.setItem(key, s), { key, s: JSON.stringify(h) }); await p.reload();
  assert.equal(await p.getByLabel("Akköprü ilk gün kaydı", { exact: true }).count(), 0);
  assert.equal(await p.getByRole("dialog").count(), 0); assert.equal((await durum(p)).acilis, null); await ctx.close();
});
