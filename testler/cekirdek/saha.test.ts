import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { yeniOyun, DURUM_SURUMU, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer, ertele } from "../../cekirdek/karar.ts";
import { anlatiCevapla, anlatiDevam, anlatiAc } from "../../cekirdek/anlati.ts";
import { sahaBaslat, sahaAySonu, sahaRaporu, sahaKararBilgisi } from "../../cekirdek/saha.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { faaliyetYap, yonetimAySonu } from "../../cekirdek/yonetim.ts";
import { sonsoz } from "../../cekirdek/secim.ts";
import { rastgeleUygun } from "../../cekirdek/deste.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const I=JSON.parse(readFileSync(new URL("../../uretilen/icerik.json",import.meta.url),"utf8")) as IcerikPaketi;
function kur(il="Taşhan"){
 const d=oyunuBaslat(yeniOyun(51),I),r=sahaBaslat(d,I,il);assert.ok(r.ok);if(!r.ok||!r.ornek)throw Error("saha açılmadı");return {d,ornek:r.ornek};
}
function gorus(d:OyunDurumu,yanitlar=[0,0,0]){
 for(const yanit of yanitlar){const r=anlatiCevapla(d,I,yanit);assert.ok(r.ok);assert.ok(anlatiDevam(d).ok);}
}
/** Bu testlerde dönüş ziyareti için dolu ayda bir normal dosya ertelenir. */
function donuseYerAc(d:OyunDurumu){
 if(d.buAy.kararlar.length+d.masa.length<6)return;
 const m=d.masa.find(m=>I.kartlar[m.kart]?.tur==="masa"&&!I.kartlar[m.kart]?.ziyaret&&!I.kartlar[m.kart]?.saha);
 assert.ok(m,"dönüş ayı için ertelenebilir dosya bulunamadı");assert.ok(ertele(d,I,m!.ornek).ok);
}
function ay(d:OyunDurumu){
 let n=0;while(d.masa.length){const r=kararVer(d,I,d.masa[0]!.ornek,2);assert.ok(r.ok);assert.ok(++n<80);}
 const r=ayiBitir(d,I);if(!r.ok)throw Error(r.neden);return r.durum;
}

test("üç saha dosyası rastgele kart olmaz; ziyaret tek gün ve ortak sahne hakkını kullanır",()=>{
 for(const t of I.saha!){const {d,ornek}=kur(t.il);
  assert.equal(d.bosGun,3);assert.equal(d.meclis.sahneAy,1);
  assert.equal(d.anlati.sahne!.ornek,ornek);
  assert.equal(d.saha[t.id]!.durum,"karar");
  assert.equal(rastgeleUygun(d,I.kartlar[t.ilk]!,I),false);
  const once=structuredClone(d);assert.equal(sahaBaslat(d,I,t.il).ok,false);assert.deepEqual(d,once);
  assert.equal(ayiBitir(d,I).ok,false);
 }
});

test("yerinde görüşme tamamlanmadan karar veya ücretsiz kamuoyu kazancı oluşmaz",()=>{
 const once=oyunuBaslat(yeniOyun(51),I),{d,ornek}=kur();
 assert.deepEqual(d.gostergeler,once.gostergeler);
 assert.deepEqual(d.ekonomi,once.ekonomi);
 assert.equal(d.yonetim.bolgeler.Taşhan!.iliski,50);
 assert.equal(kararVer(d,I,ornek,0).ok,false);
});

test("ziyaretin yanıtı ve sırası kayıtla korunur; yenileme ikinci gün tüketmez",()=>{
 const {d}=kur();anlatiCevapla(d,I,0);
 const y=yukle(kaydet(d));assert.ok(y.ok);if(!y.ok)return;
 assert.deepEqual(y.durum,d);assert.equal(y.durum.anlati.sahne!.cevap,0);
 const once=structuredClone(y.durum);
 assert.equal(sahaBaslat(y.durum,I,"Taşhan").ok,false);assert.deepEqual(y.durum,once);
});

