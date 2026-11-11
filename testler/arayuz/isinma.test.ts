import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { yeniOyun, bosAyKaydi, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiAc } from "../../cekirdek/ay.ts";
import { isinmaKarti } from "../../cekirdek/isinma.ts";
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
const yollar = [
  { ad: "yardım", secimler: [0, 0, 1], son: "ikinci_destek", odeme: 2 },
  { ad: "sayaç", secimler: [1, 0, 0], son: "ayri_hesap", odeme: 0 },
  { ad: "bakım", secimler: [2, 2, 0, 0], son: "guvenlik_testi", odeme: 1 },
];
for (const [ad, width, height] of [["masaüstü", 1366, 900], ["telefon", 440, 956]] as const) for (const yol of yollar) {
  test(`${ad}: kışın ${yol.ad} yolu gerçek ödeme, uygulama yanıtı ve kayıttan sürer`, async () => {
    const ctx = await browser.newContext({ viewport: { width, height } }), p = await ctx.newPage(), hatalar: string[] = [];
    p.on("pageerror", e => hatalar.push(e.message)); await p.goto("file://" + root + "/dist/index.html");
    let d = oyunuBaslat(yeniOyun(1702), I); d.ay = 3; d.buAy = bosAyKaydi(3); d.bekleyen = [];
    d.masa = [{ ornek: `dogalgaz_zammi#${++d.sayac}`, kart: "dogalgaz_zammi", degisken: {}, agir: false, ikinciGorus: false }];
    d.gorulen.dogalgaz_zammi = d.ay;
    await koy(p, d);
    for (let i = 0; i < yol.secimler.length; i++) {
      const m = d.masa.find(m => isinmaKarti(m.kart))!;
      await p.locator(".dosya-satir").filter({ hasText: I.kartlar[m.kart]!.metin.baslik }).click(); await boyut(p);
      if (i === 2 && yol.ad === "bakım") {
        assert.equal(m.kart, "isinma_bakim_eksik");
        assert.equal(await p.locator(".karar-dosyasi .dosya-baslik").textContent(), "Aynı vananın başında ikinci gece");
      }
      await p.locator(".karar-dosyasi .secenek").nth(yol.secimler[i]!).click();
      await p.getByText("Kış kararı kaydedildi").waitFor(); await boyut(p);
      if (ad === "telefon" && i === yol.secimler.length - 1) { mkdirSync(root + "/testler/ciktilar", { recursive: true }); await p.screenshot({ path: root + `/testler/ciktilar/isinma-${yol.ad}.png` }); }
      d = await oku(p); const sakli = structuredClone(d.isinma);
      await p.reload(); assert.deepEqual((await oku(p)).isinma, sakli, "yenileme aynı ödemeyi veya günü yeniden kullanmaz");
      if (i < yol.secimler.length - 1) { d.ay++; ayiAc(d, I); d.masa = d.masa.filter(m => isinmaKarti(m.kart)); await koy(p, d); }
    }
    assert.equal(d.isinma[0]?.asama, "uygulama"); assert.equal(d.isinma[0]?.odemeler.length, yol.odeme);
    await p.getByRole("button", { name: "Ayı bitir", exact: true }).click();
    for (let i = 0; i < d.meclis.oylamalar.length; i++) await p.getByRole("button", { name: /^(Sayımı atla|Devam et)$/ }).click();
    await p.getByText("Ay sonu raporu · Özel Kalem", { exact: true }).waitFor(); await boyut(p);
    const x = await oku(p); assert.equal(x.isinma[0]?.asama, "tamam"); assert.equal(x.isinma[0]?.sonuc, yol.son);
    assert.ok(x.gecmis.at(-1)?.olaylar.some(o => o.includes(x.isinma[0]!.sonHaber)));
    if (yol.ad === "sayaç") assert.ok(await p.locator(".rapor").getByText(/yanlış yüksek kademe farkı abone hesabına alacak yazıldı/).isVisible());
    assert.deepEqual(hatalar, []); await ctx.close();
  });
}
