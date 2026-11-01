// Kayıt ve yükleme. Kayıt metni sürümlüdür; eski bir sürüm yüklenirken sırayla göç fonksiyonları çalışır,
// ardından şema denetimi yapılır. Bozuk ya da tanınmayan kayıt asla yarım yüklenmez.

import { z } from "zod";
import { DURUM_SURUMU, AYLIK_BOS_GUN, bosAyKaydi, type OyunDurumu } from "./durum.ts";
import { gostergeBaslangic } from "./gostergeler.ts";
import { ekonomiBaslangic } from "./ekonomi.ts";
import { ilkAnketler } from "./kamuoyu.ts";
import { toplumBaslangic } from "./toplum.ts";

const OYUN_KIMLIGI = "akkopru-2026";

const sayi = z.number().finite();
const tam = z.number().int();
const degiskenler = z.record(z.string());
const ayKaydi = z.object({
  ay: tam,
  kararlar: z.array(z.object({ kart: z.string(), baslik: z.string(), secenek: tam, secenekMetni: z.string() })),
  ertelenen: z.array(z.string()),
  haberler: z.array(z.string()),
  olaylar: z.array(z.string()),
  hayatlar: z.array(z.object({ kim: z.string(), metin: z.string(), ton: sayi })),
  degisim: z.array(z.object({ id: z.string(), once: sayi, sonra: sayi })),
});

const sayilar = z.record(sayi);
const ekonomi = z.object({
  gercekEnflasyon: sayi,
  katki: sayilar,
  harcamaEtkisi: sayi,
  yatirimEtkisi: sayi,
  faizEtkisi: sayi,
  kurHizi: sayi,
  petrol: sayi,
  kuresel: sayi,
  mbBaski: sayi,
  istatistik: z.enum(["liyakatli", "sadik"]),
  makyaj: sayi,
  gsyh: sayi,
  gider: sayilar,
  gelir: sayilar,
  ekFaizYuku: sayi,
  sepet: sayilar,
  sepetGecmis: z.array(sayilar),
  hane: z.object({ asgari: sayi, kira: sayi, fatura: sayi }),
  sozler: z.array(
    z.object({
      id: z.string(), metin: z.string(), kalem: z.string(), maliyet: sayi, verildi: tam, vade: tam,
      grup: z.string().nullable(), asgariArtis: sayi, durum: z.enum(["bekliyor", "tutuldu", "kirildi"]),
    }),
  ),
  krizler: z.array(z.object({ id: z.enum(["kur_soku"]), basladi: tam })),
  arac: z.record(tam),
});

const durumSemasi = z.object({
  surum: z.literal(DURUM_SURUMU),
  tohum: tam,
  zar: z.object({ a: tam, b: tam, c: tam, d: tam }),
  ay: tam.min(1).max(18),
  bitis: z.object({ tur: z.enum(["yeniden_secilme", "yenilgi", "devrilme", "istifa"]), ay: tam, aciklama: z.string() }).nullable(),
  gostergeler: z.record(sayi),
  ayBasi: z.record(sayi),
  masa: z.array(z.object({ ornek: z.string(), kart: z.string(), degisken: degiskenler, agir: z.boolean(), ikinciGorus: z.boolean() })),
  masaKuruldu: z.boolean(),
  ertelemeKullanildi: z.boolean(),
  bosGun: tam.min(0),
  bekleyen: z.array(z.object({ kart: z.string(), ay: tam, degisken: degiskenler, agir: z.boolean() })),
  gorulen: z.record(tam),
  buAy: ayKaydi,
  sicil: z.array(z.object({ id: z.string(), tur: z.enum(["usulsuzluk", "yalan", "kirilan_soz", "baski"]), kaynak: z.string(), ay: tam, ifsaOldu: z.boolean() })),
  bayraklar: z.record(z.union([z.boolean(), z.number(), z.string()])),
  haberler: z.array(z.object({ ay: tam, metin: z.string(), kategori: z.string() })),
  gecmis: z.array(ayKaydi),
  sayac: tam.min(0),
  ekonomi,
  politika: z.record(tam.min(0)),
  imza: tam.min(0),
  meclisGundemi: z.array(z.object({ politika: z.string(), hedef: tam.min(0), ay: tam })),
  anketler: z.array(z.object({ ay: tam, sirket: z.string(), oran: sayi })),
  toplum: z.object({
    hayatlar: z.record(z.object({ olan: z.record(tam), son: z.array(z.object({ ay: tam, metin: z.string(), ton: sayi })), ayrildi: z.boolean() })),
    gazete: z.object({ ay: tam, olay: z.string(), mansetler: z.array(z.object({ gazete: z.string(), baslik: z.string() })) }).nullable(),
    kapi: z.array(z.object({ id: z.string(), durum: z.enum(["bekliyor", "kabul"]) })),
    eylemler: z.array(z.object({ id: z.string(), grup: z.string(), il: z.string(), emniyet: sayi, duzenleyici: sayi, basladi: tam, dinlendi: z.boolean() })),
  }),
});

/**
 * Göçler: anahtar, göçün başladığı sürümdür. GOCLER[1] sürüm 1 kaydını sürüm 2'ye çevirir.
 * Yeni bir alan eklendiğinde DURUM_SURUMU artırılır ve buraya bir göç yazılır.
 */
