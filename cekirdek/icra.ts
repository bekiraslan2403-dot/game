// Kart talimatlarını mevcut takvim, Hazine ve Meclis kayıtlarına uygular.
import type { OyunDurumu, MasaKarti } from "./durum.ts";
import type { Secenek } from "./icerik.ts";
import { sozVer, sozTut } from "./hazine.ts";
import { doldur } from "./metin.ts";
import { IMZA_HAKKI } from "./politika.ts";

export function icraEngeli(d: OyunDurumu, s: Secenek): string | null {
  if (!s.icra) return null;
  if (d.bosGun < s.icra.gun) return "Bu müdahale için takvimde yeterli gün yok.";
  if (s.icra.imza && d.imza >= IMZA_HAKKI) return "Bu ayın üç imzası kullanıldı.";
  return null;
}

/** Yalnız bütün karar önkoşulları denetlendikten sonra çağrılır. */
export function icraEt(d: OyunDurumu, s: Secenek, m: MasaKarti): string[] {
  const x = s.icra!;
  d.bosGun -= x.gun;
  if (x.imza) d.imza++;
  if (x.odeme) {
    const soz = sozVer(d, { ...x.odeme, metin: doldur(x.odeme.metin, m.degisken), vade: 0, tek_seferlik: true });
    sozTut(d, soz.id);
  }
  for (const [id, v] of Object.entries(x.hizip ?? {})) {
    const h = id as keyof typeof d.meclis.hizipler;
    d.meclis.hizipler[h] = Math.max(0, Math.min(100, d.meclis.hizipler[h] + v!));
  }
  if (x.maas) for (const e of d.toplum.eylemler.filter(e => e.il === m.degisken.il && e.grup === "grup.isci")) {
    e.dinlendi = true;
    e.emniyet = Math.round(e.emniyet * .7);
    e.duzenleyici = Math.round(e.duzenleyici * .7);
  }
  return [
    x.odeme ? "Hazine tek seferlik ödeme yaptı." : "",
    x.hizip ? "Karar Meclis'teki hiziplerin desteğini değiştirdi." : "",
    x.gun ? `Takvimden ${x.gun} gün ayrıldı.` : "",
    x.imza ? "Bu ayın imza haklarından biri kullanıldı." : "",
  ].filter(Boolean);
}
