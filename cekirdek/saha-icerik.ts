import { z } from "zod";
export const sahaIcerikSemasi = z.array(z.object({
  id: z.string().regex(/^[a-z0-9_]+$/), il: z.string(), baslik: z.string(), ozet: z.string(),
  ilk: z.string(), takip: z.string(), grup: z.string(), kurum: z.enum(["cevre", "hazine", "icisleri"]),
  kalem: z.enum(["yatirim", "egitim", "saglik", "sosyal"]),
  /** Yıllıklaştırılmış % GSYH akışı; tek aylık ödemede 12'ye bölünür. */
  maliyet: z.number().positive().max(.1),
  fayda: z.record(z.number()),
  tamamlandi: z.string(), aksadi: z.string(), gecici: z.string(), reddedildi: z.string(),
}).strict());
export type SahaDosyasi = z.infer<typeof sahaIcerikSemasi>[number];
