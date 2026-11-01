// Ayın akışı: ay başı (masa kurulur), ay sonu (kayıt, rapor, sonraki ay).

import { durumKopya, oyunBittiMi, sonAyMi, bosAyKaydi, AYLIK_BOS_GUN, type OyunDurumu, type AyKaydi } from "./durum.ts";
import type { IcerikPaketi } from "./icerik.ts";
import { masaKur } from "./deste.ts";
import { GOSTERGELER } from "./gostergeler.ts";
import { ekonomiAySonu } from "./ekonomi.ts";
import { sozleriDenetle } from "./hazine.ts";

export type AySonucu = { ok: true; durum: OyunDurumu; rapor: AyKaydi } | { ok: false; neden: string };

/** Ay başı: takvim ve erteleme hakkı yenilenir, masa kurulur. Girdiyi değiştirir. */
export function ayiAc(d: OyunDurumu, icerik: IcerikPaketi): void {
  d.ayBasi = { ...d.gostergeler };
  d.bosGun = AYLIK_BOS_GUN;
  d.ertelemeKullanildi = false;
  d.buAy = bosAyKaydi(d.ay);
  d.masaKuruldu = false;
  d.masa = [];
  masaKur(d, icerik);
}

/** Yeni oyunu başlatır: ilk ayın masasını kurar. */
export function oyunuBaslat(d: OyunDurumu, icerik: IcerikPaketi): OyunDurumu {
  const y = durumKopya(d);
  ayiAc(y, icerik);
  return y;
}

/** Ayı kapatır ve bir sonraki ayı açar. Girdi durumunu değiştirmez; yeni durum ve ayın raporu döner. */
export function ayiBitir(onceki: OyunDurumu, icerik: IcerikPaketi): AySonucu {
  if (oyunBittiMi(onceki)) return { ok: false, neden: "Oyun sona erdi." };
  if (onceki.masa.length) return { ok: false, neden: `Masada ${onceki.masa.length} karar bekliyor.` };
  if (sonAyMi(onceki)) return { ok: false, neden: "Dönemin son ayı; seçim henüz oyuna eklenmedi." };
  const d = durumKopya(onceki);
  const kayit = d.buAy;
  // Ay sonu: önce sözlerin vadesi, sonra ekonominin bir aylık ilerleyişi
  const olaylar = [...sozleriDenetle(d), ...ekonomiAySonu(d, (id) => icerik.kartlar[id]?.tur === "acil").olaylar];
  for (const o of olaylar) d.haberler.unshift({ ay: d.ay, metin: o, kategori: "ekonomi" });
  if (d.haberler.length > 120) d.haberler.length = 120;
  kayit.olaylar.push(...olaylar);
  kayit.degisim = GOSTERGELER.map((g) => ({ id: g.id, once: d.ayBasi[g.id] ?? g.baslangic, sonra: d.gostergeler[g.id] ?? g.baslangic }))
    .filter((x) => Math.abs(x.sonra - x.once) > 1e-9);
  d.gecmis.push(kayit);
  d.ay += 1;
  ayiAc(d, icerik);
  return { ok: true, durum: d, rapor: kayit };
}
