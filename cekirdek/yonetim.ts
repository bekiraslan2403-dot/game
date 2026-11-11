import { kongreGecmisi } from "./kongre.ts";
// Ajanda, kurumlar ve parti: aynı dört gün, aynı tek sahne bütçesi.
import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Politika } from "./icerik.ts";
import type { EylemSonucu } from "./karar.ts";
import { etkiUygula, hissedilenEnflasyon } from "./ekonomi.ts";
import { gostergeEkle } from "./gostergeler.ts";
import { zarSayi, zarTam } from "./zar.ts";
import { sahaBaslat } from "./saha.ts";
import { HIZIPLER } from "./meclis-icerik.ts";

export function notEkle(
  d: OyunDurumu,
  metin: string,
  kategori = "yonetim",
): void {
  d.buAy.olaylar.push(metin);
  d.haberler.unshift({ ay: d.ay, metin, kategori });
  d.haberler.length = Math.min(120, d.haberler.length);
}
export function sicilEkle(
  d: OyunDurumu,
  kaynak: string,
  tur: "baski" | "yalan" | "usulsuzluk" | "kirilan_soz",
): void {
  d.sicil.push({
    id: `sicil#${++d.sayac}`,
    tur,
    kaynak,
    ay: d.ay,
    ifsaOldu: false,
  });
}
export function eylemUygun(d: OyunDurumu): string | null {
  if (d.bitis || d.yonetim.secim.gece) return "Dönem kapandı.";
  if (d.anlati.sahne || d.meclis.kulis || d.yonetim.medya.basin || d.yonetim.secim.sahne)
    return "Önce açık sahneyi tamamlayın.";
  return null;
}
export type Faaliyet = "ziyaret" | "anket" | "sendika" | "is_dunyasi" | "takip";
export function faaliyetYap(
  d: OyunDurumu,
  I: IcerikPaketi,
  tur: Faaliyet,
  hedef: string,
): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  if (!["ziyaret", "anket", "sendika", "is_dunyasi", "takip"].includes(tur))
    return { ok: false, neden: "Faaliyet bulunamadı." };
  if (d.bosGun < 1) return { ok: false, neden: "Takvimde boş gün kalmadı." };
  if (
    d.yonetim.ajanda.some(
      (a) =>
        a.ay === d.ay &&
        a.tur === tur &&
        (tur !== "ziyaret" || a.hedef === hedef),
    )
  )
    return { ok: false, neden: "Bu faaliyet bu ay yapıldı." };
  if (tur === "ziyaret" && !I.sehirler.some((s) => s.ad === hedef))
    return { ok: false, neden: "Şehir bulunamadı." };
  if (tur === "anket" && !hedef.startsWith("grup."))
    return { ok: false, neden: "Bir seçmen grubu seçin." };
  if (tur === "anket" && !(hedef in d.gostergeler))
    return { ok: false, neden: "Seçmen grubu bulunamadı." };
  let haber = "";
  if (tur === "ziyaret") return sahaBaslat(d, I, hedef);
  if (tur === "anket") {
    const tahmin = Math.max(
      2,
      Math.min(98, (d.gostergeler[hedef] ?? 48) + zarTam(d.zar, -3, 3)),
    );
    haber = `Özel anket: ${hedef.replace("grup.", "")} grubunda destek yaklaşık %${Math.round(tahmin)} (±3 puan). Yalnız bu aya ait örneklem; resmî anket ortalamasına katılmadı.`;
  } else if (tur === "sendika") {
    etkiUygula(d, "grup.isci", 2, "sosyal");
    etkiUygula(d, "grup.is_dunyasi", -1, "sosyal");
    haber =
      "İşçi temsilcileriyle toplantı yapıldı. Çalışma denetimleri konusunda mutabakat işçileri rahatlattı; işverenler uygulama maliyetine itiraz etti.";
  } else if (tur === "is_dunyasi") {
    etkiUygula(d, "guven", 2, "sosyal");
    etkiUygula(d, "grup.isci", -1, "sosyal");
    haber =
      "İş dünyası görüşmesinde yatırım takvimi açıklandı. Piyasalar olumlu karşıladı; sendikalar önceliğin ücretler olmasını istedi.";
  } else {
    for (const u of d.yonetim.uygulamalar) if (u.ay > d.ay) u.ay = d.ay;
    etkiUygula(d, "parti_ici", 1, "personel");
    haber =
      "Uygulama takip toplantısı: bekleyen işler ay sonuna çekildi. Bakanlar toplantının üslubundan rahatsız.";
  }
  d.bosGun--;
  d.yonetim.ajanda.push({ ay: d.ay, tur, hedef, metin: haber });
  notEkle(d, haber);
  return { ok: true, haber };
}

