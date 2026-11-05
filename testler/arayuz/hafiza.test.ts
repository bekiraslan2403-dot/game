import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { yeniOyun, bosAyKaydi, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiAc } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const root = fileURLToPath(new URL("../..", import.meta.url)), key = "akkopru-2026:otomatik";
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;
let browser: Browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });
async function koy(p: Page, d: OyunDurumu) { await p.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value: kaydet(d) }); await p.reload(); }
async function oku(p: Page) { const y = yukle(await p.evaluate(key => localStorage.getItem(key)!, key)); if (!y.ok) throw Error(y.hata); return y.durum; }
async function boyut(p: Page) {
  await p.evaluate(async () => { await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); });
  const x = await p.evaluate(() => ({ yatay: document.documentElement.scrollWidth > innerWidth, pencere: [...document.querySelectorAll<HTMLElement>(".pencere")].some(e => e.scrollWidth > e.clientWidth), kucuk: [...document.querySelectorAll("button,select")].some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 44; }) }));
  assert.deepEqual(x, { yatay: false, pencere: false, kucuk: false });
}
function gecim() {
  const d = oyunuBaslat(yeniOyun(1208), I);
  d.masa = [{ ornek: `akkopru_tazminat#${++d.sayac}`, kart: "akkopru_tazminat", degisken: {}, agir: false, ikinciGorus: false }];
  assert.ok(kararVer(d, I, d.masa[0]!.ornek, 0).ok);
  d.ay = 2; ayiAc(d, I);
  return d;
}
for (const [ad, width, height] of [["masaüstü", 1366, 900], ["telefon", 440, 956]] as const) {
  test(`${ad}: esnafın fişli başvurusu ile ödeme ayrı ve kayıtlıdır`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height } }), p = await ctx.newPage(), hatalar: string[] = [];
    p.on("pageerror", e => hatalar.push(e.message)); await p.goto("file://" + root + "/dist/index.html"); await koy(p, gecim());
    await p.locator(".dosya-satir").filter({ hasText: "Kapalı yolun esnaf defteri" }).click();
    await p.getByLabel("Akköprü geçmiş kararlar").waitFor(); await boyut(p);
    assert.ok(await p.getByText("Şantiyede teknik kabul ve trafik açılışı kaydı yok.").isVisible());
    await p.locator(".karar-dosyasi .secenek").nth(1).click();
    await p.getByText("Hafıza kaydedildi").waitFor(); await boyut(p);
    const d = await oku(p); assert.equal(d.bayraklar.akkopru_gecim_yolu, "basvuru"); assert.equal(d.bayraklar.akkopru_gecim_sonuc, undefined);
    await p.reload(); assert.equal((await oku(p)).bayraklar.akkopru_gecim_yolu, "basvuru");
    assert.deepEqual(hatalar, []); await ctx.close();
  });
  test(`${ad}: kampanya geçmişi kapalı yolu açılmış gibi göstermez`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height } }), p = await ctx.newPage(), hatalar: string[] = [];
    p.on("pageerror", e => hatalar.push(e.message)); await p.goto("file://" + root + "/dist/index.html");
    const d = oyunuBaslat(yeniOyun(1072), I); d.ay = 16; d.buAy = bosAyKaydi(16); d.bayraklar.akkopru_oynandi = true; d.masa = [{ ornek: `akkopru_kampanya#${++d.sayac}`, kart: "akkopru_kampanya", degisken: {}, agir: false, ikinciGorus: false }]; d.bekleyen = [];
    await koy(p, d); await p.locator(".dosya-satir").filter({ hasText: "Kampanyadaki eski karar" }).click(); await p.getByLabel("Akköprü geçmiş kararlar").waitFor(); await boyut(p);
    await p.locator(".karar-dosyasi .secenek").nth(1).click(); await p.getByText("Hafıza kaydedildi").waitFor(); await boyut(p);
    const x = await oku(p); assert.ok(x.buAy.olaylar.some(o => o.includes("Kapalı yol görüntüsü"))); assert.equal(x.bekleyen.filter(y => y.kart === "akkopru_kampanya_yanit").length, 1);
    await p.reload(); assert.equal((await oku(p)).bayraklar.akkopru_kampanya_mesaji, "onarim");
    assert.deepEqual(hatalar, []); await ctx.close();
  });
}
