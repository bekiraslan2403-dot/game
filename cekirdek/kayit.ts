// Kayıt ve yükleme. Kayıt metni sürümlüdür; eski bir sürüm yüklenirken sırayla göç fonksiyonları çalışır,
// ardından şema denetimi yapılır. Bozuk ya da tanınmayan kayıt asla yarım yüklenmez.

import { z } from "zod";
import { DURUM_SURUMU, AYLIK_BOS_GUN, bosAyKaydi, type OyunDurumu } from "./durum.ts";
import { gostergeBaslangic } from "./gostergeler.ts";

const OYUN_KIMLIGI = "akkopru-2026";

const sayi = z.number().finite();
const tam = z.number().int();
const degiskenler = z.record(z.string());
const ayKaydi = z.object({
  ay: tam,
  kararlar: z.array(z.object({ kart: z.string(), baslik: z.string(), secenek: tam, secenekMetni: z.string() })),
  ertelenen: z.array(z.string()),
  haberler: z.array(z.string()),
  degisim: z.array(z.object({ id: z.string(), once: sayi, sonra: sayi })),
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
