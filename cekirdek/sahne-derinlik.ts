// Salt okunur sahne bağlamı: sorular ve cevaplar aynı karar geçmişine dayanır.
import type { OyunDurumu } from "./durum.ts";
export function soruBaglami(d:OyunDurumu,kim:string):string {
 const son=d.buAy.kararlar.at(-1)??d.gecmis.at(-1)?.kararlar.at(-1);
 const soz=d.ekonomi.sozler.find(s=>s.durum==="kirildi");
 const ifsa=d.yonetim.ifsalar.at(-1);
 if(kim==="murat")return `Bütçe açığı %${(d.gostergeler.butce_acigi??3.5).toFixed(1)}. ${d.meclis.butce.gecici?"Geçici bütçeyle devam ediyorsunuz.":"Yeni taahhütler bu bütçeden ödenecek."} Hangi kalemi azaltacaksınız?`;
 if(kim==="deniz")return `Enflasyon %${(d.gostergeler.enflasyon??29).toFixed(1)}, işsizlik %${(d.gostergeler.issizlik??8).toFixed(1)}. ${soz?`“${soz.metin}” sözü tutulmadı.`:"Haneler açıklamadan önce market fişine bakıyor."} Programınızın bedelini kim taşıyor?`;
 if(kim==="selin")return ifsa?`“${ifsa.kaynak}” dosyasında ${ifsa.yanit} Belgelerin denetimini kime açacaksınız?`:son?`“${son.baslik}” dosyasında “${son.secenekMetni}” dediniz. Karşı çıkan kesimin itirazını nasıl karşılayacaksınız?`:"İlk ayınızda hangi kararın hesabını kamuya açık vereceksiniz?";
 if(kim==="laura")return `Yargı ve basın kararlarınız dışarıda tartışılıyor. ${d.sicil.filter(s=>s.ifsaOldu).length} dosya kamuoyuna yansıdı. Bağımsız denetime hangi güvenceyi vereceksiniz?`;
 return `${d.yonetim.parti.ayrilan?"Partinizden ayrılan vekiller sizi eleştiriyor.":"Partinin üç kanadı farklı önceliklerle geliyor."} ${son?`“${son.baslik}” kararının arkasında örgüt var mı?`:"Örgütü aynı programın etrafında nasıl tutacaksınız?"}`;
}
export function sahneSorusu(d:OyunDurumu,tur:"miting"|"munazara",adim:number):string {
 const ak=d.gecmis.flatMap(r=>r.kararlar).find(k=>k.kart==="akkopru_inceleme");
 if(adim===2&&ak)return `${d.yonetim.secim.rakip}: “Akköprüde ‘${ak.secenekMetni}’ dediniz. ${d.bayraklar.akkopru_kayip?"İki işçinin ailesi bunun hesabını bekliyor.":"Tanığın ve o yol kapalıyken geçimini kaybedenlerin dosyası önünüzde."} Bu kararı bugün nasıl savunuyorsunuz?”`;
 if(tur==="miting")return ["Meydanda işçiler ve küçük esnaf yan yana. İlk sözünüz kime?",`Hazine açığı %${(d.gostergeler.butce_acigi??3.5).toFixed(1)}. Hangi vaadin maliyetini üstleneceksiniz?`,`${d.yonetim.secim.rakip}, ${d.yonetim.ifsalar.length?"sızan dosyaların hesabını":"ücretlerin fiyatlara yetişmediğini"} soruyor. Meydana cevabınız ne?`][adim]??"";
 return [soruBaglami(d,"deniz"),soruBaglami(d,"laura"),soruBaglami(d,"selin"),`${d.yonetim.secim.rakip}: “${d.gecmis.at(-1)?.kararlar[0]?.secenekMetni??"Mevcut programla devam"} dediniz. Seçmen neden size bir dönem daha versin?”`][adim]??"";
}
export function sahneCevaplari(d:OyunDurumu,tur:"miting"|"munazara",adim:number):string[] {
 if(adim===2&&d.gecmis.some(r=>r.kararlar.some(k=>k.kart==="akkopru_inceleme")))return ["Arşivi ve kendi talimatlarımı da tartışmaya aç","Tamamlanan onarımı ve bugünkü güvenliği anlat","Ailelerin ve tanığın kendi sözlerini öne çıkar"];
 if(tur==="miting")return [["Geçim sıkıntısını kabul ederek başla","Örgütün başarılarını öne çıkar","Rakibin kent yönetimini eleştir"],["Kaynağı belli sınırlı destek açıkla","Emeklilere yeni destek sözü ver","Geçimin düzeldiğini ilan et"],["Eleştiriyi yanıtla, takvimi açıkla","Rakibin tutarsızlığını göster","Meydanı eleştirene karşı birleştir"]][adim]??[];
 return [["Ekonomik bedeli ve çözüm takvimini anlat","Yeni ücret desteği sözü ver","Pahalılığın bittiğini savun"],["Bağımsız denetime açık güvence ver","Kurum atamalarının arkasında dur","Yargının hükümete uymasını iste"],["Belgeleri ve sorumluluğu kabul et","Rakibin dosyasını tartışmaya aç","Bütün iddiaları reddet"],["Sonuçları ve eksikleri birlikte anlat","Yeni program için uzlaşma öner","Sert yönetim için destek iste"]][adim]??[];
}
/** Bir cevap her soruda aynı sonucu vermez; mevcut sicil ve konu belirleyicidir. */
export function sahneIsabeti(d:OyunDurumu,adim:number,sec:number):number {
 const g=d.gostergeler;
 if(adim===2&&d.bayraklar.akkopru_oynandi)return sec===0?(d.bayraklar.akkopru_ham_veri?0.22:-0.12):sec===1?(d.bayraklar.akkopru_kayip?-0.35:0.15):((d.anlati.iliskiler.suna_ekin??50)>55||(d.anlati.iliskiler.deniz_alaz??50)>60?0.2:-0.15);
 if(adim===0)return sec===0?((g.guven??50)-35)/150:sec===1?((g["grup.isci"]??48)-45)/120:((g.enflasyon??29)<25?0.22:-0.35);
 if(adim===1)return sec===0?((g.yargi??45)-40)/150:sec===1?((g.parti_ici??30)<40?0.15:-0.2):((g["grup.muhafazakar"]??58)-(g["grup.genc"]??40))/200-0.12;
 if(adim===2)return sec===0?(d.yonetim.ifsalar.length?0.12:0.22):sec===1?((g.rakip??50)>60?0.1:-0.1):d.yonetim.ifsalar.length?-0.3:0.08;
 return sec===0?((g.guven??50)-45)/150:sec===1?((g.kutuplasma??45)<50?0.18:-0.12):((g.guvenlik??60)<40?0.12:-0.12);
}
