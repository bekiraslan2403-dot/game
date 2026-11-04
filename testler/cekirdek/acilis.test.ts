import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { yeniOyun, DURUM_SURUMU } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { anlatiAc, anlatiCevapla, anlatiDevam } from "../../cekirdek/anlati.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { yonetimAySonu } from "../../cekirdek/yonetim.ts";
import { botKarari } from "../yardim/bot.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const I = JSON.parse(readFileSync(new URL("../../uretilen/icerik.json", import.meta.url), "utf8")) as IcerikPaketi;
function basla(gece: number, konus = false) {
  const d = oyunuBaslat(yeniOyun(912), I), m = d.masa.find(m => m.kart === "akkopru_telefon")!;
  if (konus) {
    assert.ok(anlatiAc(d, I, m.ornek).ok);
    for (let i = 0; i < 3; i++) { assert.ok(anlatiCevapla(d, I, 0).ok); assert.ok(anlatiDevam(d).ok); }
  }
  assert.ok(kararVer(d, I, m.ornek, gece).ok);
  return d;
}
function geri(d: ReturnType<typeof basla>) {
  const y = yukle(kaydet(d)); if (!y.ok) throw Error(y.hata); assert.deepEqual(y.durum, d); return y.durum;
}
const beklenen = [
  ["agir_yuk_kapali", "agir_yuk_kapali", "acik"],
  ["agir_yuk_kapali", "hafif_tek_serit", "acik"],
  ["agir_yuk_kapali", "acik", "acik"],
];
for (let gece = 0; gece < 3; gece++) for (let sabah = 0; sabah < 3; sabah++) {
  test(`ilk gün ${gece}/${sabah}: sahadaki sonuç, gerçek ay akışı ve kayıt birlikte korunur`, () => {
    let d = geri(basla(gece));
    assert.equal(d.ay, 1); assert.equal(d.acilis!.gece, gece); assert.equal(d.acilis!.sabah, null);
    assert.equal(d.bekleyen.some(b => b.kart === "akkopru_inceleme"), false);
    const m = d.masa.find(m => m.kart === d.acilis!.sabahKarti)!;
    assert.ok(m); const sahneAy = d.meclis.sahneAy;
    assert.ok(kararVer(d, I, m.ornek, sabah).ok);
    assert.equal(d.acilis!.trafik, beklenen[gece]![sabah]);
    assert.equal(d.acilis!.sabah, sabah); assert.ok(d.acilis!.sonuc); assert.equal(d.meclis.sahneAy, sahneAy);
    assert.equal(d.acilis!.sevkiyat, gece === 0 && sabah === 1 ? "gecikti" : "hastanede");
    assert.equal(d.bayraklar.akkopru_yuk_kisiti, d.acilis!.trafik === "acik" ? undefined : true);
    assert.equal(d.bekleyen.filter(b => b.kart === "akkopru_inceleme").length, 1);
    assert.ok(d.buAy.olaylar.some(o => o.includes(d.acilis!.sonuc!.baslik)));
    assert.ok(d.haberler.some(h => h.metin.includes(d.acilis!.sonuc!.baslik)));
    d = geri(d);
    while (d.masa.length) botKarari(d, I, d.masa[0]!.ornek, 2);
    const r = ayiBitir(d, I); assert.ok(r.ok); if (!r.ok) return;
    assert.equal(r.durum.masa.filter(m => m.kart === "akkopru_inceleme").length, 1);
    assert.deepEqual(r.durum.acilis, d.acilis);
  });
}
test("gece kararı üç ayrı sabah ve dokuz ayrı gün sonu açar", () => {
  const sabahlar = new Set<string>(), sonlar = new Set<string>();
  for (let g = 0; g < 3; g++) for (let s = 0; s < 3; s++) {
    const d = basla(g); sabahlar.add(d.acilis!.sabahKarti);
    kararVer(d, I, d.masa.find(m => m.kart === d.acilis!.sabahKarti)!.ornek, s);
    sonlar.add(d.acilis!.sonuc!.baslik);
  }
  assert.equal(sabahlar.size, 3); assert.equal(sonlar.size, 9);
});
test("ilk gün ödemesi gerçek bütçeyi yükler, bir dönem sonra kapanır; tarihî TL tutarı sabittir", () => {
  const d = basla(0), base = yeniOyun(912).ekonomi.gider.yatirim!;
  assert.ok(d.ekonomi.gider.yatirim! > base);
  kararVer(d, I, d.masa.find(m => m.kart === d.acilis!.sabahKarti)!.ornek, 0);
  assert.equal(d.ekonomi.sozler.filter(s => s.durum === "tutuldu").length, 2);
  assert.ok(Math.abs(d.acilis!.harcamaTL - 2_666_666.666666667) < .01);
  const tutar = d.acilis!.harcamaTL; d.ekonomi.gsyh *= 1.5;
  yonetimAySonu(d);
  assert.ok(Math.abs(d.ekonomi.gider.yatirim! - base) < 1e-9);
  assert.equal(d.acilis!.harcamaTL, tutar); assert.equal(d.imza, 0);
});
test("yetersiz gün, tekrarlanan karar ve ilgisiz sabah dosyası atomik olarak reddedilir", () => {
  const d = basla(0), m = d.masa.find(m => m.kart === d.acilis!.sabahKarti)!; d.bosGun = 0;
  let once = structuredClone(d); assert.equal(kararVer(d, I, m.ornek, 1).ok, false); assert.deepEqual(d, once);
  assert.ok(kararVer(d, I, m.ornek, 0).ok); once = structuredClone(d);
  assert.equal(kararVer(d, I, m.ornek, 0).ok, false); assert.deepEqual(d, once);
  const b = basla(0); b.masa[0] = { ...m, kart: "akkopru_sabah_guvence" }; once = structuredClone(b);
  assert.equal(kararVer(b, I, m.ornek, 0).ok, false); assert.deepEqual(b, once);
});
test("sabaha kadar alınan delil çekilen tanıkla birlikte silinmez; görev sözü ihlali sicile geçer", () => {
  const d = basla(2, true), m = d.masa.find(m => m.kart === d.acilis!.sabahKarti)!;
  assert.equal(d.acilis!.hamKayit, true); const iliski = d.anlati.iliskiler.deniz_alaz!;
  kararVer(d, I, m.ornek, 2);
  assert.equal(d.acilis!.deniz, "gorevden_cekildi"); assert.equal(d.bayraklar.akkopru_ham_veri, true);
  assert.ok(d.anlati.iliskiler.deniz_alaz! < iliski); assert.ok(d.sicil.some(s => s.tur === "kirilan_soz"));
  assert.ok(d.sicil.some(s => s.tur === "baski")); geri(d);
});
test("sabah kısıtı kaldırmak veya sonradan koymak sonraki köprü olayının yolunu değiştirir", () => {
  for (const [g, s, hedef] of [[0, 2, "akkopru_kaza"], [2, 0, "akkopru_son"]] as const) {
    const d = basla(g); kararVer(d, I, d.masa.find(m => m.kart === d.acilis!.sabahKarti)!.ornek, s);
    d.bekleyen = []; d.masa = [{ kart: "akkopru_ortbas", ornek: "test", degisken: {}, agir: false, ikinciGorus: false }];
    assert.ok(kararVer(d, I, "test", 1).ok); assert.deepEqual(d.bekleyen.map(b => b.kart), [hedef]);
  }
});
test("10→11 göçü eski ilk geceye sabah, kaynak veya sonuç uydurmaz", () => {
  const d = basla(2), ham = JSON.parse(kaydet(d));
  delete ham.durum.acilis; ham.surum = 10; ham.durum.surum = 10;
  ham.durum.masa = ham.durum.masa.filter((m: { kart: string }) => !I.kartlar[m.kart]?.acilis);
  ham.durum.bekleyen.push({ kart: "akkopru_inceleme", ay: 2, degisken: {}, agir: false });
  const beklenen = structuredClone(ham.durum); const y = yukle(JSON.stringify(ham)); assert.ok(y.ok); if (!y.ok) return;
  assert.equal(y.durum.surum, DURUM_SURUMU); assert.equal(y.durum.acilis, null);
  assert.deepEqual(y.durum, { ...beklenen, surum: DURUM_SURUMU, acilis: null });
});
test("açık sabah dosyası kayıpsa veya sonuç kararından önce yazılmışsa kayıt reddedilir", () => {
  const d = basla(0);
  for (const boz of [(h: any) => { h.durum.masa = []; }, (h: any) => { h.durum.acilis.gece = 2; }, (h: any) => { h.durum.acilis.sonuc = { baslik: "Sahte sonuç", metin: "Henüz verilmemiş karardan sonuç çıkarılamaz." }; }]) {
    const ham = JSON.parse(kaydet(d)); boz(ham); assert.equal(yukle(JSON.stringify(ham)).ok, false);
  }
});
