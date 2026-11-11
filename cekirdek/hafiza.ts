// Akköprü'nün kamusal hafızası mevcut tutanaklardan okunur; eski aya yeni olay yazılmaz.
import type { OyunDurumu } from "./durum.ts";
import type { Kart, Secenek } from "./icerik.ts";
import { notEkle } from "./yonetim.ts";
import { etkiUygula } from "./ekonomi.ts";

const ACIK = new Set(["acik", "sessiz", "toren"]);
export function kopruAcik(d: OyunDurumu): boolean {
  return ACIK.has(String(d.bayraklar.akkopru_sonuc ?? "")) && (!d.santiye || d.santiye.asama === "kabul");
}
export function hafizaSatirlari(d: OyunDurumu): string[] {
  const kanit = d.inceleme?.hamKayit || d.bayraklar.akkopru_ham_veri === true;
  const beyan = d.inceleme?.tanikBeyani || d.hesaplasma?.beyan || d.bayraklar.inceleme_beyan_teslim === true;
  const yol = kopruAcik(d) ? "Trafik teknik kabulün ardından açıldı." : d.santiye ? "Şantiyede teknik kabul ve trafik açılışı kaydı yok." : "Köprünün yeniden açıldığına dair kayıt yok.";
  const alacak = d.santiye?.ucret === "odendi" || d.bayraklar.akkopru_ucret_odendi === true ? "Doğrulanan işçi alacağı ödendi." : "İşçi alacağının ödendiğine dair kayıt yok.";
  const esnaf = ({ servis: "Alternatif sevkiyat bir dönem finanse edildi.", basvuru: "Esnaf başvuruları için masa açıldı; ödeme ayrıca kararlaştırılır.", bekle: "Yerel geçim için kamu gideri ayrılmadı.", odeme: "Belgeli nakliye farkı için geçici ödeme yapıldı.", uzatma: "Alternatif sevkiyat bir dönem daha finanse edildi." } as Record<string,string>)[String(d.bayraklar.akkopru_gecim_sonuc ?? d.bayraklar.akkopru_gecim_yolu ?? "")] ?? "Esnaf kaybı için ayrı bir karar kaydı yok.";
  return [yol, kanit ? "Ham ölçüm kopyası elde." : "Ham ölçüm serisi elde değil.", beyan ? "İmzalı tanık beyanı ayrı tarihle arşivde." : "Yeni imzalı tanık beyanı yok.", alacak, esnaf, d.bayraklar.akkopru_kayip ? "Kazanın iki can kaybı var; adli hüküm kaydedilmedi." : "Bu dosyada ölümcül kaza kaydı yok."];
}
export function hafizaEngeli(d: OyunDurumu, k: Kart, s: Secenek): string | null {
  if (!k.id.startsWith("akkopru_gecim")) return null;
  if (k.id === "akkopru_gecim" && !d.santiye) return "Yerel geçim dosyası ancak şantiye açıldıktan sonra gelir.";
  if (k.id !== "akkopru_gecim" && d.bayraklar.akkopru_gecim_yolu !== ({ akkopru_gecim_servis: "servis", akkopru_gecim_basvuru: "basvuru", akkopru_gecim_bekle: "bekle" } as Record<string,string>)[k.id]) return "Önceki yerel kararın devamı bulunamadı.";
  if (k.id === "akkopru_gecim_servis" && s.bayrak?.akkopru_gecim_sonuc === "uzatma" && kopruAcik(d)) return "Yol açıldı; kapalı yol için ikinci sevkiyat ödeneği açılamaz.";
  return null;
}
export function hafizaKarar(d: OyunDurumu, kart: string, sec: number): void {
  if (kart === "akkopru_kampanya") {
    const acik = kopruAcik(d), kanit = d.inceleme?.hamKayit || d.bayraklar.akkopru_ham_veri === true;
    const aile = d.hesaplasma?.aile;
    const guven = aile === "gorusur" || aile === "yardim_aldi" || (!d.bayraklar.akkopru_kayip && (d.anlati.iliskiler.deniz_alaz ?? 50) >= 60);
    const etki = sec === 0 ? (kanit ? 0.4 : -0.15) : sec === 1 ? (acik ? 0.3 : -0.55) : guven ? 0.25 : -0.25;
    d.yonetim.secim.etki = Math.max(-4, Math.min(4, d.yonetim.secim.etki + etki));
    notEkle(d, sec === 0 ? (kanit ? "İlk geceki ham ölçüm ve talimat birlikte yayımlandı; işçi alacağı ile yolun bugünkü durumu da soruldu." : "Eldeki talimatlar yayımlandı. Ham seri bulunmadığı açıklandı; kayıt boşluğu kampanyanın konusu oldu.") : sec === 1 ? (acik ? "Köprünün açıldığı görüntüler yayımlandı. Necdet eski kayıp günlerini, işçiler ücret tutanağını sordu." : "Kapalı yol görüntüsü yayımlandı. Reklam ekibinin başarı metni kullanılmadı; esnaf gecikmenin hesabını sordu.") : guven ? "Görüşme daveti iletildi; aile veya tanık kampanya görüntüsü vermeyi kabul etmiş sayılmadı." : "Görüşme daveti iletildi; önceki mesafe nedeniyle kamuya destek açıklaması yapılmadı.", "medya");
  }
  if (kart === "akkopru_kampanya_yanit") {
    const acik = kopruAcik(d), kanit = d.inceleme?.hamKayit || d.bayraklar.akkopru_ham_veri === true;
    const gecim = d.bayraklar.akkopru_gecim_sonuc;
    const etki = sec === 0 ? (kanit ? 0.28 : -0.12) : sec === 1 ? (gecim === "odeme" || gecim === "uzatma" || gecim === "servis" ? 0.28 : -0.16) : acik && !d.bayraklar.akkopru_kayip ? 0.05 : -0.32;
    d.yonetim.secim.etki = Math.max(-4, Math.min(4, d.yonetim.secim.etki + etki));
    if (sec === 1) etkiUygula(d, "grup.esnaf", gecim === "odeme" || gecim === "uzatma" || gecim === "servis" ? 1.5 : -1, "sosyal");
    const yerel = gecim === "odeme" ? "Belgeli nakliye farkı için sınırlı ödeme yapıldı; diğer zararlar açık." : gecim === "uzatma" || gecim === "servis" ? "Geçici sevkiyat finanse edildi; geçmiş zarar ödenmedi." : gecim ? "Başvuru veya bekleme kararı kayıtta; esnafa ödeme yapılmadı." : "Esnaf için ayrı yardım kaydı yok; ödeme yapılmış gibi anlatılmadı.";
    notEkle(d, sec === 0 ? (kanit ? "Tarihli ham kayıt ve ilk talimat yan yana yayımlandı; sonraki adli süreç açık bırakıldı." : "İlk talimat yayımlandı; eksik ölçüm serisi varmış gibi sunulmadı.") : sec === 1 ? `Necdet'in geçim sorusu yanıtlandı. ${yerel}` : "Hukuk ekibi dosyayı izlemeye devam etti; kampanya yeni belge veya mahkeme hükmü ilan etmedi.", "medya");
  }
}
