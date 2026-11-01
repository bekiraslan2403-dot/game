// Tohumlu rastgelelik (sfc32). Zarın durumu oyun durumunun içinde saklanır;
// aynı tohum ve aynı kararlar her zaman aynı oyunu üretir.

export interface ZarDurumu {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Bir tamsayı tohumdan zar durumu kurar. Aynı tohum aynı diziyi verir. */
export function zarKur(tohum: number): ZarDurumu {
  // splitmix32 ile tohumu dört parçaya yay
  let t = tohum >>> 0;
  const sonraki = (): number => {
    t = (t + 0x9e3779b9) >>> 0;
    let z = t;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
  const zar: ZarDurumu = { a: sonraki(), b: sonraki(), c: sonraki(), d: sonraki() };
  // İlk değerleri at; zayıf tohumlarda dağılımı düzeltir
  for (let i = 0; i < 12; i++) zarSayi(zar);
  return zar;
}

/** [0, 1) aralığında bir sayı üretir ve zar durumunu ilerletir. */
export function zarSayi(z: ZarDurumu): number {
  const t = (((z.a + z.b) >>> 0) + z.d) >>> 0;
  z.d = (z.d + 1) >>> 0;
  z.a = (z.b ^ (z.b >>> 9)) >>> 0;
  z.b = (z.c + (z.c << 3)) >>> 0;
  z.c = ((z.c << 21) | (z.c >>> 11)) >>> 0;
  z.c = (z.c + t) >>> 0;
  return t / 4294967296;
}

/** [en az, en çok] aralığında bir tamsayı (iki uç dahil). */
export function zarTam(z: ZarDurumu, enAz: number, enCok: number): number {
  if (enCok < enAz) throw new RangeError(`zarTam: geçersiz aralık ${enAz}..${enCok}`);
  return enAz + Math.floor(zarSayi(z) * (enCok - enAz + 1));
}

/** Verilen olasılıkla true döner (0 ≤ olasılık ≤ 1). */
export function zarOlasilik(z: ZarDurumu, olasilik: number): boolean {
  return zarSayi(z) < olasilik;
}

/** Listeden eşit olasılıkla bir öğe seçer. */
export function zarSec<T>(z: ZarDurumu, liste: readonly T[]): T {
  if (liste.length === 0) throw new RangeError("zarSec: boş liste");
  return liste[Math.floor(zarSayi(z) * liste.length)] as T;
}

/** Ağırlıklara göre bir öğe seçer. Ağırlıklar negatif olamaz, toplamları sıfırdan büyük olmalıdır. */
export function zarAgirlikli<T>(z: ZarDurumu, liste: readonly T[], agirlik: (oge: T) => number): T {
  let toplam = 0;
  for (const oge of liste) {
    const w = agirlik(oge);
    if (w < 0 || !Number.isFinite(w)) throw new RangeError("zarAgirlikli: geçersiz ağırlık");
    toplam += w;
  }
  if (toplam <= 0) throw new RangeError("zarAgirlikli: ağırlıkların toplamı sıfır");
  let kalan = zarSayi(z) * toplam;
  for (const oge of liste) {
    kalan -= agirlik(oge);
    if (kalan < 0) return oge;
  }
  return liste[liste.length - 1] as T;
}

/** Listeyi yerinde karıştırır (Fisher–Yates). */
export function zarKaristir<T>(z: ZarDurumu, liste: T[]): T[] {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(zarSayi(z) * (i + 1));
    const gecici = liste[i] as T;
    liste[i] = liste[j] as T;
    liste[j] = gecici;
  }
  return liste;
}

/** Normal dağılıma yakın bir sapma (ortalama 0, standart sapma 1). */
export function zarNormal(z: ZarDurumu): number {
  let u = 0;
  while (u === 0) u = zarSayi(z);
  const v = zarSayi(z);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
