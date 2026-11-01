import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, DURUM_SURUMU, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer, ertele, ikinciGorus, tahminEt, kartMetni } from "../../cekirdek/karar.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { KATEGORI_SINIRI } from "../../cekirdek/deste.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const s = icerikDerle(join(dirname(fileURLToPath(import.meta.url)), "../../icerik"));
if (!s.paket) throw new Error(s.hatalar.join("\n"));
const I: IcerikPaketi = s.paket;

/** Masadaki her kartta verilen kurala göre karar verip ayı bitirir. */
function ayiOyna(d: OyunDurumu, sec: (d: OyunDurumu, ornek: string) => number = () => 0): OyunDurumu {
  while (d.masa.length) {
    const m = d.masa[0]!;
    const r = kararVer(d, I, m.ornek, sec(d, m.ornek));
    assert.ok(r.ok, `karar verilemedi: ${m.kart}`);
  }
  const r = ayiBitir(d, I);
  assert.ok(r.ok, r.ok ? "" : r.neden);
  return r.ok ? r.durum : d;
}

test("ilk ay: masada önce ana karar, ardından 3 masa kartı; kategori ve kişi sınırları korunur", () => {
  for (let tohum = 1; tohum <= 40; tohum++) {
    const d = oyunuBaslat(yeniOyun(tohum), I);
    assert.equal(I.kartlar[d.masa[0]!.kart]?.tur, "ana", `tohum ${tohum}`);
    assert.ok(d.masa.length >= 3 && d.masa.length <= 5, `tohum ${tohum}: ${d.masa.length} kart`);
    const kat: Record<string, number> = {};
    for (const m of d.masa) kat[I.kartlar[m.kart]!.kategori] = (kat[I.kartlar[m.kart]!.kategori] ?? 0) + 1;
    for (const v of Object.values(kat)) assert.ok(v <= KATEGORI_SINIRI);
    const getiren = d.masa.filter((m) => I.kartlar[m.kart]?.tur === "masa").map((m) => I.kartlar[m.kart]!.getiren);
    assert.equal(new Set(getiren).size, getiren.length);
  }
});

test("Aralık ayında ana karar asgari ücrettir", () => {
  const d = ayiOyna(oyunuBaslat(yeniOyun(3), I));
  assert.equal(d.ay, 2);
  assert.equal(d.masa[0]?.kart, "asgari_ucret");
});

test("karar etkileri uygular, haber yazar, kartı masadan kaldırır; zincir aynı şehirle devam eder", () => {
  // belediye_maas_1 masaya gelene kadar tohum ara
  for (let tohum = 1; tohum < 500; tohum++) {
    const d = oyunuBaslat(yeniOyun(tohum), I);
    const m = d.masa.find((x) => x.kart === "belediye_maas_1");
    if (!m) continue;
    const il = m.degisken.il!;
    assert.ok(I.sehirler.find((x) => x.ad === il)?.belediye === "muhalefet");
    const once = d.gostergeler["grup.kentli"]!;
    const r = kararVer(d, I, m.ornek, 1);
    assert.ok(r.ok && r.haber?.includes(il));
    assert.ok(d.gostergeler["grup.kentli"]! < once);
    assert.ok(!d.masa.some((x) => x.ornek === m.ornek));
    assert.equal(d.buAy.kararlar.at(-1)?.kart, "belediye_maas_1");
    const sonraki = ayiOyna(d);
    const z = sonraki.masa.find((x) => x.kart === "belediye_maas_2b");
    assert.ok(z, "zincirin sonraki kartı gelmedi");
    assert.equal(z!.degisken.il, il);
    assert.ok(kartMetni(I, z!).baslik.startsWith(il));
    return;
  }
  assert.fail("belediye zinciri hiçbir tohumda gelmedi");
});

