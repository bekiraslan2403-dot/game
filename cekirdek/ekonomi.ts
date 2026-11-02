// Ekonomi modeli (Tasarım belgesi · Sistem 3 · Ekonomi ve Hazine).
// Oyuncu ekonomiye iki kapıdan dokunur: harcama ve vergi ile Merkez Bankası'na baskı. Geri kalan her şey
// bu kapılardan yayılan zincirlerle, her ay bir hedef değere doğru yavaşça değişir.
// Bütün katsayılar oyun varsayımıdır; başlangıçta hiçbir karar verilmezse ekonomi yerinde sayar.

import type { OyunDurumu } from "./durum.ts";
import { GOSTERGE, gostergeEkle } from "./gostergeler.ts";
export { rezervSozu } from "./gostergeler.ts";
import { zarNormal, zarTam } from "./zar.ts";

// ---------------------------------------------------------------- Bütçe kalemleri

export interface KalemTanimi {
  id: string;
  ad: string;
  /** Başlangıç büyüklüğü, millî gelirin (GSYH) yüzdesi olarak */
  baslangic: number;
}

export const GIDER_KALEMLERI: readonly KalemTanimi[] = [
  { id: "emekli", ad: "Emekli aylıkları", baslangic: 5.0 },
  { id: "personel", ad: "Kamu personeli", baslangic: 5.5 },
  { id: "faiz", ad: "Faiz ödemeleri", baslangic: 2.8 },
  { id: "saglik", ad: "Sağlık", baslangic: 2.6 },
  { id: "egitim", ad: "Eğitim", baslangic: 3.0 },
  { id: "savunma", ad: "Savunma", baslangic: 1.8 },
  { id: "sosyal", ad: "Sosyal yardım", baslangic: 1.6 },
  { id: "yatirim", ad: "Yatırım", baslangic: 2.9 },
];

export const GELIR_KALEMLERI: readonly KalemTanimi[] = [
  { id: "gelir_vergisi", ad: "Gelir vergisi", baslangic: 5.2 },
  { id: "kdv", ad: "KDV ve ÖTV", baslangic: 9.6 },
  { id: "kurumlar", ad: "Kurumlar vergisi", baslangic: 2.6 },
  { id: "akaryakit", ad: "Akaryakıt ve tütün vergisi", baslangic: 2.4 },
  { id: "diger", ad: "Özelleştirme ve diğer", baslangic: 1.9 },
];

export const BUTCE_KALEMLERI = [...GIDER_KALEMLERI.map((k) => k.id), ...GELIR_KALEMLERI.map((k) => k.id)] as [string, ...string[]];
export const KALEM: Readonly<Record<string, KalemTanimi & { tur: "gider" | "gelir" }>> = Object.fromEntries([
  ...GIDER_KALEMLERI.map((k) => [k.id, { ...k, tur: "gider" as const }]),
  ...GELIR_KALEMLERI.map((k) => [k.id, { ...k, tur: "gelir" as const }]),
]);

/** Kartta kalem belirtilmemişse bütçe etkisinin düştüğü gider kalemi (kartın kategorisine göre). */
export const KATEGORI_KALEMI: Readonly<Record<string, string>> = {
  ekonomi: "sosyal", yerel: "yatirim", toplum: "sosyal", guvenlik: "savunma", dis: "savunma", hukuk: "personel",
  medya: "personel", parti: "sosyal", aile: "sosyal", afet: "yatirim", saglik: "saglik", egitim: "egitim",
};

// ---------------------------------------------------------------- Hissedilen ekonomi

export interface UrunTanimi {
  id: string;
  ad: string;
  birim: string;
  /** Kasım 2026 fiyatı, TL (oyun varsayımı) */
  fiyat: number;
  /** Asgari ücretli dört kişilik bir ailenin aylık tüketimi */
  miktar: number;
  /** Ürünün fiyatının genel enflasyona duyarlılığı */
  enflasyon: number;
  /** Kurdaki olağandışı artışın fiyata geçme oranı */
  kur: number;
}

