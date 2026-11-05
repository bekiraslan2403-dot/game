import type { Oyun } from "./useOyun.ts";
import type { OyunDurumu } from "../cekirdek/durum.ts";
export function GorevNotu({d,oyun}:{d:OyunDurumu;oyun:Oyun}) {
 if(d.ay!==1||d.bayraklar.rehber_kapali||d.masa.some(m=>m.kart==="akkopru_telefon")||d.acilis?.sabah===null)return null;
 const karar=d.buAy.kararlar.length>0,faaliyet=d.bosGun<4;
 return <section className="gorev-notu" aria-label="İlk ay görev notu"><p className="ust-etiket">Nermin Aksoy · Özel Kalem</p><h2>İlk ayınız, ilk dosyalar</h2><p>Görevi devraldınız. Emekliler aylıklarını, gençler geleceklerini, parti örgütü kimin söz sahibi olacağını bekliyor. İlk işiniz masadaki dosyaları sonuçlandırmak.</p><ol><li className={karar?"tamam":""}>Bir dosya açın, üç seçeneğin bedelini okuyup karar verin.</li><li className={faaliyet?"tamam":""}>Ajandadaki dört günden birini görüşmeye veya ikinci görüşe ayırın.</li><li>Hazine'deki sözleri ve Meclis gündemini kontrol edin. Dosyalar bittiğinde ay raporunu alın.</li></ol><p className="kucuk soluk">Ekonomik etkiler zamanla görünür. Her ay üç imza ve tek sahne hakkınız var; kulis ile basın toplantısı aynı hakkı paylaşır.</p><button className="dugme ikincil" onClick={oyun.rehberKapat}>Notu kaldır</button></section>;
}
