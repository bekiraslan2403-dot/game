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
function ilk(id: string, seed=437) {
  const d = oyunuBaslat(yeniOyun(seed), I); d.ay = 4; d.buAy = bosAyKaydi(4); d.bekleyen = [];
  d.masa = [{ kart: id, ornek: `${id}#${++d.sayac}`, degisken: {}, agir: false, ikinciGorus: false }];
  return d;
}
function sec(d: OyunDurumu, id: string, i: number) {
  const m = d.masa.find(m => m.kart === id)!; assert.ok(m, `${id} masada`);
  const r = kararVer(d, I, m.ornek, i); assert.ok(r.ok, `${id}/${i}: ${r.ok ? "" : r.neden}`);
}
function ay(d: OyunDurumu) {
  let n=0; while(d.masa.length){ botKarari(d,I,d.masa[0]!.ornek,2);assert.ok(++n<80); }
  const r=ayiBitir(d,I);if(!r.ok)throw Error(r.neden);return r.durum;
}
function sonraki(d: OyunDurumu,id: string){let n=0;while(!d.masa.some(m=>m.kart===id)){d=ay(d);assert.ok(++n<3);}return d;}
function geri(d: OyunDurumu){const r=yukle(kaydet(d));if(!r.ok)throw Error(r.hata);assert.deepEqual(r.durum,d);return r.durum;}
for(let yol=0;yol<3;yol++) for(let oturum=0;oturum<3;oturum++)test(`kaza ${yol} / duruşma ${oturum}: iki ayrı ay, teklif ödenmez`,()=>{
 let d=ilk("akkopru_kaza",401+yol*3+oturum);d.anlati.iliskiler.suna_ekin=70;
 const gider=d.ekonomi.gider.sosyal!;sec(d,"akkopru_kaza",yol);
 assert.equal(d.hesaplasma!.asama,"bekleyen");assert.equal(d.hesaplasma!.hedef,"akkopru_durusma");
 assert.equal(d.hesaplasma!.hamKayit,false);assert.equal(d.hesaplasma!.harcamaTL,0);
 assert.equal(d.ekonomi.gider.sosyal!,gider);assert.ok(d.bayraklar.akkopru_kayip);d=geri(d);
 d=sonraki(d,"akkopru_durusma");assert.equal(d.hesaplasma!.asama,"dosya");
 assert.equal(d.hesaplasma!.aile,yol===2?"reddetti":yol===0?"gorusur":"mesafeli");
 sec(d,"akkopru_durusma",oturum);
 assert.equal(d.hesaplasma!.asama,"bekleyen");assert.equal(d.hesaplasma!.hedef,"akkopru_durusma_takip");
 assert.equal(d.hesaplasma!.harcamaTL,0);assert.equal(d.hesaplasma!.bakan,oturum===0?"uzaklastirildi":"gorevde");
 assert.ok(!d.bayraklar.akkopru_bitti);geri(d);
});
test("Suna gizliliği reddeder; yardım seçimi atomik kilitli, diğer yanıtlar açık",()=>{
 let d=ilk("akkopru_kaza");d.anlati.iliskiler.suna_ekin=80;sec(d,"akkopru_kaza",2);
 d=sonraki(d,"akkopru_durusma");sec(d,"akkopru_durusma",2);
 d=sonraki(d,"akkopru_durusma_takip");assert.equal(d.hesaplasma!.aile,"reddetti");
 const m=d.masa.find(m=>m.kart==="akkopru_durusma_takip")!;const once=structuredClone(d);
 assert.equal(kararVer(d,I,m.ornek,1).ok,false);assert.deepEqual(d,once);
 sec(d,"akkopru_durusma_takip",2);assert.equal(d.hesaplasma!.harcamaTL,0);
 assert.equal(d.bayraklar.akkopru_sonuc,"kaza_bekle");geri(d);
});
test("açık emir ve bakanın uzaklaştırılması aileyle yazılı görüşmeyi mümkün kılar; avans gerçektir",()=>{
 let d=ilk("akkopru_kaza");sec(d,"akkopru_kaza",0);
 d=sonraki(d,"akkopru_durusma");sec(d,"akkopru_durusma",0);
 d=sonraki(d,"akkopru_durusma_takip");assert.equal(d.hesaplasma!.aile,"gorusur");
 const once=d.ekonomi.gider.sosyal!;sec(d,"akkopru_durusma_takip",1);
 assert.equal(d.hesaplasma!.asama,"tamam");assert.ok(d.hesaplasma!.harcamaTL>0);
 assert.equal(d.hesaplasma!.aile,"yardim_aldi");
 assert.ok(d.ekonomi.gider.sosyal!>once);assert.ok(d.yonetim.uygulamalar.some(u=>u.kalem==="sosyal"&&u.tekSeferlik));
 assert.equal(d.bayraklar.akkopru_sonuc,"kaza_yardim");assert.ok(geri(d).hesaplasma!.sonuc!.metin.includes("davadan vazgeçmesi istenmedi"));
});
for(const yol of [0,1,2])test(`Deniz yolu ${yol}: yanıtı sonra gelir, delil/iş farklıdır`,()=>{
 let d=ilk("akkopru_tanik",811+yol);d.anlati.iliskiler.deniz_alaz=60;
 const once=d.ekonomi.gider.personel!;sec(d,"akkopru_tanik",yol);
 assert.equal(d.hesaplasma!.asama,"bekleyen");assert.equal(d.hesaplasma!.beyan,false);
 assert.equal(d.ekonomi.gider.personel!,once,"iş teklifi veya koruma personel maaşı değildir");d=geri(d);
 d=sonraki(d,"akkopru_tanik_takip");
 assert.equal(d.hesaplasma!.deniz,["ifade_istegi","is_basvurusu","ayrildi"][yol]);
 sec(d,"akkopru_tanik_takip",[0,1,2][yol]!);
 assert.equal(d.hesaplasma!.asama,"tamam");
 assert.equal(d.hesaplasma!.deniz,["ifade_verdi","ise_basladi","ayrildi"][yol]);
 assert.equal(d.hesaplasma!.beyan,yol===0);
 assert.equal(d.hesaplasma!.harcamaTL>0,yol!==2);
 assert.equal(d.ekonomi.gider.personel!>once,yol===1);
 assert.equal(d.bayraklar.akkopru_ham_veri,undefined,"beyan eski ham seriyi uydurmaz");geri(d);
});
test("önceden teslim edilmiş imzalı beyan ikinci kez alınmaz",()=>{
 let d=ilk("akkopru_tanik");d.bayraklar.inceleme_beyan_teslim=true;sec(d,"akkopru_tanik",0);
 d=sonraki(d,"akkopru_tanik_takip");const m=d.masa.find(m=>m.kart==="akkopru_tanik_takip")!;
 const once=structuredClone(d);assert.equal(kararVer(d,I,m.ornek,0).ok,false);assert.deepEqual(d,once);
 sec(d,"akkopru_tanik_takip",2);assert.equal(d.hesaplasma!.beyan,true);geri(d);
});
test("Deniz'in yeni ifadesi eski teknik raporu değiştirmeyen tarihli ektir",()=>{
 let d=ilk("akkopru_tanik");d.anlati.iliskiler.deniz_alaz=65;
 d.inceleme={baslangicAy:2,yol:"bakanlik",asama:"tamam",raporAy:3,raporKarti:"akkopru_rapor_bakanlik",hamKayit:false,tanikBeyani:false,tanikDurumu:"eski_kayit",harcamaTL:0,yayin:"kapali",rapor:{tanikBeyani:false,baslik:"Bakanlık ön raporu",bulgular:["Eski kayıt yok"],eksikler:["İfade bekliyor"]},oncekiRaporlar:[],sonuc:{baslik:"Sınırlı",metin:"Dosyada saklandı"},izler:[{ay:3,metin:"Rapor teslim edildi"}]};
 const rapor=structuredClone(d.inceleme.rapor);
 sec(d,"akkopru_tanik",0);d=sonraki(d,"akkopru_tanik_takip");sec(d,"akkopru_tanik_takip",0);
 assert.equal(d.inceleme!.tanikBeyani,true);assert.equal(d.bayraklar.inceleme_beyan_teslim,true);
 assert.deepEqual(d.inceleme!.rapor,rapor);assert.ok(d.inceleme!.izler.at(-1)!.metin.includes("sonraki adli dosyaya"));geri(d);
});
test("Deniz düşük güvende ifade veya görev isteğini reddeder; önceki evrak silinmez",()=>{
 let d=ilk("akkopru_tanik");d.anlati.iliskiler.deniz_alaz=20;d.bayraklar.akkopru_ham_veri=true;
 sec(d,"akkopru_tanik",0);d=sonraki(d,"akkopru_tanik_takip");
 assert.equal(d.hesaplasma!.deniz,"ayrildi");assert.equal(d.hesaplasma!.hamKayit,true);
 const once=structuredClone(d),m=d.masa.find(m=>m.kart==="akkopru_tanik_takip")!;
 assert.equal(kararVer(d,I,m.ornek,0).ok,false);assert.deepEqual(d,once);
 sec(d,"akkopru_tanik_takip",2);assert.equal(d.hesaplasma!.hamKayit,true);geri(d);
});
test("gün veya imza yetersizliği kaza/tanık kararını ve zarı değiştirmez",()=>{
 for(const [kart,degistir]of [["akkopru_durusma",(d:OyunDurumu)=>{d.imza=3;}],["akkopru_tanik",(d:OyunDurumu)=>{d.imza=3;}]]as const){
  const d=ilk(kart),m=d.masa[0]!;degistir(d);const once=structuredClone(d);
  assert.equal(kararVer(d,I,m.ornek,0).ok,false);assert.deepEqual(d,once);
 }
});
test("13→14 geçmiş sonuca dava, ödeme veya ifade yazmaz; eski bekleyen duruşma bugün açılır",()=>{
 const d=ilk("akkopru_durusma"),h=JSON.parse(kaydet(d));delete h.durum.hesaplasma;h.surum=13;h.durum.surum=13;
 const y=yukle(JSON.stringify(h));assert.ok(y.ok);if(!y.ok)return;
 assert.deepEqual(y.durum,{...d,hesaplasma:null,surum:DURUM_SURUMU});
 y.durum.bayraklar.akkopru_kaza_yaniti="sirket";sec(y.durum,"akkopru_durusma",1);
 const p=(y.durum as OyunDurumu).hesaplasma!;assert.equal(p.yol,"sirket");assert.equal(p.harcamaTL,0);geri(y.durum);
});
test("bekleyen hedef kayıpsa veya teslim olmadan sahte sonuç yazılırsa yükleme reddeder",()=>{
 const d=ilk("akkopru_kaza");sec(d,"akkopru_kaza",0);
 for(const boz of [(h:any)=>{h.durum.bekleyen=[];},(h:any)=>{h.durum.hesaplasma.asama="tamam";},(h:any)=>{h.durum.hesaplasma.tur="tanik";}]){
  const h=JSON.parse(kaydet(d));boz(h);assert.equal(yukle(JSON.stringify(h)).ok,false);
 }
});
