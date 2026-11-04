// İçerik şeması: kartların, karakterlerin ve şehirlerin biçimi.
// İçerik derleyici YAML dosyalarını bu şemaya göre denetler; çekirdek yalnız denetlenmiş paketle çalışır.

import { z } from "zod";
import { trafikSemasi, sevkiyatSemasi, denizSemasi, acilisOlaySemasi } from "./acilis-durum.ts";
import type { SahaDosyasi } from "./saha-icerik.ts";
import type { MedyaIcerigi } from "./medya-icerik.ts";
import type { MeclisIcerigi } from "./meclis-icerik.ts";
import { BUTCE_KALEMLERI } from "./ekonomi.ts";

export const KATEGORILER = ["ekonomi", "yerel", "toplum", "guvenlik", "dis", "hukuk", "medya", "parti", "aile", "afet", "saglik", "egitim"] as const;
export const KART_TURLERI = ["ana", "masa", "zincir", "acil"] as const;
export const ASAMALAR = ["tohum", "gelisme", "doruk", "sonuc"] as const;
export const COZUCULER = ["rastgele_sehir", "muhalif_sehir", "iktidar_sehir", "baskent"] as const;
export const SICIL_TURLERI = ["usulsuzluk", "yalan", "kirilan_soz", "baski"] as const;

const kimlik = z.string().regex(/^[a-z0-9_]+$/, "yalnız küçük harf, rakam ve alt çizgi");
const bayrakDegeri = z.union([z.boolean(), z.number(), z.string()]);

export const kosulSemasi = z
  .object({
    ay_en_az: z.number().int().min(1).max(18).optional(),
    ay_en_cok: z.number().int().min(1).max(18).optional(),
    takvim_ayi: z.array(z.number().int().min(1).max(12)).optional(),
    bayrak: z.record(bayrakDegeri).optional(),
    bayrak_yok: z.array(z.string()).optional(),
    gosterge: z.record(z.object({ en_az: z.number().optional(), en_cok: z.number().optional() }).strict()).optional(),
    iliski: z.record(z.object({ en_az: z.number().min(0).max(100).optional(), en_cok: z.number().min(0).max(100).optional() }).strict()).optional(),
    /** Politika dosyasındaki kademe (0'dan başlar) */
    politika: z.record(z.object({ en_az: z.number().int().optional(), en_cok: z.number().int().optional() }).strict()).optional(),
  })
  .strict();

