// Saha: konuşma, yerinde kayıt, gerçek ödenek, uygulama ve geri dönüş.
import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Kart, Secenek } from "./icerik.ts";
import type { SahaDosyasi } from "./saha-icerik.ts";
import type { SahaKaydi } from "./saha-durum.ts";
import type { EylemSonucu } from "./karar.ts";
import { anlatiAc } from "./anlati.ts";
import { kabulTakvimiDolu } from "./ziyaret.ts";
import { sozVer, sozTut } from "./hazine.ts";
import { etkiUygula, trilyonTL } from "./ekonomi.ts";
const bul = (I:IcerikPaketi,id:string) => I.saha?.find(s=>s.id===id);
function iz(d:OyunDurumu,s:SahaKaydi,metin:string){s.izler.push({ay:d.ay,metin});d.buAy.olaylar.push(metin);}

export function sahaEngeli(d:OyunDurumu,I:IcerikPaketi,il:string):string|null {
  const t=I.saha?.find(s=>s.il===il);
  if(!t)return "Bu şehir için açık bir saha dosyası yok.";
  if(d.bitis || d.yonetim.secim.gece)return "Dönem kapandı.";
  if(d.anlati.sahne || d.meclis.kulis || d.yonetim.medya.basin || d.yonetim.secim.sahne)return "Önce açık görüşmeyi tamamla.";
  if(d.masa.some(m=>I.kartlar[m.kart]?.saha?.id===t.id))return "Önce bu şehrin masadaki saha kararını sonuçlandır.";
  if(d.saha[t.id]?.takipYapildi)return "Bu dosyanın dönüş ziyareti yapıldı. Uygulama raporunu buradan izleyebilirsin.";
  if(d.meclis.sahneAy===d.ay)return "Bu ayın sahne hakkı kullanıldı. Saha ziyareti, kulis ve basın aynı hakkı paylaşır.";
  if(d.bosGun<1)return "Takvimde boş gün kalmadı.";
  if(kabulTakvimiDolu(d))return "Bu ayın karar takvimi dolu.";
  if(!I.kartlar[d.saha[t.id]?t.takip:t.ilk]?.anlati?.sahne)return "Saha dosyası bulunamadı.";
  return null;
}
export function sahaBaslat(d:OyunDurumu,I:IcerikPaketi,il:string):EylemSonucu{
  const hata=sahaEngeli(d,I,il);if(hata)return {ok:false,neden:hata};
  const t=I.saha!.find(s=>s.il===il)!,eski=d.saha[t.id];
  const kart=eski?t.takip:t.ilk,ornek=`${kart}#${d.sayac+1}`;
  // anlatiAc'nin bütün önkoşulları yukarıda doğrulandı. Tek gün ve tek sahne
  // oradan düşer; ayrıca yol gideri adıyla sürekli bütçe kalemi yaratılmaz.
  d.sayac++;
  d.masa.push({ornek,kart,degisken:{},agir:false,ikinciGorus:false});
  const r=anlatiAc(d,I,ornek);
  if(!r.ok){d.masa.pop();d.sayac--;return r;}
  d.gorulen[kart]=d.ay;
  if(eski){eski.sonZiyaret=d.ay;eski.takipYapildi=true;}
  else d.saha[t.id]={ilkAy:d.ay,sonZiyaret:d.ay,takipYapildi:false,durum:"karar",hedefAy:null,sonucAy:null,tarihSozu:false,sozKirildi:false,guclendirildi:false,faydaUygulandi:false,denetimAy:null,denetim:"yok",harcama:0,izler:[]};
  d.bayraklar[`${t.id}_saha_belge`]=false;
  d.bayraklar[`${t.id}_saha_tarih`]=false;
  const b=d.yonetim.bolgeler[il]??={iliski:50,ziyaret:0};b.ziyaret=d.ay;
  d.yonetim.ajanda.push({ay:d.ay,tur:"ziyaret",hedef:il,metin:`${il}: ${eski?"dönüş ziyareti":"yerinde görüşme"} — ${t.baslik}.`});
  iz(d,d.saha[t.id]!,`${il}: ${eski?"önceki kararın uygulamasını görmek üzere geri dönüldü":"saha dosyası açıldı"}. Henüz yeni uygulama kararı verilmedi.`);
  return {ok:true,ornek};
}

