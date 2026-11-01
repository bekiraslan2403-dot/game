// Deste: ay başında masanın doldurulması (Sistem 1 · Kartların seçilme kuralı).
// Sıra: zamanı gelen bekleyen kartlar → ayın ana kararı → 2–3 masa kartı.

import type { OyunDurumu, MasaKarti, Degiskenler } from "./durum.ts";
import type { IcerikPaketi, Kart } from "./icerik.ts";
import { kosulSaglaniyor, degiskenCoz } from "./kosul.ts";
import { zarAgirlikli } from "./zar.ts";
import { takvimAyi } from "./takvim.ts";

export const TEKRAR_ARALIGI = 12;
export const KATEGORI_SINIRI = 2;

function ornekEkle(d: OyunDurumu, kart: Kart, degisken: Degiskenler, agir: boolean): MasaKarti {
  d.sayac += 1;
  const m: MasaKarti = { ornek: `${kart.id}#${d.sayac}`, kart: kart.id, degisken, agir, ikinciGorus: false };
  d.masa.push(m);
  d.gorulen[kart.id] = d.ay;
  return m;
}

/** Kart rastgele seçime uygun mu? (bekleyen kartlar bu denetimden geçmez) */
export function rastgeleUygun(d: OyunDurumu, kart: Kart): boolean {
  if (kart.tur === "zincir" || kart.tur === "acil") return false;
  if (kart.zincir && kart.asama !== "tohum") return false;
  const son = d.gorulen[kart.id];
  if (son !== undefined && !kart.tekrar) return false;
  if (son !== undefined && d.ay - son < TEKRAR_ARALIGI) return false;
  if (d.masa.some((m) => m.kart === kart.id)) return false;
  if (d.bekleyen.some((b) => b.kart === kart.id)) return false;
  return kosulSaglaniyor(d, kart.kosul);
}

/** Ay başında masayı kurar. Masa önceden kurulduysa hiçbir şey yapmaz. */
export function masaKur(d: OyunDurumu, icerik: IcerikPaketi): void {
  if (d.masaKuruldu) return;
  const K = icerik.kartlar;

  // 1. Zamanı gelen bekleyen kartlar (zincirler, ertelenenler)
  const zamani = d.bekleyen.filter((b) => b.ay <= d.ay);
  d.bekleyen = d.bekleyen.filter((b) => b.ay > d.ay);
  for (const b of zamani) {
    const kart = K[b.kart];
    if (kart) ornekEkle(d, kart, degiskenCoz(d, icerik, kart, b.degisken), b.agir);
  }

  // 2. Ayın ana kararı: takvime bağlı kart önce gelir
  if (!d.masa.some((m) => K[m.kart]?.tur === "ana")) {
    const anaAday = Object.values(K).filter((k) => k.tur === "ana" && rastgeleUygun(d, k));
    const buAy = takvimAyi(d.ay).ay;
    const takvimli = anaAday.filter((k) => k.kosul.takvim_ayi?.includes(buAy));
    const havuz = takvimli.length ? takvimli : anaAday.filter((k) => !k.kosul.takvim_ayi);
    if (havuz.length) {
      const k = zarAgirlikli(d.zar, havuz, (x) => x.agirlik);
      ornekEkle(d, k, degiskenCoz(d, icerik, k), false);
    }
  }

  // 3. Masa kartları: zincir kartı geldiyse 2, gelmediyse 3
  const zincirVar = zamani.some((b) => K[b.kart]?.zincir);
  const hedef = zincirVar ? 2 : 3;
  const getirenler = new Set(d.masa.map((m) => K[m.kart]?.getiren));
  for (let eklenen = 0; eklenen < hedef; ) {
    const kategoriSay = (kat: string) => d.masa.filter((m) => K[m.kart]?.kategori === kat).length;
    const havuz = Object.values(K).filter(
      (k) => k.tur === "masa" && rastgeleUygun(d, k) && kategoriSay(k.kategori) < KATEGORI_SINIRI && !getirenler.has(k.getiren),
    );
    if (!havuz.length) break;
    const k = zarAgirlikli(d.zar, havuz, (x) => x.agirlik);
    ornekEkle(d, k, degiskenCoz(d, icerik, k), false);
    getirenler.add(k.getiren);
    eklenen++;
  }
  // Ana karar her zaman ilk sırada
  d.masa.sort((a, b) => Number(K[b.kart]?.tur === "ana") - Number(K[a.kart]?.tur === "ana"));
  d.masaKuruldu = true;
}
