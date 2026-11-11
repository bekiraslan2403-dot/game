import { z } from "zod";

const odeme = z.object({
  soz: z.string(), ay: z.number().int().min(1).max(18),
  amac: z.enum(["fatura", "bakim", "gecici"]),
  tutarTL: z.number().finite().nonnegative(), uygulandi: z.boolean(),
}).strict();

export const isinmaDosyasiSemasi = z.object({
  id: z.string(), ay: z.number().int().min(1).max(18),
  ilk: z.enum(["zam", "kademe", "dondurma"]),
  asama: z.enum(["bekleyen", "masada", "uygulama", "tamam"]),
  hedef: z.string().nullable(), hedefAy: z.number().int().min(1).max(18).nullable(),
  faturaOnce: z.number().finite().nonnegative(), faturaSonra: z.number().finite().nonnegative(),
  hazineFarki: z.number().finite(),
  yanit: z.string().nullable(), sonuc: z.string().nullable(),
  kesme: z.enum(["normal", "askida", "itirazli", "suruyor"]),
  ortakSayac: z.boolean(),
  bakim: z.enum(["yok", "hazine", "tarife", "hazir", "kabul"]),
  isinma: z.enum(["haber_yok", "borc_riski", "acik", "sinirli", "kesik", "gecici"]),
  odemeler: z.array(odeme),
  sonAy: z.number().int().min(1).max(18),
  sonHaber: z.string(),
}).strict();

export type IsinmaDosyasi = z.infer<typeof isinmaDosyasiSemasi>;
export const isinmaSemasi = z.array(isinmaDosyasiSemasi);
