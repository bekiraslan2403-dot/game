import { z } from "zod";
const ay = z.number().int().min(1).max(18);
export const sahaKaydiSemasi = z.object({
  ilkAy: ay, sonZiyaret: ay, takipYapildi: z.boolean(),
  durum: z.enum(["karar", "program", "gecici", "reddedildi", "aksadi", "tamamlandi"]),
  hedefAy: z.number().int().min(1).max(30).nullable(), sonucAy: ay.nullable(),
  tarihSozu: z.boolean(), sozKirildi: z.boolean(),
  guclendirildi: z.boolean(), faydaUygulandi: z.boolean(),
  denetimAy: z.number().int().min(1).max(30).nullable(), denetim: z.enum(["yok", "bekliyor", "dogrulandi", "eksik"]),
  /** Ödeme günündeki nominal tutar, trilyon TL. */
  harcama: z.number().finite().min(0),
  izler: z.array(z.object({ ay, metin: z.string() })),
}).strict().refine(p => p.sonZiyaret >= p.ilkAy
  && (p.durum === "tamamlandi" ? p.sonucAy !== null && p.faydaUygulandi : p.sonucAy === null && !p.faydaUygulandi)
  && (!["program", "aksadi", "tamamlandi"].includes(p.durum) || p.hedefAy !== null)
  && (p.denetim === "yok" ? p.denetimAy === null : p.denetimAy !== null), "Saha uygulamasının tarih veya sonuç kaydı uyuşmuyor");
export const sahaSemasi = z.record(sahaKaydiSemasi);
export type SahaKaydi = z.infer<typeof sahaKaydiSemasi>;