/** Market sepeti: kilitli karar, 6 ürün. */
export const SEPET: readonly UrunTanimi[] = [
  { id: "ekmek", ad: "Ekmek", birim: "adet", fiyat: 15, miktar: 60, enflasyon: 1.0, kur: 0.15 },
  { id: "cay", ad: "Çay", birim: "kg", fiyat: 420, miktar: 1.5, enflasyon: 0.95, kur: 0.1 },
  { id: "sut", ad: "Süt", birim: "litre", fiyat: 45, miktar: 20, enflasyon: 1.05, kur: 0.1 },
  { id: "peynir", ad: "Beyaz peynir", birim: "kg", fiyat: 380, miktar: 3, enflasyon: 1.1, kur: 0.1 },
  { id: "yag", ad: "Ayçiçek yağı", birim: "litre", fiyat: 95, miktar: 4, enflasyon: 0.8, kur: 0.5 },
  { id: "kiyma", ad: "Dana kıyma", birim: "kg", fiyat: 720, miktar: 3, enflasyon: 1.2, kur: 0.2 },
];

/** Sepetteki altı ürün mutfak giderinin bir kısmıdır; geri kalan gıda bu çarpanla eklenir. */
export const MUTFAK_CARPANI = 1.8;

// ---------------------------------------------------------------- Durum

export type IstatistikBaskani = "liyakatli" | "sadik";
export type KrizId = "kur_soku";

export interface Kriz {
  id: KrizId;
  /** Krizin başladığı oyun ayı */
  basladi: number;
}

export interface Soz {
  id: string;
  metin: string;
  /** Söz tutulunca maliyetin yazıldığı bütçe kalemi */
  kalem: string;
  /** Yıllık maliyet, millî gelirin yüzdesi */
  maliyet: number;
  verildi: number;
  /** Bu ayın sonuna kadar tutulmazsa söz kırılır */
  vade: number;
  grup: string | null;
  asgariArtis: number;
  durum: "bekliyor" | "tutuldu" | "kirildi";
}

export interface EkonomiDurumu {
  /** Ekonominin gerçek yıllık enflasyonu; ekranda yalnız resmî oran (göstergelerdeki "enflasyon") görünür */
  gercekEnflasyon: number;
  /** Kararlardan gelen ve her ay sönümlenen hedef kayması */
  katki: Record<string, number>;
  /** Gecikmeli kanallar: harcama ve yatırım (etkisi 2–4 ayda), reel faiz (3–6 ayda) */
  harcamaEtkisi: number;
  yatirimEtkisi: number;
  faizEtkisi: number;
  /** Kurun yıllıklandırılmış, düzleştirilmiş değer kaybı (%) */
  kurHizi: number;
  /** Dış dünya */
  petrol: number;
  kuresel: number;
  /** Merkez Bankası üzerindeki baskı (her ay sönümlenir) */
  mbBaski: number;
  istatistik: IstatistikBaskani;
  /** Resmî oranın gerçeğin kaç puan altında açıklandığı */
  makyaj: number;
  /** Nominal millî gelir, yıllık, trilyon TL */
  gsyh: number;
  gider: Record<string, number>;
  gelir: Record<string, number>;
  /** Borçlanmadan ve birikmiş açıklardan gelen kalıcı faiz yükü (% GSYH) */
  ekFaizYuku: number;
  sepet: Record<string, number>;
  /** Son 13 ayın sepet fiyatları; ilk öğe 12 ay öncesidir */
  sepetGecmis: Record<string, number>[];
  hane: { asgari: number; kira: number; fatura: number };
  sozler: Soz[];
  krizler: Kriz[];
  /** Araç kimliği → en son kullanıldığı oyun ayı */
  arac: Record<string, number>;
}

export const BASLANGIC_GSYH = 64;
export const DENGE = { enflasyon: 29, buyume: 2.5, issizlik: 8, acik: 3.5, faiz: 35, guven: 50, rezerv: 65, petrol: 80, kuresel: 4.5, reelFaiz: 6 } as const;
/** Başlangıçtaki yıllık kur değer kaybı: 0,9 × (29 − 3) */
const DENGE_KUR_HIZI = 0.9 * (DENGE.enflasyon - 3);
export const KATKI_SONUM = 0.92;
export const EN_COK_KRIZ = 2;

const KATKILI = ["enflasyon", "buyume", "issizlik", "guven", "rezerv"] as const;

