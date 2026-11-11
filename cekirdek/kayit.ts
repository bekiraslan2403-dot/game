import { DEVIR_YOLLARI } from "./devir.ts";
// Kayıt ve yükleme. Kayıt metni sürümlüdür; eski bir sürüm yüklenirken sırayla göç fonksiyonları çalışır,
// ardından şema denetimi yapılır. Bozuk ya da tanınmayan kayıt asla yarım yüklenmez.

import { z } from "zod";
import { incelemeSemasi } from "./inceleme-durum.ts";
import { santiyeSemasi } from "./santiye-durum.ts";
import { hesaplasmaSemasi } from "./hesaplasma-durum.ts";
import { acilisSemasi } from "./acilis-durum.ts";
import { sahaSemasi } from "./saha-durum.ts";
import { isinmaSemasi } from "./isinma-durum.ts";
import { anlatiSemasi, anlatiBaslangic } from "./anlati-durum.ts";
import { yonetimSemasi, yonetimBaslangic } from "./genis-durum.ts";
import { DURUM_SURUMU, AYLIK_BOS_GUN, bosAyKaydi, type OyunDurumu } from "./durum.ts";
import { gostergeBaslangic } from "./gostergeler.ts";
import { ekonomiBaslangic } from "./ekonomi.ts";
import { ilkAnketler } from "./kamuoyu.ts";
import { toplumBaslangic } from "./toplum.ts";

import { PARTILER } from "./meclis-icerik.ts";
import { meclisBaslangic, oyEsigi, oySonucu } from "./meclis.ts";

const OYUN_KIMLIGI = "akkopru-2026";

const sayi = z.number().finite();
const tam = z.number().int();
const degiskenler = z.record(z.string());
const ayKaydi = z.object({
  ay: tam,
  kararlar: z.array(z.object({
    kart: z.string(), baslik: z.string(), secenek: tam, secenekMetni: z.string(),
    uygulama: z.object({
      bildirim: z.string().optional(),
      etkiler: z.array(z.string()),
      takip: z.array(z.object({ ay: tam.min(1).max(18), baslik: z.string() })),
    }).optional(),
  })),
  ertelenen: z.array(z.string()),
  haberler: z.array(z.string()),
  olaylar: z.array(z.string()),
  hayatlar: z.array(z.object({ kim: z.string(), metin: z.string(), ton: sayi })),
  degisim: z.array(z.object({ id: z.string(), once: sayi, sonra: sayi })),
});

const sayilar = z.record(sayi);
const ekonomi = z.object({
  gercekEnflasyon: sayi,
  katki: sayilar,
  harcamaEtkisi: sayi,
  yatirimEtkisi: sayi,
  faizEtkisi: sayi,
  kurHizi: sayi,
  petrol: sayi,
  kuresel: sayi,
  mbBaski: sayi,
  istatistik: z.enum(["liyakatli", "sadik"]),
  makyaj: sayi,
  gsyh: sayi,
  gider: sayilar,
  gelir: sayilar,
  ekFaizYuku: sayi,
  sepet: sayilar,
  sepetGecmis: z.array(sayilar),
  hane: z.object({ asgari: sayi, kira: sayi, fatura: sayi }),
  sozler: z.array(
    z.object({
      id: z.string(), metin: z.string(), kalem: z.string(), maliyet: sayi, verildi: tam, vade: tam,
      grup: z.string().nullable(), asgariArtis: sayi, tekSeferlik: z.boolean(), durum: z.enum(["bekliyor", "tutuldu", "kirildi"]),
    }),
  ),
  krizler: z.array(z.object({ id: z.enum(["kur_soku"]), basladi: tam })),
  arac: z.record(tam),
});

