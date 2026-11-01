// Oyun takvimi: dönem Kasım 2026'da başlar, 18. ayın sonunda (Nisan 2028) seçim yapılır.

export const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
] as const;

export const BASLANGIC = { yil: 2026, ay: 11 } as const;
export const DONEM_AY_SAYISI = 18;
export const KAMPANYA_AY_SAYISI = 3;

export interface TakvimAyi {
  yil: number;
  /** 1–12 */
  ay: number;
}

/** Oyunun kaçıncı ayının (1'den başlar) takvimde hangi aya denk geldiğini verir. */
export function takvimAyi(oyunAyi: number): TakvimAyi {
  if (!Number.isInteger(oyunAyi) || oyunAyi < 1) throw new RangeError(`takvimAyi: geçersiz oyun ayı ${oyunAyi}`);
  const sifirdan = BASLANGIC.ay - 1 + (oyunAyi - 1);
  return { yil: BASLANGIC.yil + Math.floor(sifirdan / 12), ay: (sifirdan % 12) + 1 };
}

/** "Kasım 2026" biçiminde ad. */
export function tarihAdi(oyunAyi: number): string {
  const t = takvimAyi(oyunAyi);
  return `${AY_ADLARI[t.ay - 1]} ${t.yil}`;
}

/** Kampanya evresinde mi (son 3 ay)? */
export function kampanyaMi(oyunAyi: number): boolean {
  return oyunAyi > DONEM_AY_SAYISI - KAMPANYA_AY_SAYISI && oyunAyi <= DONEM_AY_SAYISI;
}

/** Seçime kaç ay kaldı (seçim 18. ayın sonunda). */
export function secimeKalanAy(oyunAyi: number): number {
  return Math.max(0, DONEM_AY_SAYISI - oyunAyi);
}