function sepetBaslangic(): { sepet: Record<string, number>; gecmis: Record<string, number>[] } {
  const sepet = Object.fromEntries(SEPET.map((u) => [u.id, u.fiyat]));
  const gecmis: Record<string, number>[] = [];
  for (let k = 12; k >= 0; k--) {
    gecmis.push(Object.fromEntries(SEPET.map((u) => [u.id, u.fiyat / Math.pow(1 + (DENGE.enflasyon * u.enflasyon) / 100, k / 12)])));
  }
  return { sepet, gecmis };
}

export function ekonomiBaslangic(): EkonomiDurumu {
  const { sepet, gecmis } = sepetBaslangic();
  return {
    gercekEnflasyon: DENGE.enflasyon,
    katki: Object.fromEntries(KATKILI.map((k) => [k, 0])),
    harcamaEtkisi: 0,
    yatirimEtkisi: 0,
    faizEtkisi: 0,
    kurHizi: DENGE_KUR_HIZI,
    petrol: DENGE.petrol,
    kuresel: DENGE.kuresel,
    mbBaski: 0,
    istatistik: "liyakatli",
    makyaj: 0,
    gsyh: BASLANGIC_GSYH,
    gider: Object.fromEntries(GIDER_KALEMLERI.map((k) => [k.id, k.baslangic])),
    gelir: Object.fromEntries(GELIR_KALEMLERI.map((k) => [k.id, k.baslangic])),
    ekFaizYuku: 0,
    sepet,
    sepetGecmis: gecmis,
    hane: { asgari: 28000, kira: 13500, fatura: 3900 },
    sozler: [],
    krizler: [],
    arac: {},
  };
}

// ---------------------------------------------------------------- Yardımcılar

const sinirla = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Yıllık yüzde oranın bir aylık karşılığı (bileşik): %29 yıllık → aylık %2,14 */
export const aylikOran = (yillikYuzde: number) => Math.pow(1 + Math.max(-90, yillikYuzde) / 100, 1 / 12) - 1;
/** Bir aylık oranın yıllık yüzde karşılığı */
const yillikYuzde = (aylik: number) => (Math.pow(1 + aylik, 12) - 1) * 100;
const toplam = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
const g = (d: OyunDurumu, id: string) => d.gostergeler[id] ?? GOSTERGE[id]?.baslangic ?? 0;

export function toplamGider(d: OyunDurumu): number {
  return toplam(d.ekonomi.gider);
}
export function toplamGelir(d: OyunDurumu): number {
  return toplam(d.ekonomi.gelir);
}

/** Bütçe açığı göstergesini kalemlerden yeniden hesaplar. */
export function acikYenile(d: OyunDurumu): void {
  const t = GOSTERGE.butce_acigi!;
  d.gostergeler.butce_acigi = sinirla(toplamGider(d) - toplamGelir(d), t.min, t.max);
}

/** Bütçe açığını bir kalem üzerinden değiştirir: gider kalemi artar ya da gelir kalemi azalır. */
export function butceDegistir(d: OyunDurumu, kalem: string, acikFarki: number): void {
  const k = KALEM[kalem];
  if (!k) throw new Error(`Bilinmeyen bütçe kalemi: ${kalem}`);
  if (k.tur === "gider") d.ekonomi.gider[kalem] = Math.max(0, (d.ekonomi.gider[kalem] ?? 0) + acikFarki);
  else d.ekonomi.gelir[kalem] = Math.max(0, (d.ekonomi.gelir[kalem] ?? 0) - acikFarki);
  acikYenile(d);
}

/** % GSYH cinsinden bir büyüklüğün yıllık TL karşılığı (trilyon TL). */
export function trilyonTL(d: OyunDurumu, yuzde: number): number {
  return (d.ekonomi.gsyh * yuzde) / 100;
}

/** Göstergenin her ay hedefe doğru yavaş değişen türden olup olmadığı (kararın etkisi aylar içinde görülür). */
export function gecikmeliMi(id: string): boolean {
  return id === "enflasyon" || id === "buyume" || id === "issizlik";
}

/**
 * Bir karar ya da aracın bir göstergeye etkisini uygular.
 * - Enflasyon, büyüme, işsizlik: hedef kayar, gösterge aylar içinde ona yaklaşır.
 * - Güven ve rezerv: anında değişir, hedef de kayar (etki kalıcıya yakındır, yavaşça söner).
 * - Bütçe açığı: verilen kalem üzerinden bütçeye yazılır.
 * - Kur, faiz ve ekonomi dışı göstergeler: anında değişir.
 */
