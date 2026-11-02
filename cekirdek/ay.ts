// Ayın akışı: ay başı (masa kurulur), ay sonu (kayıt, rapor, sonraki ay).

import { durumKopya, oyunBittiMi, sonAyMi, bosAyKaydi, AYLIK_BOS_GUN, type OyunDurumu, type AyKaydi } from "./durum.ts";
import type { IcerikPaketi } from "./icerik.ts";
import { masaKur } from "./deste.ts";
import { GOSTERGELER } from "./gostergeler.ts";
import { ekonomiAySonu } from "./ekonomi.ts";
import { sozleriDenetle } from "./hazine.ts";
import { meclisOylamasi } from "./politika.ts";
import { kamuoyuAySonu } from "./kamuoyu.ts";
import { kapiKur, kapiKapanis, eylemlerAySonu, hayatlarAySonu, gazeteKur } from "./toplum.ts";

import { yonetimAyBasi, yonetimAySonu } from "./yonetim.ts";
import { gundemKur, basinGazeteleri } from "./medya.ts";
import { rakipHamlesi, secimiHazirla } from "./secim.ts";
import { meclisAyBasi, hizipleriGuncelle } from "./meclis.ts";

export type AySonucu = { ok: true; durum: OyunDurumu; rapor: AyKaydi } | { ok: false; neden: string };

/** Ay başı: takvim ve erteleme hakkı yenilenir, masa kurulur. Girdiyi değiştirir. */
export function ayiAc(d: OyunDurumu, icerik: IcerikPaketi): void {
  d.ayBasi = { ...d.gostergeler };
  d.bosGun = AYLIK_BOS_GUN;
  d.ertelemeKullanildi = false;
  d.imza = 0;
  d.buAy = bosAyKaydi(d.ay);
  d.masaKuruldu = false;
  d.masa = [];
  meclisAyBasi(d, icerik);
  yonetimAyBasi(d, icerik);
  masaKur(d, icerik);
  gundemKur(d);
  if (!d.toplum.kapi.length) kapiKur(d, icerik);
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
  if (onceki.meclis.kulis) return { ok: false, neden: "Önce kulis görüşmesini bitirin." };
  if (onceki.masa.length) return { ok: false, neden: `Masada ${onceki.masa.length} karar bekliyor.` };
  if (onceki.yonetim.medya.basin || onceki.yonetim.secim.sahne) return { ok:false, neden:"Önce açık sahneyi bitirin." };
  if (onceki.yonetim.secim.gece) return { ok:false, neden:"Seçim gecesi başladı." };
  const d = durumKopya(onceki);
  const kayit = d.buAy;
  hizipleriGuncelle(d);
  // Ay sonu: Meclis oylaması, sözlerin vadesi, ekonominin bir aylık ilerleyişi, kamuoyu ve anketler
  const olaylar = [
    ...meclisOylamasi(d, icerik),
    ...sozleriDenetle(d),
    ...ekonomiAySonu(d, (id) => icerik.kartlar[id]?.tur === "acil").olaylar,
    ...yonetimAySonu(d),
    ...kamuoyuAySonu(d),
    rakipHamlesi(d),
    ...kapiKapanis(d, icerik),
    ...eylemlerAySonu(d, icerik),
  ];
  kayit.hayatlar = hayatlarAySonu(d, icerik);
  if(!basinGazeteleri(d,icerik))gazeteKur(d, icerik);
  for (const o of olaylar) d.haberler.unshift({ ay: d.ay, metin: o, kategori: "ekonomi" });
  if (d.haberler.length > 120) d.haberler.length = 120;
  kayit.olaylar.push(...olaylar);
  kayit.degisim = GOSTERGELER.map((g) => ({ id: g.id, once: d.ayBasi[g.id] ?? g.baslangic, sonra: d.gostergeler[g.id] ?? g.baslangic }))
    .filter((x) => Math.abs(x.sonra - x.once) > 1e-9);
  d.gecmis.push(kayit);
  if (sonAyMi(d)) { if (!d.bitis) secimiHazirla(d, icerik); }
  else if (!d.bitis) { d.ay += 1; ayiAc(d, icerik); }
  return { ok: true, durum: d, rapor: kayit };
}
