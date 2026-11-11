// Kampanya, bitmiş il kongresi dosyasını karar geçmişinden okur.
import type { OyunDurumu } from "./durum.ts";

const SONUCLAR: Record<string, readonly [string, string, string]> = {
  kongre_yeniden_sayim: [
    "Yeni yönetim arşivi açık devir toplantısında teslim aldı.",
    "Yeni yönetim göreve arşive erişmeden başladı.",
    "İki ekip de binada kaldı, yetki devri tamamlanmadı.",
  ],
  kongre_sizinti: [
    "Tutanağı yayımladınız ve ilk pazarlık sicilde kaldı.",
    "İtirazı kurula gönderdiniz, dosyanın ilk nüshası arşivde.",
    "Belgeyi teslim eden görevliye soruşturma açıldı, itiraz kapalı kaldı.",
  ],
  kongre_teskilat: [
    "İki ekip doğrulanmış tek listeyi geçici yönetime devretti.",
    "Eksik irtibat listesi olan ilçeler saha programından çıktı.",
    "Geri çağrılmayan ekip kendi listesini teslim etmedi.",
  ],
};

export function kongreGecmisi(d: OyunDurumu) {
  const kararlar = [...d.gecmis.flatMap(a => a.kararlar), ...d.buAy.kararlar].reverse();
  const son = kararlar.find(k => Object.hasOwn(SONUCLAR, k.kart));
  const iz = son && SONUCLAR[son.kart]?.[son.secenek];
  if (!son || !iz) return null;
  return { baslik: son.baslik, iz, yayin: kararlar.find(k => k.kart === "kongre_kampanya")?.secenek };
}

export function kongreMunazara(d: OyunDurumu) {
  const dosya = kongreGecmisi(d);
  if (!dosya) return null;
  const acik = dosya.yayin === 0;
  return {
    soru: `“${dosya.baslik}” dosyasında 35 ismin oy hakkı kaydı bulunamadı. ${dosya.iz} ${acik ? "Yayımladığınız tutanak stüdyoda." : "İmzalı kongre nüshası stüdyoda."} Bunun hesabını nasıl veriyorsunuz?`,
    cevaplar: [
      { metin: "Kongre kararını ve sonraki sonucu kayıttan anlat", etki: acik ? 0.55 : 0.35,
        haber: acik ? "Açıklama, yayımlanan tutanakla örtüştü." : "Açıklama stüdyodaki imzalı nüshayla örtüştü." },
      { metin: "Kongre sorusunu geç, seçim programına dön", etki: -0.15,
        haber: "Sunucu soruyu tekrarladı. Seçim programı anlatıldı, kongre sorusu açık kaldı." },
      { metin: "Oy hakkı kaydı eksik hiçbir isim yoktu de", etki: acik ? -0.85 : -0.65,
        haber: "Sunucu kaydı eksik 35 ismi gösteren belgeyi ekrana verdi. Açıklama sicile işlendi." },
    ],
  };
}
