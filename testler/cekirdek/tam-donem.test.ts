import { botKarari } from "../yardim/bot.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, durumKopya, DURUM_SURUMU } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir, ayiAc } from "../../cekirdek/ay.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { devirDosyalari, devirSec, devirYankisi } from "../../cekirdek/devir.ts";
import { sozVer } from "../../cekirdek/hazine.ts";
import {
  faaliyetYap,
  atamaDosyasi,
  hizipleGorus,
  kurumKarari,
  yonetimAySonu,
  yonetimAyBasi,
  sicilEkle,
} from "../../cekirdek/yonetim.ts";
import {
  medyaMudahale,
  medyaYansit,
  basinAc,
  basinCevapla,
  basinKapat,
  BASIN_CEVAPLARI,
} from "../../cekirdek/medya.ts";
import {
  sloganSec,
  kampanyaYap,
  kampanyaSahneAc,
  kampanyaSahneSec,
  kampanyaSahneKapat,
  secimiHazirla,
  ikinciTur,
  secimiBitir,
  SLOGANLAR,
  sonsoz,
} from "../../cekirdek/secim.ts";
import { kulisAc, oylamaEkle, oylamayiSay } from "../../cekirdek/meclis.ts";
const I = icerikDerle(
  fileURLToPath(new URL("../../icerik", import.meta.url)),
).paket!;
const kur = (seed = 33) => oyunuBaslat(yeniOyun(seed), I);
function geri(d: ReturnType<typeof kur>) {
  const y = yukle(kaydet(d));
  if (!y.ok) throw Error(y.hata);
  return y.durum;
}
function bosalt(d: ReturnType<typeof kur>) {
  let n = 0;
  while (d.masa.length) {
    assert.ok(botKarari(d, I, d.masa[0]!.ornek, n++ % 3).ok);
    assert.ok(n < 80);
  }
}

