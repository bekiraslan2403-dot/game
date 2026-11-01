// Oyun durumu: oyunun tamamı bu tek nesnede tutulur ve kayıt dosyasına yazılır.
// Kural: durum yalnız düz veridir (sayı, metin, dizi, nesne); fonksiyon, sınıf ya da tarih nesnesi içermez.

import { zarKur, type ZarDurumu } from "./zar.ts";
import { DONEM_AY_SAYISI } from "./takvim.ts";

/** Durum biçimi her değiştiğinde artırılır; eski kayıtlar kayit.ts içindeki göçlerle güncellenir. */
export const DURUM_SURUMU = 1;

export type BitisTuru = "yeniden_secilme" | "yenilgi" | "devrilme" | "istifa";

export interface Bitis {
  tur: BitisTuru;
  ay: number;
  aciklama: string;
}

export type SicilTuru = "usulsuzluk" | "yalan" | "kirilan_soz" | "baski";

/** Gizli bedel: ifşa olursa bir olay zinciri başlatır, olmazsa sonsözde anlatılır. */
export interface SicilKaydi {
  id: string;
  tur: SicilTuru;
  kaynak: string;
  ay: number;
  ifsaOldu: boolean;
}

/** Ayın sonunda ne olduğunun kısa kaydı; ay sonu raporu ve sonsöz bunu kullanır. */
export interface AyKaydi {
  ay: number;
  kararlar: { kart: string; secenek: number }[];
  olaylar: string[];
}

export interface OyunDurumu {
  surum: number;
  tohum: number;
  zar: ZarDurumu;
  /** Oyunun kaçıncı ayı (1–18) */
  ay: number;
  bitis: Bitis | null;
  sicil: SicilKaydi[];
  /** Olay zincirleri ve içerik koşulları için genel bayraklar */
  bayraklar: Record<string, boolean | number | string>;
  gecmis: AyKaydi[];
}

/** Belirli bir tohumla yeni bir oyun durumu kurar. */
export function yeniOyun(tohum: number): OyunDurumu {
  if (!Number.isInteger(tohum)) throw new RangeError("yeniOyun: tohum bir tamsayı olmalı");
  return {
    surum: DURUM_SURUMU,
    tohum,
    zar: zarKur(tohum),
    ay: 1,
    bitis: null,
    sicil: [],
    bayraklar: {},
    gecmis: [],
  };
}

/** Rastgele bir tohum üretir (yalnız yeni oyun başlatırken kullanılır). */
export function rastgeleTohum(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Oyun bitti mi? */
export function oyunBittiMi(d: OyunDurumu): boolean {
  return d.bitis !== null;
}

/** Dönemin son ayı mı? */
export function sonAyMi(d: OyunDurumu): boolean {
  return d.ay >= DONEM_AY_SAYISI;
}

/** Durumun derin kopyası (durum düz veri olduğu için güvenlidir). */
export function durumKopya(d: OyunDurumu): OyunDurumu {
  return structuredClone(d);
}
