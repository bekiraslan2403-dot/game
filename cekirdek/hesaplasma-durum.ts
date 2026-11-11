import { z } from "zod";

export const hesaplasmaTuru = z.enum(["kaza", "tanik"]);
export const hesaplasmaYolu = z.enum(["acik", "sirket", "gizlilik", "koruma", "gorev", "serbest"]);
export const hesaplasmaSemasi = z.object({
  tur: hesaplasmaTuru,
  baslangicAy: z.number().int().min(1).max(18),
  asama: z.enum(["bekleyen", "dosya", "tamam"]),
  hedef: z.enum(["akkopru_durusma", "akkopru_durusma_takip", "akkopru_tanik_takip"]).nullable(),
  hedefAy: z.number().int().min(1).nullable(),
  yol: hesaplasmaYolu,
  hamKayit: z.boolean(),
  beyan: z.boolean(),
  aile: z.enum(["bekliyor", "gorusur", "mesafeli", "reddetti", "yardim_aldi"]),
  deniz: z.enum(["bekliyor", "ifade_istegi", "is_basvurusu", "ayrildi", "ifade_verdi", "ise_basladi"]),
  bakan: z.enum(["gorevde", "uzaklastirildi"]),
  yayin: z.enum(["bekliyor", "acik", "sinirli", "gizlilik_istendi"]),
  harcamaTL: z.number().finite().min(0),
  sonuc: z.object({ baslik: z.string(), metin: z.string() }).strict().nullable(),
  izler: z.array(z.object({ ay: z.number().int().min(1).max(18), metin: z.string() }).strict()).min(1),
}).strict().refine(p => p.asama === "tamam" ? p.hedef === null && p.hedefAy === null && p.sonuc !== null : p.hedef !== null && p.hedefAy !== null && p.sonuc === null, "hesaplaşma aşaması ve hedef dosyası uyuşmuyor")
  .refine(p => p.tur === "kaza" ? ["acik", "sirket", "gizlilik"].includes(p.yol) && p.hedef !== "akkopru_tanik_takip" : ["koruma", "gorev", "serbest"].includes(p.yol) && p.hedef !== "akkopru_durusma" && p.hedef !== "akkopru_durusma_takip", "hesaplaşma yolu uyuşmuyor").nullable();
export type HesaplasmaKaydi = NonNullable<z.infer<typeof hesaplasmaSemasi>>;