export function sahaKararBilgisi(d:OyunDurumu,I:IcerikPaketi,k:Kart,s:Secenek):{metin:string,kilit?:string,maliyet:number}{
 const t=k.saha&&bul(I,k.saha.id),p=t&&d.saha[t.id];
 if(!t||!p||!s.saha_karari)return {metin:"",maliyet:0,kilit:"Bu saha kararı açık değil."};
 if(s.saha_karari==="program"){
  if(p.durum==="tamamlandi")return {metin:"Tamamlanan işe ikinci ödenek ayrılmaz.",maliyet:0};
  if(d.bayraklar[`${t.id}_saha_belge`]!==true)return {metin:"",maliyet:0,kilit:"Yerinde kayıt doğrulanmadı. Bu ziyaretle yapım talimatı veremezsin."};
  if(d.imza>=3)return {metin:"",maliyet:0,kilit:"Bu ayın üç imzası kullanıldı. Geçici destek veya mevcut takvimle devam edebilirsin."};
  return {metin:p.durum==="program"||p.durum==="aksadi"?"1 imza · Ek teknik ekip ve koordinasyon. Yeni hedef gelecek ay; önceki gecikme kaydı silinmez.":"1 imza · İki aylık uygulama. Kurum kapasitesi yetersizse iş aksayabilir.",maliyet:t.maliyet*(p.durum==="program"||p.durum==="aksadi"?.3:1)};
 }
 if(s.saha_karari==="gecici")return {metin:"Bir aylık ihtiyaca yönelik destek. Kalıcı işin yerine geçmez.",maliyet:t.maliyet*.2};
 if(s.saha_karari==="denetle"){
  if(p.denetim!=="yok")return {metin:"Aynı denetim ikinci kez sipariş edilmez; mevcut rapor izlenir.",maliyet:0};
  if(d.imza>=3)return {metin:"",maliyet:0,kilit:"Bağımsız denetim için bu ay imza kalmadı."};
  return {metin:"1 imza · Gelecek ay bağımsız uygulama raporu. Denetim, işi kendiliğinden tamamlamaz.",maliyet:t.maliyet*.06};
 }
 return {metin:s.saha_karari==="reddet"?"Kalıcı iş veya geçici destek için yeni kaynak ayrılmaz.":"Verilmiş ödenek, açık iş ve gecikme kaydı korunur; yeni ödeme yapılmaz.",maliyet:0};
}
function ode(d:OyunDurumu,t:SahaDosyasi,p:SahaKaydi,tutar:number,ad:string){
 const soz=sozVer(d,{metin:`${t.il}: ${ad}`,kalem:t.kalem,maliyet:tutar,vade:0,tek_seferlik:true});
 sozTut(d,soz.id);p.harcama+=trilyonTL(d,tutar)/12;
}
function sozKir(d:OyunDurumu,t:SahaDosyasi,p:SahaKaydi){
 if(!p.tarihSozu||p.sozKirildi)return;
 p.sozKirildi=true;
 const kaynak=`${t.il}: kamuya açıklanan ${t.baslik.toLocaleLowerCase("tr")} takvimi tutulmadı`;
 d.sicil.push({id:`sicil#${++d.sayac}`,tur:"kirilan_soz",kaynak,ay:d.ay,ifsaOldu:false});
 etkiUygula(d,t.grup,-2,t.kalem);iz(d,p,kaynak+".");
}
export function sahaKararVer(d:OyunDurumu,I:IcerikPaketi,k:Kart,s:Secenek):EylemSonucu{
 const bilgi=sahaKararBilgisi(d,I,k,s);if(bilgi.kilit)return {ok:false,neden:bilgi.kilit};
 const t=bul(I,k.saha!.id)!,p=d.saha[t.id]!,eylem=s.saha_karari;
 if(eylem==="program"&&p.durum!=="tamamlandi"){
  const ek=p.durum==="program"||p.durum==="aksadi";
  d.imza++;ode(d,t,p,bilgi.maliyet,ek?"ek teknik ekip ödeneği":"yerel uygulama ödeneği");
  p.durum="program";p.guclendirildi=ek;p.hedefAy=d.ay+(ek?1:2);
  if(!ek)p.tarihSozu=d.bayraklar[`${t.id}_saha_tarih`]===true;
  iz(d,p,`${t.il}: ${ek?"ek teknik ekip finanse edildi":"işin ödeneği çıkarıldı"}. İş henüz bitmedi.`);
 }else if(eylem==="gecici"){
  ode(d,t,p,bilgi.maliyet,"geçici hizmet desteği");p.durum="gecici";
  p.tarihSozu=d.bayraklar[`${t.id}_saha_tarih`]===true;sozKir(d,t,p);
  etkiUygula(d,t.grup,.6,t.kalem);
  iz(d,p,`${t.il}: ${t.gecici}`);
 }else if(eylem==="reddet"){
  p.durum="reddedildi";p.tarihSozu=d.bayraklar[`${t.id}_saha_tarih`]===true;sozKir(d,t,p);
  etkiUygula(d,t.grup,-1.5,t.kalem);iz(d,p,`${t.il}: ${t.reddedildi}`);
 }else if(eylem==="denetle"&&p.denetim==="yok"){
  d.imza++;ode(d,t,p,bilgi.maliyet,"bağımsız uygulama denetimi");p.denetimAy=d.ay+1;p.denetim="bekliyor";
  iz(d,p,`${t.il}: bağımsız denetim sipariş edildi. Rapor henüz gelmedi.`);
 }else iz(d,p,`${t.il}: yeni kaynak ayrılmadı; dosyanın mevcut uygulama durumu korundu.`);
 return {ok:true,haber:p.izler.at(-1)!.metin};
}
export function sahaAySonu(d:OyunDurumu,I:IcerikPaketi):string[]{
 const haberler:string[]=[];
 for(const [id,p]of Object.entries(d.saha)){
  const t=bul(I,id);if(!t)continue;
  if(p.durum==="program"&&p.hedefAy!==null&&p.hedefAy<=d.ay){
   if((d.yonetim.kurumlar[t.kurum]?.liyakat??50)<60&&!p.guclendirildi){
    p.durum="aksadi";haberler.push(`${t.il}: ${t.aksadi}`);sozKir(d,t,p);
   }else{
    p.durum="tamamlandi";p.sonucAy=d.ay;
    d.bayraklar[`saha_${id}_tamamlandi`]=true;
    if(!p.faydaUygulandi){
     for(const [g,v]of Object.entries(t.fayda))etkiUygula(d,g,v,t.kalem);
     // Yalnız bu işin ilgilendirdiği grubun yerel eylemi etkilenir.
     for(const e of d.toplum.eylemler.filter(e=>e.il===t.il&&e.grup===t.grup)){
      e.emniyet=Math.round(e.emniyet*.65);e.duzenleyici=Math.round(e.duzenleyici*.65);e.dinlendi=true;
     }
     p.faydaUygulandi=true;
    }
    haberler.push(`${t.il}: ${t.tamamlandi}`);
   }
  }
  if(p.denetim==="bekliyor"&&p.denetimAy!==null&&p.denetimAy<=d.ay){
   p.denetim=p.durum==="tamamlandi"?"dogrulandi":"eksik";
   haberler.push(`${t.il}: bağımsız rapor ${p.denetim==="dogrulandi"?"tamamlanan işi doğruladı":"işin tamamlanmadığını kayda geçirdi"}.`);
  }
  for(const metin of haberler.filter(h=>h.startsWith(t.il+":")))p.izler.push({ay:d.ay,metin});
 }
 return haberler;
}
export function sahaRaporu(d:OyunDurumu,t:SahaDosyasi):string{
 const p=d.saha[t.id];if(!p)return t.ozet;
 const durum=p.durum==="tamamlandi"?t.tamamlandi:p.durum==="aksadi"?t.aksadi:p.durum==="gecici"?t.gecici:p.durum==="reddedildi"?t.reddedildi:p.durum==="program"?"Ödenek çıkarıldı; uygulama sürüyor. Tamamlandı kaydı henüz yok.":"Ziyaret yapıldı; uygulama kararı bekliyor.";
 return durum+(p.denetim==="bekliyor"?" Bağımsız denetim raporu bekleniyor.":p.denetim==="dogrulandi"?" Bağımsız rapor tamamlanan işi doğruladı.":p.denetim==="eksik"?" Bağımsız inceleme sırasında işin tamamlanmadığı kayda geçti.":"")+(p.sozKirildi?" Açıklanan teslim tarihinin tutulmaması sicile yazıldı.":"");
}
