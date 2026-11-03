import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, durumKopya, DURUM_SURUMU, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir, ayiAc } from "../../cekirdek/ay.ts";
import { anlatiAc, anlatiCevapla, anlatiDevam } from "../../cekirdek/anlati.ts";
import { kararVer, ertele } from "../../cekirdek/karar.ts";
import { basinAc } from "../../cekirdek/medya.ts";
import { kosulSaglaniyor } from "../../cekirdek/kosul.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { sonsoz } from "../../cekirdek/secim.ts";
import { kulisAc } from "../../cekirdek/meclis.ts";
import { masaKur } from "../../cekirdek/deste.ts";
import { sahneSorusu, sahneCevaplari } from "../../cekirdek/sahne-derinlik.ts";

const I = icerikDerle(fileURLToPath(new URL("../../icerik", import.meta.url))).paket!;
const kur = () => oyunuBaslat(yeniOyun(505), I);

test("yeni dönemin ilk gecesinde Akköprü dosyası vardır; rastgele tekrar başlamaz", () => {
  for (let tohum = 0; tohum < 20; tohum++) {
    const d = oyunuBaslat(yeniOyun(tohum), I);
    assert.equal(d.masa.filter(m => m.kart === "akkopru_telefon").length, 1);
    assert.equal(d.masa[0]?.kart, "akkopru_telefon");
    assert.equal(ertele(d, I, d.masa[0]!.ornek).ok, false, "ilk gecenin ana kararı ertelenemez");
    assert.equal(I.kartlar.akkopru_inceleme?.tur, "zincir");
  }
});

test("Akköprü yüzleşmesi sürerken rakip yayının tohumu aynı ayın üstüne binmez", () => {
  const d = yeniOyun(511); d.ay = 5;
  d.bekleyen = ["rakip_dosya", "akkopru_durusma"].map(kart => ({ kart, ay: 5, degisken: {}, agir: false }));
  masaKur(d, I);
  assert.ok(d.masa.some(m => m.kart === "akkopru_durusma"));
  assert.ok(!d.masa.some(m => m.kart === "rakip_dosya"));
  assert.equal(d.bekleyen.find(b => b.kart === "rakip_dosya")?.ay, 6);
});

test("ilk gece telefonu sahne hakkını kullanır, gün tüketmez; kayıtla sürer", () => {
  let d = kur();
  const m = d.masa.find(m => m.kart === "akkopru_telefon")!;
  const zar = structuredClone(d.zar);
  assert.ok(anlatiAc(d, I, m.ornek).ok);
  assert.equal(d.bosGun, 4);
  assert.equal(d.meclis.sahneAy, d.ay);
  assert.equal(basinAc(d, I).ok, false);
  assert.equal(kararVer(d, I, m.ornek, 0).ok, false);
  assert.equal(ertele(d, I, m.ornek).ok, false);
  assert.equal(ayiBitir(d, I).ok, false);
  for (let adim = 0; adim < 3; adim++) {
    assert.ok(anlatiCevapla(d, I, 0).ok);
    const kopya = durumKopya(d);
    assert.equal(anlatiCevapla(d, I, 0).ok, false);
    assert.deepEqual(d, kopya);
    const y = yukle(kaydet(d)); assert.ok(y.ok);
    if (y.ok) { assert.deepEqual(y.durum, d); d = y.durum; }
    assert.equal(d.anlati.notlar.length, adim + 1);
    assert.ok(anlatiDevam(d).ok);
  }
  assert.equal(d.anlati.sahne, null);
  assert.equal(d.bayraklar.akkopru_ham_veri, true);
  assert.equal(d.bayraklar.akkopru_gorev_guvencesi, true);
  assert.equal(d.bayraklar.akkopru_tanik_koruma, undefined);
  assert.ok(d.anlati.iliskiler.deniz_alaz! >= 60);
  assert.deepEqual(d.zar, zar, "diyaloglar zar tüketmemeli");
  assert.equal(anlatiAc(d, I, m.ornek).ok, false);
  assert.equal(basinAc(d, I).ok, false, "aylık sahne iki kez kullanılamaz");
});

test("tanığın güveni kurulmazsa ham veri yanıtı açılamaz; reddedilen işlem bedel yazmaz", () => {
  const d = kur(), m = d.masa.find(m => m.kart === "akkopru_telefon")!;
  anlatiAc(d, I, m.ornek); anlatiCevapla(d, I, 1); anlatiDevam(d);
  const c = durumKopya(d);
  assert.equal(anlatiCevapla(d, I, 0).ok, false);
  assert.deepEqual(d, c);
  assert.equal(kosulSaglaniyor(d, { iliski: { deniz_alaz: { en_az: 60 } } }), false);
  assert.ok(anlatiCevapla(d, I, 1).ok); anlatiDevam(d);
  assert.ok(anlatiCevapla(d, I, 2).ok); anlatiDevam(d);
  assert.equal(d.bayraklar.akkopru_ham_veri, undefined);
  assert.ok(d.anlati.iliskiler.deniz_alaz! < 50);
});