const parti = z.enum(["yukselis", "bayrak", "demokrat", "kalan", "ulusal"]);
const oran = sayi.min(0).max(100);
const oylamaTuru = z.enum(["kanun", "butce", "anayasa"]);
const meclis = z.object({
  hizipler: z.object({ eski: oran, teknokrat: oran, muhafazakar: oran }),
  vekiller: z.record(z.object({ iliski: oran, sozler: z.array(z.string()), ihanet: tam.min(0) })),
  oylamalar: z.array(z.object({ id: z.string(), ay: tam, baslik: z.string(), tur: oylamaTuru,
    politika: z.string().nullable(), hedef: tam.min(0), adaylar: z.array(z.string()).max(12),
    bonus: sayilar, sozVeren: z.array(z.string()), taviz: parti.nullable(), butceEtki: sayilar })),
  sonuclar: z.array(z.object({ id: z.string(), ay: tam, baslik: z.string(), tur: oylamaTuru,
    evet: tam.min(0).max(592), hayir: tam.min(0).max(592), cekimser: tam.min(0).max(592), katilan: tam.min(0).max(592), esik: tam,
    sonuc: z.enum(["kabul", "ret", "halkoylamasi"]),
    uygulama: z.object({
      tur: z.enum(["yururluk", "degismedi", "bekliyor", "gecici", "halkoylamasi"]),
      kademe: z.object({ once: z.string(), sonra: z.string() }).optional(),
      butce: z.object({ kalem: z.string(), farkTL: sayi }).optional(),
      etkiler: sayilar,
      takip: z.object({ ay: tam.min(1).max(18), baslik: z.string() }).optional(),
    }).optional(),
    oylar: z.array(z.object({ kim: z.string(), parti, oy: z.enum(["evet", "hayir", "cekimser"]), fire: z.boolean(), grup: z.enum(["ayrilan", "transfer"]).optional() })).length(592) }).refine(r =>
      r.katilan === r.oylar.length && r.evet === r.oylar.filter(v => v.oy === "evet").length
      && r.hayir === r.oylar.filter(v => v.oy === "hayir").length && r.cekimser === r.oylar.filter(v => v.oy === "cekimser").length
      && new Set(r.oylar.map(v => v.kim)).size === 592
      && PARTILER.every(p => r.oylar.filter(v => v.parti === p.id).length === p.sandalye)
      && [0, 1, 3].includes(r.oylar.filter(v => v.grup === "transfer").length)
      && r.oylar.every(v => v.grup !== "transfer" || (v.parti === "demokrat" && /^DBP sıra \d+$/.test(v.kim)))
      && r.esik === oyEsigi(r.tur, r.katilan) && r.sonuc === oySonucu(r.tur, r.evet, r.katilan), "oylama tutanağının toplamları uyuşmuyor")),
  sahneAy: tam.min(0), kulis: z.object({ oylama: z.string(), vekil: z.string(), sonuc: z.string().nullable() }).nullable(),
  butce: z.object({
    gecici: z.boolean(), sonOylama: tam.min(0), gider: sayilar, gelir: sayilar, taslak: sayilar,
    plan: z.object({
      maliYil: tam.min(2027), ad: z.string().min(3),
      komisyon: z.enum(["ertele", "ek", "aynen"]).nullable(),
      kabulAy: tam.min(1).nullable(), uygulamaAy: tam.min(1).nullable(),
    }).refine(p => p.uygulamaAy === null || (p.kabulAy !== null && p.uygulamaAy > p.kabulAy), "Bütçe kabulden önce yürürlüğe giremez.").optional(),
  }),
});

