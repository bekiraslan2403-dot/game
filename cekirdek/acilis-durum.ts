import { z } from "zod";

export const ACILIS_SABAHLAR = ["akkopru_sabah_kisit", "akkopru_sabah_olcum", "akkopru_sabah_guvence"] as const;
export const trafikSemasi = z.enum(["agir_yuk_kapali", "hafif_tek_serit", "acik"]);
export const sevkiyatSemasi = z.enum(["alternatif_yolda", "hastanede", "gecikti"]);
export const denizSemasi = z.enum(["gorevde", "baski_altinda", "gorevden_cekildi"]);
export const acilisOlaySemasi = z.object({ saat: z.string().regex(/^\d{2}\.\d{2}$/), metin: z.string().min(3) }).strict();

/** İlk günün gerçekleşmiş kaydıdır; sonraki aylarda güncel trafik diye sunulmaz. */
export const acilisSemasi = z.object({
  gece: z.number().int().min(0).max(2),
  sabahKarti: z.enum(ACILIS_SABAHLAR),
  sabah: z.number().int().min(0).max(2).nullable(),
  trafik: trafikSemasi,
  sevkiyat: sevkiyatSemasi,
  deniz: denizSemasi,
  hamKayit: z.boolean(),
  harcamaTL: z.number().finite().min(0),
  sonuc: z.object({ baslik: z.string(), metin: z.string() }).strict().nullable(),
  olaylar: z.array(acilisOlaySemasi).min(1),
}).strict().refine(a => a.sabahKarti === ACILIS_SABAHLAR[a.gece], "sabah dosyası ilk geceyle uyuşmuyor").refine(a => (a.sabah === null) === (a.sonuc === null), "ilk günün sonucu karar kaydıyla uyuşmuyor").nullable();
export type AcilisKaydi = NonNullable<z.infer<typeof acilisSemasi>>;