test("erteleme: ayda bir, ana karar ertelenemez, ertelenen kart ağırlaşarak gelir", () => {
  const d = oyunuBaslat(yeniOyun(8), I);
  const ana = d.masa[0]!;
  assert.equal(ertele(d, I, ana.ornek).ok, false);
  const masaKarti = d.masa.find((m) => I.kartlar[m.kart]?.tur === "masa")!;
  assert.ok(ertele(d, I, masaKarti.ornek).ok);
  const ikinci = d.masa.find((m) => I.kartlar[m.kart]?.tur === "masa");
  if (ikinci) assert.equal(ertele(d, I, ikinci.ornek).ok, false);
  const y = ayiOyna(d);
  const geri = y.masa.find((m) => m.kart === masaKarti.kart);
  assert.ok(geri?.agir);
  assert.equal(ertele(y, I, geri!.ornek).ok, false);
});

test("danışman tahmini kararlıdır, zarı değiştirmez; ikinci görüş bir gün alır", () => {
  const d = oyunuBaslat(yeniOyun(12), I);
  const m = d.masa[0]!;
  const zar = JSON.stringify(d.zar);
  const t1 = tahminEt(d, I, m.ornek, 0), t2 = tahminEt(d, I, m.ornek, 0);
  assert.deepEqual(t1, t2);
  assert.equal(JSON.stringify(d.zar), zar);
  const gun = d.bosGun;
  assert.ok(ikinciGorus(d, m.ornek).ok);
  assert.equal(d.bosGun, gun - 1);
  assert.equal(ikinciGorus(d, m.ornek).ok, false);
});

test("masa boşalmadan ay bitmez; ay sonunda değişimler rapora yazılır", () => {
  const d = oyunuBaslat(yeniOyun(21), I);
  assert.equal(ayiBitir(d, I).ok, false);
  while (d.masa.length) kararVer(d, I, d.masa[0]!.ornek, 0);
  const r = ayiBitir(d, I);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.ok(r.rapor.kararlar.length >= 3);
  assert.ok(r.rapor.degisim.length > 0);
  assert.equal(r.durum.gecmis.length, 1);
  assert.equal(r.durum.bosGun, 4);
});

test("aynı tohum ve aynı kararlar birebir aynı oyunu üretir", () => {
  const oyna = () => {
    let d = oyunuBaslat(yeniOyun(99), I);
    for (let i = 0; i < 8; i++) d = ayiOyna(d, (_, o) => o.length % 3);
    return d;
  };
  assert.deepEqual(oyna(), oyna());
});

test("17 ay boyunca her tohumda oyun hatasız ilerler; ilk 6 ayın hepsinde ana karar vardır", () => {
  for (let tohum = 1; tohum <= 30; tohum++) {
    let d = oyunuBaslat(yeniOyun(tohum), I);
    for (let ay = 1; ay < 18; ay++) {
      if (ay <= 6) assert.equal(I.kartlar[d.masa[0]!.kart]?.tur, "ana", `tohum ${tohum} ay ${ay}`);
      d = ayiOyna(d, (x, o) => (x.ay + o.length + tohum) % 3);
      for (const [id, v] of Object.entries(d.gostergeler)) assert.ok(Number.isFinite(v), `${id} sonlu değil`);
    }
    assert.equal(d.ay, 18);
  }
});

test("oyunun ortasında kaydedilen oyun birebir geri yüklenir", () => {
  let d = oyunuBaslat(yeniOyun(55), I);
  d = ayiOyna(d);
  d = ayiOyna(d);
  ertele(d, I, d.masa.find((m) => I.kartlar[m.kart]?.tur === "masa")!.ornek);
  const y = yukle(kaydet(d));
  assert.ok(y.ok, y.ok ? "" : y.hata);
  if (y.ok) assert.deepEqual(y.durum, d);
});

test("sürüm 1 kaydı göçlerle güncel sürüme yükseltilir", () => {
  const eski = { oyun: "akkopru-2026", surum: 1, durum: { surum: 1, tohum: 5, zar: { a: 1, b: 2, c: 3, d: 4 }, ay: 3, bitis: null, sicil: [], bayraklar: {}, gecmis: [] } };
  const y = yukle(JSON.stringify(eski));
  assert.ok(y.ok, y.ok ? "" : y.hata);
  if (!y.ok) return;
  assert.equal(y.durum.surum, DURUM_SURUMU);
  assert.equal(y.durum.ay, 3);
  assert.equal(y.durum.masaKuruldu, false);
  assert.equal(y.durum.gostergeler.enflasyon, 29);
});
