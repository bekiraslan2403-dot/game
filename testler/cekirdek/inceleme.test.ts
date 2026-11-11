import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { yeniOyun, DURUM_SURUMU, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { anlatiAc, anlatiCevapla, anlatiDevam } from "../../cekirdek/anlati.ts";
import { incelemeAyBasi, incelemeKanit } from "../../cekirdek/inceleme.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { botKarari } from "../yardim/bot.ts";
import { INCELEME_RAPORLARI } from "../../cekirdek/inceleme-durum.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const I = JSON.parse(readFileSync(new URL("../../uretilen/icerik.json", import.meta.url), "utf8")) as IcerikPaketi;
function konus(d: OyunDurumu, kart: string, secimler = [2, 1, 0]) {
  const m = d.masa.find(m => m.kart === kart)!; assert.ok(m); assert.ok(anlatiAc(d, I, m.ornek).ok);
  for (const i of secimler) { assert.ok(anlatiCevapla(d, I, i).ok); assert.ok(anlatiDevam(d).ok); }
}
function ay(d: OyunDurumu) {
  let n = 0; while (d.masa.length) { botKarari(d, I, d.masa[0]!.ornek, 2); assert.ok(++n < 80); }
  const r = ayiBitir(d, I); if (!r.ok) throw Error(r.neden); return r.durum;
}
function kur(ham = false) {
  let d = oyunuBaslat(yeniOyun(742), I);
  if (ham) konus(d, "akkopru_telefon", [0, 0, 0]);
  kararVer(d, I, d.masa.find(m => m.kart === "akkopru_telefon")!.ornek, 2);
  kararVer(d, I, d.masa.find(m => m.kart === d.acilis!.sabahKarti)!.ornek, 2);
  d = ay(d); assert.equal(d.ay, 2); return d;
}
function baslat(yol: number, ham = false, beyan = false) {
  const d = kur(ham); if (beyan) konus(d, "akkopru_inceleme");
  const m = d.masa.find(m => m.kart === "akkopru_inceleme")!;
  assert.ok(kararVer(d, I, m.ornek, yol).ok); return d;
}
function rapor(d: OyunDurumu) { assert.ok(d.inceleme?.rapor); return d.inceleme.rapor; }
function geri(d: OyunDurumu) {
  const y = yukle(kaydet(d)); if (!y.ok) throw Error(y.hata); assert.deepEqual(y.durum, d); return y.durum;
}
for (let yol = 0; yol < 3; yol++) for (let yanit = 0; yanit < 3; yanit++) {
  test(`inceleme ${yol}/${yanit}: rapor gerçek ayda gelir; karar veya devir kayıtta sürer`, () => {
    let d = geri(baslat(yol, true));
    assert.equal(d.inceleme!.asama, "bekliyor"); assert.equal(d.inceleme!.rapor, null); assert.equal(d.inceleme!.raporAy, 3);
    incelemeAyBasi(d, I); assert.equal(d.inceleme!.rapor, null, "erken rapor üretilemez");
    d = ay(d); assert.equal(d.inceleme!.asama, "rapor"); assert.ok(d.inceleme!.rapor);
    const ilkRapor = structuredClone(rapor(d)), once = structuredClone(d.inceleme!.izler);
    incelemeAyBasi(d, I); assert.deepEqual(d.inceleme!.izler, once, "aynı rapor ikinci kez teslim edilemez");
    const m = d.masa.find(m => m.kart === d.inceleme!.raporKarti)!; assert.ok(m);
    assert.ok(kararVer(d, I, m.ornek, yanit).ok);
    if ((yol === 1 && yanit === 0) || (yol === 2 && yanit === 1)) {
      assert.equal(d.inceleme!.asama, "bekliyor"); assert.equal(d.inceleme!.rapor, null);
      assert.equal(d.inceleme!.oncekiRaporlar.length, 1); assert.deepEqual(d.inceleme!.oncekiRaporlar[0]!.rapor, ilkRapor);
      assert.equal(d.inceleme!.raporKarti, INCELEME_RAPORLARI.bagimsiz);
      d = ay(geri(d)); assert.equal(d.ay, 4); assert.equal(d.inceleme!.asama, "rapor");
      assert.equal(d.inceleme!.oncekiRaporlar.length, 1); assert.notEqual(rapor(d).baslik, ilkRapor.baslik);
      assert.ok(kararVer(d, I, d.masa.find(m => m.kart === INCELEME_RAPORLARI.bagimsiz)!.ornek, 0).ok);
    }
    assert.equal(d.inceleme!.asama, "tamam"); assert.ok(d.inceleme!.sonuc);
    assert.ok(d.haberler.some(h => h.metin.includes(d.inceleme!.sonuc!.baslik)));
    geri(d);
  });
}
test("delilsiz güçlü başvuru kilitlidir; beyan ayrı ek olur, teslim edilmiş rapor değişmez", () => {
  let d = ay(baslat(0)); const m = d.masa.find(m => m.kart === INCELEME_RAPORLARI.bagimsiz)!;
  const once = structuredClone(d); assert.equal(kararVer(d, I, m.ornek, 0).ok, false); assert.deepEqual(d, once);
  const rapor = structuredClone(d.inceleme!.rapor); konus(d, m.kart);
  assert.equal(d.bayraklar.akkopru_ham_veri, undefined); assert.equal(d.inceleme!.hamKayit, false);
  assert.equal(d.inceleme!.tanikBeyani, true); assert.deepEqual(d.inceleme!.rapor, rapor);
  d.bayraklar.inceleme_beyan_teslim = false; incelemeKanit(d);
  assert.equal(d.bayraklar.inceleme_kanit_var, true, "teslim edilmiş beyan sonraki sözle silinemez");
  assert.ok(kararVer(d, I, m.ornek, 0).ok); geri(d);
});
test("sabah arşivlenen ikinci cihaz serisi rapora girer ve ayrı bir yayın yolu açar", () => {
  for (const sabah of [0, 1, 2]) {
    let d = oyunuBaslat(yeniOyun(742), I);
    assert.ok(kararVer(d, I, d.masa.find(m => m.kart === "akkopru_telefon")!.ornek, 1).ok);
    assert.ok(kararVer(d, I, d.masa.find(m => m.kart === d.acilis!.sabahKarti)!.ornek, sabah).ok);
    assert.equal(d.bayraklar.akkopru_sabah_olcum_arsivde, sabah === 1 ? true : undefined);
    assert.equal(d.acilis!.hamKayit, false);
    d = ay(geri(d));
    assert.ok(kararVer(d, I, d.masa.find(m => m.kart === "akkopru_inceleme")!.ornek, 0).ok);
    d = ay(d);
    assert.equal(rapor(d).bulgular.some(b => b.startsWith("İkinci cihazın ham serisi")), sabah === 1);
    assert.ok(rapor(d).eksikler.some(e => e.includes("İlk geceye ait ham ölçüm serisi")));
    assert.equal(d.inceleme!.hamKayit, false);
    const karar = kararVer(d, I, d.masa.find(m => m.kart === INCELEME_RAPORLARI.bagimsiz)!.ornek, 0);
    assert.equal(karar.ok, sabah === 1);
    if (karar.ok) assert.equal(geri(d).inceleme!.yayin, "acik");
  }
});
test("ilk gece kopyası tanığın uzaklaştırılmasıyla kaybolmaz; yeni beyan varmış sayılmaz", () => {
  const d = ay(baslat(0, true));
  assert.equal(d.inceleme!.tanikDurumu, "gorevden_cekildi"); assert.equal(d.inceleme!.hamKayit, true);
  assert.equal(d.inceleme!.tanikBeyani, false); assert.ok(d.inceleme!.rapor!.eksikler.some(e => e.includes("yeni imzalı beyan")));
  assert.equal(d.bayraklar.inceleme_kanit_var, true); geri(d);
});
test("başarısız görevlendirme veya imza bütçeyi, kaydı ve zarı değiştirmez", () => {
  for (const degistir of [(d: OyunDurumu) => { d.bosGun = 0; }, (d: OyunDurumu) => { d.imza = 3; }]) {
    const d = kur(), m = d.masa.find(m => m.kart === "akkopru_inceleme")!; degistir(d);
    const once = structuredClone(d); assert.equal(kararVer(d, I, m.ornek, 0).ok, false); assert.deepEqual(d, once);
    assert.ok(kararVer(d, I, m.ornek, 1).ok, "bakanlık yolu kaynak yetmediğinde açık kalır");
  }
});
test("işçi ödemesi sadece Akköprü işçi eylemine işler; raporu veya onarımı tamamlamaz", () => {
  const d = ay(baslat(0)); d.toplum.eylemler = [
    { id: "a", il: "Akköprü", grup: "grup.isci", emniyet: 100, duzenleyici: 200, basladi: 3, dinlendi: false },
    { id: "b", il: "Turunçlu", grup: "grup.isci", emniyet: 100, duzenleyici: 200, basladi: 3, dinlendi: false },
  ];
  const once = d.ekonomi.gider.personel!; const tl = d.inceleme!.harcamaTL;
  kararVer(d, I, d.masa.find(m => m.kart === INCELEME_RAPORLARI.bagimsiz)!.ornek, 1);
  assert.ok(d.ekonomi.gider.personel! > once); assert.ok(d.inceleme!.harcamaTL > tl);
  assert.deepEqual(d.toplum.eylemler.map(e => e.emniyet), [70, 100]);
  assert.equal(d.inceleme!.yayin, "sinirli"); assert.ok(d.bekleyen.some(b => b.kart === "akkopru_tazminat"));
  assert.ok(d.yonetim.uygulamalar.some(u => u.tekSeferlik && u.kalem === "personel"));
  const harcama = d.inceleme!.harcamaTL; d.ekonomi.gsyh *= 2; assert.equal(d.inceleme!.harcamaTL, harcama);
  geri(d);
});
test("yinelenen karar veya ilgisiz rapor ücretsiz işlem üretmez", () => {
  const d = ay(baslat(1)), m = d.masa.find(m => m.kart === INCELEME_RAPORLARI.bakanlik)!;
  kararVer(d, I, m.ornek, 2); const once = structuredClone(d);
  assert.equal(kararVer(d, I, m.ornek, 2).ok, false); assert.deepEqual(d, once);
  const b = kur(); b.masa.push({ ...m }); const kopya = structuredClone(b);
  assert.equal(anlatiAc(b, I, m.ornek).ok, false); assert.deepEqual(b, kopya);
});
test("11→12 göçü önceki ilk günü korur; eski inceleme kararına rapor üretmez", () => {
  const d = kur(true), h = JSON.parse(kaydet(d)); delete h.durum.inceleme; h.surum = 11; h.durum.surum = 11;
  const once = structuredClone(h.durum); const y = yukle(JSON.stringify(h)); assert.ok(y.ok); if (!y.ok) return;
  assert.deepEqual(y.durum, { ...once, surum: DURUM_SURUMU, inceleme: null, santiye: null, hesaplasma: null });
});
test("bekleyen dosyası kayıp veya vadesinden önce teslim edilmiş rapor kaydı reddedilir", () => {
  const d = baslat(0, true);
  for (const boz of [(h: any) => { h.durum.bekleyen = []; }, (h: any) => { h.durum.inceleme.asama = "rapor"; }, (h: any) => { h.durum.inceleme.yol = "bakanlik"; }]) {
    const h = JSON.parse(kaydet(d)); boz(h); assert.equal(yukle(JSON.stringify(h)).ok, false);
  }
});
