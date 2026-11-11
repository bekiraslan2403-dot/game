import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, durumKopya, bosAyKaydi, DURUM_SURUMU, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiAc, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { GAZ_PAYI, isinmaAySonu, isinmaDurumu, isinmaKarti } from "../../cekirdek/isinma.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { sonsoz } from "../../cekirdek/secim.ts";

const I = icerikDerle(fileURLToPath(new URL("../../icerik", import.meta.url))).paket!;
function kur(ay = 3) {
  const d = oyunuBaslat(yeniOyun(791), I); d.ay = ay; d.buAy = bosAyKaydi(ay); d.bekleyen = [];
  d.masa = [{ ornek: `dogalgaz_zammi#${++d.sayac}`, kart: "dogalgaz_zammi", degisken: {}, agir: false, ikinciGorus: false }];
  d.gorulen.dogalgaz_zammi = ay;
  return d;
}
function sec(d: OyunDurumu, n: number) {
  const m = d.masa.find(m => isinmaKarti(m.kart))!; assert.ok(m);
  const r = kararVer(d, I, m.ornek, n); assert.ok(r.ok, r.ok ? "" : `${m.kart}: ${r.neden}`);
}
function sonraki(d: OyunDurumu) {
  d.ay++; ayiAc(d, I); d.masa = d.masa.filter(m => isinmaKarti(m.kart));
  assert.equal(d.masa.length, 1); assert.equal(d.isinma.at(-1)?.asama, "masada");
}
function kaydiDene(d: OyunDurumu) { const y = yukle(kaydet(d)); assert.ok(y.ok, y.ok ? "" : y.hata); if (y.ok) assert.deepEqual(y.durum, d); }

test("üç kış kararı ve dokuz ara yol kayıtla korunur; her son seçenek farklı uygulamaya gider", () => {
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const d = kur(), once = d.ekonomi.hane.fatura;
    sec(d, a); const p = d.isinma[0]!;
    assert.equal(d.ekonomi.hane.fatura, once * (1 + GAZ_PAYI * [38, 12, 0][a]! / 100));
    kaydiDene(d); sonraki(d); sec(d, b); kaydiDene(d);
    const hedef = p.hedef; sonraki(d); assert.equal(d.masa[0]?.kart, hedef);
    assert.equal(d.masa[0]?.degisken.isinma, p.id); kaydiDene(d);
    for (let c = 0; c < 3; c++) {
      const x = durumKopya(d);
      if (a === 2 && b === 2 && c === 0) {
        sec(x, 0); assert.equal(x.isinma[0]?.asama, "bekleyen"); kaydiDene(x);
        sonraki(x);
      }
      sec(x, c); assert.equal(x.isinma[0]?.asama, "uygulama"); kaydiDene(x);
      const r = ayiBitir(x, I); assert.ok(r.ok, r.ok ? "" : r.neden); if (!r.ok) continue;
      assert.equal(r.durum.isinma[0]?.asama, "tamam");
      assert.ok(r.rapor.olaylar.some(o => o.startsWith("Kış dosyası —") && !o.includes("Son talimat")));
      assert.equal(isinmaAySonu(r.durum).length, 0, "uygulama ikinci kez işletilmez");
      kaydiDene(r.durum); assert.ok(sonsoz(r.durum).some(s => s.startsWith("Kış tarifesinin")));
    }
  }
});

test("eksik montajla güvenlik testi başlatılamaz; ret dosyayı ve zarı değiştirmez", () => {
  const d = kur(); sec(d, 2); sonraki(d); sec(d, 0); sonraki(d);
  d.isinma[0]!.bakim = "yok";
  const once = durumKopya(d), r = kararVer(d, I, d.masa[0]!.ornek, 0);
  assert.ok(!r.ok && r.neden.includes("Parça değişimi")); assert.deepEqual(d, once);
});

test("yardım ödeneği önce programdadır; sonraki ay faturaya ulaşır, ikinci dönem ayrı ödenir", () => {
  const d = kur(); sec(d, 0); sonraki(d);
  const fatura = d.ekonomi.hane.fatura; sec(d, 0);
  let p = d.isinma[0]!; assert.equal(p.odemeler.length, 1); assert.equal(p.odemeler[0]?.uygulandi, false);
  assert.equal(d.ekonomi.hane.fatura, fatura, "hedefli yardım bütün hanelerin tarifesini indirmez");
  const tutar = p.odemeler[0]!.tutarTL;
  sonraki(d); assert.equal(p.odemeler[0]?.uygulandi, true); assert.equal(p.isinma, "acik");
  sec(d, 1); assert.equal(p.odemeler.length, 2); assert.notEqual(p.odemeler[0]?.soz, p.odemeler[1]?.soz);
  assert.equal(p.odemeler[1]?.uygulandi, false); isinmaAySonu(d); assert.ok(p.odemeler.every(o => o.uygulandi));
  d.ekonomi.gsyh *= 2; assert.equal(p.odemeler[0]?.tutarTL, tutar); kaydiDene(d);
  const bozuk = JSON.parse(kaydet(d)); bozuk.durum.ekonomi.sozler = [];
  assert.equal(yukle(JSON.stringify(bozuk)).ok, false, "gerçek ödeme belgesi kaybolmuş kayıt reddedilir");
});

