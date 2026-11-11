import type { Oyun } from "./useOyun.ts";
import type { OyunDurumu } from "../cekirdek/durum.ts";
export function GorevNotu({d,oyun}:{d:OyunDurumu;oyun:Oyun}) {
 if(d.ay!==1||d.bayraklar.rehber_kapali||d.masa.some(m=>m.kart==="akkopru_telefon")||d.acilis?.sabah===null)return null;
 const karar=d.buAy.kararlar.length>0,faaliyet=d.bosGun<4;
 return <section className="gorev-notu" aria-label="İlk ay görev notu"><p className="ust-etiket">Nermin Aksoy · Özel Kalem</p><h2>İlk ayınız, ilk dosyalar</h2><ol><li className={karar?"tamam":""}>Bir dosya açın ve karar verin.</li><li className={faaliyet?"tamam":""}>Ajandadan bir görüşme planlayın.</li><li>Kararlar bitince ayı kapatın.</li></ol><p className="kucuk soluk">Her ay 3 imza ve 1 sahne hakkınız var.</p><button className="dugme ikincil" onClick={oyun.rehberKapat}>Notu kaldır</button></section>;
}
