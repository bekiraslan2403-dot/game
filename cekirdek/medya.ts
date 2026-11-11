// Sistem 5: karara bağlı haberler, müdahaleler ve kayıtta devam eden üç soruluk sahne.
import { soruBaglami } from "./sahne-derinlik.ts";
import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi } from "./icerik.ts";
import type { EylemSonucu } from "./karar.ts";
import { etkiUygula } from "./ekonomi.ts";
import { zarKaristir, zarSayi, zarTam } from "./zar.ts";
import { sozVer } from "./hazine.ts";
import { eylemUygun, notEkle, sicilEkle } from "./yonetim.ts";

export function gundemKur(d: OyunDurumu): void {
  const g = d.gostergeler;
  d.yonetim.medya.konular = [
    {
      id: "gecim",
      ad: "Geçim",
      agirlik: (g.enflasyon ?? 29) + (g.issizlik ?? 8) * 2,
    },
    {
      id: "adalet",
      ad: "Adalet",
      agirlik: 100 - (g.yargi ?? 45) + d.yonetim.ifsalar.length * 3,
    },
    { id: "guvenlik", ad: "Güvenlik", agirlik: 100 - (g.guvenlik ?? 60) },
    { id: "goc", ad: "Göç ve gelecek", agirlik: 95 - (g["grup.genc"] ?? 40) },
    { id: "dis", ad: "Dış politika", agirlik: 90 - (g.itibar ?? 50) },
  ].sort((a, b) => b.agirlik - a.agirlik);
}
export function medyaYansit(
  d: OyunDurumu,
  I: IcerikPaketi,
  baslik: string,
  olumlu = true,
): void {
  const m = d.yonetim.medya;
  if (!I.medya) return;
  const kullanicilar = zarKaristir(d.zar, [...I.medya.kullanicilar]).slice(
    0,
    3,
  );
  for (const [i, k] of kullanicilar.entries()) {
    const destek = i === 0 ? olumlu : i === 1 ? !olumlu : zarSayi(d.zar) > 0.5;
    m.akis.unshift({
      ay: d.ay,
      kim: k.ad,
      metin: `${baslik}: ${destek ? k.destek : k.elestiri}`,
      begeni: zarTam(d.zar, 80, 9500),
      paylasim: zarTam(d.zar, 10, 1800),
    });
  }
  m.akis.unshift({
    ay: d.ay,
    kim: "@muhalefetmasasi",
    metin: `${baslik} için uygulama ve bütçe tutanağını istedik. Sonuçlarını takip edeceğiz.`,
    begeni: zarTam(d.zar, 400, 16000),
    paylasim: zarTam(d.zar, 50, 3000),
  });
  m.akis.length = Math.min(m.akis.length, 60);
  for (const k of I.medya.kuruluslar.filter((k) => k.tur === "kanal")) {
    const c = m.cizgi[k.id] ?? k.cizgi;
    m.bultenler = m.bultenler.filter(
      (b) => !(b.ay === d.ay && b.kanal === k.id),
    );
    m.bultenler.unshift({
      ay: d.ay,
      kanal: k.id,
      metin:
        c > 20
          ? `Başkentten yeni adım: ${baslik}. Hükümet sonuçların takipçisi olacağını açıkladı.`
          : c < -20
            ? `${baslik}: Bedelini kim ödeyecek? Muhalefet ve etkilenen yurttaşlar yanıt bekliyor.`
            : `${baslik}: Düzenlemenin bütçesi ve sahadaki sonuçları tartışılıyor.`,
    });
  }
  m.bultenler.length = Math.min(18, m.bultenler.length);
  gundemKur(d);
}
export type MedyaAraci = "reklam" | "ihale" | "ceza" | "engel" | "kayyum";
export const MEDYA_ARACLARI: { id: MedyaAraci; ad: string; bedel: string }[] = [
  {
    id: "reklam",
    ad: "Kamu reklamı ver",
    bedel:
      "Yıllık bütçeye %0,04 GSYH yük. Yayın çizgisi yumuşar; rakipler ayrıcalık eleştirir.",
  },
  {
    id: "ihale",
    ad: "Sahibine ihale teklif et",
    bedel:
      "%0,10 GSYH yatırım ve usulsüzlük kaydı. Holding yayın çizgisine müdahale eder.",
  },
  {
    id: "ceza",
    ad: "İdari para cezası uygula",
    bedel: "Program kapanır; basın özgürlüğü ve gençlerin desteği düşer.",
  },
  {
    id: "engel",
    ad: "Habere erişimi engelle",
    bedel: "Yurt dışında yayılma ve ters tepme riski. Baskı sicile yazılır.",
  },
  {
    id: "kayyum",
    ad: "Kayyum ata",
    bedel:
      "Yayın kontrolü değişir. Basın, gençler, dış itibar ve sicilde kalıcı bedel.",
  },
];
const MAHKEME_YAYIN_NOTLARI: Record<string, string> = {
  duzeltme_bekliyor: "Genel arşiv açık. İtiraz edilen kaydın yeni kopyası hazırlanıyor.",
  cekildi: "Genel arşiv açık. Kanal, itiraz edilen kaydı kendi kararıyla çekti.",
  duzeltildi: "Adresler çıkarıldı. Düzeltilen haber arşivde.",
  emanet: "Genel arşiv açık. İtiraz edilen kayıt yayından çekildi, başvuru için saklandı.",
  altyazi_acik: "Görüntü yayımlandı. İtiraz edilen kişisel bilgiler altyazıda kaldı.",
  tedbir: "Arşiv açıldı. Adresleri çıkarılan haber yayında.",
  kapali: "Halk TV’nin çevrim içi arşivi kapalı.",
};

