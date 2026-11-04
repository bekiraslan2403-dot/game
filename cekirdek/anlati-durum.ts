import { z } from "zod";

export const anlatiSemasi = z.object({
  sahne: z.object({ ornek: z.string(), adim: z.number().int().min(0).max(2), cevap: z.number().int().min(0).max(2).nullable() }).nullable(),
  notlar: z.array(z.object({ ay: z.number().int().min(1).max(18), ornek: z.string(), kart: z.string(), kim: z.string(), metin: z.string(), anlatici: z.boolean().optional(), soru: z.number().int().min(0).max(2), secenek: z.number().int().min(0).max(2) })),
  iliskiler: z.record(z.number().finite().min(0).max(100)),
});
export type AnlatiDurumu = z.infer<typeof anlatiSemasi>;
export function anlatiBaslangic(): AnlatiDurumu { return { sahne: null, notlar: [], iliskiler: {} }; }
