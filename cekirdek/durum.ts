// Oyun durumu: oyunun tamamı bu tek nesnede tutulur ve kayıt dosyasına yazılır.
// Kural: durum yalnız düz veridir (sayı, metin, dizi, nesne); fonksiyon, sınıf ya da tarih nesnesi içermez.

import { zarKur, type ZarDurumu } from "./zar.ts";
import { DONEM_AY_SAYISI } from "./takvim.ts";
import { gostergeBaslangic } from "./gostergeler.ts";
import { ekonomiBaslangic, type EkonomiDurumu } from "./ekonomi.ts";
import { ilkAnketler, type Anket } from "./kamuoyu.ts";
import type { MeclisTeklifi } from "./politika.ts";
import { toplumBaslangic, type ToplumDurumu } from "./toplum.ts";

/** Durum biçimi her değiştiğinde artırılır; eski kayıtlar kayit.ts içindeki göçlerle güncellenir. */
export const DURUM_SURUMU = 5;

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
  /** Ay sonunda kendiliğinden olanlar: kriz, kırılan söz, piyasa haberi */
  olaylar: string[];
  /** Beş hayattan bu ayın sahneleri */
  hayatlar: { kim: string; metin: string; ton: number }[];
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
  /** Ekonomi modeli, bütçe, söz defteri ve hissedilen ekonomi (Sistem 3) */
  ekonomi: EkonomiDurumu;
  /** Politika dosyası: değiştirilmiş kademeler (yoksa içerikteki başlangıç kademesi) */
  politika: Record<string, number>;
  /** Bu ay kullanılan imza sayısı */
  imza: number;
  /** Ay sonunda oylanacak kanun teklifleri */
  meclisGundemi: MeclisTeklifi[];
  /** Açıklanan anketler (en son 80) */
  anketler: Anket[];
  /** Beş hayat, gazeteler, kapıda bekleyenler, sokak eylemleri */
  toplum: ToplumDurumu;
}

export function bosAyKaydi(ay: number): AyKaydi {
  return { ay, kararlar: [], ertelenen: [], haberler: [], olaylar: [], hayatlar: [], degisim: [] };
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
    ekonomi: ekonomiBaslangic(),
    politika: {},
    imza: 0,
    meclisGundemi: [],
    anketler: ilkAnketler(g),
    toplum: toplumBaslangic(),
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
