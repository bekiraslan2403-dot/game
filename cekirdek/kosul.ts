// Kart koşullarının değerlendirilmesi ve değişken çözücüler.

import type { OyunDurumu, Degiskenler } from "./durum.ts";
import type { IcerikPaketi, Kart, Kosul, Cozucu } from "./icerik.ts";
import { takvimAyi } from "./takvim.ts";
import { zarSec } from "./zar.ts";

/** Koşul sağlanıyor mu? Politika koşulu için içerik paketi gerekir (başlangıç kademeleri oradadır). */
export function kosulSaglaniyor(d: OyunDurumu, k: Kosul, icerik?: IcerikPaketi): boolean {
  if (k.ay_en_az !== undefined && d.ay < k.ay_en_az) return false;
  if (k.ay_en_cok !== undefined && d.ay > k.ay_en_cok) return false;
  if (k.takvim_ayi && !k.takvim_ayi.includes(takvimAyi(d.ay).ay)) return false;
  for (const [b, v] of Object.entries(k.bayrak ?? {})) if (d.bayraklar[b] !== v) return false;
  for (const b of k.bayrak_yok ?? []) if (d.bayraklar[b] !== undefined) return false;
  for (const [kim, s] of Object.entries(k.iliski ?? {})) {
    const v = d.anlati.iliskiler[kim] ?? 50;
    if (s.en_az !== undefined && v < s.en_az) return false;
    if (s.en_cok !== undefined && v > s.en_cok) return false;
  }
  for (const [id, s] of Object.entries(k.politika ?? {})) {
    const v = d.politika[id] ?? icerik?.politikalar[id]?.baslangic;
    if (v === undefined) return false;
    if (s.en_az !== undefined && v < s.en_az) return false;
    if (s.en_cok !== undefined && v > s.en_cok) return false;
  }
  for (const [g, s] of Object.entries(k.gosterge ?? {})) {
    const v = d.gostergeler[g];
    if (v === undefined) return false;
    if (s.en_az !== undefined && v < s.en_az) return false;
    if (s.en_cok !== undefined && v > s.en_cok) return false;
  }
  return true;
}

/** Bir değişkenin değerini çözer (kart masaya geldiğinde bir kez; zincirde devralınır). Zarı ilerletir. */
export function cozucuCalistir(d: OyunDurumu, icerik: IcerikPaketi, c: Cozucu): string {
  const S = icerik.sehirler;
  const ad = (liste: typeof S) => zarSec(d.zar, liste.length ? liste : S).ad;
  switch (c) {
    case "rastgele_sehir": return ad(S);
    case "muhalif_sehir": return ad(S.filter((s) => s.belediye === "muhalefet"));
    case "iktidar_sehir": return ad(S.filter((s) => s.belediye === "iktidar"));
    case "baskent": return (S.find((s) => s.baskent) ?? S[0])!.ad;
  }
}

/** Kartın değişkenlerini çözer; devralınan değerler korunur. */
export function degiskenCoz(d: OyunDurumu, icerik: IcerikPaketi, kart: Kart, devralinan: Degiskenler = {}): Degiskenler {
  const sonuc: Degiskenler = {};
  for (const [ad, c] of Object.entries(kart.degiskenler)) sonuc[ad] = devralinan[ad] ?? cozucuCalistir(d, icerik, c);
  return sonuc;
}
