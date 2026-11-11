import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi } from "./icerik.ts";

export const YURTTAS_YOLLARI = ["acik", "yazili", "klip"] as const;
export type YurttasYolu = (typeof YURTTAS_YOLLARI)[number];

export const YURTTAS_SECENEKLERI = {
  acik: {
    ad: "Açık hesap toplantısı düzenle",
    not: "İyi ve kötü örnekleri birlikte ele al. Bir yurttaş yayında yanıtını sorgulayabilir.",
    gun: 2, kasa: 10,
  },
  yazili: {
    ad: "İsimleri ayıklayıp yazılı yanıt ver",
    not: "Yurttaşları kameraya çıkarmadan sorunları yazılı olarak kabul et. Daha az kişiye ulaşır.",
    gun: 1, kasa: 6,
  },
  klip: {
    ad: "Yalnız olumlu örneklerden bir klip hazırla",
    not: "Klip dışında kalan güçlükler gündeme gelirse karşı açıklama kampanyaya zarar verir.",
    gun: 1, kasa: 8,
  },
} as const;

export function yurttasIzleri(d: OyunDurumu, I: IcerikPaketi) {
  return I.hayatlar.map(h => {
    const hayat = d.toplum.hayatlar[h.id];
    return { kim: h.ad, son: hayat?.son[0], ayrildi: hayat?.ayrildi ?? false };
  });
}

export function yurttasSayilari(d: OyunDurumu, I: IcerikPaketi) {
  const guncel = yurttasIzleri(d, I).flatMap(({ kim, son }) =>
    son && son.ay >= d.ay - 3 && son.ay < d.ay ? [{ kim, ...son }] : [],
  );
  return {
    olumlu: guncel.filter(iz => iz.ton > 0).length,
    olumsuz: guncel.filter(iz => iz.ton < 0).length,
    toplam: guncel.length,
    kayitlar: guncel,
  };
}

export function yurttasYaniti(yol: YurttasYolu, sayilar: ReturnType<typeof yurttasSayilari>) {
  if (yol === "acik") return {
    etki: 0.45,
    tepki: sayilar.olumsuz > 0
      ? "Bir katılımcı açık yayında kendi dosyasını sordu. Bekleyen işler yayının tutanağına girdi. Yerel basın hem soruyu hem yanıtı yayımladı."
      : "Yerel basın, iyi haberlerle birlikte mevcut hizmetin nerede ve kimlere ulaştığını gösteren yanıtı yayımladı.",
  };
  if (yol === "yazili") return {
    etki: 0.2,
    tepki: "Yazılı yanıt mahalle derneklerine ulaştı. Paylaşılan nüshada kişisel ayrıntılar ayıklandı. Yanıt yerel haberlerde kısa bir yer buldu.",
  };
  return sayilar.olumsuz > 0 ? {
    etki: -0.6,
    tepki: "Klip yayına girdi. Bir mahalle derneği görüntülerin dışında kalan güçlükleri kendi açıklamasında anlattı. Akşam haberleri iki yayını yan yana verdi.",
  } : {
    etki: 0.6,
    tepki: "Olumlu örneklerin yer aldığı klip yerel bültene taşındı. Kampanya ekibinin mesajı kısa sürede yayıldı.",
  };
}

export function secimGecesiYurttaslar(d: OyunDurumu, I: IcerikPaketi) {
  return yurttasIzleri(d, I).map(({ kim, son, ayrildi }) => {
    const giris = son ? `${son.ay}. ayın son kişisel kaydı · ${son.metin}` : "Bu dönemden kişisel not ulaşmadı.";
    const secimNotu = ayrildi
      ? "Ülkeden ayrıldıktan sonra kendisinden seçim gecesi için yeni bir açıklama gelmedi."
      : "Seçim gecesi için açık oy beyanı yok.";
    return { kim, metin: `${giris} ${secimNotu}` };
  });
}