function tekDosya(d: OyunDurumu, id: string): string {
  const ornek = `${id}#${++d.sayac}`;
  d.masa = [{ ornek, kart: id, degisken: {}, agir: false, ikinciGorus: false }];
  return ornek;
}
test("aynı gece bakımı kararı önceki yük kısıtlamasına göre kazaya veya açılışa gider", () => {
  for (const sinir of [false, true]) {
    const d = kur();
    if (sinir) d.bayraklar.akkopru_yuk_kisiti = true;
    assert.ok(kararVer(d, I, tekDosya(d, "akkopru_ortbas"), 1).ok);
    assert.deepEqual(d.bekleyen.filter(b => ["akkopru_son", "akkopru_kaza"].includes(b.kart)).map(b => b.kart), [sinir ? "akkopru_son" : "akkopru_kaza"]);
  }
});
test("savcılığa aynı başvuru, ham delil varsa açılışa yoksa tanık dosyasına gider", () => {
  for (const veri of [false, true]) {
    const d = kur(); if (veri) d.bayraklar.akkopru_ham_veri = true;
    kararVer(d, I, tekDosya(d, "akkopru_belge"), 0);
    assert.deepEqual(d.bekleyen.map(b => b.kart), [veri ? "akkopru_son" : "akkopru_tanik"]);
  }
});

function bolumuOyna(secimler: Record<string, number>, gorus: boolean): OyunDurumu {
  let d = kur();
  for (let ay = 1; ay <= 6; ay++) {
    while (d.masa.length) {
      const m = d.masa[0]!;
      if (gorus && m.kart === "akkopru_telefon") {
        anlatiAc(d, I, m.ornek);
        for (let i = 0; i < 3; i++) { assert.ok(anlatiCevapla(d, I, 0).ok); anlatiDevam(d); }
      }
      assert.ok(kararVer(d, I, m.ornek, secimler[m.kart] ?? 0).ok);
    }
    const r = ayiBitir(d, I); assert.ok(r.ok);
    if (r.ok) d = r.durum;
  }
  return d;
}
test("Akköprü gerçek ay akışında üç ayrı sona ulaşır ve sonsöz seçimleri hatırlar", () => {
  const acik = bolumuOyna({}, true);
  const eksik = bolumuOyna({}, false);
  const kaza = bolumuOyna({ akkopru_telefon: 2, akkopru_inceleme: 1, akkopru_ortbas: 1, akkopru_kaza: 1, akkopru_durusma: 1 }, false);
  assert.equal(acik.bayraklar.akkopru_sonuc, "acik");
  assert.equal(eksik.bayraklar.akkopru_sonuc, "tanik_korundu");
  assert.equal(kaza.bayraklar.akkopru_sonuc, "bekleyen_adalet");
  assert.notEqual(sonsoz(acik)[0], sonsoz(eksik)[0]);
  assert.notEqual(sonsoz(eksik)[0], sonsoz(kaza)[0]);
  assert.ok(kaza.gecmis.flatMap(r => r.kararlar).some(k => k.kart === "akkopru_durusma"));
  assert.ok(yukle(kaydet(acik)).ok && yukle(kaydet(eksik)).ok && yukle(kaydet(kaza)).ok);
});

test("7→8 göçü eski kararları, zarı ve açık kulisi değiştirmez", () => {
  const d = kur(); d.ay = 2; ayiAc(d, I);
  const o = d.meclis.oylamalar[0]!; kulisAc(d, I, o.id, o.adaylar[0]!);
  const ham = JSON.parse(kaydet(d)); delete ham.durum.anlati;
  ham.surum = 7; ham.durum.surum = 7;
  const y = yukle(JSON.stringify(ham)); assert.ok(y.ok);
  if (!y.ok) return;
  assert.equal(y.durum.surum, DURUM_SURUMU);
  assert.deepEqual(y.durum, d);
});

test("ilk gece kampanyada geri döner; aynı davetin etkisi önceki güvene bağlıdır", () => {
  const d = bolumuOyna({}, true); d.ay = 16; ayiAc(d, I);
  const m = d.masa.find(m => m.kart === "akkopru_kampanya"); assert.ok(m);
  assert.ok(sahneSorusu(d, "munazara", 2).includes("Akköprüde"));
  assert.equal(sahneCevaplari(d, "miting", 2).length, 3);
  const mesafeli = durumKopya(d);
  d.yonetim.secim.etki = 0; mesafeli.yonetim.secim.etki = 0;
  mesafeli.anlati.iliskiler.deniz_alaz = 30;
  assert.ok(kararVer(d, I, m!.ornek, 2).ok);
  assert.ok(kararVer(mesafeli, I, m!.ornek, 2).ok);
  assert.ok(d.yonetim.secim.etki > mesafeli.yonetim.secim.etki);
  ayiAc(d, I);
  assert.ok(!d.masa.some(m => m.kart === "akkopru_kampanya"), "kampanya dosyası aynı ay iki kez kurulmaz");
});
test("bozuk görüşme sırası, kayıp bağlı dosya ve eşzamanlı sahne reddedilir", () => {
  const d = kur(); anlatiAc(d, I, d.masa.find(m => m.kart === "akkopru_telefon")!.ornek);
  for (const boz of [
    (h: any) => { h.durum.anlati.sahne.adim = 2; },
    (h: any) => { h.durum.masa = []; },
    (h: any) => { h.durum.anlati.sahne.cevap = 0; },
    (h: any) => { h.durum.meclis.kulis = { oylama: "x", vekil: "x", sonuc: null }; },
  ]) { const ham = JSON.parse(kaydet(d)); boz(ham); assert.equal(yukle(JSON.stringify(ham)).ok, false); }
});


test("günü kalmayan oyuncu ilk gece telefonunu dinleyebilir; sonraki yüz yüze görüşme gün ister", () => {
 const d=kur();d.bosGun=0;
 assert.ok(anlatiAc(d,I,d.masa.find(m=>m.kart==='akkopru_telefon')!.ornek).ok);
 assert.equal(d.bosGun,0);
 const e=kur();e.bosGun=0;
 const ornek=tekDosya(e,'akkopru_belge');
 assert.equal(anlatiAc(e,I,ornek).ok,false);
 assert.equal(e.meclis.sahneAy,0);
});
