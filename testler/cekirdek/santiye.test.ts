import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { yeniOyun, bosAyKaydi, DURUM_SURUMU, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { botKarari } from "../yardim/bot.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const I = JSON.parse(readFileSync(new URL("../../uretilen/icerik.json", import.meta.url), "utf8")) as IcerikPaketi;
function tek(d: OyunDurumu, id: string) {
  const m = { kart: id, ornek: `${id}#${++d.sayac}`, degisken: { il: "Akköprü" }, agir: false, ikinciGorus: false };
  d.masa = [m]; return m.ornek;
}
function baslangic() {
  const d = oyunuBaslat(yeniOyun(889), I); d.ay = 4; d.buAy = bosAyKaydi(4); d.bekleyen = [];
  return d;
}
function karar(d: OyunDurumu, id: string, i: number) {
  const m = d.masa.find(m => m.kart === id)!; assert.ok(m, `${id} masada`);
  const r = kararVer(d, I, m.ornek, i); assert.ok(r.ok, r.ok ? "" : r.neden);
}
function ileri(d: OyunDurumu) {
  let n = 0; while (d.masa.length) { botKarari(d, I, d.masa[0]!.ornek, 2); assert.ok(++n < 80); }
  const r = ayiBitir(d, I); if (!r.ok) throw Error(r.neden); return r.durum;
}
function devam(d: OyunDurumu, id: string) {
  let n = 0; while (!d.masa.some(m => m.kart === id)) { d = ileri(d); assert.ok(++n < 3, `${id} gelmedi`); }
  return d;
}
function kayit(d: OyunDurumu) { const r = yukle(kaydet(d)); if (!r.ok) throw Error(r.hata); assert.deepEqual(r.durum, d); return r.durum; }

test("protokol ücreti gerçekten öder; ikinci ödeme kilitli, esnaf zararı kapanmaz", () => {
  let d = baslangic(); tek(d, "akkopru_tazminat"); karar(d, "akkopru_tazminat", 1);
  assert.equal(d.santiye!.ucret, "odendi"); assert.equal(d.santiye!.protokol, "kosullu");
  assert.ok(d.santiye!.harcamaTL > 0); assert.ok(d.yonetim.uygulamalar.some(u => u.kalem === "personel" && u.tekSeferlik));
  d = kayit(d); d = devam(d, "akkopru_onarim"); assert.equal(d.santiye!.ucret, "odendi");
  const m = tek(d, "akkopru_tazminat"); const once = structuredClone(d);
  assert.equal(kararVer(d, I, m, 1).ok, false); assert.deepEqual(d, once);
});
for (const secim of [0, 1, 2]) test(`protokol ${secim} ücret/teminat/dava ayrımını korur`, () => {
  const d = baslangic(); tek(d, "akkopru_tazminat"); karar(d, "akkopru_tazminat", secim);
  assert.equal(d.santiye!.ucret, secim === 1 ? "odendi" : "bekliyor");
  assert.equal(d.santiye!.protokol, ["ayri_teminat", "kosullu", "dava"][secim]);
  assert.ok(!d.bayraklar.akkopru_bitti); assert.ok(d.bekleyen.some(b => b.kart === "akkopru_onarim")); kayit(d);
});
test("ödenek fiziksel teslimi sonraki aya taşır; deney ve kabul iki ayrı tarihte gelir", () => {
  let d = baslangic(); tek(d, "akkopru_onarim"); karar(d, "akkopru_onarim", 0);
  assert.equal(d.santiye!.asama, "yapim"); assert.equal(d.santiye!.teknik, "bekliyor");
  assert.ok(d.santiye!.harcamaTL > 0); assert.ok(!d.bayraklar.akkopru_bitti); d = kayit(d);
  d = devam(d, "akkopru_teslim"); assert.equal(d.santiye!.asama, "fiziksel_teslim");
  karar(d, "akkopru_teslim", 0); assert.equal(d.santiye!.asama, "kabul_bekliyor");
  assert.equal(d.santiye!.teknik, "bekliyor"); d = kayit(d);
  d = devam(d, "akkopru_kabul"); assert.equal(d.santiye!.teknik, "uygun");
  karar(d, "akkopru_kabul", 0); assert.equal(d.santiye!.asama, "kabul");
  assert.ok(d.masa.some(m => m.kart === "akkopru_son"), "açılış kabulden sonra ayrı karar");
  karar(d, "akkopru_son", 0); assert.equal(d.bayraklar.akkopru_sonuc, "acik"); kayit(d);
});
test("eski yüklenicinin işi bağımsız deneyden geçmez; eksik rapora imza atılamaz", () => {
  let d = baslangic(); tek(d, "akkopru_onarim"); karar(d, "akkopru_onarim", 1);
  d = devam(d, "akkopru_teslim"); karar(d, "akkopru_teslim", 0);
  d = devam(d, "akkopru_kabul"); assert.equal(d.santiye!.teknik, "eksik");
  const m = d.masa.find(m => m.kart === "akkopru_kabul")!; const once = structuredClone(d);
  assert.equal(kararVer(d, I, m.ornek, 0).ok, false); assert.deepEqual(d, once);
  karar(d, "akkopru_kabul", 1); assert.ok(d.bekleyen.some(b => b.kart === "akkopru_onarim")); kayit(d);
});
test("teslimi geri çevirmek yeniden para ve yapım ister; şirket tutanağı güvenlik onayı üretmez", () => {
  for (const i of [1, 2]) {
    let d = baslangic(); tek(d, "akkopru_onarim"); karar(d, "akkopru_onarim", 0);
    d = devam(d, "akkopru_teslim"); const once = d.santiye!.harcamaTL;
    karar(d, "akkopru_teslim", i);
    assert.equal(d.santiye!.asama, i === 1 ? "yapim" : "durduruldu");
    assert.equal(d.santiye!.harcamaTL > once, i === 1);
    assert.ok(d.bekleyen.some(b => b.kart === (i === 1 ? "akkopru_teslim" : "akkopru_onarim")));
    assert.notEqual(d.santiye!.teknik, "uygun"); kayit(d);
  }
});
test("ikinci deney önceki sonucu açılış diye saymaz", () => {
  let d = baslangic(); tek(d, "akkopru_onarim"); karar(d, "akkopru_onarim", 0);
  d = devam(d, "akkopru_teslim"); karar(d, "akkopru_teslim", 0);
  d = devam(d, "akkopru_kabul"); assert.equal(d.santiye!.teknik, "uygun");
  karar(d, "akkopru_kabul", 2); assert.equal(d.santiye!.asama, "kabul_bekliyor");
  assert.ok(!d.masa.some(m => m.kart === "akkopru_son"));
  d = devam(d, "akkopru_kabul"); assert.equal(d.santiye!.teknik, "uygun"); kayit(d);
});
test("yapım duraklatılırsa teslim olmaz; kaynak engeli ve kayıt bozulması atomiktir", () => {
  const d = baslangic(); tek(d, "akkopru_onarim"); karar(d, "akkopru_onarim", 2);
  assert.equal(d.santiye!.asama, "hazirlik"); assert.equal(d.santiye!.isAy, null);
  const m = tek(d, "akkopru_onarim"); d.imza = 3; const once = structuredClone(d);
  assert.equal(kararVer(d, I, m, 0).ok, false); assert.deepEqual(d, once);
  const h = JSON.parse(kaydet(d)); h.durum.santiye.asama = "kabul"; h.durum.santiye.teknik = "uygun";
  assert.equal(yukle(JSON.stringify(h)).ok, false);
});
test("12→13 eski kararda geçmiş ödeme ve teknik teslim uydurmaz", () => {
  const d = baslangic(), h = JSON.parse(kaydet(d)); delete h.durum.santiye; h.surum = 12; h.durum.surum = 12;
  const y = yukle(JSON.stringify(h)); assert.ok(y.ok); if (!y.ok) return;
  assert.equal(y.durum.surum, DURUM_SURUMU); assert.deepEqual(y.durum, { ...d, santiye: null });
});
test("12→13 yalnız gerçek eski rapor ödemesini mükerrer avansa karşı tanır", () => {
  const d = baslangic(), h = JSON.parse(kaydet(d)); delete h.durum.santiye;
  h.durum.buAy.kararlar.push({ kart: "akkopru_rapor_bagimsiz", secenek: 1, baslik: "Rapor", secenekMetni: "Ücret" });
  h.surum = 12; h.durum.surum = 12;
  const y = yukle(JSON.stringify(h)); assert.ok(y.ok); if (!y.ok) return;
  assert.equal(y.durum.santiye, null); assert.equal(y.durum.bayraklar.akkopru_ucret_odendi, true);
  tek(y.durum, "akkopru_tazminat"); const once = structuredClone(y.durum);
  assert.equal(kararVer(y.durum, I, y.durum.masa[0]!.ornek, 1).ok, false); assert.deepEqual(y.durum, once);
});
