import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { yeniOyun, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat } from "../../cekirdek/ay.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const root = fileURLToPath(new URL("../..", import.meta.url));
const key = "akkopru-2026:otomatik";
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;
let browser: Browser;
before(async () => { browser = await chromium.launch(); mkdirSync(root + "/testler/ciktilar", { recursive: true }); });
after(async () => { await browser?.close(); });
function kur(kart: string) {
  const d = oyunuBaslat(yeniOyun(17), I);
  d.masa = [{ kart, ornek: "icra#test", degisken: { il: "Turunçlu" }, agir: false, ikinciGorus: false }];
  return d;
}
async function yerlestir(p: Page, d: OyunDurumu) {
  await p.evaluate(({ key, s }) => localStorage.setItem(key, s), { key, s: kaydet(d) }); await p.reload();
  assert.equal(await p.locator(".anlati-kapi").count(), 0, "başka dosya Akköprü telefon sahnesi gibi sunulmaz");
  await p.locator(".dosya-satir").first().click(); await p.locator(".karar-dosyasi").waitFor();
}
async function durum(p: Page) {
  const y = yukle(await p.evaluate(k => localStorage.getItem(k)!, key)); if (!y.ok) throw Error(y.hata); return y.durum;
}
for (const [ad, width, height] of [["masaustu", 1366, 900], ["telefon", 440, 956]] as const) {
  test(`${ad}: ihracat dosyası doğrulanır, ödenir ve kayıttan korunur`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height } }), p = await ctx.newPage(); const hatalar: string[] = [];
    p.on("pageerror", e => hatalar.push(e.message)); await p.goto("file://" + root + "/dist/index.html");
    await yerlestir(p, kur("ihracatci_kur"));
    assert.equal(await p.locator(".karar-dosyasi .ifadeler").count(), 0);
    await p.locator(".karar-dosyasi .secenek").nth(0).click();
    let d = await durum(p); assert.equal(d.bosGun, 3); assert.equal(d.bayraklar.ihracat_kayit, true);
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.locator(".dosya-satir").first().click();
    const odeme = p.locator(".karar-dosyasi .secenek").nth(0);
    assert.match(await odeme.innerText(), /1 imza.*Tek seferlik 9,6 milyon TL/);
    await p.getByText("Masadaki belgeleri incele", { exact: false }).click();
    await p.getByText(/Sendika ile Hazine düzeltilen listeyi karşılaştırdı/).waitFor();
    const boyut = await p.evaluate(() => ({ tasma: document.documentElement.scrollWidth > innerWidth, pencere: [...document.querySelectorAll<HTMLElement>(".pencere")].some(e => e.scrollWidth > e.clientWidth) }));
    assert.deepEqual(boyut, { tasma: false, pencere: false });
    await p.screenshot({ path: root + `/testler/ciktilar/${ad}-ihracat.png`, fullPage: true });
    await odeme.click(); d = await durum(p);
    assert.equal(d.imza, 1); assert.equal(d.ekonomi.sozler.at(-1)!.durum, "tutuldu");
    assert.ok(d.bekleyen.some(b => b.kart === "ihracat_donus"));
    await p.reload(); assert.deepEqual(await durum(p), d); assert.deepEqual(hatalar, []); await ctx.close();
  });
}
test("kaynak ve belge kilitleri görünür; inceleme parayı harcamaz", async () => {
  const ctx = await browser.newContext(), p = await ctx.newPage(); await p.goto("file://" + root + "/dist/index.html");
  let d = kur("ihracat_sozlesme"); await yerlestir(p, d);
  assert.ok(await p.locator(".karar-dosyasi .secenek").nth(0).isDisabled());
  await p.getByText("Önce sipariş ve ücret kaydını birlikte doğrulat.", { exact: true }).waitFor();
  d = kur("belediye_maas_1"); d.imza = 3; await yerlestir(p, d);
  assert.ok(await p.locator(".karar-dosyasi .secenek").nth(0).isDisabled());
  await p.locator(".karar-dosyasi .secenek").nth(2).click(); d = await durum(p);
  assert.equal(d.bosGun, 3); assert.equal(d.ekonomi.sozler.length, 0); assert.ok(d.bekleyen.some(b => b.kart === "belediye_maas_2c"));
  await ctx.close();
});

test("ikinci vardiya için belge incelemesi gün, ödeme ayrı imza kullanır", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const p = await ctx.newPage();
    const d = kur("ihracat_donus");
    d.bayraklar.ihracat_yol = "ucret";
    const url = "https://akkopru.test/";
    await p.route(url, route => route.fulfill({ path: root + "/dist/index.html", contentType: "text/html" }));
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto(url);
    await p.getByRole("button", { name: /Vardiya çizelgesi geri geldi/ }).click();
    await p.getByRole("button", { name: /Alıcının koşullu siparişini ve yeni bordroyu doğrulat/ }).click();
    await p.getByRole("dialog", { name: "Vardiya çizelgesi geri geldi" }).getByText(/Bu incelemede ödeme yapılmadı/).waitFor();
    assert.equal((await durum(p)).ekonomi.sozler.length, 0);
    await p.getByRole("button", { name: "Masaya dön", exact: true }).click();
    await p.getByRole("button", { name: /Dört yüz seksen isimlik liste/ }).click();
    const odeme = p.getByRole("button", { name: /Yeni vardiyanın doğrulanmış ücretleri için/ });
    assert.match(await odeme.innerText(), /1 imza.*Tek seferlik/);
    await odeme.click();
    await p.getByRole("dialog", { name: "Dört yüz seksen isimlik liste" }).getByText(/480 kişilik bordrosuna ayrı ödenek çıktı/).waitFor();
    const x = await durum(p);
    assert.equal(x.bosGun, 3);
    assert.equal(x.imza, 1);
    assert.equal(x.ekonomi.sozler.at(-1)?.durum, "tutuldu");
    assert.ok(x.bekleyen.some(m => m.kart === "ihracat_yukleme" && m.ay === d.ay + 1));
  } finally {
    await ctx.close();
  }
});