/** Seçeneğin ekonomiye özel sonuçları (Sistem 3). */
export const ekonomiSonucuSemasi = z
  .object({
    /** Bütçe açığı etkisinin yazılacağı kalem (kartın kalemini geçersiz kılar) */
    kalem: z.enum(BUTCE_KALEMLERI).optional(),
    /** Asgari ücrete yüzde artış (hane bütçesine yansır) */
    asgari_artis: z.number().min(0).max(100).optional(),
    /** Faturalara yüzde zam */
    fatura_artis: z.number().min(-50).max(100).optional(),
    /** İstatistik kurumu başkanı */
    istatistik: z.enum(["liyakatli", "sadik"]).optional(),
    /** Verilen söz: söz defterine yazılır */
    soz: z
      .object({
        metin: z.string().min(3),
        kalem: z.enum(BUTCE_KALEMLERI),
        maliyet: z.number().positive().max(3),
        vade: z.number().int().min(1).max(12),
        tek_seferlik: z.boolean().default(false),
        grup: z.string().optional(),
        asgari_artis: z.number().min(0).max(50).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const secenekSemasi = z
  .object({
    metin: z.string().min(3),
    etki: z.record(z.number()).default({}),
    kosul: kosulSemasi.optional(),
    kilitNedeni: z.string().optional(),
    icra: z.object({
      gun: z.number().int().min(0).max(2).default(0),
      imza: z.boolean().default(false),
      odeme: ekonomiSonucuSemasi.shape.soz.optional(),
      hizip: z.object({ eski: z.number().optional(), teknokrat: z.number().optional(), muhafazakar: z.number().optional() }).strict().optional(),
      maas: z.boolean().optional(),
    }).strict().optional(),
    bayrak: z.record(bayrakDegeri).optional(),
    sonraki: z.array(z.object({ kart: kimlik, gecikme: z.number().int().min(0).max(6).default(1), kosul: kosulSemasi.optional() }).strict()).default([]),
    tepkiler: z.array(z.object({ kim: kimlik, metin: z.string(), kosul: kosulSemasi.optional() }).strict()).optional(),
    sicil: z.object({ tur: z.enum(SICIL_TURLERI), kaynak: z.string().min(3) }).strict().optional(),
    haber: z.string().optional(),
    ekonomi: ekonomiSonucuSemasi.optional(),
    /** Görüşmede verilen talimat mevcut politika/Meclis sürecini kullanır. */
    politika: z.object({ id: kimlik, hedef: z.number().int().min(0), yon: z.enum(["artir", "azalt"]).default("artir") }).strict().optional(),
    destek: z.object({ kaynak: kimlik }).strict().optional(),
    acilis_sonuc: z.object({
      trafik: trafikSemasi, sevkiyat: sevkiyatSemasi, deniz: denizSemasi,
      baslik: z.string().min(3), metin: z.string().min(10),
      olaylar: z.array(acilisOlaySemasi).min(1).max(3),
    }).strict().optional(),
    saha_karari: z.enum(["program", "gecici", "reddet", "denetle", "kapat"]).optional(),
  })
  .strict();

export const kartSemasi = z
  .object({
    id: kimlik,
    kategori: z.enum(KATEGORILER),
    tur: z.enum(KART_TURLERI).default("masa"),
    zincir: kimlik.optional(),
    asama: z.enum(ASAMALAR).optional(),
    getiren: kimlik,
    kosul: kosulSemasi.default({}),
    agirlik: z.number().positive().default(1),
    tekrar: z.boolean().default(false),
    acilis: z.object({
      gece: z.number().int().min(0).max(2),
      trafik: trafikSemasi, sevkiyat: sevkiyatSemasi, deniz: denizSemasi,
      olaylar: z.array(acilisOlaySemasi).min(1).max(3),
    }).strict().optional(),
    saha: z.object({ id: kimlik, asama: z.enum(["ilk", "takip"]) }).strict().optional(),
    ziyaret: z.object({ id: kimlik, asama: z.enum(["gorusme", "takip"]) }).strict().optional(),
    degiskenler: z.record(z.enum(COZUCULER)).default({}),
    ertelenince: kimlik.optional(),
    /** Bütçe açığı etkilerinin yazılacağı kalem; yoksa kategoriye göre seçilir */
    kalem: z.enum(BUTCE_KALEMLERI).optional(),
    anlati: z.object({
      mekan: z.string(), amac: z.string(),
      sesler: z.array(z.object({ kim: kimlik, metin: z.string(), kosul: kosulSemasi.optional() }).strict()).min(2).max(4),
      belgeler: z.array(z.object({ ad: z.string(), metin: z.string() }).strict()).min(1).max(3),
      hatirlatmalar: z.array(z.object({ kim: kimlik, metin: z.string(), kosul: kosulSemasi }).strict()).default([]),
      secenekNotlari: z.array(z.object({ gerekce: z.string(), bedel: z.string() }).strict()).length(3),
      sahne: z.object({
        baslik: z.string(),
        adimlar: z.array(z.object({
          kim: kimlik, metin: z.string(),
          secenekler: z.array(z.object({
            metin: z.string(), cevap: z.string(), anlatici: z.boolean().optional(),
            kosul: kosulSemasi.optional(), kilitNedeni: z.string().optional(),
            etki: z.record(z.number()).default({}),
            bayrak: z.record(bayrakDegeri).optional(),
            iliski: z.record(z.number()).default({}),
          }).strict()).length(3),
        }).strict()).length(3),
      }).strict().optional(),
    }).strict().optional(),
    metin: z
      .object({ baslik: z.string().min(3), durum: z.string().min(10), kulis: z.string().optional() })
      .strict(),
    secenekler: z.array(secenekSemasi).length(3, "her kartta tam 3 seçenek olmalı"),
  })
  .strict();

export const karakterSemasi = z
  .object({
    id: kimlik,
    ad: z.string(),
    rol: z.string(),
    yetkinlik: z.number().min(0).max(1).default(0.6),
  })
  .strict();

export const sehirSemasi = z
  .object({
    ad: z.string(),
    bolge: z.string(),
    belediye: z.enum(["iktidar", "muhalefet"]),
    baskent: z.boolean().default(false),
  })
  .strict();

export const POLITIKA_BOLUMLERI = ["ekonomi", "toplum", "saglik_egitim", "sehir", "cevre", "calisma"] as const;
export const BOLUM_AD: Record<(typeof POLITIKA_BOLUMLERI)[number], string> = {
  ekonomi: "Ekonomi ve çalışma hayatı",
  toplum: "Toplum, güvenlik, hukuk",
  saglik_egitim: "Sağlık ve eğitim",
  sehir: "Şehir hayatı",
  cevre: "Çevre",
  calisma: "Dijital ve gençlik",
};

/** Politika dosyasındaki kademeli bir ayar (politika ya da yönetmelik). */
export const politikaSemasi = z
  .object({
    id: kimlik,
    ad: z.string().min(3),
    bolum: z.enum(POLITIKA_BOLUMLERI),
    yol: z.enum(["kararname", "kanun"]),
    temel_hak: z.boolean().default(false),
    getiren: kimlik,
    aciklama: z.string().min(10),
    kademeler: z.array(z.string().min(2)).min(3).max(5),
    baslangic: z.number().int().min(0),
    kalem: z.enum(BUTCE_KALEMLERI).optional(),
    /** Bir kademe yukarı çıkınca olan etki (aşağı inince işaret tersine döner) */
    adim: z.record(z.number()),
    sesler: z.object({ artis: z.array(z.string()).min(1), azalis: z.array(z.string()).min(1) }).strict(),
  })
  .strict();

export type Politika = z.infer<typeof politikaSemasi>;

export const hayatSemasi = z
  .object({
    id: kimlik,
    ad: z.string(),
    yas: z.number().int(),
    sehir: z.string(),
    meslek: z.string(),
    grup: z.string(),
    sahneler: z
      .array(
        z.object({ id: kimlik, kosul: kosulSemasi.default({}), bayrak: z.record(bayrakDegeri).optional(), metin: z.string().min(10), ton: z.number().int().min(-1).max(1), ayrilis: z.boolean().default(false) }).strict(),
      )
      .min(3),
  })
  .strict();

const etkiSemasi = z.record(z.number());
export const toplumSemasi = z
  .object({
    gazeteler: z.array(z.object({ id: kimlik, ad: z.string(), olumlu: z.array(z.string()).min(1), olumsuz: z.array(z.string()).min(1) }).strict()).min(2),
    ziyaretciler: z.array(z.object({ id: kimlik, kim: z.string(), konu: z.string(), gorusme: kimlik.optional(), kabul: etkiSemasi, ihmal: etkiSemasi }).strict()).min(3),
    eylemler: z.record(z.object({ ad: z.string(), talep: z.string(), taban: z.number().positive() }).strict()),
  })
  .strict();

export type Hayat = z.infer<typeof hayatSemasi>;
export type ToplumIcerigi = z.infer<typeof toplumSemasi>;
export type Kart = z.infer<typeof kartSemasi>;
export type Secenek = z.infer<typeof secenekSemasi>;
export type Kosul = z.infer<typeof kosulSemasi>;
export type Karakter = z.infer<typeof karakterSemasi>;
export type Sehir = z.infer<typeof sehirSemasi>;
export type Cozucu = (typeof COZUCULER)[number];

export interface IcerikPaketi {
  surum: string;
  kartlar: Record<string, Kart>;
  karakterler: Record<string, Karakter>;
  sehirler: Sehir[];
  politikalar: Record<string, Politika>;
  hayatlar: Hayat[];
  toplum: ToplumIcerigi;
  meclis: MeclisIcerigi;
  medya?: MedyaIcerigi;
  saha?: SahaDosyasi[];
}
