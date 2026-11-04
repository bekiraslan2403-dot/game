// Ziyaretlerin talimatı ve sonraki dosyada okunan gerçek sonuç. Ayrı bir puan
// sistemi yok: politika, Meclis tutanağı ve uygulama kuyruğu birlikte okunur.
import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Secenek } from "./icerik.ts";
import type { EylemSonucu } from "./karar.ts";
import { bekleyenTeklif, IMZA_HAKKI, politikaDegistir, seviye } from "./politika.ts";
import { sozTut, sozVer } from "./hazine.ts";

type Talimat = NonNullable<Secenek["politika"]>;
const karsilaniyor = (n: number, t: Talimat) => t.yon === "azalt" ? n <= t.hedef : n >= t.hedef;

/** Kabul ve takip de ayın karar bütçesine dahildir; yeni bir sınırsız yan
 * görev listesi yaratılmaz. Var olan zorunlu krizler geriye dönük kesilmez. */
export function kabulTakvimiDolu(d: OyunDurumu): boolean {
  return d.buAy.kararlar.length + d.masa.length >= 6;
}

export function talimatAciklamasi(d: OyunDurumu, I: IcerikPaketi, t: Talimat): { metin: string; kilit?: string } {
  const p = I.politikalar[t.id];
  if (!p || t.hedef >= p.kademeler.length) return { metin: "", kilit: "Bu düzenleme bulunamadı." };
  const teklif = bekleyenTeklif(d, p.id);
  if (teklif) return karsilaniyor(teklif.hedef, t)
    ? { metin: "Bu yöndeki teklif zaten Meclis'te. Yeni imza kullanılmaz; sonuç henüz belli değil." }
    : { metin: "", kilit: "Bu konuda farklı bir teklif Meclis'te. Önce Meclis gündemini düzenle." };
  if (karsilaniyor(seviye(d, p), t)) return { metin: "Bu düzenleme zaten yürürlükte. Mevcut uygulama korunur; yeni imza kullanılmaz." };
  const metin = `${p.yol === "kanun" ? "1 imza · Meclis oylaması gerekir." : "1 imza · Kararname yayımlanır."}`;
  return { metin, ...(d.imza >= IMZA_HAKKI ? { kilit: "Bu ayın üç imzası kullanıldı. Diğer yanıtlar hâlâ seçilebilir." } : {}) };
}

export function gorusmeTalimati(d: OyunDurumu, I: IcerikPaketi, t: Talimat): EylemSonucu {
  const bilgi = talimatAciklamasi(d, I, t);
  if (bilgi.kilit) return { ok: false, neden: bilgi.kilit };
  const p = I.politikalar[t.id]!;
  if (bekleyenTeklif(d, p.id) || karsilaniyor(seviye(d, p), t)) return { ok: true, haber: bilgi.metin };
  return politikaDegistir(d, I, p.id, t.hedef);
}

export function gorusmeDestegi(d: OyunDurumu, I: IcerikPaketi, kaynak: string, uygula = false): EylemSonucu {
  const tanim = I.kartlar[kaynak]?.secenekler.find(s => s.ekonomi?.soz)?.ekonomi?.soz;
  if (!tanim) return { ok: false, neden: "Bu görüşmenin destek ödeneği bulunamadı." };
  const soz = d.ekonomi.sozler.find(s => s.metin === tanim.metin);
  if (soz?.durum === "kirildi") return { ok: false, neden: "Bu desteğin ödeme süresi geçti. Yerine getirilmeyen söz sicilde kalır." };
  if (soz?.durum === "tutuldu") return { ok: true, haber: "Bu desteğin ödeneği zaten çıkarıldı; ikinci ödeme yapılmadı." };
  if (!uygula) return { ok: true };
  return sozTut(d, (soz ?? sozVer(d, tanim)).id);
}

/** Yalnız okur. Görüşmede açılan oylamanın kimliğiyle eşler; başka bir ayın
 * kabulü veya mevcut kademe, o görüşmenin başarısı diye sunulmaz. */