/** Atamalar masaya bir karar dosyası olarak getirilir; ayrı kurum yönetimi yok. */
export function atamaDosyasi(d: OyunDurumu, kurum: string): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  if (!(kurum in d.yonetim.kurumlar))
    return { ok: false, neden: "Kurum bulunamadı." };
  if (d.imza >= 3) return { ok: false, neden: "Bu ayın üç imzası kullanıldı." };
  if (
    d.masa.some((m) => m.kart === "kurum_atama") ||
    d.yonetim.ajanda.some((a) => a.ay === d.ay && a.tur === "atama")
  )
    return { ok: false, neden: "Bu ayın atama dosyası açıldı." };
  d.imza++;
  d.bayraklar.atama_kurum = kurum;
  d.masa.unshift({
    ornek: `kurum_atama#${++d.sayac}`,
    kart: "kurum_atama",
    degisken: {},
    agir: false,
    ikinciGorus: false,
  });
  d.yonetim.ajanda.push({
    ay: d.ay,
    tur: "atama",
    hedef: kurum,
    metin: "Atama dosyası masaya alındı; bir imza ayrıldı.",
  });
  return { ok: true };
}
export function kurumKarari(d: OyunDurumu, p: Politika, adim: number): void {
  const kurum = d.yonetim.kurumlar[p.getiren] ?? d.yonetim.kurumlar.hazine!;
  const etki = Object.fromEntries(
    Object.entries(p.adim).map(([id, v]) => [id, v * adim]),
  );
  // Mali/hukuki karar yürürlükte; hizmetlerin sahadaki kalan kısmı liyakate bağlı gecikir.
  const gecikme: Record<string, number> = {};
  for (const [id, v] of Object.entries(etki)) {
    if (
      ["konut", "deprem", "kamu_hizmet"].includes(id) &&
      v > 0 &&
      kurum.liyakat < 65
    ) {
      etkiUygula(d, id, v * 0.5, p.kalem ?? "sosyal");
      gecikme[id] = v * 0.5;
    } else etkiUygula(d, id, v, p.kalem ?? "sosyal");
  }
  if (Object.keys(gecikme).length) {
    d.yonetim.uygulamalar.push({
      ay: d.ay + 2,
      baslik: p.ad,
      etki: gecikme,
      kalem: p.kalem ?? "sosyal",
    });
    notEkle(
      d,
      `${p.ad} yürürlükte. Uygulamanın kalan yarısı personel ve kapasite sorunu nedeniyle iki ay sonra tamamlanacak.`,
    );
  }
  if (
    p.temel_hak &&
    adim > 0 &&
    (d.gostergeler.yargi ?? 45) > 65 &&
    (d.yonetim.kurumlar.adalet?.sadakat ?? 38) < 50
  ) {
    notEkle(
      d,
      `${p.ad} hakkında Anayasa Mahkemesi inceleme başlattı; bağımsız yargı uygulamayı durdurabilir.`,
    );
    d.yonetim.uygulamalar.push({
      ay: d.ay + 1,
      baslik: `${p.ad}: mahkeme kararı`,
      etki: Object.fromEntries(
        Object.entries(p.adim).map(([id, v]) => [id, -v * adim]),
      ),
      kalem: p.kalem ?? "sosyal",
      politika: p.id,
      onceki: d.politika[p.id] ?? p.baslangic,
      beklenen: (d.politika[p.id] ?? p.baslangic) + adim,
    });
  }
}
export function yonetimAySonu(d: OyunDurumu): string[] {
  const olaylar: string[] = [];
  for (const u of d.yonetim.uygulamalar.filter((u) => u.ay <= d.ay)) {
    if (u.politika) {
      if (d.politika[u.politika] !== u.beklenen) {
        olaylar.push(
          `${u.baslik}: düzenleme daha önce değiştirildi; aynı etki ikinci kez uygulanmadı.`,
        );
        continue;
      }
      d.politika[u.politika] = u.onceki!;
    }
    for (const [id, v] of Object.entries(u.etki)) etkiUygula(d, id, v, u.kalem);
    olaylar.push(
      `Tamamlanan uygulama: ${u.baslik}. Önceden bekleyen etkiler bu ay gerçekleşti.`,
    );
  }
  d.yonetim.uygulamalar = d.yonetim.uygulamalar.filter((u) => u.ay > d.ay);
  if (d.ay >= 7) {
    const h = HIZIPLER.find((h) => d.meclis.hizipler[h.id] < 15);
    if (h && !d.yonetim.parti.ayrilan) {
      d.yonetim.parti.ayrilan = h.id;
      d.yonetim.parti.vekil = zarTam(d.zar, 15, 30);
      gostergeEkle(d.gostergeler, "parti_ici", 8);
      olaylar.push(
        `${h.ad} lideri ${d.yonetim.parti.vekil} vekille Yeni Kanat Partisi'ni kurdu. Bu sandalyeler iktidar grubundan ayrıldı.`,
      );
    }
    if (
      HIZIPLER.filter((h) => d.meclis.hizipler[h.id] < 20).length >= 2 &&
      !d.yonetim.parti.kurultay
    ) {
      d.yonetim.parti.kurultay = d.ay + 1;
      olaylar.push(
        "İki hizip olağanüstü kurultay istedi. Gelecek ay liderlik oylanacak; ajandada örgütle görüşmek için son fırsat.",
      );
    } else if (d.yonetim.parti.kurultay && d.yonetim.parti.kurultay <= d.ay) {
      if (HIZIPLER.filter((h) => d.meclis.hizipler[h.id] < 30).length >= 2)
        d.bitis = {
          tur: "istifa",
          ay: d.ay,
          aciklama:
            "Olağanüstü kurultayda parti liderliğini kaybettiniz. Cumhurbaşkanlığından istifa ettiniz.",
        };
      else {
        olaylar.push(
          "Kurultay delegeleri son görüşmelerin ardından yönetimin devamına karar verdi.",
        );
        d.yonetim.parti.kurultay = 0;
      }
    }
  }
  return olaylar;
}
export function hizipleGorus(d: OyunDurumu, id: string): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  const h = HIZIPLER.find((h) => h.id === id);
  if (
    !h ||
    d.bosGun < 1 ||
    d.yonetim.ajanda.some(
      (a) => a.ay === d.ay && a.tur === "hizip" && a.hedef === id,
    )
  )
    return {
      ok: false,
      neden: "Görüşme yapılamıyor: boş gün ve ayda bir görüşme gerekiyor.",
    };
  d.bosGun--;
  d.meclis.hizipler[h.id] = Math.min(100, d.meclis.hizipler[h.id] + 15);
  const diger = HIZIPLER.filter((x) => x.id !== id);
  for (const x of diger)
    d.meclis.hizipler[x.id] = Math.max(0, d.meclis.hizipler[x.id] - 2);
  const haber = `${h.ad} ile görüşüldü. Gündemde daha fazla söz sahibi olacaklar; diğer kanatlar ayrıcalık eleştirisi yaptı.`;
  d.yonetim.ajanda.push({ ay: d.ay, tur: "hizip", hedef: id, metin: haber });
  notEkle(d, haber);
  return { ok: true, haber };
}
export function yonetimAyBasi(d: OyunDurumu, I: IcerikPaketi): void {
  // En fazla bir ifşa: aynı kayıt ikinci kez açılmaz, yeni yalan sonraki aylarda dönebilir.
  if (!d.yonetim.ifsa && I.kartlar.ifsa_yanit) {
    const kayit = d.sicil.find(
      (s) =>
        !s.ifsaOldu &&
        s.ay < d.ay &&
        zarSayi(d.zar) <
          0.025 +
            (d.gostergeler.basin ?? 45) / 900 +
            (s.tur === "kirilan_soz" ? 0.08 : 0),
    );
    if (kayit) {
      kayit.ifsaOldu = true;
      d.yonetim.ifsa = { sicil: kayit.id, kaynak: kayit.kaynak, ay: d.ay };
      d.masa.push({
        ornek: `ifsa_yanit#${++d.sayac}`,
        kart: "ifsa_yanit",
        degisken: {},
        agir: false,
        ikinciGorus: false,
      });
      notEkle(
        d,
        `Sızan dosya: ${kayit.kaynak}. Basın açıklama bekliyor.`,
        "medya",
      );
    }
  }
  const sabit: Record<number, string> = {
    1: "akkopru_telefon",
    2: "akkopru_inceleme",
    5: "rakip_dosya",
    7: "aile_telefon",
    9: "veliaht_karari",
    13: "aile_son",
    16: "akkopru_kampanya",
    17: "kongre_kampanya",
  };
  const kart = sabit[d.ay];
  if (
    kart &&
    I.kartlar[kart] &&
    (kart !== "akkopru_kampanya" || d.bayraklar.akkopru_oynandi) &&
    (kart !== "kongre_kampanya" || kongreGecmisi(d)) &&
    !d.gorulen[kart] &&
    !d.bekleyen.some((b) => b.kart === kart)
  )
    d.bekleyen.push({ kart, ay: d.ay, degisken: {}, agir: false });
  const krizler = [
    {
      id: "pahalilik",
      basla: d.ekonomi.gercekEnflasyon > 38,
      bitir: d.ekonomi.gercekEnflasyon < 33,
      kart: "pahalilik_karari",
    },
    {
      id: "banka",
      basla: d.ekonomi.krizler.some(
        (k) => k.id === "kur_soku" && d.ay - k.basladi >= 2,
      ),
      bitir: !d.ekonomi.krizler.length && (d.gostergeler.guven ?? 50) > 35,
      kart: "banka_guvence",
    },
    {
      id: "not",
      basla: (d.gostergeler.butce_acigi ?? 3.5) > 5,
      bitir: (d.gostergeler.butce_acigi ?? 3.5) < 4,
      kart: "not_indirimi",
    },
    {
      id: "grev",
      basla:
        hissedilenEnflasyon(d) > 33 &&
        d.ekonomi.hane.asgari / 28000 < 1 + hissedilenEnflasyon(d) / 100,
      bitir: d.ekonomi.hane.asgari / 28000 >= 1 + hissedilenEnflasyon(d) / 100,
      kart: "ucret_grevi",
    },
  ];
  for (const k of krizler) {
    const anahtar = `kriz_${k.id}`;
    if (k.bitir) {
      if (d.bayraklar[anahtar]) notEkle(d, `${k.id} krizi yatıştı.`, "ekonomi");
      d.bayraklar[anahtar] = false;
      d.yonetim.krizTakip[k.id] = 0;
    } else if (k.basla) {
      if (d.yonetim.krizTakip[`${k.id}:son`] !== d.ay) {
        d.yonetim.krizTakip[k.id] = (d.yonetim.krizTakip[k.id] ?? 0) + 1;
        d.yonetim.krizTakip[`${k.id}:son`] = d.ay;
      }
      const acik =
        Object.entries(d.bayraklar).filter(
          ([id, v]) => id.startsWith("kriz_") && v,
        ).length + d.ekonomi.krizler.length;
      // Para politikasına baskı varken ani kur şoku için bir kriz yeri boş kalır.
      const sinir = d.ekonomi.mbBaski > 0 && !d.ekonomi.krizler.length ? 1 : 2;
      if (
        !d.bayraklar[anahtar] &&
        acik < sinir &&
        (k.id !== "not" || d.yonetim.krizTakip[k.id]! >= 2)
      ) {
        d.bayraklar[anahtar] = true;
        if (I.kartlar[k.kart])
          d.bekleyen.push({
            kart: k.kart,
            ay: d.ay,
            degisken: {},
            agir: false,
          });
      }
    } else if (!d.bayraklar[anahtar]) d.yonetim.krizTakip[k.id] = 0;
  }
}
export function ozelKarar(d: OyunDurumu, kart: string, sec: number): void {
  if (kart === "kurum_atama") {
    const id = String(d.bayraklar.atama_kurum ?? "hazine");
    const onceki = d.yonetim.kurumlar[id];
    if (onceki && sec !== 2) {
      d.yonetim.kurumlar[id] =
        sec === 0 ? { liyakat: 90, sadakat: 35 } : { liyakat: 40, sadakat: 90 };
      if (id === "istatistik")
        d.ekonomi.istatistik = sec === 0 ? "liyakatli" : "sadik";
      if (id === "merkez_bankasi") {
        etkiUygula(d, "guven", sec === 0 ? 4 : -6, "sosyal");
        if (sec === 1) d.ekonomi.mbBaski += 3;
      }
    }
  }
  if (kart === "veliaht_karari") {
    d.yonetim.parti.veliaht = "teknokrat";
    d.meclis.hizipler.teknokrat =
      sec === 0
        ? Math.min(100, d.meclis.hizipler.teknokrat + 20)
        : sec === 1
          ? Math.max(0, d.meclis.hizipler.teknokrat - 50)
          : d.meclis.hizipler.teknokrat;
  }
  if (kart === "ifsa_yanit" && d.yonetim.ifsa) {
    d.yonetim.ifsalar.push({
      ay: d.ay,
      kaynak: d.yonetim.ifsa.kaynak,
      yanit: [
        "Sorumluluğu kabul etti; ilgili görevliyi aldı.",
        "İddiaları inkâr etti.",
        "Karşı saldırıya geçti.",
      ][sec]!,
    });
    d.yonetim.ifsa = null;
  }
}
