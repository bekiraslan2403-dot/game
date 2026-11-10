// Tam dönem: yalnız düz veri; sahne ve seçim sonuçları kayıtta korunur.
import { z } from "zod";
const n = z.number().finite(),
  t = n.int().min(0),
  oran = n.min(0).max(100);
export const yonetimSemasi = z
  .object({
    ajanda: z.array(
      z.object({
        ay: t,
        tur: z.string(),
        hedef: z.string(),
        metin: z.string(),
      }),
    ),
    bolgeler: z.record(z.object({ iliski: oran, ziyaret: t })),
    kurumlar: z.record(z.object({ liyakat: oran, sadakat: oran })),
    uygulamalar: z.array(
      z.object({
        ay: t,
        baslik: z.string(),
        etki: z.record(n),
        kalem: z.string(),
        politika: z.string().optional(),
        onceki: t.optional(),
        beklenen: t.optional(),
        tekSeferlik: z.boolean().optional(),
      }),
    ),
    parti: z.object({
      veliaht: z.string().nullable(),
      ayrilan: z.string().nullable(),
      vekil: t.max(30),
      kurultay: t,
    }),
    medya: z.object({
      cizgi: z.record(n.min(-60).max(60)),
      hamleler: z.record(t),
      akis: z.array(
        z.object({
          ay: t,
          kim: z.string(),
          metin: z.string(),
          begeni: t,
          paylasim: t,
        }),
      ),
      bultenler: z.array(
        z.object({ ay: t, kanal: z.string(), metin: z.string() }),
      ),
      konular: z.array(
        z.object({ id: z.string(), ad: z.string(), agirlik: n }),
      ),
      basin: z
        .object({
          ay: t,
          adim: t.max(3),
          sorular: z
            .array(
              z.object({
                kim: z.string(),
                soru: z.string(),
                cevap: z.string().nullable(),
                sonuc: z.string().nullable(),
              }),
            )
            .length(3),
        })
        .nullable(),
      gecmis: z.array(
        z.object({
          ay: t,
          kim: z.string(),
          soru: z.string(),
          cevap: z.string(),
          sonuc: z.string(),
        }),
      ),
    }),
    ifsa: z.object({ sicil: z.string(), kaynak: z.string(), ay: t }).nullable(),
    ifsalar: z.array(
      z.object({ ay: t, kaynak: z.string(), yanit: z.string() }),
    ),
    krizTakip: z.record(t),
    secim: z.object({
      rakip: z.string(),
      kasa: n.min(0).max(120),
      etki: n.min(-4).max(4),
      slogan: z.string().nullable(),
      tekrar: z.record(t),
      sahne: z
        .object({
          tur: z.enum(["miting", "munazara"]),
          adim: t.max(4),
          cevaplar: z.array(t.max(2)),
        })
        .nullable(),
      gece: z
        .object({
          tur: t.min(1).max(2),
          oy: n.min(0).max(100),
          rakipOy: n.min(0).max(100),
          diger: n.min(0).max(100),
          katilim: oran,
          ikinciTur: z.boolean(),
          itiraz: z.boolean(),
          tamam: z.boolean(),
          akis: z.array(
            z.object({
              acilan: oran,
              ajansA: oran,
              ajansB: oran,
              not: z.string(),
            }),
          ),
          hayatlar: z.array(z.object({ kim: z.string(), metin: z.string() })),
          ilkHesap: z.object({
            gruplar: z.array(z.object({ id: z.string(), destek: oran, katilim: oran, katki: n })),
            kampanya: n,
            rakip: n,
            belirsizlik: n,
            sinir: n,
          }).optional(),
          ikinciHesap: z.object({
            tercih: t.min(0).max(2),
            ilkOy: oran,
            havuz: oran,
            aktarilan: oran,
            belirsizlik: n,
            kutuplasma: n,
            partiIci: n,
          }).optional(),
          yenidenSayim: n.optional(),
        })
        .nullable(),
    }),
  })
  .superRefine((v, ctx) => {
    const b = v.medya.basin;
    if (
      b &&
      b.sorular.some(
        (s, i) => i < b.adim !== (s.cevap !== null && s.sonuc !== null),
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["medya", "basin"],
        message: "basın tutanağı ile soru sırası uyuşmuyor",
      });
    const s = v.secim.sahne;
    if (
      s &&
      (s.cevaplar.length !== s.adim || (s.tur === "miting" && s.adim > 3))
    )
      ctx.addIssue({
        code: "custom",
        path: ["secim", "sahne"],
        message: "kampanya sahnesi sıra bilgisi bozuk",
      });
    const g = v.secim.gece;
    if (
      g &&
      (Math.abs(g.oy + g.rakipOy + g.diger - 100) > 0.00001 ||
        (g.tur === 2 && g.diger !== 0) ||
        (g.ikinciTur && g.tur !== 1))
    )
      ctx.addIssue({
        code: "custom",
        path: ["secim", "gece"],
        message: "seçim oy toplamları veya tur bilgisi uyuşmuyor",
      });
  });
export type YonetimDurumu = z.infer<typeof yonetimSemasi>;
export function yonetimBaslangic(tohum = 0): YonetimDurumu {
  return {
    ajanda: [],
    bolgeler: {},
    kurumlar: {
      hazine: { liyakat: 65, sadakat: 65 },
      adalet: { liyakat: 78, sadakat: 38 },
      merkez_bankasi: { liyakat: 85, sadakat: 35 },
      istatistik: { liyakat: 80, sadakat: 40 },
      cevre: { liyakat: 55, sadakat: 70 },
      icisleri: { liyakat: 70, sadakat: 60 },
    },
    uygulamalar: [],
    parti: { veliaht: null, ayrilan: null, vekil: 0, kurultay: 0 },
    medya: {
      cizgi: {},
      hamleler: {},
      akis: [],
      bultenler: [],
      konular: [],
      basin: null,
      gecmis: [],
    },
    ifsa: null,
    ifsalar: [],
    krizTakip: {},
    secim: {
      rakip: (tohum >>> 0) % 2 ? "Arda Soyer" : "İpek Ergin",
      kasa: 65,
      etki: 0,
      slogan: null,
      tekrar: {},
      sahne: null,
      gece: null,
    },
  };
}