export const GOCLER: Record<number, (eski: Record<string, unknown>) => Record<string, unknown>> = {
  // Sürüm 1 → 2: göstergeler, masa, deste ve ayın kaydı eklendi. Eski kayıtta yalnız takvim vardı.
  1: (eski) => {
    const ay = typeof eski.ay === "number" ? eski.ay : 1;
    const g = gostergeBaslangic();
    return {
      ...eski,
      gostergeler: g,
      ayBasi: { ...g },
      masa: [],
      masaKuruldu: false,
      ertelemeKullanildi: false,
      bosGun: AYLIK_BOS_GUN,
      bekleyen: [],
      gorulen: {},
      buAy: bosAyKaydi(ay),
      haberler: [],
      gecmis: [],
      sayac: 0,
    };
  },
  // Sürüm 2 → 3: ekonomi modeli eklendi; ayın kaydına "olaylar" eklendi. Bütçe açığı artık kalemlerden hesaplanır,
  // bu yüzden eski kayıttaki açığın başlangıçtan farkı sosyal yardıma (açık büyükse) ya da diğer gelirlere (küçükse)
  // yazılır; diğer göstergeler korunur.
  2: (eski) => {
    const e = ekonomiBaslangic();
    const g = (eski.gostergeler ?? {}) as Record<string, number>;
    if (typeof g.enflasyon === "number") e.gercekEnflasyon = g.enflasyon;
    if (typeof g.butce_acigi === "number") {
      const fark = g.butce_acigi - 3.5;
      if (fark >= 0) e.gider.sosyal = (e.gider.sosyal ?? 0) + fark;
      else e.gelir.diger = (e.gelir.diger ?? 0) - fark;
    }
    const ay = (k: unknown) => ({ ...(k as Record<string, unknown>), olaylar: [] });
    return { ...eski, buAy: ay(eski.buAy), gecmis: Array.isArray(eski.gecmis) ? eski.gecmis.map(ay) : [], ekonomi: e };
  },
  // Sürüm 3 → 4: politika dosyası, Meclis gündemi, anketler ve toplum göstergeleri eklendi.
  3: (eski) => {
    const g = { ...gostergeBaslangic(), ...((eski.gostergeler ?? {}) as Record<string, number>) };
    return { ...eski, gostergeler: g, ayBasi: { ...gostergeBaslangic(), ...((eski.ayBasi ?? {}) as Record<string, number>) }, politika: {}, imza: 0, meclisGundemi: [], anketler: ilkAnketler(g) };
  },
  // Sürüm 4 → 5: beş hayat, gazeteler, kapıda bekleyenler ve sokak eylemleri; ayın kaydına "hayatlar" eklendi.
  4: (eski) => {
    const ay = (k: unknown) => ({ ...(k as Record<string, unknown>), hayatlar: [] });
    return { ...eski, buAy: ay(eski.buAy), gecmis: Array.isArray(eski.gecmis) ? eski.gecmis.map(ay) : [], toplum: toplumBaslangic() };
  },
};

export type YuklemeSonucu = { ok: true; durum: OyunDurumu } | { ok: false; hata: string };

/** Durumu kayıt metnine çevirir. */
export function kaydet(d: OyunDurumu): string {
  return JSON.stringify({ oyun: OYUN_KIMLIGI, surum: d.surum, kayitTarihi: new Date().toISOString(), durum: d });
}

/** Kayıt metnini okur; göçleri uygular ve şemaya göre denetler. */
export function yukle(metin: string): YuklemeSonucu {
  let ham: unknown;
  try {
    ham = JSON.parse(metin);
  } catch {
    return { ok: false, hata: "Kayıt dosyası okunamadı (JSON değil)." };
  }
  if (typeof ham !== "object" || ham === null) return { ok: false, hata: "Kayıt dosyası boş ya da bozuk." };
  const kab = ham as { oyun?: unknown; surum?: unknown; durum?: unknown };
  if (kab.oyun !== OYUN_KIMLIGI) return { ok: false, hata: "Bu dosya bir Akköprü 2026 kaydı değil." };
  if (typeof kab.surum !== "number" || !Number.isInteger(kab.surum)) return { ok: false, hata: "Kayıt sürümü okunamadı." };
  if (kab.surum > DURUM_SURUMU) return { ok: false, hata: "Bu kayıt oyunun daha yeni bir sürümünde yapılmış." };
  if (typeof kab.durum !== "object" || kab.durum === null) return { ok: false, hata: "Kayıtta oyun durumu yok." };

  let durum = structuredClone(kab.durum) as Record<string, unknown>;
  for (let s = kab.surum; s < DURUM_SURUMU; s++) {
    const goc = GOCLER[s];
    if (!goc) return { ok: false, hata: `Sürüm ${s} kaydını güncelleyecek göç tanımlı değil.` };
    durum = goc(durum);
    durum.surum = s + 1;
  }
  const sonuc = durumSemasi.safeParse(durum);
  if (!sonuc.success) {
    const ilk = sonuc.error.issues[0];
    return { ok: false, hata: `Kayıt doğrulanamadı: ${ilk ? `${ilk.path.join(".")} — ${ilk.message}` : "bilinmeyen hata"}` };
  }
  return { ok: true, durum: sonuc.data as OyunDurumu };
}