export function halkTvArsivNotu(d: OyunDurumu): string | undefined {
  const durum = d.bayraklar.mahkeme_yayin_durumu;
  return typeof durum === "string" && Object.hasOwn(MAHKEME_YAYIN_NOTLARI, durum) ? MAHKEME_YAYIN_NOTLARI[durum] : undefined;
}

/** Kararın verildiği ay genel erişim engeli uygulanamaz. */
export function mahkemeEngeli(d: OyunDurumu, kurulus: string, arac: MedyaAraci): string | undefined {
  if (kurulus === "halk_tv" && arac === "engel" && d.buAy.kararlar.some(k => k.kart === "mahkeme_yayin_ayna" && k.secenek === 0))
    return "Mahkeme bu ay Halk TV için yeni genel erişim engelini durdurdu.";
}
export function medyaMudahale(
  d: OyunDurumu,
  I: IcerikPaketi,
  kurulus: string,
  arac: MedyaAraci,
): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  const k = I.medya?.kuruluslar.find((k) => k.id === kurulus);
  if (!k || !MEDYA_ARACLARI.some((a) => a.id === arac))
    return { ok: false, neden: "Kuruluş veya araç bulunamadı." };
  const tedbir = mahkemeEngeli(d, kurulus, arac);
  if (tedbir) return { ok: false, neden: tedbir };
  const anahtar = `${kurulus}:${arac}`;
  if (d.yonetim.medya.hamleler[anahtar] === d.ay)
    return { ok: false, neden: "Bu müdahale bu ay kullanıldı." };
  // Kamu kuruluşuna kamu ihalesi/kayyum pazarlığı yapılmaz.
  if (k.id === "devlet" && ["ihale", "kayyum"].includes(arac))
    return { ok: false, neden: "Devlet televizyonu zaten kamu kuruluşu." };
  let kayma = 0;
  if (arac === "reklam") {
    etkiUygula(d, "butce_acigi", 0.04, "personel");
    kayma = 10;
    etkiUygula(d, "grup.kentli", -0.7, "sosyal");
  }
  if (arac === "ihale") {
    etkiUygula(d, "butce_acigi", 0.1, "yatirim");
    kayma = 22;
    sicilEkle(
      d,
      `${k.ad} sahibine yayın çizgisi karşılığında ihale`,
      "usulsuzluk",
    );
  }
  if (arac === "ceza") {
    kayma = 8;
    etkiUygula(d, "basin", -3, "sosyal");
    etkiUygula(d, "grup.genc", -1.5, "sosyal");
    sicilEkle(d, `${k.ad} programına idari ceza`, "baski");
  }
  if (arac === "engel") {
    kayma = 5;
    etkiUygula(d, "basin", -3, "sosyal");
    etkiUygula(d, "itibar", -2, "sosyal");
    sicilEkle(d, `${k.ad} haberine erişim engeli`, "baski");
    if (zarSayi(d.zar) < 0.45) {
      kayma = -8;
      etkiUygula(d, k.grup, -2, "sosyal");
    }
  }
  if (arac === "kayyum") {
    kayma = 100;
    etkiUygula(d, "basin", -8, "sosyal");
    etkiUygula(d, "itibar", -6, "sosyal");
    etkiUygula(d, "grup.genc", -4, "sosyal");
    etkiUygula(d, "grup.laik", -3, "sosyal");
    sicilEkle(d, `${k.ad} kuruluşuna kayyum`, "baski");
  }
  d.yonetim.medya.cizgi[k.id] = Math.max(
    -60,
    Math.min(60, (d.yonetim.medya.cizgi[k.id] ?? k.cizgi) + kayma),
  );
  d.yonetim.medya.hamleler[anahtar] = d.ay;
  // Özgür basına duyulan güven azaldığında olumlu yayınların etkisi de zayıflar.
  etkiUygula(d, k.grup, (0.5 * (d.gostergeler.basin ?? 45)) / 100, "sosyal");
  const haber = `${k.ad}: ${MEDYA_ARACLARI.find((a) => a.id === arac)!.ad}. ${kayma < 0 ? "Müdahale habere ilgiyi artırdı; yayın çizgisi daha da sertleşti." : "Yayın çizgisi ve izleyici tepkileri değişti."}`;
  notEkle(d, haber, "medya");
  medyaYansit(d, I, haber, kayma > 0);
  return { ok: true, haber };
}
export function basinAc(d: OyunDurumu, I: IcerikPaketi): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  if (d.meclis.sahneAy === d.ay)
    return { ok: false, neden: "Bu ayın sahnesi kullanıldı." };
  if (!I.medya) return { ok: false, neden: "Basın içeriği bulunamadı." };
  const olay =
    d.buAy.kararlar.at(-1)?.baslik ??
    d.toplum.gazete?.olay ??
    "Hükümetin bu ayki programı";
  const onceki = d.yonetim.medya.gecmis
    .filter((g) => g.cevap === "yalan")
    .at(-1);
  const sorular = zarKaristir(d.zar, [...I.medya.gazeteciler])
    .slice(0, 3)
    .map((g, i) => ({
      kim: g.id,
      soru:
        i === 0
          ? `“${olay}” hakkında: ${soruBaglami(d,g.id)}`
          : i === 2 && onceki
            ? `Önceki toplantıda “${onceki.soru}” sorusuna verdiğiniz yanıt belgelerle çelişiyor. Açıklamanız nedir?`
            : soruBaglami(d,g.id),
      cevap: null,
      sonuc: null,
    }));
  d.meclis.sahneAy = d.ay;
  d.yonetim.medya.basin = { ay: d.ay, adim: 0, sorular };
  return { ok: true };
}
export const BASIN_CEVAPLARI = [
  {
    id: "acik",
    ad: "Açık ve dürüst cevapla",
    not: "Sorunun bedelini kabul et. Güven kazanabilir; tabanın kötü habere kızabilir.",
  },
  {
    id: "kacamak",
    ad: "Soruyu başka konuya çek",
    not: "Kısa vadede zaman kazan. Tekrarlandıkça etkisi azalır.",
  },
  {
    id: "mujde",
    ad: "Yeni bir destek sözü ver",
    not: "Hazine'ye iki ay vadeli bir söz yazılır. Tutulmaması yeniden gündem olur.",
  },
  {
    id: "yalan",
    ad: "Rakamları olduğundan iyi göster",
    not: "Geçici destek; belgelerle çelişen açıklama sicile yalan olarak yazılır.",
  },
  {
    id: "iftira",
    ad: "Gazeteciyi rakiple iş birliğiyle suçla",
    not: "Tabanı birleştir; kutuplaşma ve hukuki bedel.",
  },
  {
    id: "azar",
    ad: "Gazeteciyi azarla",
    not: "Sert lider görüntüsü; basın ve dış itibarda kayıp.",
  },
] as const;
export type BasinCevabi = (typeof BASIN_CEVAPLARI)[number]["id"];
export function basinCevapla(
  d: OyunDurumu,
  I: IcerikPaketi,
  cevap: BasinCevabi,
): EylemSonucu {
  const b = d.yonetim.medya.basin;
  if (
    d.bitis ||
    !b ||
    b.adim >= 3 ||
    !BASIN_CEVAPLARI.some((c) => c.id === cevap)
  )
    return { ok: false, neden: "Yanıt bekleyen soru yok." };
  const soru = b.sorular[b.adim]!;
  const s = zarSayi(d.zar),
    sert = soru.kim === "selin" || soru.kim === "laura";
  let sonuc = "";
  const tekrar=d.yonetim.medya.gecmis.filter(g=>g.cevap===cevap&&g.ay>=d.ay-2).length;
  const inanilirlik=Math.max(0.25,1-tekrar*0.18);
  if (cevap === "acik") {
    etkiUygula(d, "guven", 1.2, "sosyal");
    etkiUygula(d, "itibar", 1.5, "sosyal");
    etkiUygula(d, "grup.muhafazakar", -0.6, "sosyal");
    sonuc =
      "Sorunun varlığını kabul ettiniz. Piyasalar açıklığı olumlu karşıladı; partide savunma zayıf bulundu.";
  }
  if (cevap === "kacamak") {
    const kez = d.yonetim.medya.gecmis.filter(
      (g) => g.cevap === "kacamak",
    ).length;
    etkiUygula(d, "grup.kentli", -0.5 - Math.min(2, kez * 0.25), "sosyal");
    sonuc =
      kez > 1
        ? "Gazeteciler aynı soruyu yeniden sordu. Kaçamak cevap artık işe yaramıyor."
        : "Soru yanıtsız kaldı; toplantı kısa bir süre sizin seçtiğiniz konuya döndü.";
  }
  if (cevap === "mujde") {
    sozVer(d, {
      metin: "Basın toplantısında açıklanan hane desteği",
      kalem: "sosyal",
      maliyet: 0.12,
      vade: 2,
      grup: "grup.isci",
    });
    etkiUygula(d, "grup.isci", 1.2, "sosyal");
    sonuc =
      "Yeni destek sözü manşete çıktı. Hazine iki ay içinde ödeme bekliyor.";
  }
  if (cevap === "yalan") {
    sicilEkle(d, `Basın toplantısında yanıltıcı rakam: ${soru.soru}`, "yalan");
    etkiUygula(d, "grup.emekli", s < 0.5 && sert ? -0.5 : 1.4*inanilirlik, "sosyal");
    if(tekrar>=2){etkiUygula(d,"guven",-1,"sosyal");}
    sonuc = sert
      ? "Muhabir dayanak belgeyi istedi. Açıklama sicile yazıldı; doğrulanabilir rakamlarla çelişebilir."
      : "Yanıt salonda alkış aldı. Gerçek rakamlar değişmedi; açıklama sicile yazıldı.";
  }
  if (cevap === "iftira" || cevap === "azar") {
    etkiUygula(d, "grup.muhafazakar", 1, "sosyal");
    etkiUygula(d, "kutuplasma", 2, "sosyal");
    etkiUygula(d, "basin", -2, "sosyal");
    etkiUygula(d, "itibar", -1.2, "sosyal");
    sicilEkle(
      d,
      `${soru.kim} isimli gazeteciye ${cevap === "iftira" ? "iftira" : "baskı"}`,
      "baski",
    );
    sonuc =
      "Tabanınız sert çıkışı sahiplendi. Muhabir açıklamayı yayınladı; dış basında özgürlük tartışması başladı.";
  }
  if(tekrar>=2)sonuc+=" Aynı yanıtı tekrar ettiğiniz için muhabirler somut kanıt istiyor.";
  soru.cevap = cevap;
  soru.sonuc = sonuc;
  b.adim++;
  d.yonetim.medya.gecmis.push({
    ay: d.ay,
    kim: soru.kim,
    soru: soru.soru,
    cevap,
    sonuc,
  });
  if(b.adim===3)basinGazeteleri(d,I);
  notEkle(d, sonuc, "medya");
  medyaYansit(
    d,
    I,
    `Basın toplantısı: ${BASIN_CEVAPLARI.find((c) => c.id === cevap)!.ad}`,
    cevap === "acik" || cevap === "mujde",
  );
  return { ok: true, haber: sonuc };
}
export function basinKapat(d: OyunDurumu): EylemSonucu {
  if (!d.yonetim.medya.basin || d.yonetim.medya.basin.adim < 3)
    return { ok: false, neden: "Üç soruyu da yanıtlayın." };
  d.yonetim.medya.basin = null;
  return { ok: true };
}

