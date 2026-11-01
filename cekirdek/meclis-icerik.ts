import { z } from "zod";

export const PARTILER = [
  { id: "yukselis", ad: "Yükseliş Partisi", kisa: "YP", sandalye: 278 },
  { id: "bayrak", ad: "Bayrak Partisi", kisa: "BP", sandalye: 46 },
  { id: "demokrat", ad: "Demokrat Birlik Partisi", kisa: "DBP", sandalye: 153 },
  { id: "kalan", ad: "Kalan Halkların Partisi", kisa: "KHP", sandalye: 56 },
  { id: "ulusal", ad: "Ulusal Yol Partisi", kisa: "UYP", sandalye: 59 },
] as const;
export type PartiId = (typeof PARTILER)[number]["id"];
export const HIZIPLER = [
  { id: "eski", ad: "Eski kadro", sandalye: 110 },
  { id: "teknokrat", ad: "Teknokratlar", sandalye: 80 },
  { id: "muhafazakar", ad: "Muhafazakâr kanat", sandalye: 88 },
] as const;
export type HizipId = (typeof HIZIPLER)[number]["id"];
export const vekilSemasi = z.object({
  id: z.string().regex(/^[a-z_]+$/), ad: z.string().min(3),
  parti: z.enum(["yukselis", "bayrak", "demokrat", "kalan", "ulusal"]),
  hizip: z.enum(["eski", "teknokrat", "muhafazakar"]).nullable(),
  il: z.string().min(3), dert: z.enum(["yatirim", "makam", "dava", "vicdan"]),
  talep: z.string().min(10), giris: z.string().min(10),
}).strict().superRefine((v, ctx) => {
  if ((v.parti === "yukselis") !== (v.hizip !== null)) ctx.addIssue({ code: "custom", message: "yalnız iktidar vekilinin hizbi olmalı" });
});
export const meclisIcerikSemasi = z.object({ vekiller: z.array(vekilSemasi).length(12) }).strict().superRefine((m, ctx) => {
  if (new Set(m.vekiller.map(v => v.id)).size !== 12) ctx.addIssue({ code: "custom", message: "vekil kimlikleri benzersiz olmalı" });
});
export type Vekil = z.infer<typeof vekilSemasi>;
export type MeclisIcerigi = z.infer<typeof meclisIcerikSemasi>;
