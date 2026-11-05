// Hazine masası: oyuncunun ekonomiye doğrudan dokunduğu araçlar ve söz defteri (Sistem 3 · Hazine masası).
// Her araç ayda bir kez kullanılabilir. Tahmin durumu değiştirmez; uygulama tahminle aynı etkiyi verir.

import type { OyunDurumu } from "./durum.ts";
import { gostergeEkle } from "./gostergeler.ts";
import { KALEM, GIDER_KALEMLERI, GELIR_KALEMLERI, etkiUygula, butceDegistir, type Soz } from "./ekonomi.ts";
import type { EylemSonucu, Tahmin } from "./karar.ts";

export type AracId = "kesinti" | "vergi" | "borclanma" | "mb_baski";

export interface AracTanimi {
  id: AracId;
  ad: string;
  aciklama: string;
  /** Araç bir bütçe kalemi seçilerek mi kullanılır */
  kalemler: string[] | null;
}

/** Bir kalemde kesinti ya da vergi artışının oranı */
export const ARAC_ORANI = 0.05;
/** Gider kalemi başlangıcının bu oranının altına inemez; vergi bu oranın üstüne çıkamaz */
const KESINTI_TABANI = 0.6;
const VERGI_TAVANI = 1.6;

export const ARACLAR: readonly AracTanimi[] = [
  { id: "kesinti", ad: "Harcama kesintisi", aciklama: "Bir gider kalemini yüzde 5 kıs. Açık küçülür; kesilen kalemin kesimi kızar.", kalemler: GIDER_KALEMLERI.map((k) => k.id).filter((k) => k !== "faiz") },
  { id: "vergi", ad: "Vergi artışı", aciklama: "Bir vergiyi yüzde 5 artır. Gelir artar; ilgili kesim tepki verir, bazı vergiler fiyatlara yansır.", kalemler: GELIR_KALEMLERI.map((k) => k.id).filter((k) => k !== "diger") },
  { id: "borclanma", ad: "Dış borçlanma", aciklama: "Uluslararası piyasadan tahvil ihraç et. Rezervler bugün güçlenir; faiz giderleri kalıcı olarak artar.", kalemler: null },
  { id: "mb_baski", ad: "Merkez Bankası'na baskı", aciklama: "Faizin indirilmesini iste. Kısa vadede büyüme gelir; kur ve enflasyon yükselir, güven düşer.", kalemler: null },
];
export const ARAC: Readonly<Record<string, AracTanimi>> = Object.fromEntries(ARACLAR.map((a) => [a.id, a]));

/** Kesilen gider kaleminin kesimlerdeki tepkisi */
const KESINTI_TEPKISI: Record<string, Record<string, number>> = {
  emekli: { "grup.emekli": -4 },
  personel: { "grup.memur": -4, "grup.kentli": -0.5 },
  saglik: { "grup.emekli": -1.5, "grup.isci": -1, "grup.kiraci": -0.5 },
  egitim: { "grup.genc": -1.5, "grup.kentli": -1.5 },
  savunma: { "grup.milliyetci": -2.5 },
  sosyal: { "grup.isci": -1.5, "grup.kiraci": -1.5, "grup.muhafazakar": -1 },
  yatirim: { "grup.esnaf": -1, "grup.is_dunyasi": -1.5 },
};

/** Artırılan verginin kesimlerdeki tepkisi ve fiyatlara etkisi */
const VERGI_TEPKISI: Record<string, Record<string, number>> = {
  gelir_vergisi: { "grup.kentli": -2, "grup.memur": -1.5, "grup.isci": -1 },
  kdv: { "grup.isci": -1.5, "grup.emekli": -1, "grup.kiraci": -1, enflasyon: 0.8 },
  kurumlar: { "grup.is_dunyasi": -4, guven: -3, buyume: -0.3 },
  akaryakit: { "grup.esnaf": -2.5, "grup.isci": -1, enflasyon: 0.5 },
};

interface AracEtkisi {
  /** Bütçe açığına etki ve hangi kalemden */
  butce: { kalem: string; acik: number } | null;
  /** Göstergelere etkiler (etkiUygula kurallarıyla) */
  etki: Record<string, number>;
  /** Faiz yüküne kalıcı ekleme (% GSYH; aylar içinde faiz ödemelerine yansır) */
  ekFaiz: number;
  mbBaski: number;
  sicil: string | null;
}

export type AracDenetimi = { ok: true; etki: AracEtkisi } | { ok: false; neden: string };