test("6→7 göçü bütün eski kararları, açık kulisi ve zarı korur", () => {
  const d = kur();
  d.ay = 2;
  ayiAc(d, I);
  const o = d.meclis.oylamalar[0]!;
  kulisAc(d, I, o.id, o.adaylar[0]!);
  const ham = JSON.parse(kaydet(d));
  delete ham.durum.yonetim;
  ham.surum = 6;
  ham.durum.surum = 6;
  const y = yukle(JSON.stringify(ham));
  assert.ok(y.ok);
  if (!y.ok) return;
  assert.equal(y.durum.surum, DURUM_SURUMU);
  assert.deepEqual(y.durum.zar, d.zar);
  assert.deepEqual(y.durum.meclis, d.meclis);
  assert.deepEqual(y.durum.ekonomi, d.ekonomi);
  assert.deepEqual(y.durum.masa, d.masa);
});
test("ajanda dört gün paylaşır; faaliyet ve atama suistimal edilemez", () => {
  const d = kur();
  assert.ok(faaliyetYap(d, I, "anket", "grup.genc").ok);
  assert.equal(d.bosGun, 3);
  const once = durumKopya(d);
  assert.equal(faaliyetYap(d, I, "anket", "grup.genc").ok, false);
  assert.deepEqual(d, once);
  assert.ok(faaliyetYap(d, I, "takip", "").ok);
  assert.ok(faaliyetYap(d, I, "sendika", "").ok);
  assert.ok(faaliyetYap(d, I, "is_dunyasi", "").ok);
  assert.equal(d.bosGun, 0);
  assert.equal(faaliyetYap(d, I, "ziyaret", "Yalıkent").ok, false);
  assert.ok(d.buAy.olaylar.some((o) => o.includes("±3")));
  assert.ok(atamaDosyasi(d, "cevre").ok);
  assert.equal(d.imza, 1);
  assert.equal(atamaDosyasi(d, "hazine").ok, false);
  const m = d.masa.find((m) => m.kart === "kurum_atama")!;
  kararVer(d, I, m.ornek, 1);
  assert.equal(d.yonetim.kurumlar.cevre!.sadakat, 90);
  assert.deepEqual(geri(d), d);
});
test("ziyaret başlatmak eylemi otomatik küçültmez veya bütçe gideri yaratmaz", () => {
  const d = kur();
  d.toplum.eylemler = [
    {
      id: "x",
      grup: "grup.isci",
      il: "Taşhan",
      emniyet: 100,
      duzenleyici: 200,
      basladi: 1,
      dinlendi: false,
    },
  ];
  const gider = d.ekonomi.gider.personel!;
  faaliyetYap(d, I, "ziyaret", "Taşhan");
  assert.equal(d.toplum.eylemler[0]!.emniyet, 100);
  assert.equal(d.toplum.eylemler[0]!.dinlendi, false);
  assert.equal(d.ekonomi.gider.personel!, gider);
  assert.ok(d.anlati.sahne);
});
test("altı medya kuruluşu, karara bağlı yayınlar ve müdahale sınırı", () => {
  const d = kur();
  assert.equal(I.medya!.kuruluslar.length, 6);
  medyaYansit(d, I, "Kira düzenlemesi");
  assert.equal(d.yonetim.medya.bultenler.length, 3);
  assert.equal(d.yonetim.medya.akis.length, 4);
  assert.ok(
    d.yonetim.medya.akis.every((a) => a.metin.includes("Kira düzenlemesi")),
  );
  assert.ok(medyaMudahale(d, I, "merkez_tv", "ihale").ok);
  assert.equal(d.sicil.at(-1)!.tur, "usulsuzluk");
  const once = durumKopya(d);
  assert.equal(medyaMudahale(d, I, "merkez_tv", "ihale").ok, false);
  assert.deepEqual(d, once);
  assert.equal(medyaMudahale(d, I, "devlet", "kayyum").ok, false);
});
test("basın sahnesi üç soruyla kayıt üzerinden devam eder; sahne ve ay kapanışı korunur", () => {
  let d = kur();
  bosalt(d);
  const onceSoz=d.ekonomi.sozler.length, onceSicil=d.sicil.length;
  assert.ok(basinAc(d, I).ok);
  assert.equal(
    new Set(d.yonetim.medya.basin!.sorular.map((s) => s.kim)).size,
    3,
  );
  assert.equal(ayiBitir(d, I).ok, false);
  assert.ok(basinCevapla(d, I, "yalan").ok);
  d = geri(d);
  assert.equal(d.yonetim.medya.basin!.adim, 1);
  assert.equal(basinKapat(d).ok, false);
  assert.ok(basinCevapla(d, I, "mujde").ok);
  assert.ok(basinCevapla(d, I, "acik").ok);
  const once = durumKopya(d);
  assert.equal(basinCevapla(d, I, "yalan").ok, false);
  assert.deepEqual(d, once);
  assert.equal(d.toplum.gazete?.olay,"Basın toplantısı");
  assert.equal(d.toplum.gazete?.mansetler.length,3);
  assert.equal(d.ekonomi.sozler.length, onceSoz + 1);
  assert.equal(d.sicil.length, onceSicil + 1);
  assert.ok(basinKapat(d).ok);
  assert.equal(basinAc(d, I).ok, false);
  assert.ok(ayiBitir(d, I).ok);
});
test("altı basın cevabının her biri gerçek bir bedel bırakır", () => {
  for (const c of BASIN_CEVAPLARI) {
    const d = kur();
    basinAc(d, I);
    const once = durumKopya(d);
    assert.ok(basinCevapla(d, I, c.id).ok);
    assert.notDeepEqual(d.gostergeler, once.gostergeler);
    assert.ok(d.buAy.olaylar.length > once.buAy.olaylar.length);
    assert.deepEqual(geri(d), d);
  }
});
test("kulis ve basın aynı ayın tek sahnesini paylaşır", () => {
  const d = kur();
  d.ay = 2;
  ayiAc(d, I);
  basinAc(d, I);
  const o = d.meclis.oylamalar[0]!;
  assert.equal(kulisAc(d, I, o.id, o.adaylar[0]!).ok, false);
  assert.equal(faaliyetYap(d, I, "ziyaret", "Taşhan").ok, false);
});
test("liyakatsiz kurumda hizmet etkisi gecikir; takip toplantısı hızlandırır", () => {
  const d = kur();
  const p = Object.values(I.politikalar).find((p) => (p.adim.konut ?? 0) > 0)!;
  assert.ok(p);
  for (const k of Object.values(d.yonetim.kurumlar)) k.liyakat = 30;
  const once = d.gostergeler.konut!;
  kurumKarari(d, p, 1);
  assert.equal(d.gostergeler.konut, once + p.adim.konut! * 0.5);
  assert.equal(d.yonetim.uygulamalar.length, 1);
  assert.ok(faaliyetYap(d, I, "takip", "").ok);
  yonetimAySonu(d);
  assert.equal(d.gostergeler.konut, once + p.adim.konut!);
  assert.equal(d.yonetim.uygulamalar.length, 0);
});
test("partiden ayrılan sandalyeler 592 oy içinde kalır ve destek davranışı değişir", () => {
  const d = kur();
  d.ay = 8;
  d.meclis.hizipler.teknokrat = 5;
  yonetimAySonu(d);
  assert.ok(d.yonetim.parti.vekil >= 15 && d.yonetim.parti.vekil <= 30);
  const o = oylamaEkle(d, I, {
    id: "kopus",
    ay: 8,
    baslik: "Bölünme sonrası",
    tur: "kanun",
    politika: null,
    hedef: 0,
  });
  const r = oylamayiSay(d, I, o);
  assert.equal(r.oylar.length, 592);
  assert.equal(
    r.oylar.filter((v) => v.grup === "ayrilan").length,
    d.yonetim.parti.vekil,
  );
  assert.deepEqual(geri(d), d);
});
test("kurultay uyarısından sonra görüşme istifayı önleyebilir", () => {
  const d = kur();
  d.ay = 8;
  d.meclis.hizipler.eski = 19;
  d.meclis.hizipler.muhafazakar = 19;
  yonetimAySonu(d);
  assert.equal(d.yonetim.parti.kurultay, 9);
  d.ay = 9;
  hizipleGorus(d, "eski");
  hizipleGorus(d, "muhafazakar");
  yonetimAySonu(d);
  assert.equal(d.bitis, null);
  const x = kur();
  x.ay = 8;
  x.meclis.hizipler.eski = 5;
  x.meclis.hizipler.muhafazakar = 5;
  yonetimAySonu(x);
  x.ay = 9;
  yonetimAySonu(x);
  assert.equal(x.bitis?.tur, "istifa");
});
test("ifşa yalnız eski kaydı bir kez açar; inkâr yeni sicil bırakır", () => {
  let bulunan = false;
  for (let seed = 1; seed <= 100; seed++) {
    const d = kur(seed);
    sicilEkle(d, "Özel bir ihale", "usulsuzluk");
    d.ay = 2;
    yonetimAyBasi(d, I);
    if (!d.yonetim.ifsa) continue;
    bulunan = true;
    const id = d.yonetim.ifsa.sicil;
    const m = d.masa.find((m) => m.kart === "ifsa_yanit")!;
    kararVer(d, I, m.ornek, 1);
    assert.equal(d.yonetim.ifsa, null);
    assert.equal(d.yonetim.ifsalar.length, 1);
    assert.ok(d.sicil.find((s) => s.id === id)!.ifsaOldu);
    assert.equal(d.sicil.at(-1)!.tur, "yalan");
    assert.deepEqual(geri(d), d);
    break;
  }
  assert.ok(bulunan);
});
test("krizler eşiklere bağlı başlar; aynı anda iki kriz sınırı korunur", () => {
  const d = kur();
  d.ay = 7;
  d.ekonomi.gercekEnflasyon = 42;
  d.gostergeler.butce_acigi = 6;
  yonetimAyBasi(d, I);
  assert.ok(d.bayraklar.kriz_pahalilik);
  assert.notEqual(d.bayraklar.kriz_not, true);
  assert.ok(
    Object.entries(d.bayraklar).filter(([k, v]) => k.startsWith("kriz_") && v)
      .length <= 2,
  );
  d.ekonomi.gercekEnflasyon = 30;
  d.ekonomi.hane.asgari = 50000;
  d.gostergeler.butce_acigi = 3;
  d.ay++;
  yonetimAyBasi(d, I);
  assert.equal(d.bayraklar.kriz_pahalilik, false);
});
test("kampanya bütçesi, tekrar etkisi ve sahne kaldığı yerden yüklenir", () => {
  let d = kur();
  d.ay = 16;
  ayiAc(d, I);
  assert.ok(sloganSec(d, SLOGANLAR[0]).ok);
  assert.equal(sloganSec(d, SLOGANLAR[1]).ok, false);
  const once = d.yonetim.secim.etki;
  kampanyaYap(d, "kapi", "grup.genc");
  const ilk = d.yonetim.secim.etki - once;
  kampanyaYap(d, "kapi", "grup.genc");
  assert.ok(Math.abs(d.yonetim.secim.etki - once - ilk - ilk / 2) < 1e-9);
  assert.equal(kampanyaYap(d, "kapi", "grup.genc").ok, false);
  assert.ok(kampanyaSahneAc(d, "munazara").ok);
  assert.ok(kampanyaSahneSec(d, 0).ok);
  d = geri(d);
  assert.equal(d.yonetim.secim.sahne!.adim, 1);
  assert.equal(kampanyaSahneKapat(d).ok, false);
  for (let i = 0; i < 3; i++) kampanyaSahneSec(d, 1);
  assert.ok(kampanyaSahneKapat(d).ok);
  assert.equal(kampanyaSahneAc(d, "miting").ok, false);
  assert.ok(d.yonetim.secim.etki <= 4);
});
test("18. ay kapanır, seçim kayıtta tek kez hesaplanır ve ikinci tur bitişe ulaşır", () => {
  let d = kur();
  d.ay = 18;
  ayiAc(d, I);
  bosalt(d);
  const r = ayiBitir(d, I);
  assert.ok(r.ok);
  if (!r.ok) return;
  d = r.durum;
  assert.ok(d.yonetim.secim.gece);
  const once = durumKopya(d);
  secimiHazirla(d, I);
  assert.deepEqual(d, once);
  d = geri(d);
  const gece = d.yonetim.secim.gece!;
  assert.ok(Math.abs(gece.oy + gece.rakipOy + gece.diger - 100) < 1e-9);
  assert.equal(gece.hayatlar.length, 5);
  if (gece.ikinciTur) assert.ok(ikinciTur(d, 0).ok);
  assert.ok(secimiBitir(d, "kabul").ok);
  assert.ok(d.bitis);
  const bitti = durumKopya(d);
  assert.equal(secimiBitir(d, "kabul").ok, false);
  assert.deepEqual(d, bitti);
  assert.deepEqual(geri(d), d);
  assert.ok(sonsoz(d).length >= 4);
});
test("seçimde güçlü ve zayıf yönetimler farklı bitişlere ulaşır", () => {
  for (const destek of [25, 75]) {
    const d = kur();
    d.ay = 18;
    for (const g of GRUPLAR) d.gostergeler[g] = destek;
    secimiHazirla(d, I);
    if (d.yonetim.secim.gece!.ikinciTur) ikinciTur(d, 0);
    secimiBitir(d, "kabul");
    assert.equal(d.bitis?.tur, destek > 50 ? "yeniden_secilme" : "yenilgi");
  }
});
const GRUPLAR = GOSTERGE_GRUPLARI();
function GOSTERGE_GRUPLARI() {
  return Object.keys(yeniOyun(1).gostergeler).filter((id) =>
    id.startsWith("grup."),
  );
}
test("yakın sonuçta tanımama anayasal krizdir; geniş farkta itiraz açılamaz", () => {
  const d = kur();
  secimiHazirla(d, I);
  const g = d.yonetim.secim.gece!;
  g.ikinciTur = false;
  g.oy = 50.2;
  g.rakipOy = 49.8;
  g.diger = 0;
  g.itiraz = true;
  assert.ok(secimiBitir(d, "tanima").ok);
  assert.equal(d.bitis?.tur, "devrilme");
  assert.equal(d.bitis?.devir, undefined);
  const x = kur();
  secimiHazirla(x, I);
  x.yonetim.secim.gece!.ikinciTur = false;
  x.yonetim.secim.gece!.itiraz = false;
  assert.equal(secimiBitir(x, "sayim").ok, false);
});

