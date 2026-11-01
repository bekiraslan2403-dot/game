// Tarayıcıda otomatik kayıt. Depolama her ortamda çalışmayabilir (gizli pencere, önizleme);
// bu yüzden her erişim try/catch içindedir ve hata oyunu durdurmaz.

import { kaydet, yukle } from "../cekirdek/kayit.ts";
import type { OyunDurumu } from "../cekirdek/durum.ts";

const ANAHTAR = "akkopru-2026:otomatik";

export function otomatikKaydet(d: OyunDurumu): boolean {
  try {
    localStorage.setItem(ANAHTAR, kaydet(d));
    return true;
  } catch {
    return false;
  }
}

export function otomatikYukle(): OyunDurumu | null {
  try {
    const metin = localStorage.getItem(ANAHTAR);
    if (!metin) return null;
    const s = yukle(metin);
    return s.ok ? s.durum : null;
  } catch {
    return null;
  }
}

export function otomatikSil(): void {
  try {
    localStorage.removeItem(ANAHTAR);
  } catch {
    /* depolama yoksa silinecek bir şey de yoktur */
  }
}
