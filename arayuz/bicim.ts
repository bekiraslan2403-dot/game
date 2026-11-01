// Etkilerin ve değişimlerin ekranda nasıl söyleneceği: ekonomi sayıyla, kamuoyu ve siyaset sözlü (Temel kararlar: karma görünürlük).

import { GOSTERGE, grupTutumu, duzeySozu } from "../cekirdek/gostergeler.ts";

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

/** Danışmanın tahminini bir cümle parçasına çevirir. */
export function etkiIfadesi(id: string, deger: number): Ifade {
  const t = GOSTERGE[id];
  if (!t) return { metin: id, ton: "notr" };
  const yon = deger > 0;
  if (t.alan === "ekonomi" && t.gorunum === "sayi") {
    const isaret = yon ? "+" : "−";
    const birim = t.birim === "TL" ? " TL" : " puan";
    return { metin: `${t.ad} ${isaret}${sayiBicim(Math.abs(deger), t.birim === "TL" ? 2 : 1)}${birim}`, ton: ton(id, deger) };
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
  const soz = t.alan === "secmen" ? grupTutumu : duzeySozu;
  const a = soz(once), b = soz(sonra);
  if (a !== b) return { metin: `${t.ad}: ${a} → ${b}`, ton: ton(id, fark) };
  if (Math.abs(fark) < 1) return null;
  return { metin: `${t.ad}: ${b} (${fark > 0 ? "yükseliyor" : "geriliyor"})`, ton: ton(id, fark) };
}
