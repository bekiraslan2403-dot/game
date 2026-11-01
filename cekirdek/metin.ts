// Metin şablonları: "{il:de} grev başladı" + { il: "Yalıkent" } → "Yalıkent'te grev başladı".
// Yer tutucu biçimi: {ad} ya da {ad:ek}. Ekler: de, deki, den, e, i, in, le.

import { ek, type EkTuru } from "./ekler.ts";

const EKLER: readonly EkTuru[] = ["de", "deki", "den", "e", "i", "in", "le"];
const YER_TUTUCU = /\{([a-z_]+)(?::([a-z]+))?\}/g;

export interface YerTutucu {
  ad: string;
  ek: EkTuru | null;
}

/** Bir şablondaki yer tutucuları listeler; geçersiz ek varsa hata fırlatır. */
export function yerTutucular(sablon: string): YerTutucu[] {
  const sonuc: YerTutucu[] = [];
  for (const m of sablon.matchAll(YER_TUTUCU)) {
    const ad = m[1] as string;
    const e = m[2];
    if (e !== undefined && !EKLER.includes(e as EkTuru)) throw new Error(`Bilinmeyen ek "{${ad}:${e}}"`);
    sonuc.push({ ad, ek: (e as EkTuru | undefined) ?? null });
  }
  return sonuc;
}

/** Şablonu doldurur. Tanımsız bir değişken hata fırlatır; metinde asla "{il}" görünmez. */
export function doldur(sablon: string, degiskenler: Readonly<Record<string, string>>): string {
  return sablon.replace(YER_TUTUCU, (_tum, ad: string, e?: string) => {
    const deger = degiskenler[ad];
    if (deger === undefined) throw new Error(`Şablon değişkeni tanımsız: {${ad}}`);
    return e ? ek(deger, e as EkTuru) : deger;
  });
}

/** Bir metindeki sözcük sayısı (uzunluk denetimi için). */
export function sozcukSayisi(metin: string): number {
  return metin.trim().split(/\s+/).filter(Boolean).length;
}
