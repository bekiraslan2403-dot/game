// Yıllık bütçede taslak, Meclis kabulü ve yürürlük ayrı işlemlerdir.
import type { OyunDurumu } from "./durum.ts";
import { etkiUygula } from "./ekonomi.ts";
import { takvimAyi } from "./takvim.ts";

export const BUTCE_KOMISYONU = "butce_komisyonu";
export const KOMISYON_TERCIHLERI = ["ertele", "ek", "aynen"] as const;
export const KOMISYON_YATIRIM_FARKI = { ertele: -0.1, ek: 0.06, aynen: 0 } as const;

export interface ButcePlani {
  maliYil: number;
  ad: string;
  komisyon: (typeof KOMISYON_TERCIHLERI)[number] | null;
  kabulAy: number | null;
  uygulamaAy: number | null;
}

export function butceTaslakYaz(d: OyunDurumu, ad: string, etkiler: Record<string, number>): void {
  const b = d.meclis.butce;
  b.taslak = { ...etkiler };
  const oylama = d.meclis.oylamalar.find(o => o.tur === "butce");
  if (oylama && !b.plan) {
    // Önceki sürümde açılmış oylamanın takvimi ve paketi korunur.
    oylama.butceEtki = { ...etkiler };
    oylama.baslik += ` — ${ad}`;
    return;
  }
  b.plan = { maliYil: takvimAyi(d.ay).yil + 1, ad, komisyon: null, kabulAy: null, uygulamaAy: null };
}

export function butceKomisyonuBitir(d: OyunDurumu, secim: number): void {
  const b = d.meclis.butce;
  const tercih = KOMISYON_TERCIHLERI[secim]!;
  b.plan!.komisyon = tercih;
  const yatirim = (b.taslak.butce_acigi ?? 0) + KOMISYON_YATIRIM_FARKI[tercih];
  b.taslak.butce_acigi = Math.round(yatirim * 100) / 100;
}

export function butceEtkisiniIsle(d: OyunDurumu, etkiler: Record<string, number>): void {
  for (const [id, v] of Object.entries(etkiler)) etkiUygula(d, id, v, "yatirim");
  const b = d.meclis.butce;
  b.taslak = {};
  b.gider = { ...d.ekonomi.gider };
  b.gelir = { ...d.ekonomi.gelir };
}

export function butceAyBasi(d: OyunDurumu): void {
  const b = d.meclis.butce;
  const plan = b.plan;
  if (!plan || plan.kabulAy === null || plan.uygulamaAy !== null || d.ay <= plan.kabulAy || takvimAyi(d.ay).yil < plan.maliYil) return;
  const fark = b.taslak.butce_acigi ?? 0;
  butceEtkisiniIsle(d, b.taslak);
  plan.uygulamaAy = d.ay;
  const tutar = fark.toLocaleString("tr-TR", { signDisplay: "exceptZero", maximumFractionDigits: 2 });
  const haber = `${plan.maliYil} bütçesi yürürlükte. Yıllık yatırım giderinde millî gelire oranla ${tutar} puan değişim Hazine cetveline işlendi.`;
  d.buAy.olaylar.push(haber);
  d.buAy.haberler.push(haber);
  d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "ekonomi" });
  d.haberler.length = Math.min(d.haberler.length, 120);
}