test("gün ve imza kilidi başarısız kararda zarı, parayı ve dosyayı değiştirmez", () => {
  const d = kur(); sec(d, 0); sonraki(d); d.bosGun = 0; d.imza = 3;
  for (const n of [0, 1]) {
    const once = durumKopya(d), r = kararVer(d, I, d.masa[0]!.ornek, n);
    assert.equal(r.ok, false); assert.deepEqual(d, once);
  }
  d.bosGun = 1; const once = durumKopya(d), r = kararVer(d, I, d.masa[0]!.ornek, 0);
  assert.ok(!r.ok && r.neden.includes("imza")); assert.deepEqual(d, once);
  sec(d, 2); assert.equal(d.isinma[0]?.hedef, "isinma_kesim");
});

test("ortak sayaç kararı yanlış kademeyi düzeltir; tahsilata dönmek farklı son bırakır", () => {
  const d = kur(); sec(d, 1); sonraki(d); sec(d, 0); sonraki(d);
  const x = durumKopya(d); sec(d, 0); sec(x, 2);
  assert.equal(d.isinma[0]?.ortakSayac, true); assert.equal(d.isinma[0]?.odemeler.length, 0);
  isinmaAySonu(d); isinmaAySonu(x);
  assert.ok(d.isinma[0]?.sonHaber.includes("yanlış yüksek kademe farkı"));
  assert.equal(d.isinma[0]?.isinma, "acik"); assert.equal(x.isinma[0]?.isinma, "kesik");
});

test("tarifeden bakım Hazine ödemesi değildir; montaj güvenlik kabulü yerine geçmez", () => {
  for (const b of [0, 1, 2]) {
    const d = kur(); sec(d, 2); sonraki(d); const fatura = d.ekonomi.hane.fatura;
    sec(d, b); const p = d.isinma[0]!;
    assert.equal(p.odemeler.length, b === 0 ? 1 : 0);
    assert.equal(d.ekonomi.hane.fatura > fatura, b === 1);
    sonraki(d); assert.equal(p.bakim, b === 2 ? "yok" : "hazir");
    assert.notEqual(p.isinma, "acik");
    sec(d, b === 2 ? 1 : 0); assert.notEqual(p.bakim, "kabul");
    isinmaAySonu(d);
    assert.equal(p.bakim, b === 2 ? "yok" : "kabul");
    assert.equal(p.isinma, b === 2 ? "gecici" : "acik");
    if (b === 2) { d.ay++; assert.ok(isinmaDurumu(d, p).includes("bugünkü ısınma doğrulanmadı")); }
  }
});

test("14→15 göçü geçmiş kışa olay veya ödeme eklemez; ikinci kış birincinin kaydını korur", () => {
  const d = kur(); d.masa = []; d.ekonomi.hane.fatura = 7191;
  d.buAy.kararlar.push({ kart: "dogalgaz_zammi", baslik: "Eski doğal gaz kararı", secenek: 0, secenekMetni: "Eski tarife" });
  const eski = JSON.parse(kaydet(d)); eski.surum = eski.durum.surum = 14; delete eski.durum.isinma;
  const y = yukle(JSON.stringify(eski)); assert.ok(y.ok, y.ok ? "" : y.hata); if (!y.ok) return;
  assert.equal(y.durum.surum, DURUM_SURUMU); assert.deepEqual(y.durum.isinma, []);
  assert.equal(y.durum.ekonomi.hane.fatura, 7191); assert.deepEqual(y.durum.buAy, d.buAy); assert.deepEqual(y.durum.bekleyen, []);
  const n = kur(); sec(n, 0); sonraki(n); sec(n, 2); sonraki(n); sec(n, 1); isinmaAySonu(n);
  const ilk = structuredClone(n.isinma[0]);
  n.ay = 15; n.masa = [{ ornek: `dogalgaz_zammi#${++n.sayac}`, kart: "dogalgaz_zammi", degisken: {}, agir: false, ikinciGorus: false }];
  n.gorulen.dogalgaz_zammi = n.ay;
  sec(n, 2); assert.equal(n.isinma.length, 2); assert.deepEqual(n.isinma[0], ilk);
  sonraki(n); assert.equal(n.masa[0]?.degisken.isinma, n.isinma[1]?.id); kaydiDene(n);
});

test("seçim ayına kalan eski tarife kartı aynı ay tamamlanır ve kapanış yanıtını kaybetmez", () => {
  const d = kur(18); sec(d, 2); assert.equal(d.masa[0]?.kart, "isinma_bakim");
  sec(d, 0); assert.equal(d.masa[0]?.kart, "isinma_bakim_son");
  assert.equal(d.bekleyen.filter(b => b.kart.startsWith("isinma_")).length, 0);
  sec(d, 0); kaydiDene(d);
  const r = ayiBitir(d, I); assert.ok(r.ok); if (!r.ok) return;
  assert.equal(r.durum.isinma[0]?.bakim, "kabul"); assert.ok(r.rapor.olaylar.some(o => o.includes("sızdırmazlık testini tamamladı")));
  assert.ok(sonsoz(r.durum).some(s => s.includes("Bölge hattı yeniden devreye alındı")));
});