export function etkiUygula(d: OyunDurumu, id: string, deger: number, kalem: string): void {
  const e = d.ekonomi;
  if (id === "butce_acigi") return butceDegistir(d, kalem, deger);
  if (gecikmeliMi(id)) {
    e.katki[id] = (e.katki[id] ?? 0) + deger;
    return;
  }
  if (id === "guven" || id === "rezerv") e.katki[id] = (e.katki[id] ?? 0) + deger;
  gostergeEkle(d.gostergeler, id, deger);
}

// ---------------------------------------------------------------- Sözlü durumlar

/** Sepetin yıllık değişimi (%), aile tüketimiyle ağırlıklı: "hissedilen enflasyon". */
export function hissedilenEnflasyon(d: OyunDurumu): number {
  const e = d.ekonomi;
  const once = e.sepetGecmis[0];
  if (!once) return e.gercekEnflasyon;
  let bugun = 0, gecen = 0;
  for (const u of SEPET) {
    bugun += (e.sepet[u.id] ?? u.fiyat) * u.miktar;
    gecen += (once[u.id] ?? u.fiyat) * u.miktar;
  }
  return (bugun / gecen - 1) * 100;
}

/** Sepetin son bir aydaki değişimi (%). */
export function sepetAylik(d: OyunDurumu): number {
  const h = d.ekonomi.sepetGecmis;
  const son = h[h.length - 1], once = h[h.length - 2];
  if (!son || !once) return 0;
  let a = 0, b = 0;
  for (const u of SEPET) {
    a += (son[u.id] ?? u.fiyat) * u.miktar;
    b += (once[u.id] ?? u.fiyat) * u.miktar;
  }
  return (a / b - 1) * 100;
}

export interface HaneButcesi {
  gelir: number;
  kira: number;
  fatura: number;
  mutfak: number;
  kalan: number;
}

/** Asgari ücretli dört kişilik bir ailenin bu ayki bütçesi (TL). */
export function haneButcesi(d: OyunDurumu): HaneButcesi {
  const e = d.ekonomi;
  const mutfak = SEPET.reduce((t, u) => t + (e.sepet[u.id] ?? u.fiyat) * u.miktar, 0) * MUTFAK_CARPANI;
  const { asgari, kira, fatura } = e.hane;
  return { gelir: asgari, kira, fatura, mutfak, kalan: asgari - kira - fatura - mutfak };
}

/** Danışmanların uyarıları: kriz eşiğine yaklaşıldığında ve kriz sürerken. */
export function ekonomiUyarilari(d: OyunDurumu): string[] {
  const e = d.ekonomi;
  const u: string[] = [];
  if (e.krizler.some((k) => k.id === "kur_soku")) u.push("Kur şoku sürüyor: dolar her ay yükseliyor, rezervler eriyor. Yatırımcı güveni toparlanınca kriz kapanır.");
  else if (g(d, "guven") < 30 && g(d, "rezerv") < 65)
    u.push("Ekonomi danışmanı uyarıyor: yatırımcı güveni zayıf ve rezervler azalıyor; güven bir kademe daha düşerse kura saldırı başlayabilir.");
  return u;
}

// ---------------------------------------------------------------- Ay sonu

export interface AySonuSonucu {
  /** Ay sonunda olan ekonomik gelişmeler (haber metni) */
  olaylar: string[];
}