export function ziyaretSonucu(d: OyunDurumu, I: IcerikPaketi, id: string): { yanit: string; durum: string } | null {
  const z = I.toplum.ziyaretciler.find(z => z.id === id);
  let kart = z?.gorusme && I.kartlar[z.gorusme];
  if (!kart) return null;
  const beklenen = kart.id;
  const karar = [...d.gecmis.flatMap(g => g.kararlar), ...d.buAy.kararlar].find(k => k.kart === beklenen || (I.kartlar[k.kart]?.ziyaret?.id === id && I.kartlar[k.kart]?.ziyaret?.asama === "gorusme"));
  if (!karar) return null; // Eski sürümdeki salt kabul kaydından karar uydurulmaz.
  kart = I.kartlar[karar.kart]!;
  const s = kart.secenekler[karar.secenek]!;
  if (!s.politika) {
    if (s.icra) return { yanit: karar.secenekMetni, durum: s.haber ?? "Talimat kayda geçti. Sonucu takip dosyasında ele alınacak." };
    if (s.ekonomi?.asgari_artis) return { yanit: karar.secenekMetni, durum: `Ara zam hane ücretine uygulandı. Şu anki asgari ücret ${Math.round(d.ekonomi.hane.asgari).toLocaleString("tr-TR")} TL. Aradan geçen fiyat artışları alım gücünü ayrıca etkiliyor.` };
    const soz = s.ekonomi?.soz && d.ekonomi.sozler.find(v => v.metin === s.ekonomi!.soz!.metin && v.verildi === d.gorulen[kart.id]);
    return { yanit: karar.secenekMetni, durum: soz ? soz.durum === "tutuldu" ? "Dar kapsamlı desteğin ödeneği çıkarıldı. Genel düzenleme yapılmadı; heyetin geri kalan talebi sürüyor." : soz.durum === "kirildi" ? "Destek sözü vadesinde yerine getirilmedi. Kırılan söz sicile ve kamuoyuna yansıdı." : "Destek sözü verildi, ödenek henüz çıkarılmadı. Bu dosyadan ödemeyi yapabilir veya daha kapsamlı düzenlemeye geçebilirsin." : "Talep geri çevrildi. Genel düzenleme veya destek ödeneği çıkarılmadı." };
  }
  const t = s.politika, p = I.politikalar[t.id]!;
  const ay = d.gorulen[kart.id];
  const sonuc = d.meclis.sonuclar.find(r => r.id === `${p.id}@${ay}`);
  const bekliyor = bekleyenTeklif(d, p.id);
  let durum = sonuc ? `Görüşmedeki teklif ${sonuc.sonuc === "kabul" ? "Meclis'te kabul edildi" : sonuc.sonuc === "ret" ? "Meclis'te reddedildi" : "halkoylamasına sunuldu"}: ${sonuc.evet} evet, ${sonuc.hayir} ret.`
    : bekliyor ? "Bu konudaki teklif hâlâ Meclis gündeminde; uygulamaya geçmiş değil."
    : p.yol === "kanun" && !karsilaniyor(seviye(d, p), t) ? "Görüşmede istenen düzenleme yürürlükte değil. Teklif geri çekilmiş veya daha sonra değiştirilmiş olabilir."
    : "Görüşmede desteklenen düzenlemenin bugünkü durumu aşağıda.";
  durum += ` Şu an: ${p.kademeler[seviye(d, p)]}.`;
  const isler = d.yonetim.uygulamalar.filter(u => u.politika === p.id || u.baslik === p.ad);
  if (isler.some(u => u.politika === p.id)) durum += " Mahkeme incelemesi bekliyor; karar kesinleşmiş sayılmaz.";
  if (isler.some(u => !u.politika)) durum += " Sahadaki uygulamanın bir bölümü kapasite sorunu nedeniyle bekliyor.";
  return { yanit: karar.secenekMetni, durum };
}