test("kayıt bozuk sahne sırasını ve yüzde toplamını reddeder", () => {
  const d = kur();
  basinAc(d, I);
  const ham = JSON.parse(kaydet(d));
  ham.durum.yonetim.medya.basin.adim = 2;
  assert.equal(yukle(JSON.stringify(ham)).ok, false);
  const x = kur();
  secimiHazirla(x, I);
  const gece = JSON.parse(kaydet(x));
  gece.durum.yonetim.secim.gece.oy += 5;
  assert.equal(yukle(JSON.stringify(gece)).ok, false);
});
test("bağımsız mahkeme hak kısıtlayan düzenlemeyi geri alır; aynı etkiyi iki kez uygulamaz", () => {
  const d = kur();
  d.gostergeler.yargi = 80;
  const p = Object.values(I.politikalar).find((p) => p.temel_hak)!;
  const eski = p.baslangic;
  kurumKarari(d, p, 1);
  d.politika[p.id] = eski + 1;
  assert.ok(d.yonetim.uygulamalar.some((u) => u.politika === p.id));
  d.ay = 2;
  yonetimAySonu(d);
  assert.equal(d.politika[p.id], eski);
  const once = durumKopya(d);
  yonetimAySonu(d);
  assert.deepEqual(d.gostergeler, once.gostergeler);
});
test("not indirimi iki ayrı ay ister; aynı ayı yeniden hazırlamak sayacı ilerletmez", () => {
  const d = kur();
  d.ay = 4;
  d.gostergeler.butce_acigi = 6;
  yonetimAyBasi(d, I);
  yonetimAyBasi(d, I);
  assert.equal(d.yonetim.krizTakip.not, 1);
  assert.notEqual(d.bayraklar.kriz_not, true);
  d.ay++;
  yonetimAyBasi(d, I);
  assert.equal(d.bayraklar.kriz_not, true);
});

