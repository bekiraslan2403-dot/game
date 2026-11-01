// Ayın akışı. Bu dosya iş listesinin 4. maddesinde (masa, kararlar, ay sonu) genişletilecek;
// şimdilik yalnız ayın kapanışını ve geçmiş kaydını yapar.

import { durumKopya, oyunBittiMi, sonAyMi, type OyunDurumu } from "./durum.ts";

export type AySonucu = { ok: true; durum: OyunDurumu } | { ok: false; neden: string };

/** Ayı kapatır ve bir sonraki aya geçer. Girdi durumunu değiştirmez; yeni durum döner. */
export function ayiBitir(onceki: OyunDurumu): AySonucu {
  if (oyunBittiMi(onceki)) return { ok: false, neden: "Oyun sona erdi." };
  if (sonAyMi(onceki)) return { ok: false, neden: "Dönemin son ayı; seçim henüz oyuna eklenmedi." };
  const d = durumKopya(onceki);
  d.gecmis.push({ ay: d.ay, kararlar: [], olaylar: [] });
  d.ay += 1;
  return { ok: true, durum: d };
}
