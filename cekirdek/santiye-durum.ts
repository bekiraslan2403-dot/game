import { z } from "zod";

export const santiyeSemasi = z.object({
  baslangicAy: z.number().int().min(1).max(18),
  asama: z.enum(["protokol", "hazirlik", "yapim", "fiziksel_teslim", "kabul_bekliyor", "kabul", "durduruldu"]),
  yuklenici: z.enum(["belirsiz", "eski", "yeni"]),
  ucret: z.enum(["bekliyor", "odendi"]),
  protokol: z.enum(["yok", "ayri_teminat", "kosullu", "dava"]),
  sorumluluk: z.enum(["sakli", "zayiflatildi"]),
  numune: z.boolean(),
  isAy: z.number().int().min(1).nullable(),
  harcamaTL: z.number().finite().min(0),
  teknik: z.enum(["bekliyor", "eksik", "uygun"]),
  izler: z.array(z.object({ ay: z.number().int().min(1).max(18), metin: z.string() }).strict()).min(1),
}).strict().refine(p => p.asama !== "yapim" || p.isAy !== null, "yapım takvimi yok")
  .refine(p => p.asama !== "kabul" || (p.teknik === "uygun" && p.numune && p.yuklenici === "yeni"), "kabulün teknik sonucu yok").nullable();
export type SantiyeKaydi = NonNullable<z.infer<typeof santiyeSemasi>>;
