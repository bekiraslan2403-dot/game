// Göstergeler: ekonomi rakamları (sayıyla), seçmen gruplarının desteği ve siyasi durumlar (sözlü).
// Kartlardaki "etki" anahtarları bu listedeki kimliklerdir; içerik derleyici bilinmeyen anahtarı reddeder.
// Başlangıç değerleri oyun varsayımıdır (Tasarım belgesi, Sistem 3 ve 4).

export type GostergeAlani = "ekonomi" | "secmen" | "siyaset" | "toplum";
export type IyiYon = "yuksek" | "dusuk" | null;

export interface GostergeTanimi {
  id: string;
  ad: string;
  alan: GostergeAlani;
  /** Ekranda sayıyla mı (ekonomi rakamları) yoksa sözlü mü görünür */
  gorunum: "sayi" | "sozlu";
  birim: string;
  baslangic: number;
  min: number;
  max: number;
  ondalik: number;
  iyi: IyiYon;
  /** Seçmen grupları için nüfus payı (%) */
  nufus?: number;
  /** Seçmen grubunun en çok istediği */
  istek?: string;
}

const ekonomi: GostergeTanimi[] = [
  { id: "enflasyon", ad: "Enflasyon", alan: "ekonomi", gorunum: "sayi", birim: "%", baslangic: 29, min: 0, max: 150, ondalik: 1, iyi: "dusuk" },
  { id: "buyume", ad: "Büyüme", alan: "ekonomi", gorunum: "sayi", birim: "%", baslangic: 2.5, min: -12, max: 12, ondalik: 1, iyi: "yuksek" },
  { id: "issizlik", ad: "İşsizlik", alan: "ekonomi", gorunum: "sayi", birim: "%", baslangic: 8, min: 3, max: 30, ondalik: 1, iyi: "dusuk" },
  { id: "butce_acigi", ad: "Bütçe açığı", alan: "ekonomi", gorunum: "sayi", birim: "% GSYH", baslangic: 3.5, min: -3, max: 15, ondalik: 1, iyi: "dusuk" },
  { id: "kur", ad: "Dolar kuru", alan: "ekonomi", gorunum: "sayi", birim: "TL", baslangic: 50, min: 10, max: 500, ondalik: 2, iyi: "dusuk" },
  { id: "faiz", ad: "Politika faizi", alan: "ekonomi", gorunum: "sayi", birim: "%", baslangic: 35, min: 0, max: 100, ondalik: 1, iyi: null },
  { id: "guven", ad: "Yatırımcı güveni", alan: "ekonomi", gorunum: "sozlu", birim: "", baslangic: 50, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
  { id: "rezerv", ad: "Rezerv durumu", alan: "ekonomi", gorunum: "sozlu", birim: "", baslangic: 65, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
];

// Gruplar: ad, nüfus payı, başlangıç desteği (memnun 58, kararsız 48, kırgın 40)
const GRUPLAR: [string, string, number, number, string][] = [
  ["muhafazakar", "Muhafazakârlar", 34, 58, "Aile, din, istikrar"],
  ["laik", "Laikler", 26, 40, "Yaşam tarzı, yargı bağımsızlığı"],
  ["milliyetci", "Milliyetçiler", 18, 58, "Güvenlik, dış politikada sertlik"],
  ["kalan", "Kalan azınlığı", 12, 40, "Anadil, barış, yerel yönetim"],
  ["emekli", "Emekliler", 16, 48, "Aylık artışı, ilaç, ikramiye"],
  ["isci", "İşçiler ve asgari ücretliler", 28, 48, "Ücret, iş güvencesi"],
  ["memur", "Memurlar", 7, 58, "Maaş, kadro"],
  ["esnaf", "Esnaf ve çiftçiler", 14, 48, "Kredi, destek, vergi"],
  ["is_dunyasi", "İş dünyası", 3, 48, "İstikrar, düşük faiz, hukuk"],
  ["genc", "Gençler", 20, 40, "İş, özgürlük, gelecek"],
  ["kentli", "Kentli orta sınıf", 22, 40, "Enflasyon, eğitim, hukuk"],
  ["kiraci", "Kiracılar", 27, 40, "Kira artışı sınırı, konut"],
];

const secmen: GostergeTanimi[] = GRUPLAR.map(([id, ad, nufus, baslangic, istek]) => ({
  id: `grup.${id}`, ad, alan: "secmen", gorunum: "sozlu", birim: "", baslangic, min: 2, max: 98, ondalik: 1, iyi: "yuksek", nufus, istek,
}));

const siyaset: GostergeTanimi[] = [
  { id: "kutuplasma", ad: "Kutuplaşma", alan: "siyaset", gorunum: "sozlu", birim: "", baslangic: 45, min: 0, max: 100, ondalik: 0, iyi: "dusuk" },
  { id: "rakip", ad: "Rakip adayın gücü", alan: "siyaset", gorunum: "sozlu", birim: "", baslangic: 50, min: 0, max: 100, ondalik: 0, iyi: "dusuk" },
  { id: "parti_ici", ad: "Parti içi huzursuzluk", alan: "siyaset", gorunum: "sozlu", birim: "", baslangic: 30, min: 0, max: 100, ondalik: 0, iyi: "dusuk" },
  { id: "basin", ad: "Basın özgürlüğü", alan: "siyaset", gorunum: "sozlu", birim: "", baslangic: 45, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
  { id: "itibar", ad: "Uluslararası itibar", alan: "siyaset", gorunum: "sozlu", birim: "", baslangic: 50, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
];

// Toplum göstergeleri (Sistem 4 ve politika dosyası): sözlü görünür, 0–100
const toplum: GostergeTanimi[] = [
  { id: "huzur", ad: "Sosyal huzur", alan: "toplum", gorunum: "sozlu", birim: "", baslangic: 55, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
  { id: "guvenlik", ad: "Güvenlik", alan: "toplum", gorunum: "sozlu", birim: "", baslangic: 60, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
  { id: "yargi", ad: "Yargı bağımsızlığı", alan: "toplum", gorunum: "sozlu", birim: "", baslangic: 45, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
  { id: "kamu_hizmet", ad: "Kamu hizmetleri", alan: "toplum", gorunum: "sozlu", birim: "", baslangic: 55, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
  { id: "konut", ad: "Konuta erişim", alan: "toplum", gorunum: "sozlu", birim: "", baslangic: 35, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
  { id: "deprem", ad: "Deprem hazırlığı", alan: "toplum", gorunum: "sozlu", birim: "", baslangic: 40, min: 0, max: 100, ondalik: 0, iyi: "yuksek" },
];

export const GOSTERGELER: readonly GostergeTanimi[] = [...ekonomi, ...secmen, ...siyaset, ...toplum];
export const GOSTERGE: Readonly<Record<string, GostergeTanimi>> = Object.fromEntries(GOSTERGELER.map((g) => [g.id, g]));
export const GRUP_KIMLIKLERI: readonly string[] = secmen.map((g) => g.id);

export function gostergeBaslangic(): Record<string, number> {
  return Object.fromEntries(GOSTERGELER.map((g) => [g.id, g.baslangic]));
}

/** Göstergeyi sınırları içinde değiştirir; bilinmeyen kimlik hata fırlatır. */
export function gostergeEkle(gostergeler: Record<string, number>, id: string, fark: number): void {
  const t = GOSTERGE[id];
  if (!t) throw new Error(`Bilinmeyen gösterge: ${id}`);
  const once = gostergeler[id] ?? t.baslangic;
  gostergeler[id] = Math.min(t.max, Math.max(t.min, once + fark));
}

/** Grup desteği için sözlü tutum. */
export function grupTutumu(destek: number): string {
  if (destek < 30) return "öfkeli";
  if (destek < 43) return "kırgın";
  if (destek < 53) return "kararsız";
  if (destek < 64) return "memnun";
  return "coşkulu";
}

/** 0–100 aralığındaki sözlü göstergeler için genel etiket. */
export function duzeySozu(deger: number): string {
  if (deger < 20) return "çok zayıf";
  if (deger < 40) return "zayıf";
  if (deger < 60) return "orta";
  if (deger < 80) return "güçlü";
  return "çok güçlü";
}

/** Rezerv durumu için sözlü etiket (Sistem 3: "rahat", "sıkışık", "tehlikede"). */
export function rezervSozu(deger: number): string {
  if (deger >= 55) return "rahat";
  if (deger >= 30) return "sıkışık";
  return "tehlikede";
}

/** Bir göstergenin değerini ekranda gösterilecek biçimde yazar. */
export function gostergeYaz(id: string, deger: number): string {
  const t = GOSTERGE[id];
  if (!t) return String(deger);
  if (t.alan === "secmen") return grupTutumu(deger);
  if (id === "rezerv") return rezervSozu(deger);
  if (t.gorunum === "sozlu") return duzeySozu(deger);
  const sayi = deger.toLocaleString("tr-TR", { minimumFractionDigits: t.ondalik, maximumFractionDigits: t.ondalik });
  return t.birim === "%" ? `%${sayi}` : t.birim === "TL" ? `${sayi} TL` : `%${sayi} ${t.birim.replace("% ", "")}`.trim();
}
