import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { yeniOyun, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiAc } from "../../cekirdek/ay.ts";
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
for (const [ad, width, height] of [["masaüstü", 1366, 900], ["telefon", 440, 956]] as const) {
  test(`${ad}: inceleme, müdahale ve geçici hastane hattı maaştan ayrı kalır`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height } }), p = await ctx.newPage(), hatalar: string[] = [];
    p.on("pageerror", e => hatalar.push(e.message)); await p.goto("file://" + root + "/dist/index.html");
    let d = oyunuBaslat(yeniOyun(392), I);
    d.masa = [{ ornek: `belediye_maas_1#${++d.sayac}`, kart: "belediye_maas_1", degisken: { il: "Turunçlu" }, agir: false, ikinciGorus: false }];
    await koy(p, d);
    const ac = async (baslik: string) => { await p.locator(".dosya-satir").filter({ hasText: baslik }).click(); await p.getByLabel("Belediye ücret ve hizmet kaydı").waitFor(); await boyut(p); };
    const sec = async (n: number) => { await p.locator(".karar-dosyasi .secenek").nth(n).click(); await p.getByText("Garaj kaydı güncellendi").waitFor(); await boyut(p); };
    await ac("Turunçlu garajında son vardiya"); await sec(2);
    d = await oku(p); assert.equal(d.ekonomi.sozler.length, 0); assert.equal(d.bayraklar.belediye_ilk_yol, "inceleme");
    await p.getByRole("button", { name: "Masaya dön" }).click(); d.ay = 2; ayiAc(d, I); await koy(p, d);
    await ac("Turunçlu: Ayrılan bordro, ayrılmayan sorumluluk"); await sec(2);
    d = await oku(p); assert.equal(d.bayraklar.belediye_ikinci_yol, "muda"); assert.ok(d.sicil.some(s => s.kaynak.includes("Belediye ücret itirazı")));
    await p.getByRole("button", { name: "Masaya dön" }).click(); d.ay = 3; ayiAc(d, I); await koy(p, d);
    await ac("Turunçlu garajından sonra"); await sec(1);
    d = await oku(p); assert.equal(d.bayraklar.belediye_sonuc, "guvenli_hat"); assert.equal(d.bayraklar.belediye_hizmet, "gecici");
    assert.ok(await p.getByText("Bu dosyada ücret ödemesi yok", { exact: true }).isVisible());
    assert.equal(d.ekonomi.sozler.at(-1)?.kalem, "yatirim");
    await p.reload(); assert.equal((await oku(p)).bayraklar.belediye_sonuc, "guvenli_hat");
    assert.deepEqual(hatalar, []); await ctx.close();
  });
}
