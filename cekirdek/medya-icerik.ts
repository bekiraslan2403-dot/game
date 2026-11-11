import { z } from "zod";
export const medyaIcerikSemasi = z
  .object({
    kuruluslar: z
      .array(
        z
          .object({
            id: z.string(),
            ad: z.string(),
            tur: z.enum(["gazete", "kanal"]),
            sahip: z.string(),
            cizgi: z.number().min(-60).max(60),
            grup: z.string(),
          })
          .strict(),
      )
      .length(6),
    gazeteciler: z
      .array(
        z
          .object({
            id: z.string(),
            ad: z.string(),
            kurulus: z.string(),
            soru: z.string(),
          })
          .strict(),
      )
      .length(5),
    kullanicilar: z
      .array(
        z
          .object({ ad: z.string(), destek: z.string(), elestiri: z.string() })
          .strict(),
      )
      .min(4),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      new Set(v.kuruluslar.map((k) => k.id)).size !== 6 ||
      v.kuruluslar.filter((k) => k.tur === "kanal").length !== 3
    )
      ctx.addIssue({
        code: "custom",
        message: "üç gazete ve üç kanalın kimlikleri benzersiz olmalı",
      });
    if (new Set(v.gazeteciler.map((k) => k.id)).size !== 5)
      ctx.addIssue({
        code: "custom",
        message: "gazeteci kimlikleri benzersiz olmalı",
      });
  });
export type MedyaIcerigi = z.infer<typeof medyaIcerikSemasi>;
