// Oyun durumu: oyunun tamamı bu tek nesnede tutulur ve kayıt dosyasına yazılır.
// Kural: durum yalnız düz veridir (sayı, metin, dizi, nesne); fonksiyon, sınıf ya da tarih nesnesi içermez.

import { zarKur, type ZarDurumu } from "./zar.ts";
import { DONEM_AY_SAYISI } from "./takvim.ts";
import { gostergeBaslangic } from "./gostergeler.ts";

/** Durum biçimi her değiştiğinde artırılır; eski kayıtlar kayit.ts içindeki göçlerle güncellenir. */
export const DURUM_SURUMU = 2;

/** Her ay takvimdeki boş gün sayısı (ikinci görüş, sahneler ve ziyaretler bundan harcar). */
export const AYLIK_BOS_GUN = 4;

export type BitisTuru = "yeniden_secilme" | "yenilgi" | "devrilme" | "istifa";
export type SicilTuru = "usulsuzluk" | "yalan" | "kirilan_soz" | "baski";
export type Degiskenler = Record<string, string>;

export interface Bitis {
  tur: BitisTuru;
  ay: number;
  aciklama: string;
}

/** Gizli bedel: ifşa olursa bir olay zinciri başlatır, olmazsa sonsözde anlatılır. */
export interface SicilKaydi {
  id: string;
  tur: SicilTuru;
  kaynak: string;
  ay: number;
  ifsaOldu: boolean;
}

/** Masadaki bir kart örneği. Aynı kart farklı değişkenlerle ikinci kez gelebilir. */
export interface MasaKarti {
  ornek: string;
  kart: string;
  degisken: Degiskenler;
  /** Ertelendiği için ağırlaşmış mı (etkiler 1,5 kat) */
  agir: boolean;
  ikinciGorus: boolean;
}

/** İleri bir ayda masaya gelecek kart (zincirin sonraki aşaması ya da ertelenen kart). */
export interface BekleyenKart {
  kart: string;
  ay: number;
  degisken: Degiskenler;
  agir: boolean;
}

export interface Haber {
  ay: number;
  metin: string;
  kategori: string;
}

export interface VerilenKarar {
  kart: string;
  baslik: string;
  secenek: number;
  secenekMetni: string;
}

/** Ayın sonunda ne olduğunun kaydı; ay sonu raporu ve sonsöz bunu kullanır. */
export interface AyKaydi {
  ay: number;
  kararlar: VerilenKarar[];
  ertelenen: string[];
  haberler: string[];
  degisim: { id: string; once: number; sonra: number }[];
}

export interface OyunDurumu {
  surum: number;
  tohum: number;
  zar: ZarDurumu;
  /** Oyunun kaçıncı ayı (1–18) */
  ay: number;
  bitis: Bitis | null;
  gostergeler: Record<string, number>;
  /** Ay başındaki gösterge değerleri (ay sonu raporundaki değişim için) */
  ayBasi: Record<string, number>;
  masa: MasaKarti[];
  masaKuruldu: boolean;
  ertelemeKullanildi: boolean;
  bosGun: number;
  bekleyen: BekleyenKart[];
  /** Kart kimliği → en son masaya geldiği ay */
  gorulen: Record<string, number>;
  buAy: AyKaydi;
  sicil: SicilKaydi[];
  /** Olay zincirleri ve içerik koşulları için genel bayraklar */
  bayraklar: Record<string, boolean | number | string>;
  haberler: Haber[];
  gecmis: AyKaydi[];
  /** Benzersiz örnek kimlikleri için sayaç */
  sayac: number;
}

export function bosAyKaydi(ay: number): AyKaydi {
  return { ay, kararlar: [], ertelenen: [], haberler: [], degisim: [] };
}

/** Belirli bir tohumla yeni bir oyun durumu kurar (masa henüz boştur; ayiAc ile kurulur). */
export function yeniOyun(tohum: number): OyunDurumu {
  if (!Number.isInteger(tohum)) throw new RangeError("yeniOyun: tohum bir tamsayı olmalı");
  const g = gostergeBaslangic();
  return {
    surum: DURUM_SURUMU,
    tohum,
    zar: zarKur(tohum),
    ay: 1,
    bitis: null,
    gostergeler: g,
    ayBasi: { ...g },
    masa: [],
    masaKuruldu: false,
    ertelemeKullanildi: false,
    bosGun: AYLIK_BOS_GUN,
    bekleyen: [],
    gorulen: {},
    buAy: bosAyKaydi(1),
    sicil: [],
    bayraklar: {},
    haberler: [],
    gecmis: [],
    sayac: 0,
  };
}

/** Rastgele bir tohum üretir (yalnız yeni oyun başlatırken kullanılır). */
export function rastgeleTohum(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function oyunBittiMi(d: OyunDurumu): boolean {
  return d.bitis !== null;
}

export function sonAyMi(d: OyunDurumu): boolean {
  return d.ay >= DONEM_AY_SAYISI;
}

/** Durumun derin kopyası (durum düz veri olduğu için güvenlidir). */
export function durumKopya(d: OyunDurumu): OyunDurumu {
  return structuredClone(d);
}
