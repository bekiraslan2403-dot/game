// İçerik şeması: kartların, karakterlerin ve şehirlerin biçimi.
// İçerik derleyici YAML dosyalarını bu şemaya göre denetler; çekirdek yalnız denetlenmiş paketle çalışır.

import { z } from "zod";

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
  })
  .strict();

export const secenekSemasi = z
  .object({
    metin: z.string().min(3),
    etki: z.record(z.number()).default({}),
    bayrak: z.record(bayrakDegeri).optional(),
    sonraki: z.array(z.object({ kart: kimlik, gecikme: z.number().int().min(1).max(6).default(1) }).strict()).default([]),
    sicil: z.object({ tur: z.enum(SICIL_TURLERI), kaynak: z.string().min(3) }).strict().optional(),
    haber: z.string().optional(),
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
    degiskenler: z.record(z.enum(COZUCULER)).default({}),
    ertelenince: kimlik.optional(),
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
}