test("kongre geçmişi kampanya dosyasını bir kez açar; münazara tutanağa göre sonuçlanır", () => {
  const d = yeniOyun(13);
  d.ay = 17;
  ayiAc(d, I);
  assert.ok(!d.masa.some(m => m.kart === "kongre_kampanya"));
  const eskiAy = { ...d.buAy, ay: 12, kararlar: [{
    kart: "kongre_teskilat", baslik: "Turunçlu il binasının iki anahtarı",
    secenek: 1, secenekMetni: "Yalnız doğrulanan ilçelerde çalış",
  }] };
  d.gecmis.push(eskiAy);
  ayiAc(d, I);
  const m = d.masa.find(m => m.kart === "kongre_kampanya")!;
  assert.ok(m);
  yonetimAyBasi(d, I);
  assert.ok(!d.bekleyen.some(k => k.kart === "kongre_kampanya"));
  const gun = d.bosGun;
  assert.ok(kararVer(d, I, m.ornek, 0).ok);
  assert.equal(d.bosGun, gun - 1);
  assert.ok(kampanyaSahneAc(d, "munazara").ok);
  for (let i = 0; i < 3; i++) assert.ok(kampanyaSahneSec(d, 0).ok);

  const x = geri(d);
  assert.equal(x.yonetim.secim.sahne?.adim, 3);
  for (const [secim, fark] of [[0, 0.55], [1, -0.15], [2, -0.85]] as const) {
    const aday = durumKopya(x);
    const once = aday.yonetim.secim.etki;
    const sicil = aday.sicil.length;
    assert.ok(kampanyaSahneSec(aday, secim).ok);
    assert.ok(Math.abs(aday.yonetim.secim.etki - once - fark) < 1e-9);
    assert.equal(aday.sicil.length, sicil + (secim === 2 ? 1 : 0));
    if (secim === 2) assert.equal(aday.sicil.at(-1)?.tur, "yalan");
    assert.ok(kampanyaSahneKapat(aday).ok);
  }
  const kapali = durumKopya(x);
  kapali.buAy.kararlar.find(k => k.kart === "kongre_kampanya")!.secenek = 2;
  const once = kapali.yonetim.secim.etki;
  assert.ok(kampanyaSahneSec(kapali, 0).ok);
  assert.ok(Math.abs(kapali.yonetim.secim.etki - once - 0.35) < 1e-9);
});