test("yerel temsilciyi dışlamak ortak tespiti kapatır; başarısız seçim atomiktir",()=>{
 const {d,ornek}=kur();anlatiCevapla(d,I,2);anlatiDevam(d);
 const once=structuredClone(d);assert.equal(anlatiCevapla(d,I,0).ok,false);assert.deepEqual(d,once);
 anlatiCevapla(d,I,1);anlatiDevam(d);anlatiCevapla(d,I,0);anlatiDevam(d);
 const son=structuredClone(d);assert.equal(kararVer(d,I,ornek,0).ok,false);assert.deepEqual(d,son);
 assert.ok(kararVer(d,I,ornek,1).ok,"geçici yardım hâlâ mümkün");
});

test("aynı kayıtla yapım, geçici destek ve ret üç farklı uygulamaya gider",()=>{
 for(const t of I.saha!)for(const sec of [0,1,2]){
  const {d,ornek}=kur(t.il);gorus(d);const gider=d.ekonomi.gider[t.kalem]!;
  assert.ok(kararVer(d,I,ornek,sec).ok);
  const p=d.saha[t.id]!;
  assert.equal(p.durum,["program","gecici","reddedildi"][sec]);
  assert.equal(d.imza,sec===0?1:0);
  assert.equal(p.faydaUygulandi,false);
  assert.equal(d.ekonomi.sozler.filter(s=>s.tekSeferlik&&s.durum==="tutuldu").length,sec===2?0:1);
  if(sec!==2)assert.ok(d.ekonomi.gider[t.kalem]!>gider);
  const once=structuredClone(d);assert.equal(kararVer(d,I,ornek,sec).ok,false);assert.deepEqual(d,once);
  assert.ok(yukle(kaydet(d)).ok);
 }
});

test("imza yokken yapım kilitlenir; ret veya geçici yardım hâlâ mümkündür",()=>{
 const {d,ornek}=kur();gorus(d);d.imza=3;
 const once=structuredClone(d);assert.equal(kararVer(d,I,ornek,0).ok,false);assert.deepEqual(d,once);
 assert.ok(kararVer(d,I,ornek,1).ok);
});

test("yalnız para ayırmak hizmeti bitirmez; yüksek kapasitede vadesinde ve bir kez tamamlanır",()=>{
 const {d,ornek}=kur();d.yonetim.kurumlar.cevre!.liyakat=80;gorus(d);kararVer(d,I,ornek,0);
 const once=d.gostergeler.konut!;
 d.ay=2;sahaAySonu(d,I);assert.equal(d.saha.tashan!.durum,"program");assert.equal(d.gostergeler.konut,once);
 d.ay=3;const haber=sahaAySonu(d,I);assert.ok(haber.some(h=>h.includes("fiilî teslim")));
 assert.equal(d.saha.tashan!.durum,"tamamlandi");assert.ok(d.gostergeler.konut!>once);
 const son=structuredClone(d);sahaAySonu(d,I);assert.deepEqual(d,son);
 assert.ok(sonsoz(d).some(m=>m.includes("fiilî teslim")));
});

test("yetersiz kapasite işi aksatır; kesin tarih sözü sicile yalnız bir kez yazılır",()=>{
 const {d,ornek}=kur();gorus(d,[0,0,1]);kararVer(d,I,ornek,0);
 d.ay=3;sahaAySonu(d,I);
 assert.equal(d.saha.tashan!.durum,"aksadi");assert.equal(d.saha.tashan!.faydaUygulandi,false);
 assert.ok(d.sicil.some(s=>s.tur==="kirilan_soz"));const n=d.sicil.length;
 sahaAySonu(d,I);assert.equal(d.sicil.length,n);
 assert.match(sahaRaporu(d,I.saha![0]!),/sicile/);
});

test("kesin tarih verip kaynak ayırmamak da karşılıksız bir vaat olarak kalmaz",()=>{
 const {d,ornek}=kur();gorus(d,[0,0,1]);kararVer(d,I,ornek,2);
 assert.equal(d.saha.tashan!.sozKirildi,true);assert.ok(d.sicil.some(s=>s.tur==="kirilan_soz"));
});

test("geçici destek kalıcı iş tamamlandı sayılmaz; bütçe kalıcı olarak şişmez",()=>{
 const {d,ornek}=kur();gorus(d);const gider=d.ekonomi.gider.yatirim!;
 kararVer(d,I,ornek,1);assert.ok(d.ekonomi.gider.yatirim!>gider);
 yonetimAySonu(d);assert.ok(Math.abs(d.ekonomi.gider.yatirim!-gider)<1e-9);
 d.ay=4;sahaAySonu(d,I);assert.equal(d.saha.tashan!.durum,"gecici");assert.equal(d.saha.tashan!.faydaUygulandi,false);
});