/** Ayın sonunda ekonomiyi bir ay ilerletir. Girdiyi değiştirir; zarı ilerletir. */
export function ekonomiAySonu(d: OyunDurumu, acilKartVar: (id: string) => boolean): AySonuSonucu {
  const e = d.ekonomi;
  const G = d.gostergeler;
  const olaylar: string[] = [];
  const kurSokuVar = () => e.krizler.some((k) => k.id === "kur_soku");

  // 1. Dış dünya: petrol ve küresel faiz her ay küçük oynar
  e.petrol = sinirla(e.petrol + 0.15 * (DENGE.petrol - e.petrol) + 3.5 * zarNormal(d.zar), 45, 140);
  e.kuresel = sinirla(e.kuresel + 0.1 * (DENGE.kuresel - e.kuresel) + 0.08 * zarNormal(d.zar), 2, 8);

  // 2. Gecikmeli kanallar
  const acik = g(d, "butce_acigi");
  e.harcamaEtkisi += 0.65 * (acik - DENGE.acik - e.harcamaEtkisi);
  e.yatirimEtkisi += 0.65 * ((e.gider.yatirim ?? 0) - 2.9 - e.yatirimEtkisi);
  e.faizEtkisi += 0.28 * (g(d, "faiz") - e.gercekEnflasyon - DENGE.reelFaiz - e.faizEtkisi);
  const H = e.harcamaEtkisi, Y = e.yatirimEtkisi, R = e.faizEtkisi;

  // 3. Kur: enflasyon farkı, reel faiz, güven ve küresel faiz kadar değer kaybeder
  const E0 = e.gercekEnflasyon;
  const yillik =
    0.9 * (E0 - 3) - 0.6 * (g(d, "faiz") - E0 - DENGE.reelFaiz) + 0.3 * (DENGE.guven - g(d, "guven")) + 2 * (e.kuresel - DENGE.kuresel) + (kurSokuVar() ? 20 : 0);
  const kurT = GOSTERGE.kur!;
  G.kur = sinirla(g(d, "kur") * (1 + sinirla(aylikOran(yillik) + 0.004 * zarNormal(d.zar), -0.03, 0.12)), kurT.min, kurT.max);
  // Ay içindeki kart etkileri de dahil, kurun bu ayki toplam değişimi
  const kurAylik = G.kur / (d.ayBasi.kur ?? G.kur) - 1;
  e.kurHizi += 0.4 * (yillikYuzde(kurAylik) - e.kurHizi);

  // 4. Gerçek enflasyon
  const k = e.katki;
  const Ehedef = DENGE.enflasyon + 1.1 * H - 0.7 * R + 0.3 * sinirla(e.kurHizi - DENGE_KUR_HIZI, -15, 60) + 0.05 * (e.petrol - DENGE.petrol) + (k.enflasyon ?? 0);
  e.gercekEnflasyon = sinirla(E0 + 0.3 * (Ehedef - E0), 0, 150);

  // 5. Büyüme ve işsizlik
  // Reel faizin ve harcamanın büyümeye etkisi sınırlıdır; yüksek enflasyon büyümeyi aşındırır
  const Bhedef =
    DENGE.buyume + sinirla(0.5 * H + 1.5 * Y, -3, 2.5) - sinirla(0.35 * R, -2.5, 4) + 0.05 * (g(d, "guven") - DENGE.guven) -
    0.012 * (e.petrol - DENGE.petrol) - 0.06 * Math.max(0, e.gercekEnflasyon - 40) + (k.buyume ?? 0) - (kurSokuVar() ? 3 : 0);
  gostergeEkle(G, "buyume", 0.45 * (Bhedef - g(d, "buyume")));
  const Uhedef = DENGE.issizlik - 0.4 * (g(d, "buyume") - DENGE.buyume) + (k.issizlik ?? 0);
  gostergeEkle(G, "issizlik", 0.25 * (Uhedef - g(d, "issizlik")));

  // 6. Resmî enflasyon: sadık bir kurum başkanı oranı 3–8 puan düşük açıklar
  if (e.istatistik === "sadik") e.makyaj += 0.5 * (sinirla(0.18 * e.gercekEnflasyon, 3, 8) - e.makyaj);
  else e.makyaj = 0;
  G.enflasyon = sinirla(e.gercekEnflasyon - e.makyaj, 0, 150);

  // 7. Yatırımcı güveni ve rezerv
  const Ghedef =
    DENGE.guven - 2.5 * (acik - DENGE.acik) - sinirla(0.3 * (e.gercekEnflasyon - DENGE.enflasyon), -6, 12) + sinirla(0.4 * R, -8, 6) - 1.2 * e.makyaj +
    0.25 * (g(d, "itibar") - 50) - 3 * (e.kuresel - DENGE.kuresel) - 1.5 * e.mbBaski + (k.guven ?? 0);
  gostergeEkle(G, "guven", 0.35 * (Ghedef - g(d, "guven")));
  const Zhedef = DENGE.rezerv + 0.6 * (g(d, "guven") - DENGE.guven) + (k.rezerv ?? 0) - (kurSokuVar() ? 25 : 0);
  gostergeEkle(G, "rezerv", 0.2 * (Zhedef - g(d, "rezerv")));

  // 8. Merkez Bankası faizi kendi belirler; baskı hedefini aşağı çeker
  const Er = g(d, "enflasyon");
  const Fhedef = Er + DENGE.reelFaiz + 0.5 * (Er - DENGE.enflasyon) - 1.5 * e.mbBaski * (0.6 + (d.yonetim.kurumlar.merkez_bankasi?.sadakat ?? 35) / 87.5);
  const adim = Math.round((0.25 * (Fhedef - g(d, "faiz"))) * 4) / 4;
  gostergeEkle(G, "faiz", adim);
  e.mbBaski *= 0.8;

  // 9. Bütçe: endeksli ödemeler resmî orana, millî gelir gerçek orana göre büyür; faiz yükü faize ve borca bağlı
  const reelB = g(d, "buyume");
  const endeks = (1 + aylikOran(Er + reelB)) / (1 + aylikOran(e.gercekEnflasyon + reelB));
  e.gider.emekli = (e.gider.emekli ?? 0) * endeks;
  e.gider.personel = (e.gider.personel ?? 0) * endeks;
  e.ekFaizYuku += Math.max(0, acik - DENGE.acik) * 0.01;
  const faizHedef = 2.8 + 0.07 * (g(d, "faiz") - DENGE.faiz) + e.ekFaizYuku;
  e.gider.faiz = Math.max(0.5, (e.gider.faiz ?? 0) + 0.15 * (faizHedef - (e.gider.faiz ?? 0)));
  const bSapma = (reelB - DENGE.buyume) / 12;
  e.gelir.kurumlar = (e.gelir.kurumlar ?? 0) * (1 + 0.03 * bSapma);
  e.gelir.gelir_vergisi = (e.gelir.gelir_vergisi ?? 0) * (1 + 0.01 * bSapma);
  e.gelir.kdv = (e.gelir.kdv ?? 0) * (1 + 0.01 * bSapma);
  acikYenile(d);
  e.gsyh *= 1 + aylikOran(e.gercekEnflasyon + reelB);

  // 10. Market sepeti ve hane: sokaktaki fiyatlar gerçek enflasyonla değişir
  const kurSapma = kurAylik - aylikOran(DENGE_KUR_HIZI);
  for (const u of SEPET) {
    const artis = aylikOran(e.gercekEnflasyon * u.enflasyon) + u.kur * kurSapma + 0.006 * zarNormal(d.zar);
    e.sepet[u.id] = (e.sepet[u.id] ?? u.fiyat) * (1 + Math.max(-0.03, artis));
  }
  e.sepetGecmis.push({ ...e.sepet });
  while (e.sepetGecmis.length > 13) e.sepetGecmis.shift();
  e.hane.kira *= 1 + aylikOran(e.gercekEnflasyon * 1.15);
  e.hane.fatura *= 1 + aylikOran(e.gercekEnflasyon * 0.9);

  // 11. Kararların katkısı söner
  for (const id of KATKILI) k[id] = (k[id] ?? 0) * KATKI_SONUM;

  // 12. Krizler: kapanış, sonra yeni kriz
  if (kurSokuVar()) {
    const kriz = e.krizler.find((x) => x.id === "kur_soku")!;
    if (kriz.basladi < d.ay && g(d, "guven") >= 30) {
      e.krizler = e.krizler.filter((x) => x !== kriz);
      olaylar.push("Kurdaki dalgalanma yatıştı; piyasalar sakinleşiyor.");
    }
  } else if (e.krizler.length + Object.entries(d.bayraklar).filter(([id,v])=>id.startsWith("kriz_")&&v).length < EN_COK_KRIZ && g(d, "guven") < 20 && g(d, "rezerv") < 55) {
    const sicrama = zarTam(d.zar, 6, 10);
    G.kur = sinirla(g(d, "kur") * (1 + sicrama / 100), kurT.min, kurT.max);
    e.krizler.push({ id: "kur_soku", basladi: d.ay });
    if (acilKartVar("kur_soku_1")) d.bekleyen.push({ kart: "kur_soku_1", ay: d.ay + 1, degisken: {}, agir: false });
    olaylar.push(`Dolar kuru bir gecede yüzde ${sicrama} sıçradı; döviz bürolarının önünde kuyruk var.`);
  }

  return { olaylar };
}