function etkiHesapla(d: OyunDurumu, arac: AracId, kalem?: string): AracDenetimi {
  const e = d.ekonomi;
  const t = ARAC[arac];
  if (!t) return { ok: false, neden: "Bilinmeyen araç." };
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  if (e.arac[arac] === d.ay) return { ok: false, neden: "Bu araç bu ay kullanıldı." };
  if (t.kalemler && (!kalem || !t.kalemler.includes(kalem))) return { ok: false, neden: "Bir kalem seçin." };

  switch (arac) {
    case "kesinti": {
      const k = kalem!;
      const simdi = e.gider[k] ?? 0;
      const kesilen = simdi * ARAC_ORANI;
      if (simdi - kesilen < (KALEM[k]?.baslangic ?? 0) * KESINTI_TABANI) return { ok: false, neden: `${KALEM[k]?.ad} daha fazla kısılamaz.` };
      return { ok: true, etki: { butce: { kalem: k, acik: -kesilen }, etki: { ...KESINTI_TEPKISI[k] }, ekFaiz: 0, mbBaski: 0, sicil: null } };
    }
    case "vergi": {
      const k = kalem!;
      const simdi = e.gelir[k] ?? 0;
      const artis = simdi * ARAC_ORANI;
      if (simdi + artis > (KALEM[k]?.baslangic ?? 0) * VERGI_TAVANI) return { ok: false, neden: `${KALEM[k]?.ad} daha fazla artırılamaz.` };
      return { ok: true, etki: { butce: { kalem: k, acik: -artis }, etki: { ...VERGI_TEPKISI[k] }, ekFaiz: 0, mbBaski: 0, sicil: null } };
    }
    case "borclanma": {
      const etki: Record<string, number> = { rezerv: 12 };
      // Açık büyükken borçlanmak kredi notunu tehlikeye atar
      if ((d.gostergeler.butce_acigi ?? 0) > 4) etki.guven = -3;
      return { ok: true, etki: { butce: null, etki, ekFaiz: 0.12, mbBaski: 0, sicil: null } };
    }
    case "mb_baski": {
      const kur = d.gostergeler.kur ?? 50;
      const yakin = d.sicil.some((s) => s.tur === "baski" && s.kaynak === MB_SICIL && d.ay - s.ay < 6);
      return {
        ok: true,
        etki: { butce: null, etki: { faiz: -2, kur: kur * 0.03, guven: -5, enflasyon: 0.8, buyume: 0.4 }, ekFaiz: 0, mbBaski: Math.min(2, 8 - d.ekonomi.mbBaski), sicil: yakin ? null : MB_SICIL },
      };
    }
  }
}

const MB_SICIL = "Merkez Bankası'na faiz baskısı";

/** Aracın kullanılıp kullanılamayacağı; kullanılamıyorsa nedeni. */
export function aracDenetle(d: OyunDurumu, arac: AracId, kalem?: string): AracDenetimi {
  return etkiHesapla(d, arac, kalem);
}

/** Aracın danışman tahmini (durumu ve zarı değiştirmez). */
export function aracTahmini(d: OyunDurumu, arac: AracId, kalem?: string): Tahmin[] {
  const s = etkiHesapla(d, arac, kalem);
  if (!s.ok) return [];
  const t: Tahmin[] = [];
  if (s.etki.butce) t.push({ id: "butce_acigi", deger: s.etki.butce.acik });
  if (s.etki.ekFaiz) t.push({ id: "butce_acigi", deger: s.etki.ekFaiz, gecikmeli: true });
  for (const [id, v] of Object.entries(s.etki.etki)) t.push({ id, deger: v });
  if (arac === "kesinti" && kalem === "yatirim") t.push({ id: "buyume", deger: -(d.ekonomi.gider.yatirim ?? 0) * ARAC_ORANI * 1.5 });
  return t;
}

/** Aracı kullanır. Girdiyi değiştirir. */
export function aracKullan(d: OyunDurumu, arac: AracId, kalem?: string): EylemSonucu {
  const s = etkiHesapla(d, arac, kalem);
  if (!s.ok) return s;
  const e = d.ekonomi;
  const x = s.etki;
  if (x.butce) butceDegistir(d, x.butce.kalem, x.butce.acik);
  for (const [id, v] of Object.entries(x.etki)) etkiUygula(d, id, v, "sosyal");
  e.ekFaizYuku += x.ekFaiz;
  e.mbBaski += x.mbBaski;
  if (x.sicil) {
    d.sayac += 1;
    d.sicil.push({ id: `sicil#${d.sayac}`, tur: "baski", kaynak: x.sicil, ay: d.ay, ifsaOldu: false });
  }
  e.arac[arac] = d.ay;
  const haber = aracHaberi(arac, kalem);
  d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "ekonomi" });
  if (d.haberler.length > 120) d.haberler.length = 120;
  d.buAy.haberler.push(haber);
  return { ok: true, haber };
}

