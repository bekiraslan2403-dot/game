import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{yeniOyun}from'../../cekirdek/durum.ts';import{ayiAc,oyunuBaslat}from'../../cekirdek/ay.ts';import{kararVer}from'../../cekirdek/karar.ts';import{yukle,kaydet}from'../../cekirdek/kayit.ts';import{ziyaretSonucu}from'../../cekirdek/ziyaret.ts';import{yonetimAySonu}from'../../cekirdek/yonetim.ts';import{meclisDestegi}from'../../cekirdek/politika.ts';import type{IcerikPaketi}from'../../cekirdek/icerik.ts';
const I=JSON.parse(readFileSync(new URL('../../uretilen/icerik.json',import.meta.url),'utf8'))as IcerikPaketi;
function kur(kart:string){const d=oyunuBaslat(yeniOyun(17),I);d.masa=[{kart,ornek:'test',degisken:{il:'Turunçlu'},agir:false,ikinciGorus:false}];return d;}
test('yetersiz gün veya imzada icra hiçbir kaydı, parayı veya zarı değiştirmez',()=>{for(const kart of ['ihracatci_kur','belediye_maas_1','il_kongresi']){const d=kur(kart);d.bosGun=0;d.imza=3;const once=structuredClone(d);assert.equal(kararVer(d,I,'test',0).ok,false);assert.deepEqual(d,once);}});
test('ihracat doğrulaması aynı ay dosya açar; belge olmadan ödeme kilitlidir',()=>{const d=kur('ihracatci_kur');assert.ok(kararVer(d,I,'test',0).ok);assert.equal(d.bosGun,3);const m=d.masa.find(m=>m.kart==='ihracat_sozlesme')!;assert.ok(m);const base=d.ekonomi.gider.sosyal!;assert.ok(kararVer(d,I,m.ornek,0).ok);assert.ok(d.ekonomi.gider.sosyal!>base);assert.equal(d.imza,1);yonetimAySonu(d);assert.ok(Math.abs(d.ekonomi.gider.sosyal!-base)<1e-9);const b=kur('ihracat_sozlesme'),old=structuredClone(b);assert.equal(kararVer(b,I,'test',0).ok,false);assert.deepEqual(b,old);});
test('telefon kur seviyesini sihirli biçimde değiştirmez; tehdit sicile geçer',()=>{const d=kur('ihracatci_kur'),oncekiKur=d.gostergeler.kur;kararVer(d,I,'test',1);const m=d.masa[0]!;kararVer(d,I,m.ornek,1);assert.equal(d.gostergeler.kur,oncekiKur);assert.ok(d.sicil.some(s=>s.tur==='baski'));assert.ok(d.bekleyen.some(b=>b.kart==='ihracat_donus'));});
test('kongre tercihi gerçek Meclis hizip desteğini ve oy beklentisini değiştirir',()=>{const a=kur('il_kongresi'),b=kur('il_kongresi');kararVer(a,I,'test',0);kararVer(b,I,'test',1);assert.notDeepEqual(a.meclis.hizipler,b.meclis.hizipler);assert.notEqual(meclisDestegi(a,I.politikalar.emekli_aylik),meclisDestegi(b,I.politikalar.emekli_aylik));assert.ok(a.bekleyen.some(k=>k.kart==='kongre_tutanak'));});
test('maaş ödemesi yalnız aynı şehirdeki işçi eylemine işler; inceleme ödeme değildir',()=>{const d=kur('belediye_maas_1');d.toplum.eylemler=[{id:'a',il:'Turunçlu',grup:'grup.isci',emniyet:100,duzenleyici:200,basladi:1,dinlendi:false},{id:'b',il:'Yalıkent',grup:'grup.isci',emniyet:100,duzenleyici:200,basladi:1,dinlendi:false}];kararVer(d,I,'test',0);assert.deepEqual(d.toplum.eylemler.map(e=>e.emniyet),[70,100]);assert.equal(d.ekonomi.sozler.at(-1)!.durum,'tutuldu');const b=kur('belediye_maas_1');kararVer(b,I,'test',2);assert.equal(b.ekonomi.sozler.length,0);assert.ok(yukle(kaydet(d)).ok);});
test('yeni aile görüşmesi sağlık politikası vermez; eski karar metni korunur',()=>{const z=I.toplum.ziyaretciler.find(z=>z.id==='sehit')!;assert.equal(z.gorusme,'kabul_sehit_gorev');const d=kur(z.gorusme!);kararVer(d,I,'test',0);assert.equal(d.politika.saglik_harcama,undefined);assert.equal(d.bosGun,3);assert.match(ziyaretSonucu(d,I,'sehit')!.durum,/yazılı yanıt istendi/);assert.ok(d.bekleyen.some(b=>b.kart==='takip_sehit_gorev'));const old=kur('kabul_sehit');kararVer(old,I,'test',0);assert.match(ziyaretSonucu(old,I,'sehit')!.yanit,/Sağlık/);});