test("tamamlanan iş yalnız ilgili şehirdeki ilgili eylemi etkiler",()=>{
 const {d,ornek}=kur();d.yonetim.kurumlar.cevre!.liyakat=80;
 d.toplum.eylemler=[{id:"a",grup:"grup.kiraci",il:"Taşhan",emniyet:100,duzenleyici:200,basladi:1,dinlendi:false},{id:"b",grup:"grup.isci",il:"Taşhan",emniyet:100,duzenleyici:200,basladi:1,dinlendi:false},{id:"c",grup:"grup.kiraci",il:"Akköprü",emniyet:100,duzenleyici:200,basladi:1,dinlendi:false}];
 gorus(d);kararVer(d,I,ornek,0);assert.ok(d.toplum.eylemler.every(e=>e.emniyet===100));
 d.ay=3;sahaAySonu(d,I);assert.deepEqual(d.toplum.eylemler.map(e=>e.emniyet),[65,100,100]);
});

test("dönüş ziyaretinde ek ekip geciken işi tamamlatır; geçmiş gecikme silinmez",()=>{
 let {d,ornek}=kur();gorus(d);kararVer(d,I,ornek,0);
 d=ay(ay(ay(d)));assert.equal(d.ay,4);assert.equal(d.saha.tashan!.durum,"aksadi");
 donuseYerAc(d);
 const harcama=d.saha.tashan!.harcama,r=sahaBaslat(d,I,"Taşhan");assert.ok(r.ok&&r.ornek);if(!r.ok||!r.ornek)return;
 gorus(d);assert.ok(kararVer(d,I,r.ornek,0).ok);assert.ok(d.saha.tashan!.harcama>harcama);
 d=ay(d);assert.equal(d.saha.tashan!.durum,"program");d=ay(d);
 assert.equal(d.saha.tashan!.durum,"tamamlandi");assert.ok(d.saha.tashan!.izler.some(k=>k.metin.includes("bitmedi")));
 assert.equal(sahaBaslat(d,I,"Taşhan").ok,false,"aynı dönüş ziyareti tekrar ödül üretmez");
});

test("bağımsız rapor sonraki ay gelir ve uygulanmamış işi tamamlanmış göstermez",()=>{
 let {d,ornek}=kur();gorus(d);kararVer(d,I,ornek,1);d=ay(d);
 const r=sahaBaslat(d,I,"Taşhan");if(!r.ok||!r.ornek)throw Error("dönüş yok");gorus(d);kararVer(d,I,r.ornek,1);
 assert.equal(d.saha.tashan!.denetim,"bekliyor");d=ay(d);assert.equal(d.saha.tashan!.denetim,"bekliyor");d=ay(d);
 assert.equal(d.saha.tashan!.denetim,"eksik");assert.equal(d.saha.tashan!.durum,"gecici");
});

test("tamamlanmış iş ikinci kez ödeme, imza veya hizmet faydası üretmez",()=>{
 let {d,ornek}=kur();d.yonetim.kurumlar.cevre!.liyakat=80;gorus(d);kararVer(d,I,ornek,0);d=ay(ay(ay(d)));
 donuseYerAc(d);
 const r=sahaBaslat(d,I,"Taşhan");if(!r.ok||!r.ornek)throw Error("dönüş yok");gorus(d);
 const n=d.imza,harcama=d.saha.tashan!.harcama,konut=d.gostergeler.konut;
 const k=I.kartlar[I.saha![0]!.takip]!;assert.equal(sahaKararBilgisi(d,I,k,k.secenekler[0]!).maliyet,0);
 assert.ok(kararVer(d,I,r.ornek,0).ok);assert.equal(d.imza,n);assert.equal(d.saha.tashan!.harcama,harcama);assert.equal(d.gostergeler.konut,konut);
});

