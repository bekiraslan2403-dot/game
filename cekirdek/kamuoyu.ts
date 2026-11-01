// Kamuoyu (Sistem 4 · Seçmen grupları ve kamuoyunu ölçmek).
// Grupların tutumu her ay hissedilen ekonomiyle değişir; oyuncu gerçek eğilimi değil, üç anket şirketinin rakamını görür.

import type { OyunDurumu } from "./durum.ts";
import { GOSTERGELER, GOSTERGE, GRUP_KIMLIKLERI, gostergeEkle } from "./gostergeler.ts";
import { hissedilenEnflasyon, haneButcesi } from "./ekonomi.ts";
import { zarNormal } from "./zar.ts";

export interface AnketSirketi {
  id: string;
  ad: string;
  /** İktidar lehine eğilim (puan) */
  egilim: number;
  /** Yanılma payı (puan, yaklaşık iki standart sapma) */
  pay: number;
  /** Kaç ayda bir anket açıklar */
  siklik: number;
  aciklama: string;
}

export const ANKET_SIRKETLERI: readonly AnketSirketi[] = [
  { id: "merkez", ad: "Merkez Araştırma", egilim: 2.5, pay: 2, siklik: 1, aciklama: "İktidara 2–3 puan cömert" },
  { id: "panorama", ad: "Panorama", egilim: -1.5, pay: 2, siklik: 1, aciklama: "Muhalefete 1–2 puan cömert" },
  { id: "saha", ad: "Saha Kamuoyu", egilim: 0, pay: 3, siklik: 2, aciklama: "Yansız ama yavaş; iki ayda bir" },
];

export interface Anket {
  ay: number;
  sirket: string;
  oran: number;
}

/** Hissedilen enflasyonun "olağan" kabul edildiği düzey (başlangıçta sepet yaklaşık bu kadar pahalanıyor). */
const HISSEDILEN_DENGE = 31;

/** Hayat pahalılığına duyarlılık (her 10 puanlık fazla için aylık kayıp) */
const PAHALILIK: Record<string, number> = {
  "grup.emekli": 0.8, "grup.isci": 0.8, "grup.kiraci": 0.7, "grup.kentli": 0.5, "grup.memur": 0.4, "grup.esnaf": 0.4, "grup.genc": 0.3,
};
/** İşsizliğe duyarlılık (her puanlık fazla için aylık kayıp) */
const ISSIZLIK: Record<string, number> = { "grup.genc": 0.5, "grup.isci": 0.4, "grup.kentli": 0.2 };

/** Gerçek oy eğilimi: grupların nüfus payıyla ağırlıklı desteği, rakibin gücüyle düzeltilmiş (%). */
export function gercekDestek(d: OyunDurumu): number {
  let pay = 0, top = 0;
  for (const id of GRUP_KIMLIKLERI) {
    const t = GOSTERGE[id]!;
    pay += (d.gostergeler[id] ?? t.baslangic) * (t.nufus ?? 0);
    top += t.nufus ?? 0;
  }
  return Math.min(80, Math.max(15, pay / top - 0.12 * ((d.gostergeler.rakip ?? 50) - 50)));
}

/** Her şirketin en son açıkladığı anket. */
export function sonAnketler(d: OyunDurumu): Anket[] {
  const s: Anket[] = [];
  for (const k of ANKET_SIRKETLERI) {
    const a = [...d.anketler].reverse().find((x) => x.sirket === k.id);
    if (a) s.push(a);
  }
  return s;
}

/** Ekranda görünen tek rakam: şirketlerin son anketlerinin ortalaması. */
export function anketOrtalamasi(d: OyunDurumu): number | null {
  const s = sonAnketler(d);
  if (!s.length) return null;
  return s.reduce((t, a) => t + a.oran, 0) / s.length;
}

/** Aylara göre anket ortalaması (grafik için). */
export function anketSeyri(d: OyunDurumu): { ay: number; oran: number }[] {
  const aylar = [...new Set(d.anketler.map((a) => a.ay))].sort((a, b) => a - b);
  return aylar.map((ay) => {
    const son: Record<string, number> = {};
    for (const a of d.anketler) if (a.ay <= ay) son[a.sirket] = a.oran;
    const v = Object.values(son);
    return { ay, oran: v.reduce((t, x) => t + x, 0) / v.length };
  });
}

/** Anket şirketleri bu ayın sonunda rakamlarını açıklar. Zarı ilerletir. */
export function anketYap(d: OyunDurumu): void {
  const gercek = gercekDestek(d);
  for (const s of ANKET_SIRKETLERI) {
    if ((d.ay - 1) % s.siklik !== 0) continue;
    const oran = Math.min(85, Math.max(10, gercek + s.egilim + (s.pay / 2) * zarNormal(d.zar)));
    d.anketler.push({ ay: d.ay, sirket: s.id, oran: Math.round(oran * 10) / 10 });
  }
  if (d.anketler.length > 80) d.anketler.splice(0, d.anketler.length - 80);
}

/**
 * Ay sonunda kamuoyu: gruplar hissedilen pahalılığa, işsizliğe ve hanenin geçimine tepki verir; zamanla kendi
 * olağan düzeylerine yavaşça döner. Sosyal huzur da aynı nedenlerle değişir. Girdiyi değiştirir.
 */
export function kamuoyuAySonu(d: OyunDurumu): string[] {
  const olaylar: string[] = [];
  const his = hissedilenEnflasyon(d);
  const U = d.gostergeler.issizlik ?? 8;
  const kalan = haneButcesi(d).kalan;
  for (const id of GRUP_KIMLIKLERI) {
    const t = GOSTERGE[id]!;
    const v = d.gostergeler[id] ?? t.baslangic;
    let fark = -(PAHALILIK[id] ?? 0.2) * ((his - HISSEDILEN_DENGE) / 10) - (ISSIZLIK[id] ?? 0.1) * (U - 8) + 0.03 * (t.baslangic - v);
    if (id === "grup.isci" || id === "grup.kiraci") fark += Math.min(0.5, Math.max(-0.8, kalan / 5000));
    gostergeEkle(d.gostergeler, id, fark);
  }
  const huzur = d.gostergeler.huzur ?? 55;
  gostergeEkle(
    d.gostergeler, "huzur",
    -0.08 * (his - HISSEDILEN_DENGE) - 0.3 * (U - 8) - 0.02 * ((d.gostergeler.kutuplasma ?? 45) - 45) + 0.05 * (55 - huzur),
  );
  const onceki = anketOrtalamasi(d);
  anketYap(d);
  const yeni = anketOrtalamasi(d);
  if (onceki !== null && yeni !== null && Math.abs(yeni - onceki) >= 1.5)
    olaylar.push(`Anketlerde ${yeni > onceki ? "yükseliş" : "düşüş"}: hükümetin oyu ortalama %${yeni.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} oldu.`);
  return olaylar;
}

/** Oyunun başındaki anketler (Ekim 2026; zar kullanmaz). */
export function ilkAnketler(gostergeler: Record<string, number>): Anket[] {
  const g = gercekDestek({ gostergeler } as OyunDurumu);
  return ANKET_SIRKETLERI.map((s) => ({ ay: 0, sirket: s.id, oran: Math.round((g + s.egilim) * 10) / 10 }));
}

/** Gösterge tanımları içinden toplum göstergeleri (ülke ekranı için). */
export const TOPLUM_GOSTERGELERI = GOSTERGELER.filter((g) => g.alan === "toplum");