// Ekonomi tutarı okunur kalmalı; küçük gerçek ödenek sıfır diye gösterilmez.
import { tutarYaz } from "../../arayuz/bicim.ts";
test("dar destek tutarları milyon ve bin TL olarak görünür", () => {
  assert.equal(tutarYaz(.0000096), "9,6 milyon TL");
  assert.equal(tutarYaz(.00000032), "320 bin TL");
  assert.equal(tutarYaz(-.0000096), "-9,6 milyon TL");
  assert.equal(tutarYaz(2.24), "2,24 trilyon TL");
  assert.equal(tutarYaz(0), "0 TL");
});

test("yeni sipariş teyidi ödemeden ayrılır; ikinci bordro yalnız bir kez finanse edilir", () => {
  const d = kur("ihracatci_kur");
  assert.ok(kararVer(d, I, "test", 0).ok);
  assert.ok(kararVer(d, I, d.masa[0]!.ornek, 0).ok);
  d.ay++;
  ayiAc(d, I);
  const donus = d.masa.find(m => m.kart === "ihracat_donus")!;
  for (const yol of ["sirket", "ret", "baski"] as const) {
    const x = structuredClone(d);
    x.bayraklar.ihracat_yol = yol;
    const once = structuredClone(x);
    assert.equal(kararVer(x, I, donus.ornek, 1).ok, false);
    assert.deepEqual(x, once);
  }
  const sozSayisi = d.ekonomi.sozler.length;
  const gun = d.bosGun;
  assert.ok(kararVer(d, I, donus.ornek, 1).ok);
  assert.equal(d.bosGun, gun - 1);
  assert.equal(d.ekonomi.sozler.length, sozSayisi);
  const y = yukle(kaydet(d));
  assert.ok(y.ok);
  const x = y.durum;
  const siparis = x.masa.find(m => m.kart === "ihracat_yeni_siparis")!;
  const eskiOdeme = structuredClone(x);
  eskiOdeme.bayraklar.ihracat_ek_destek = true;
  assert.equal(kararVer(eskiOdeme, I, siparis.ornek, 0).ok, false);
  const sonAy = structuredClone(x);
  sonAy.ay = 18;
  assert.equal(kararVer(sonAy, I, siparis.ornek, 0).ok, false);
  const avans = structuredClone(x);
  assert.ok(kararVer(avans, I, siparis.ornek, 1).ok);
  assert.equal(avans.ekonomi.sozler.length, sozSayisi);
  assert.ok(!avans.bekleyen.some(m => m.kart === "ihracat_yukleme"));
  assert.ok(kararVer(x, I, siparis.ornek, 0).ok);
  assert.equal(x.ekonomi.sozler.length, sozSayisi + 1);
  assert.equal(x.ekonomi.sozler.at(-1)?.maliyet, 0.00012);
  assert.equal(x.ekonomi.sozler.at(-1)?.durum, "tutuldu");
  assert.equal(kararVer(x, I, siparis.ornek, 0).ok, false);
  x.ay++;
  ayiAc(x, I);
  const yukleme = x.masa.find(m => m.kart === "ihracat_yukleme")!;
  assert.ok(kararVer(x, I, yukleme.ornek, 2).ok);
  assert.ok(x.sicil.some(s => s.tur === "yalan" && s.kaynak.includes("240")));
});

test("kongre tutanağı aynı şehirde üç ayrı takip açar ve pazarlık sicili korunur", () => {
  for (const [secim, takip] of ["kongre_yeniden_sayim", "kongre_sizinti", "kongre_teskilat"].entries()) {
    const d = kur("il_kongresi");
    assert.ok(kararVer(d, I, "test", secim).ok);
    d.ay++;
    ayiAc(d, I);
    const tutanak = d.masa.find(m => m.kart === "kongre_tutanak")!;
    assert.equal(tutanak.degisken.il, "Turunçlu");
    assert.ok(kararVer(d, I, tutanak.ornek, secim).ok);
    const y = yukle(kaydet(d));
    assert.ok(y.ok);
    const x = y.durum;
    x.ay++;
    ayiAc(x, I);
    const dosyalar = x.masa.filter(m => m.kart.startsWith("kongre_"));
    assert.deepEqual(dosyalar.map(m => [m.kart, m.degisken.il]), [[takip, "Turunçlu"]]);
    const eski = x.meclis.hizipler.eski;
    const teknokrat = x.meclis.hizipler.teknokrat;
    assert.ok(kararVer(x, I, dosyalar[0]!.ornek, 0).ok);
    assert.notEqual(x.meclis.hizipler.eski, eski);
    assert.ok(x.meclis.hizipler.teknokrat > teknokrat);
    if (secim === 1) assert.ok(x.sicil.some(s => s.kaynak.includes("kongre itirazının kapatılması")));
  }
  const son = kur("kongre_tutanak");
  son.ay = 18;
  assert.ok(kararVer(son, I, "test", 2).ok);
  assert.equal(son.masa[0]?.kart, "kongre_teskilat");
  assert.ok(!son.bekleyen.some(m => m.ay > 18));
});