const durumSemasi = z.object({
  surum: z.literal(DURUM_SURUMU),
  tohum: tam,
  zar: z.object({ a: tam, b: tam, c: tam, d: tam }),
  ay: tam.min(1).max(18),
  bitis: z.object({ tur: z.enum(["yeniden_secilme", "yenilgi", "devrilme", "istifa"]), ay: tam, aciklama: z.string(), devir: z.enum(DEVIR_YOLLARI).nullable().optional() }).nullable(),
  gostergeler: z.record(sayi),
  ayBasi: z.record(sayi),
  masa: z.array(z.object({ ornek: z.string(), kart: z.string(), degisken: degiskenler, agir: z.boolean(), ikinciGorus: z.boolean() })),
  masaKuruldu: z.boolean(),
  ertelemeKullanildi: z.boolean(),
  bosGun: tam.min(0),
  bekleyen: z.array(z.object({ kart: z.string(), ay: tam, degisken: degiskenler, agir: z.boolean() })),
  gorulen: z.record(tam),
  buAy: ayKaydi,
  sicil: z.array(z.object({ id: z.string(), tur: z.enum(["usulsuzluk", "yalan", "kirilan_soz", "baski"]), kaynak: z.string(), ay: tam, ifsaOldu: z.boolean() })),
  bayraklar: z.record(z.union([z.boolean(), z.number(), z.string()])),
  haberler: z.array(z.object({ ay: tam, metin: z.string(), kategori: z.string() })),
  gecmis: z.array(ayKaydi),
  sayac: tam.min(0),
  ekonomi,
  meclis,
  yonetim: yonetimSemasi,
  anlati: anlatiSemasi,
  saha: sahaSemasi,
  acilis: acilisSemasi,
  inceleme: incelemeSemasi,
  santiye: santiyeSemasi,
  hesaplasma: hesaplasmaSemasi,
  isinma: isinmaSemasi,
  politika: z.record(tam.min(0)),
  imza: tam.min(0),
  meclisGundemi: z.array(z.object({ politika: z.string(), hedef: tam.min(0), ay: tam })),
  anketler: z.array(z.object({ ay: tam, sirket: z.string(), oran: sayi })),
  toplum: z.object({
    hayatlar: z.record(z.object({ olan: z.record(tam), son: z.array(z.object({ ay: tam, metin: z.string(), ton: sayi })), ayrildi: z.boolean() })),
    gazete: z.object({ ay: tam, olay: z.string(), mansetler: z.array(z.object({ gazete: z.string(), baslik: z.string() })) }).nullable(),
    kapi: z.array(z.object({ id: z.string(), durum: z.enum(["bekliyor", "kabul"]) })),
    eylemler: z.array(z.object({ id: z.string(), grup: z.string(), il: z.string(), emniyet: sayi, duzenleyici: sayi, basladi: tam, dinlendi: z.boolean() })),
  }),
}).refine(d => {
  const p = d.inceleme;
  if (!p || p.asama === "tamam") return true;
  return p.asama === "bekliyor" ? d.bekleyen.some(b => b.kart === p.raporKarti && b.ay === p.raporAy)
    : d.ay >= p.raporAy && d.masa.some(m => m.kart === p.raporKarti);
}, "incelemenin bekleyen veya teslim edilmiş rapor dosyası bulunamadı").refine(d => {
  const p = d.santiye;
  if (!p) return true;
  const kart = p.asama === "yapim" || p.asama === "fiziksel_teslim" ? "akkopru_teslim"
    : p.asama === "kabul_bekliyor" ? "akkopru_kabul"
    : p.asama === "protokol" || p.asama === "hazirlik" || p.asama === "durduruldu" ? "akkopru_onarim" : null;
  if (!kart) return true;
  if (p.isAy !== null && p.isAy > d.ay) return d.bekleyen.some(b => b.kart === kart && b.ay === p.isAy);
  return d.masa.some(m => m.kart === kart) || d.bekleyen.some(b => b.kart === kart && b.ay >= d.ay);
}, "şantiyenin bekleyen teslim veya işlem dosyası bulunamadı").refine(d => {
  const p = d.hesaplasma;
  if (!p || p.asama === "tamam") return true;
  return p.asama === "bekleyen"
    ? d.bekleyen.some(b => b.kart === p.hedef && b.ay === p.hedefAy)
    : d.ay >= p.hedefAy! && d.masa.some(m => m.kart === p.hedef);
}, "hesaplaşmanın bekleyen veya masadaki dosyası bulunamadı").refine(d => !d.acilis || d.acilis.sabah !== null || d.masa.some(m => m.kart === d.acilis!.sabahKarti), "ilk sabahın açık dosyası masada bulunamadı").refine(d => {
  const s = d.anlati.sahne;
  if (!s) return true;
  const notlar = d.anlati.notlar.filter(n => n.ornek === s.ornek);
  return !d.bitis && !d.meclis.kulis && !d.yonetim.medya.basin && !d.yonetim.secim.sahne
    && d.meclis.sahneAy === d.ay && d.masa.some(m => m.ornek === s.ornek)
    && notlar.length === s.adim + (s.cevap === null ? 0 : 1)
    && notlar.every((n, i) => n.soru === i)
    && (s.cevap === null || notlar.at(-1)?.secenek === s.cevap);
}, "anlatı görüşmesinin sırası veya bağlı dosyası uyuşmuyor").refine(d => {
  if (new Set(d.isinma.map(p => p.id)).size !== d.isinma.length || d.isinma.filter(p => p.asama !== "tamam").length > 1) return false;
  const odemeler = d.isinma.flatMap(p => p.odemeler);
  if (new Set(odemeler.map(o => o.soz)).size !== odemeler.length) return false;
  return d.isinma.every(p => p.odemeler.every(o => d.ekonomi.sozler.some(s => s.id === o.soz && s.durum === "tutuldu" && s.verildi === o.ay && s.tekSeferlik))
    && (p.asama === "bekleyen" ? d.bekleyen.some(b => b.kart === p.hedef && b.ay === p.hedefAy && b.degisken.isinma === p.id)
      : p.asama === "masada" ? d.masa.some(m => m.kart === p.hedef && m.degisken.isinma === p.id)
      : p.hedef === null && p.hedefAy === null));
}, "kış dosyasının bağlı kartı veya gerçek ödeme kaydı bulunamadı");

