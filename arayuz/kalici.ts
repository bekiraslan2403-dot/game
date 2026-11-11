// Tarayıcıda otomatik kayıt. Depolama her ortamda çalışmayabilir (gizli pencere, önizleme);
// bu yüzden her erişim try/catch içindedir ve hata oyunu durdurmaz.

import { kaydet, yukle } from "../cekirdek/kayit.ts";
import type { OyunDurumu } from "../cekirdek/durum.ts";
import { invoke, isTauri } from "@tauri-apps/api/core";

const ANAHTAR = "akkopru-2026:otomatik";
let acilisKaydi: OyunDurumu | null = null;
let yazmaSirasi: Promise<void> = Promise.resolve();

/** Masaüstü açılışında diskteki kayıt ve yedeği denetlenir; bozuk kayıt ezilmez. */
export async function kaliciyiHazirla(): Promise<void> {
  if (!isTauri()) return;
  const disk = await invoke<{ asil: string | null; yedek: string | null }>("kayit_oku");
  let onbellek: string | null = null;
  try { onbellek = localStorage.getItem(ANAHTAR); } catch { /* Disk kaydı yeterli. */ }
  const adaylar = [disk.asil, disk.yedek, onbellek].filter((x): x is string => x !== null);
  const gecerli = adaylar.flatMap(metin => {
    const y = yukle(metin);
    if (!y.ok) return [];
    const tarih = Date.parse((JSON.parse(metin) as { kayitTarihi?: string }).kayitTarihi ?? "");
    return [{ durum: y.durum, tarih: Number.isFinite(tarih) ? tarih : 0 }];
  }).sort((a, b) => b.tarih - a.tarih);
  if (adaylar.length && !gecerli.length) throw new Error("Kayıt ve yedek açılamadı. Mevcut kayıt dosyalarına dokunulmadı.");
  acilisKaydi = gecerli[0]?.durum ?? null;
}

function diskeYaz(metin: string): void {
  // Hızlı ardışık kararların eski kaydı yenisinin üstüne yazmasını engeller.
  yazmaSirasi = yazmaSirasi.catch(() => {}).then(() => invoke<void>("kayit_yaz", { metin }));
  void yazmaSirasi.then(() => {
    window.dispatchEvent(new CustomEvent("akkopru:kayit", { detail: null }));
  }, () => {
    window.dispatchEvent(new CustomEvent("akkopru:kayit", { detail: "Disk kaydı yazılamadı. Oyun bu oturumda açık; diskteki önceki kayıt korunuyor." }));
  });
}

export function otomatikKaydet(d: OyunDurumu): boolean {
  const metin = kaydet(d);
  if (isTauri()) diskeYaz(metin);
  try {
    localStorage.setItem(ANAHTAR, metin);
    return true;
  } catch {
    if(!isTauri())window.dispatchEvent(new CustomEvent("akkopru:kayit",{detail:"Tarayıcı oyunu kaydedemedi. Menüden kaydı dosyaya indirin; pencereyi kapatırsanız bu oturumdaki ilerleme kaybolabilir."}));
    return false;
  }
}

export function otomatikYukle(): OyunDurumu | null {
  if (acilisKaydi) return structuredClone(acilisKaydi);
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