function aracHaberi(arac: AracId, kalem?: string): string {
  const ad = (kalem && KALEM[kalem]?.ad.toLocaleLowerCase("tr")) ?? "";
  switch (arac) {
    case "kesinti": return `Hazine, ${ad} kaleminde yüzde 5 kesintiye gitti.`;
    case "vergi": return `${KALEM[kalem ?? ""]?.ad ?? "Vergi"} oranları artırıldı; Hazine ek gelir bekliyor.`;
    case "borclanma": return "Hazine uluslararası piyasada tahvil ihraç etti; rezervler güçlendi.";
    case "mb_baski": return "Merkez Bankası beklenmedik biçimde faizi 2 puan indirdi; dolar yükseldi.";
  }
}

// ---------------------------------------------------------------- Söz defteri

export interface SozTanimi {
  metin: string;
  kalem: string;
  maliyet: number;
  vade: number;
  grup?: string | undefined;
  asgari_artis?: number | undefined;
  tek_seferlik?: boolean | undefined;
}

/** Yeni bir söz kaydeder (kart seçeneği, miting, kulis, halk hattı). */
export function sozVer(d: OyunDurumu, s: SozTanimi): Soz {
  d.sayac += 1;
  const soz: Soz = {
    id: `soz#${d.sayac}`,
    metin: s.metin,
    kalem: s.kalem,
    maliyet: s.maliyet,
    verildi: d.ay,
    vade: d.ay + s.vade,
    grup: s.grup ?? null,
    asgariArtis: s.asgari_artis ?? 0,
    tekSeferlik: s.tek_seferlik ?? false,
    durum: "bekliyor",
  };
  d.ekonomi.sozler.push(soz);
  return soz;
}

/** Bir sözü yerine getirir: maliyeti bütçeye yazılır, söz verilen kesim memnun olur. */
export function sozTut(d: OyunDurumu, id: string): EylemSonucu {
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  const s = d.ekonomi.sozler.find((x) => x.id === id);
  if (!s) return { ok: false, neden: "Böyle bir söz yok." };
  if (s.durum !== "bekliyor") return { ok: false, neden: s.durum === "tutuldu" ? "Bu söz zaten tutuldu." : "Bu sözün vadesi geçti." };
  butceDegistir(d, s.kalem, s.maliyet);
  // Ekonomi bu ayın giderini işler; ay sonundaki uygulama dönüşü geçici
  // kalemi kapatır. Hazine'den de takip dosyasından da ödenirse aynı yol işler.
  if (s.tekSeferlik) d.yonetim.uygulamalar.push({ ay: d.ay, baslik: `${s.metin}: tek seferlik ödeme dönemi tamamlandı`, etki: { butce_acigi: -s.maliyet }, kalem: s.kalem, tekSeferlik: true });
  if (s.asgariArtis) d.ekonomi.hane.asgari *= 1 + s.asgariArtis / 100;
  if (s.grup) gostergeEkle(d.gostergeler, s.grup, 2);
  s.durum = "tutuldu";
  const haber = `Söz tutuldu: ${s.metin}.`;
  d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "ekonomi" });
  d.buAy.haberler.push(haber);
  return { ok: true, haber };
}

/** Ay sonunda vadesi dolan sözler kırılır: sicile "kırılan söz" düşer, söz verilen kesim kızar. */
export function sozleriDenetle(d: OyunDurumu): string[] {
  const olaylar: string[] = [];
  for (const s of d.ekonomi.sozler) {
    if (s.durum !== "bekliyor" || s.vade > d.ay) continue;
    s.durum = "kirildi";
    if (s.grup) gostergeEkle(d.gostergeler, s.grup, -4);
    d.sayac += 1;
    d.sicil.push({ id: `sicil#${d.sayac}`, tur: "kirilan_soz", kaynak: s.metin, ay: d.ay, ifsaOldu: false });
    olaylar.push(`Verilen söz tutulmadı: ${s.metin}.`);
  }
  return olaylar;
}