/**
 * Göçler: anahtar, göçün başladığı sürümdür. GOCLER[1] sürüm 1 kaydını sürüm 2'ye çevirir.
 * Yeni bir alan eklendiğinde DURUM_SURUMU artırılır ve buraya bir göç yazılır.
 */
export const GOCLER: Record<number, (eski: Record<string, unknown>) => Record<string, unknown>> = {
  // Sürüm 1 → 2: göstergeler, masa, deste ve ayın kaydı eklendi. Eski kayıtta yalnız takvim vardı.
  1: (eski) => {
    const ay = typeof eski.ay === "number" ? eski.ay : 1;
    const g = gostergeBaslangic();
    return {
      ...eski,
      gostergeler: g,
      ayBasi: { ...g },
      masa: [],
      masaKuruldu: false,
      ertelemeKullanildi: false,
      bosGun: AYLIK_BOS_GUN,
      bekleyen: [],
      gorulen: {},
      buAy: bosAyKaydi(ay),
      haberler: [],
      gecmis: [],
      sayac: 0,
    };
  },
  // Sürüm 2 → 3: ekonomi modeli eklendi; ayın kaydına "olaylar" eklendi. Bütçe açığı artık kalemlerden hesaplanır,
  // bu yüzden eski kayıttaki açığın başlangıçtan farkı sosyal yardıma (açık büyükse) ya da diğer gelirlere (küçükse)
  // yazılır; diğer göstergeler korunur.
  2: (eski) => {
    const e = ekonomiBaslangic();
    const g = (eski.gostergeler ?? {}) as Record<string, number>;
    if (typeof g.enflasyon === "number") e.gercekEnflasyon = g.enflasyon;
    if (typeof g.butce_acigi === "number") {
      const fark = g.butce_acigi - 3.5;
      if (fark >= 0) e.gider.sosyal = (e.gider.sosyal ?? 0) + fark;
      else e.gelir.diger = (e.gelir.diger ?? 0) - fark;
    }
    const ay = (k: unknown) => ({ ...(k as Record<string, unknown>), olaylar: [] });
    return { ...eski, buAy: ay(eski.buAy), gecmis: Array.isArray(eski.gecmis) ? eski.gecmis.map(ay) : [], ekonomi: e };
  },
  // Sürüm 3 → 4: politika dosyası, Meclis gündemi, anketler ve toplum göstergeleri eklendi.
  3: (eski) => {
    const g = { ...gostergeBaslangic(), ...((eski.gostergeler ?? {}) as Record<string, number>) };
    return { ...eski, gostergeler: g, ayBasi: { ...gostergeBaslangic(), ...((eski.ayBasi ?? {}) as Record<string, number>) }, politika: {}, imza: 0, meclisGundemi: [], anketler: ilkAnketler(g) };
  },
  // Sürüm 4 → 5: beş hayat, gazeteler, kapıda bekleyenler ve sokak eylemleri; ayın kaydına "hayatlar" eklendi.
  4: (eski) => {
    const ay = (k: unknown) => ({ ...(k as Record<string, unknown>), hayatlar: [] });
    return { ...eski, buAy: ay(eski.buAy), gecmis: Array.isArray(eski.gecmis) ? eski.gecmis.map(ay) : [], toplum: toplumBaslangic() };
  },
  // Sürüm 5 → 6: Meclis, hizipler ve kulis. Eski tekliflere dokunulmaz;
  // içerik yüklendiğinde meclisHazirla kararsız vekil listesini bir kez kurar.
  5: (eski) => ({ ...eski, meclis: meclisBaslangic() }),
  // 6 → 7: ajanda, medya, kurumlar ve kampanya. Önceki kararlar ve açık kulis korunur.
  6: (eski) => ({ ...eski, yonetim: yonetimBaslangic(typeof eski.tohum === "number" ? eski.tohum : 0) }),
  // 7 → 8: görüşme, tanık notları ve karakter ilişkileri; önceki oyun aynen korunur.
  7: (eski) => ({ ...eski, anlati: anlatiBaslangic() }),
  // 8 → 9: eski sözlerin bütçe davranışı korunur. Yeni geçici destekler,
  // ödendikleri ayın ardından sürekli gider yaratmadan kapanır.
  8: (eski) => {
    const ekonomi = eski.ekonomi as Record<string, unknown>;
    return { ...eski, ekonomi: { ...ekonomi, sozler: Array.isArray(ekonomi?.sozler) ? ekonomi.sozler.map(s => ({ ...(s as Record<string, unknown>), tekSeferlik: false })) : [] } };
  },
  // 9 → 10: önceki ziyaretlere proje veya başarı uydurulmaz.
  9: (eski) => {
    const toplum = eski.toplum as { hayatlar?: { ayse?: { olan?: Record<string, unknown> } } } | undefined;
    const yerlesmis = typeof toplum?.hayatlar?.ayse?.olan?.anahtar === "number";
    return { ...eski, saha: {}, ...(yerlesmis ? { bayraklar: { ...(eski.bayraklar as Record<string, unknown>), ayse_yerlesmis: true } } : {}) };
  },
  // 10 → 11: geçmiş ilk geceye sonradan bir sabah veya ödeme eklenmez.
  10: (eski) => ({ ...eski, acilis: null }),
  // 11 → 12: eski inceleme kararlarına heyet, rapor veya harcama uydurulmaz.
  11: (eski) => ({ ...eski, inceleme: null }),
  // 12 → 13: geçmiş protokole ücret ödemesi, yapım veya teknik kabul eklenmez.
  12: (eski) => {
    const kayitlar = [...(Array.isArray(eski.gecmis) ? eski.gecmis : []), eski.buAy] as { kararlar?: { kart?: string; secenek?: number }[] }[];
    const odenmis = kayitlar.some(k => k?.kararlar?.some(c => c.kart === "akkopru_rapor_bagimsiz" && c.secenek === 1));
    return { ...eski, santiye: null, ...(odenmis ? { bayraklar: { ...(eski.bayraklar as Record<string, unknown>), akkopru_ucret_odendi: true } } : {}) };
  },
  // 13 → 14: eski kaza veya tanık bitişine yeni duruşma/ifade/ödeme uydurulmaz.
  13: (eski) => ({ ...eski, hesaplasma: null }),
  // 14 → 15: eski tarife, faturalar ve ödemeler aynen kalır. Geçmiş kışa
  // yeni yardım, kesinti, bakım ya da gelecek dosyası eklenmez.
  14: (eski) => ({ ...eski, isinma: [] }),
};