test("seçim hesabı kayıtlı bileşenlerle oy oranını yeniden kurar ve ikinci tur tercihi farklı bedeller taşır", () => {
  const d = kur();
  d.ay = 18;
  for (const g of GRUPLAR) d.gostergeler[g] = 46;
  d.gostergeler.guven = 90;
  d.gostergeler.rakip = 53;
  d.gostergeler.kutuplasma = 40;
  d.yonetim.secim.etki = 0.55;
  secimiHazirla(d, I);
  const g = geri(d).yonetim.secim.gece!;
  assert.ok(g.ikinciTur);
  const ilk = g.ilkHesap!;
  assert.equal(ilk.gruplar.length, GRUPLAR.length);
  assert.equal(ilk.kampanya, 0.55);
  assert.equal(ilk.rakip, -0.24);
  const toplam = 50 + ilk.gruplar.reduce((a, b) => a + b.katki, 0) + ilk.kampanya + ilk.rakip + ilk.belirsizlik + ilk.sinir;
  assert.ok(Math.abs(toplam - g.oy) < 1e-9);

  const [ittifak, ortak, sert] = [0, 1, 2].map(sec => {
    const x = durumKopya(d);
    assert.ok(ikinciTur(x, sec).ok);
    const sonuc = geri(x).yonetim.secim.gece!;
    const h = sonuc.ikinciHesap!;
    assert.equal(h.havuz, g.diger);
    assert.equal(h.ilkOy, g.oy);
    assert.ok(Math.abs(h.ilkOy + h.aktarilan + h.belirsizlik - sonuc.oy) < 1e-9);
    return h;
  });
  assert.ok(ortak!.aktarilan > ittifak!.aktarilan && ittifak!.aktarilan > sert!.aktarilan);
  assert.equal(ittifak!.partiIci, 2);
  assert.equal(ittifak!.kutuplasma, -2);
  assert.equal(ortak!.partiIci, 0);
  assert.equal(sert!.kutuplasma, 2);

  const eski = durumKopya(d);
  delete eski.yonetim.secim.gece!.ilkHesap;
  assert.equal(geri(eski).yonetim.secim.gece?.oy, g.oy);
  assert.ok(ikinciTur(eski, 0).ok);
});