test("başarısız ziyaret açılışı tüm kaynakları, zarı ve kayıtları korur",()=>{
 for(const degistir of [(d:OyunDurumu)=>{d.bosGun=0},(d:OyunDurumu)=>{d.meclis.sahneAy=1},(d:OyunDurumu)=>{while(d.masa.length<6)d.masa.push({...d.masa[0]!,ornek:'dolu'+d.masa.length})}]){
 const d=oyunuBaslat(yeniOyun(1),I);degistir(d);const once=structuredClone(d);assert.equal(sahaBaslat(d,I,"Taşhan").ok,false);assert.deepEqual(d,once);
 }
 const d=oyunuBaslat(yeniOyun(1),I),once=structuredClone(d);assert.equal(faaliyetYap(d,I,"ziyaret","Yalıkent").ok,false);assert.deepEqual(d,once);
});

test("saha ziyareti ile ilk gece aynı aylık sahneyi paylaşır",()=>{
 const {d}=kur();const tel=d.masa.find(m=>m.kart==="akkopru_telefon")!;gorus(d);
 assert.equal(anlatiAc(d,I,tel.ornek).ok,false);
});

test("9 → 10 göçü eski ziyaretlere iş, ödeme veya başarı uydurmaz",()=>{
 const d=oyunuBaslat(yeniOyun(1),I);d.yonetim.bolgeler.Taşhan={ziyaret:1,iliski:60};
 const k=JSON.parse(kaydet(d));k.surum=9;k.durum.surum=9;delete k.durum.saha;
 const y=yukle(JSON.stringify(k));assert.ok(y.ok);if(!y.ok)return;
 assert.equal(y.durum.surum,DURUM_SURUMU);assert.deepEqual(y.durum.saha,{});assert.deepEqual(y.durum.yonetim,d.yonetim);assert.deepEqual(y.durum.zar,d.zar);
});

test("yerel konut işi Ayşe'nin hayatına bağlanır; tamamlandıktan sonra konteynerde yaşıyor denmez",async()=>{
 const {hayatlarAySonu}=await import("../../cekirdek/toplum.ts");
 const {kosulSaglaniyor}=await import("../../cekirdek/kosul.ts");
 const {d,ornek}=kur();d.yonetim.kurumlar.cevre!.liyakat=80;gorus(d);kararVer(d,I,ornek,0);d.ay=3;sahaAySonu(d,I);
 const ayse=I.hayatlar.find(h=>h.id==="ayse")!;
 for(const id of ["konteyner","salgin","unutulduk","anahtar"])assert.equal(kosulSaglaniyor(d,ayse.sahneler.find(s=>s.id===id)!.kosul,I),false);
 const hayatlar=[];for(let i=0;i<30;i++)hayatlar.push(...hayatlarAySonu(d,I));
 assert.equal(hayatlar.filter(h=>h.metin.includes("bağlantı işinin kabulünden sonra")).length,1);
 assert.equal(d.bayraklar.ayse_yerlesmis,true);
});

test("eski kayıtta evine yerleşmiş Ayşe yeniden konteynere döndürülmez",()=>{
 const d=oyunuBaslat(yeniOyun(1),I);d.toplum.hayatlar.ayse={olan:{anahtar:1},son:[],ayrildi:false};
 const k=JSON.parse(kaydet(d));k.surum=9;k.durum.surum=9;delete k.durum.saha;
 const y=yukle(JSON.stringify(k));assert.ok(y.ok);if(!y.ok)return;
 assert.equal(y.durum.bayraklar.ayse_yerlesmis,true);assert.equal(y.durum.toplum.hayatlar.ayse!.olan.anahtar,1);
});

test("tamamlanan yerel işin gerçek grup etkisi aynı zarla seçim sonucuna yansır",async()=>{
 const {secimiHazirla}=await import("../../cekirdek/secim.ts");
 const {d,ornek}=kur();gorus(d);kararVer(d,I,ornek,0);d.yonetim.kurumlar.cevre!.liyakat=80;d.ay=18;
 const karsilastir=structuredClone(d);
 sahaAySonu(d,I);
 secimiHazirla(karsilastir,I);secimiHazirla(d,I);
 assert.ok(d.yonetim.secim.gece!.oy>karsilastir.yonetim.secim.gece!.oy);
 assert.deepEqual(d.zar,karsilastir.zar,"ek bir seçim zarı atılmaz");
});
