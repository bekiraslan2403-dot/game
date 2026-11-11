import { z } from "zod";
export const incelemeYolu = z.enum(["bagimsiz", "bakanlik", "onarim"]);
export const INCELEME_RAPORLARI = { bagimsiz: "akkopru_rapor_bagimsiz", bakanlik: "akkopru_rapor_bakanlik", onarim: "akkopru_rapor_onarim" } as const;
export const incelemeRaporSemasi = z.object({ tanikBeyani: z.boolean(), baslik: z.string(), bulgular: z.array(z.string()), eksikler: z.array(z.string()) }).strict();
export const incelemeSemasi = z.object({
  baslangicAy: z.number().int().min(1).max(18),
  yol: incelemeYolu,
  asama: z.enum(["bekliyor", "rapor", "tamam"]),
  raporAy: z.number().int().min(1),
  raporKarti: z.enum(["akkopru_rapor_bagimsiz", "akkopru_rapor_bakanlik", "akkopru_rapor_onarim"]),
  hamKayit: z.boolean(),
  tanikBeyani: z.boolean(),
  tanikDurumu: z.enum(["gorevde", "baski_altinda", "gorevden_cekildi", "eski_kayit"]),
  harcamaTL: z.number().finite().min(0),
  yayin: z.enum(["bekliyor", "acik", "sinirli", "kapali"]),
  rapor: incelemeRaporSemasi.nullable(),
  oncekiRaporlar: z.array(z.object({ ay: z.number().int().min(1).max(18), yol: incelemeYolu, rapor: incelemeRaporSemasi }).strict()),
  sonuc: z.object({ baslik: z.string(), metin: z.string() }).strict().nullable(),
  izler: z.array(z.object({ ay: z.number().int().min(1).max(18), metin: z.string() }).strict()).min(1),
}).strict().refine(p => p.raporKarti === INCELEME_RAPORLARI[p.yol], "inceleme yolu ile rapor dosyası uyuşmuyor")
 .refine(p => p.asama === "bekliyor" ? p.rapor === null && p.sonuc === null : p.rapor !== null && (p.asama === "tamam") === (p.sonuc !== null), "inceleme aşaması rapor veya sonuçla uyuşmuyor").nullable();
export type IncelemeKaydi = NonNullable<z.infer<typeof incelemeSemasi>>;
