// Kayıt ve yükleme. Kayıt metni sürümlüdür; eski bir sürüm yüklenirken sırayla göç fonksiyonları çalışır,
// ardından şema denetimi yapılır. Bozuk ya da tanınmayan kayıt asla yarım yüklenmez.

import { z } from "zod";
import { DURUM_SURUMU, type OyunDurumu } from "./durum.ts";

const OYUN_KIMLIGI = "akkopru-2026";

const zarSemasi = z.object({ a: z.number().int(), b: z.number().int(), c: z.number().int(), d: z.number().int() });

const durumSemasi = z.object({
  surum: z.literal(DURUM_SURUMU),
  tohum: z.number().int(),
  zar: zarSemasi,
  ay: z.number().int().min(1).max(18),
  bitis: z
    .object({
      tur: z.enum(["yeniden_secilme", "yenilgi", "devrilme", "istifa"]),
      ay: z.number().int(),
      aciklama: z.string(),
    })
    .nullable(),
  sicil: z.array(
    z.object({
      id: z.string(),
      tur: z.enum(["usulsuzluk", "yalan", "kirilan_soz", "baski"]),
      kaynak: z.string(),
      ay: z.number().int(),
      ifsaOldu: z.boolean(),
    }),
  ),
  bayraklar: z.record(z.union([z.boolean(), z.number(), z.string()])),
  gecmis: z.array(
    z.object({
      ay: z.number().int(),
      kararlar: z.array(z.object({ kart: z.string(), secenek: z.number().int() })),
      olaylar: z.array(z.string()),
    }),
  ),
});

/**
 * Göçler: anahtar, göçün başladığı sürümdür. GOCLER[1] sürüm 1 kaydını sürüm 2'ye çevirir.
 * Yeni bir alan eklendiğinde DURUM_SURUMU artırılır ve buraya bir göç yazılır.
 */
export const GOCLER: Record<number, (eski: Record<string, unknown>) => Record<string, unknown>> = {};

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