/** Toplantının üç farklı manşeti; ertesi ay açılınca aynı tutanak okunur. */
export function basinGazeteleri(d: OyunDurumu, I: IcerikPaketi): boolean {
  const cevaplar = d.yonetim.medya.gecmis.filter((g) => g.ay === d.ay);
  if (cevaplar.length !== 3) return false;
  const varMi = (tur: string) => cevaplar.some((g) => g.cevap === tur);
  const olumlu = varMi("mujde") ? "Kürsüden yeni destek sözü" : "Cumhurbaşkanından istikrar mesajı";
  const elestiri = varMi("azar") || varMi("iftira") ? "Soru soran gazeteci hedefte"
    : varMi("yalan") ? "Kürsüde pembe tablo, pazarda başka hesap"
    : varMi("mujde") ? "Bir söz daha: kaynağı nerede?"
    : varMi("kacamak") ? "Üç soru, beklenen yanıtlar hâlâ yok" : "İktidar sorunları kabul etti";
  const finans = varMi("mujde") ? "Yeni destek sözü bütçenin gündeminde"
    : varMi("yalan") ? "Veriler ile açıklamalar: doğrulama bekleniyor" : "Piyasalar açıklamalardan sonra uygulamayı bekliyor";
  const basliklar = [olumlu, elestiri, finans];
  d.toplum.gazete = { ay: d.ay, olay: "Basın toplantısı", mansetler: I.toplum.gazeteler.map((g, i) => ({ gazete: g.id, baslik: basliklar[i] ?? finans })) };
  return true;
}