test("yeniden sayım kesin ajans satırını ve düzeltme kaydını günceller", () => {
  const d = kur();
  secimiHazirla(d, I);
  const g = d.yonetim.secim.gece!;
  Object.assign(g, { tur: 2, oy: 50.2, rakipOy: 49.8, diger: 0, ikinciTur: false, itiraz: true });
  assert.ok(secimiBitir(d, "sayim").ok);
  const son = geri(d).yonetim.secim.gece!;
  assert.equal(son.akis.at(-1)?.ajansA, son.oy);
  assert.equal(son.akis.at(-1)?.ajansB, son.oy);
  assert.ok(Math.abs(son.oy - 50.2 - son.yenidenSayim!) < 1e-9);
});

test("seçim kapanışındaki devir imzası tek seferliktir ve açık işleri değiştirmez", () => {
  const d = kur();
  d.ay = 18;
  for (const g of GRUPLAR) d.gostergeler[g] = 70;
  d.meclis.butce.gecici = true;
  sozVer(d, { metin: "Teslimde bekleyen taahhüt", kalem: "sosyal", maliyet: 0.02, vade: 1 });
  assert.equal(devirSec(d, "acik").ok, false);
  secimiHazirla(d, I);
  assert.ok(secimiBitir(d, "kabul").ok);
  assert.equal(d.bitis?.devir, null);
  const kayitli = geri(d);
  const once = devirDosyalari(kayitli);
  assert.deepEqual(once.filter(k => k.bekliyor).map(k => k.id), ["butce", "sozler"]);
  const yankilar = new Set<string>();
  for (const yol of ["acik", "kapali", "imzasiz"] as const) {
    const x = geri(d);
    assert.ok(devirSec(x, yol).ok);
    const y = geri(x);
    assert.equal(y.bitis?.devir, yol);
    assert.deepEqual(devirDosyalari(y), once);
    assert.deepEqual(y.yonetim.secim, kayitli.yonetim.secim);
    assert.deepEqual(y.ekonomi, kayitli.ekonomi);
    assert.deepEqual(y.gecmis, kayitli.gecmis);
    assert.equal(devirSec(y, "acik").ok, false);
    yankilar.add(devirYankisi(y)!);
  }
  assert.equal(yankilar.size, 3);
  delete d.bitis!.devir;
  const eski = geri(d);
  assert.equal(devirSec(eski, "acik").ok, false);
  assert.equal(devirYankisi(eski), null);
});
