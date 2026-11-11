import { useState } from "react";
import type { OyunDurumu, MasaKarti } from "../cekirdek/durum.ts";
import type { SahaDosyasi } from "../cekirdek/saha-icerik.ts";
import { sahaEngeli, sahaRaporu } from "../cekirdek/saha.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { tutarYaz } from "./bicim.ts";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

export function SahaIzleme({d,t,ayrinti=true}:{d:OyunDurumu;t:SahaDosyasi;ayrinti?:boolean}){
 const kayit=d.saha[t.id];
 return <section className="saha-izleme" aria-label={`${t.il} uygulama kaydı`}>
  <p>{sahaRaporu(d,t)}</p>
  {ayrinti&&kayit&&<details className="anlati-belgeler"><summary>Önceki karar ve uygulama kayıtları</summary>
    <p className="kucuk soluk">Çıkarılan toplam ödenek: {tutarYaz(kayit.harcama)}. Yeni bir ziyaret, eski kararı veya ödemeyi silmez.</p>
    <ol className="saha-izler">{kayit.izler.map((k,i)=><li key={i}><span className="kucuk soluk">{tarihAdi(k.ay)}</span><p>{k.metin}</p></li>)}</ol>
  </details>}
 </section>;
}
export function SahaProgrami({d,oyun,onAc,onKapat}:{d:OyunDurumu;oyun:Oyun;onAc:(m:MasaKarti)=>void;onKapat:()=>void}){
 const [il,setIl]=useState("Taşhan");
 const t=ICERIK.saha?.find(s=>s.il===il);if(!t)return null;
 const acik=d.masa.find(m=>ICERIK.kartlar[m.kart]?.saha?.id===t.id),hata=sahaEngeli(d,ICERIK,il);
 return <section className="kutu saha-programi" aria-label="Saha ziyareti">
  <h4>Saha ziyareti</h4>
  <label className="alan">Açık dosya<select aria-label="Şehir" value={il} onChange={(e:{target:{value:string}})=>setIl(e.target.value)}>{ICERIK.saha!.map(s=><option key={s.id} value={s.il}>{s.il} · {s.baslik}</option>)}</select></label>
  <p className="saha-konu"><b>{t.baslik}</b></p>
  <SahaIzleme d={d} t={t}/>
  <p className="kucuk soluk">1 gün ve ayın sahne hakkı. Yerel temsilcileri dinler, kaydı inceler, sonunda ne yapılacağına karar verirsin.</p>
  {acik?<button className="dugme ikincil" onClick={()=>{onAc(acik);onKapat();}}>Saha kararına dön</button>:<button className="dugme ikincil" disabled={!!hata} onClick={()=>{
    const kart=d.saha[t.id]?t.takip:t.ilk,r=oyun.faaliyet("ziyaret",il);
    if(r.ok&&r.ornek){onAc({ornek:r.ornek,kart,degisken:{},agir:false,ikinciGorus:false});onKapat();}
  }}>{d.saha[t.id]?.takipYapildi?"Ziyaret tamamlandı":d.saha[t.id]?"Dönüş ziyaretine git":"Ziyarete git"}</button>}
  {hata&&!acik&&<p className="kucuk soluk" role="status">{hata}</p>}
 </section>;
}
