// Etkilerin ve değişimlerin ekranda nasıl söyleneceği: ekonomi sayıyla, kamuoyu ve siyaset sözlü (Temel kararlar: karma görünürlük).

import { GOSTERGE, grupTutumu, duzeySozu, rezervSozu } from "../cekirdek/gostergeler.ts";
import { gecikmeliMi } from "../cekirdek/ekonomi.ts";

export type Ton = "iyi" | "kotu" | "notr";

export interface Ifade {
  metin: string;
  ton: Ton;
}

const sayiBicim = (v: number, ondalik: number) =>
  v.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik });

function ton(id: string, fark: number): Ton {
  const iyi = GOSTERGE[id]?.iyi;
  if (!iyi || Math.abs(fark) < 1e-9) return "notr";
  return (iyi === "yuksek") === fark > 0 ? "iyi" : "kotu";
}

function siddet(fark: number): string {
  const a = Math.abs(fark);
  if (a < 1) return "biraz";
  if (a < 2.5) return "";
  if (a < 4) return "belirgin biçimde";
  return "sert biçimde";
}

/** Danışmanın tahminini bir cümle parçasına çevirir. Gecikmeli etkiler "aylar içinde" diye belirtilir. */
export function etkiIfadesi(id: string, deger: number, gecikmeli = false): Ifade {
  const t = GOSTERGE[id];
  if (!t) return { metin: id, ton: "notr" };
  const yon = deger > 0;
  if (t.alan === "ekonomi" && t.gorunum === "sayi") {
    const isaret = yon ? "+" : "−";
    const birim = t.birim === "TL" ? " TL" : " puan";
    const ek = gecikmeli || gecikmeliMi(id) ? " (aylar içinde)" : "";
    return { metin: `${t.ad} ${isaret}${sayiBicim(Math.abs(deger), t.birim === "TL" || id === "butce_acigi" ? 2 : 1)}${birim}${ek}`, ton: ton(id, deger) };
  }
  const s = siddet(deger);
  if (t.alan === "secmen") return { metin: `${t.ad} ${yon ? "memnun olur" : "kızar"}${s ? ` (${s.replace(" biçimde", "")})` : ""}`, ton: ton(id, deger) };
  return { metin: `${t.ad} ${s ? s + " " : ""}${yon ? "artar" : "azalır"}`, ton: ton(id, deger) };
}

/** Ay sonu raporundaki bir değişimi yazar. */
export function degisimIfadesi(id: string, once: number, sonra: number): Ifade | null {
  const t = GOSTERGE[id];
  if (!t) return null;
  const fark = sonra - once;
  if (t.alan === "ekonomi" && t.gorunum === "sayi") {
    const esik = t.birim === "TL" ? 0.005 : 0.05;
    if (Math.abs(fark) < esik) return null;
    const o = t.birim === "TL" ? 2 : 1;
    const b = (v: number) => (t.birim === "TL" ? `${sayiBicim(v, o)} TL` : `%${sayiBicim(v, o)}`);
    return { metin: `${t.ad}: ${b(once)} → ${b(sonra)}`, ton: ton(id, fark) };
  }
  const soz = t.alan === "secmen" ? grupTutumu : id === "rezerv" ? rezervSozu : duzeySozu;
  const a = soz(once), b = soz(sonra);
  if (a !== b) return { metin: `${t.ad}: ${a} → ${b}`, ton: ton(id, fark) };
  if (Math.abs(fark) < 1) return null;
  return { metin: `${t.ad}: ${b} (${fark > 0 ? "yükseliyor" : "geriliyor"})`, ton: ton(id, fark) };
}

/** Trilyon TL cinsinden bir tutarı yazar: "3,20 trilyon TL", "850 milyar TL". */
export function tutarYaz(trilyon: number): string {
  const a = Math.abs(trilyon);
  if (a >= 1) return `${sayiBicim(trilyon, 2)} trilyon TL`;
  const kisa = (v: number) => v.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
  if (a >= .001) return `${kisa(trilyon * 1_000)} milyar TL`;
  if (a >= .000001) return `${kisa(trilyon * 1_000_000)} milyon TL`;
  if (a >= .000000001) return `${kisa(trilyon * 1_000_000_000)} bin TL`;
  return tlYaz(trilyon * 1_000_000_000_000);
}

/** TL tutarı, kuruşsuz ve binlik ayraçlı: "28.000 TL". */
export function tlYaz(tl: number): string {
  return `${Math.round(tl).toLocaleString("tr-TR")} TL`;
}

/** Yüzde, Türkçe yazımla: "%29,4". */
export function yuzdeYaz(v: number, ondalik = 1): string {
  return `${v < 0 ? "−" : ""}%${sayiBicim(Math.abs(v), ondalik)}`;
}