export type YuklemeSonucu = { ok: true; durum: OyunDurumu } | { ok: false; hata: string };

/** Durumu kayıt metnine çevirir. */
export function kaydet(d: OyunDurumu): string {
  return JSON.stringify({ oyun: OYUN_KIMLIGI, surum: d.surum, kayitTarihi: new Date().toISOString(), durum: d });
}

/** Kayıt metnini okur; göçleri uygular ve şemaya göre denetler. */
export function yukle(metin: string): YuklemeSonucu {
  let ham: unknown;
  try {
    ham = JSON.parse(metin);
  } catch {
    return { ok: false, hata: "Kayıt dosyası okunamadı (JSON değil)." };
  }
  if (typeof ham !== "object" || ham === null) return { ok: false, hata: "Kayıt dosyası boş ya da bozuk." };
  const kab = ham as { oyun?: unknown; surum?: unknown; durum?: unknown };
  if (kab.oyun !== OYUN_KIMLIGI) return { ok: false, hata: "Bu dosya bir Akköprü 2026 kaydı değil." };
  if (typeof kab.surum !== "number" || !Number.isInteger(kab.surum)) return { ok: false, hata: "Kayıt sürümü okunamadı." };
  if (kab.surum > DURUM_SURUMU) return { ok: false, hata: "Bu kayıt oyunun daha yeni bir sürümünde yapılmış." };
  if (typeof kab.durum !== "object" || kab.durum === null) return { ok: false, hata: "Kayıtta oyun durumu yok." };

  let durum = structuredClone(kab.durum) as Record<string, unknown>;
  for (let s = kab.surum; s < DURUM_SURUMU; s++) {
    const goc = GOCLER[s];
    if (!goc) return { ok: false, hata: `Sürüm ${s} kaydını güncelleyecek göç tanımlı değil.` };
    durum = goc(durum);
    durum.surum = s + 1;
  }
  const sonuc = durumSemasi.safeParse(durum);
  if (!sonuc.success) {
    const ilk = sonuc.error.issues[0];
    return { ok: false, hata: `Kayıt doğrulanamadı: ${ilk ? `${ilk.path.join(".")} — ${ilk.message}` : "bilinmeyen hata"}` };
  }
  return { ok: true, durum: sonuc.data as OyunDurumu };
}
