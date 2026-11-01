// Politika dosyası: kademeli politikalar ve yönetmelikler (Uygulama planı · Kapsam genişlemesi).
// Kararname hemen yürürlüğe girer; kanun ay sonunda Meclis'te oylanır. Her ay en fazla IMZA_HAKKI değişiklik.

import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Politika } from "./icerik.ts";
import type { EylemSonucu, Tahmin } from "./karar.ts";
import { etkiUygula } from "./ekonomi.ts";
import { zarSayi } from "./zar.ts";

export const IMZA_HAKKI = 3;

export interface MeclisTeklifi {
  politika: string;
  hedef: number;
  /** Teklifin verildiği oyun ayı */
  ay: number;
}

export function seviye(d: OyunDurumu, p: Politika): number {
  return d.politika[p.id] ?? p.baslangic;
}

export function bekleyenTeklif(d: OyunDurumu, id: string): MeclisTeklifi | undefined {
  return d.meclisGundemi.find((t) => t.politika === id);
}

/** Meclis'te bir kanun teklifinin geçme olasılığı (Meclis sistemi gelene kadar basit bir kural). */
export function meclisDestegi(d: OyunDurumu, p?: Politika): number {
  const parti = d.gostergeler.parti_ici ?? 30;
  const kutup = d.gostergeler.kutuplasma ?? 45;
  const temel = p?.temel_hak ? 0.12 : 0;
  return Math.min(0.92, Math.max(0.2, 0.86 - parti / 160 - kutup / 450 - temel));
}

/** Bir kademe değişikliğinin danışman tahmini (durumu değiştirmez). */
export function politikaTahmini(d: OyunDurumu, p: Politika, hedef: number): Tahmin[] {
  const adim = hedef - seviye(d, p);
  if (!adim) return [];
  return Object.entries(p.adim).map(([id, v]) => ({ id, deger: v * adim }));
}

/** Bir politika ya da yönetmeliğin kademesini değiştirir (kararname) ya da Meclis'e teklif eder (kanun). */
export function politikaDegistir(d: OyunDurumu, icerik: IcerikPaketi, id: string, hedef: number): EylemSonucu {
  const p = icerik.politikalar[id];
  if (!p) return { ok: false, neden: "Böyle bir politika yok." };
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  if (!Number.isInteger(hedef) || hedef < 0 || hedef >= p.kademeler.length) return { ok: false, neden: "Geçersiz kademe." };
  if (hedef === seviye(d, p)) return { ok: false, neden: "Politika zaten bu kademede." };
  if (bekleyenTeklif(d, id)) return { ok: false, neden: "Bu konuda bir kanun teklifi Meclis'te bekliyor." };
  if (d.imza >= IMZA_HAKKI) return { ok: false, neden: `Bu ay ${IMZA_HAKKI} imza hakkının hepsi kullanıldı.` };
  d.imza += 1;
  const yeni = p.kademeler[hedef]!;
  if (p.yol === "kanun") {
    d.meclisGundemi.push({ politika: id, hedef, ay: d.ay });
    const haber = `${p.ad}: “${yeni}” için kanun teklifi Meclis'e sunuldu; ay sonunda oylanacak.`;
    haberYaz(d, haber);
    return { ok: true, haber };
  }
  uygula(d, p, hedef);
  const haber = `${p.ad}: Cumhurbaşkanı kararnamesiyle “${yeni}” dönemi başladı.`;
  haberYaz(d, haber);
  return { ok: true, haber };
}

/** Bekleyen kanun teklifini geri çeker (imza iade edilmez). */
export function teklifiGeriCek(d: OyunDurumu, id: string): EylemSonucu {
  if (!bekleyenTeklif(d, id)) return { ok: false, neden: "Bu konuda bekleyen bir teklif yok." };
  d.meclisGundemi = d.meclisGundemi.filter((t) => t.politika !== id);
  return { ok: true };
}

function uygula(d: OyunDurumu, p: Politika, hedef: number): void {
  const adim = hedef - seviye(d, p);
  for (const [g, v] of Object.entries(p.adim)) etkiUygula(d, g, v * adim, p.kalem ?? "sosyal");
  d.politika[p.id] = hedef;
}

function haberYaz(d: OyunDurumu, haber: string): void {
  d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "politika" });
  if (d.haberler.length > 120) d.haberler.length = 120;
  d.buAy.haberler.push(haber);
}

/** Ay sonunda Meclis'teki kanun teklifleri oylanır. Zarı ilerletir. */
export function meclisOylamasi(d: OyunDurumu, icerik: IcerikPaketi): string[] {
  const olaylar: string[] = [];
  for (const t of d.meclisGundemi) {
    const p = icerik.politikalar[t.politika];
    if (!p) continue;
    const yeni = p.kademeler[t.hedef] ?? "";
    if (zarSayi(d.zar) < meclisDestegi(d, p)) {
      uygula(d, p, t.hedef);
      olaylar.push(`Meclis kabul etti: ${p.ad} — “${yeni}”.`);
    } else {
      d.gostergeler.parti_ici = Math.min(100, (d.gostergeler.parti_ici ?? 30) + 1.5);
      olaylar.push(`Meclis reddetti: ${p.ad} — “${yeni}”. Partiden fire verildi.`);
    }
  }
  d.meclisGundemi = [];
  return olaylar;
}

/** Bir değişiklik sonrası vatandaşların söylediklerinden biri (kararlı seçim). */
export function vatandasSesi(d: OyunDurumu, p: Politika, artis: boolean): string {
  const l = artis ? p.sesler.artis : p.sesler.azalis;
  return l[(d.ay + d.imza + p.id.length) % l.length] ?? "";
}
