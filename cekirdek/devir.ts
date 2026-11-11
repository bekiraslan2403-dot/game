import type { OyunDurumu } from "./durum.ts";
import type { EylemSonucu } from "./karar.ts";
import { kongreGecmisi } from "./kongre.ts";

export const DEVIR_YOLLARI = ["acik", "kapali", "imzasiz"] as const;
export type DevirYolu = (typeof DEVIR_YOLLARI)[number];

export const DEVIR_SECENEKLERI = {
  acik: {
    baslik: "İmzalı dökümü yayımla",
    bedel: "Kişisel ayrıntılar ayıklanır. Hazır ve bekleyen dosyalar kamuya açıklanır.",
    belge: "Kamuya açık teslim tutanağı",
    durum: "Kurum arşivi imzalı tutanağı aldı. Dosya dökümünün kişisel bilgi içermeyen nüshası kamuya açıldı.",
  },
  kapali: {
    baslik: "Kurum arşivine kapalı tutanakla teslim et",
    bedel: "Kurumlar hangi işin beklediğini görür. Kamuya bu teslimin yalnız alındı bilgisi açıklanır.",
    belge: "Kapalı teslim alındısı",
    durum: "Kurum arşivi dosyaların tamamını içeren imzalı teslim tutanağını aldı. Kamuya alındı bilgisi verildi.",
  },
  imzasiz: {
    baslik: "Ortak teslim tutanağı imzalamadan ayrıl",
    bedel: "Kurumlar eldeki kayıtlarla işe başlar. Dosyaların birlikte teslim edildiğini gösteren imza oluşmaz.",
    belge: "İmzasız kapanış kaydı",
    durum: "Ortak teslim tutanağı imzalanmadı. Kurumların mevcut kayıtları kendi arşivlerinde kaldı.",
  },
} as const;

export function devirSec(d: OyunDurumu, yol: DevirYolu): EylemSonucu {
  const bitis = d.bitis;
  if (!bitis || (bitis.tur !== "yeniden_secilme" && bitis.tur !== "yenilgi") || bitis.devir !== null || !DEVIR_YOLLARI.includes(yol)) {
    return { ok: false, neden: "Devir dosyası karar beklemiyor." };
  }
  bitis.devir = yol;
  return { ok: true, haber: DEVIR_SECENEKLERI[yol].durum };
}

export function devirDosyalari(d: OyunDurumu) {
  const inceleme = d.inceleme;
  const santiye = d.santiye;
  const sozler = d.ekonomi.sozler;
  const acikSoz = sozler.filter(s => s.durum === "bekliyor").length;
  const kirikSoz = sozler.filter(s => s.durum === "kirildi").length;
  const butce = d.meclis.butce;
  const kongre = kongreGecmisi(d);
  return [
    ...(inceleme ? [{
      id: "inceleme", ad: "Akköprü incelemesi", bekliyor: inceleme.asama !== "tamam",
      durum: inceleme.asama === "tamam" ? inceleme.sonuc!.baslik
        : inceleme.asama === "rapor" ? "Rapor teslim edildi. Rapor hakkındaki karar bekliyor."
        : "İnceleme görevlendirildi. Rapor bekliyor.",
    }] : []),
    ...(santiye ? [{
      id: "santiye", ad: "Şantiye ve işçi alacağı", bekliyor: santiye.asama !== "kabul" || santiye.ucret === "bekliyor",
      durum: `${santiye.asama === "kabul" ? "Bağımsız teknik kabul tamamlandı." : santiye.asama === "durduruldu" ? "Şantiye durduruldu. Teknik kabul kaydı yok." : "Bağımsız teknik kabul bekliyor."} ${santiye.ucret === "odendi" ? "Doğrulanan ücret ödendi." : "İşçi alacağı bekliyor."}`,
    }] : []),
    ...(butce.gecici || butce.plan ? [{
      id: "butce", ad: "Yıllık bütçe", bekliyor: butce.gecici || butce.plan?.uygulamaAy == null,
      durum: butce.gecici ? "Geçici bütçe yürürlükte. Yeni paket bekliyor."
        : butce.plan?.uygulamaAy != null ? "Kabul edilen ödenek Hazineye işlendi."
        : butce.plan?.kabulAy != null ? "Paket kabul edildi. Yürürlük bekliyor."
        : "Yıllık bütçe taslağı tamamlanmış bir ödeme oluşturmuyor.",
    }] : []),
    ...(sozler.length ? [{
      id: "sozler", ad: "Hazine taahhütleri", bekliyor: acikSoz > 0,
      durum: `${sozler.length - acikSoz - kirikSoz} tutuldu · ${acikSoz} bekliyor · ${kirikSoz} tutulmadı.`,
    }] : []),
    ...(kongre ? [{ id: "kongre", ad: kongre.baslik, bekliyor: false, durum: kongre.iz }] : []),
    ...(d.yonetim.secim.gece?.tamam ? [{ id: "secim", ad: "Kesin seçim tutanağı", bekliyor: false,
      durum: `${d.yonetim.secim.gece.tur}. tur sayımı arşivde.`,
    }] : []),
  ];
}

export function devirYankisi(d: OyunDurumu): string | null {
  const yol = d.bitis?.devir;
  if (yol === "acik") return "Beş yıl sonra araştırmacılar, yayımlanan dökümü kullanarak tamamlanan işlerle o gün bekleyenleri ayrı ayrı izledi.";
  if (yol === "kapali") return "Beş yıl sonra kurumlar imzalı tutanakla hangi dosyayı kimden aldığını gösterebiliyordu. Kamuya sunulan kayıt teslimin alındı bilgisiyle sınırlı kaldı.";
  if (yol === "imzasiz") return "Beş yıl sonra devir dosyası incelendiğinde belgeler farklı kurumlarda bulundu. Hangi evrakın kime teslim edildiğini birleştiren ortak imza yoktu.";
  return null;
}
