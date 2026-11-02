// Son üç ay ve seçim gecesi. Sonuç bir kez hesaplanır; animasyon ve yenileme zar atmaz.
import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi } from "./icerik.ts";
import type { EylemSonucu } from "./karar.ts";
import { GOSTERGE, GRUP_KIMLIKLERI } from "./gostergeler.ts";
import { zarSayi, zarTam } from "./zar.ts";
import { sahneIsabeti, sahneCevaplari } from "./sahne-derinlik.ts";
import { sozVer } from "./hazine.ts";
import { eylemUygun, notEkle, sicilEkle } from "./yonetim.ts";

export const SLOGANLAR = [
  "Geçimi birlikte düzelteceğiz",
  "Güven ve istikrar",
  "Özgür bir yarın",
] as const;
export function kasaSozu(n: number): string {
  return n < 20 ? "boş" : n < 55 ? "yeterli" : "güçlü";
}
function kampanyaEtkisi(d: OyunDurumu, fark: number): void {
  d.yonetim.secim.etki = Math.max(-4, Math.min(4, d.yonetim.secim.etki + fark));
}
export function sloganSec(d: OyunDurumu, slogan: string): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  if (
    d.ay < 16 ||
    d.yonetim.secim.slogan ||
    !SLOGANLAR.includes(slogan as (typeof SLOGANLAR)[number])
  )
    return { ok: false, neden: "Slogan kampanya başında bir kez seçilir." };
  d.yonetim.secim.slogan = slogan;
  const celiski =
    slogan === SLOGANLAR[0]
      ? (d.gostergeler.enflasyon ?? 29) > 38
      : slogan === SLOGANLAR[1]
        ? (d.gostergeler.huzur ?? 55) < 35
        : (d.gostergeler.basin ?? 45) < 30;
  kampanyaEtkisi(d, celiski ? -0.8 : 0.5);
  const haber = celiski
    ? `“${slogan}” sloganı sicil ve mevcut koşullarla çeliştiği için alaya alındı.`
    : `“${slogan}” kampanyanın ana mesajı oldu.`;
  notEkle(d, haber, "secim");
  return { ok: true, haber };
}
export type KampanyaAraci = "reklam" | "kapi" | "kamu";
export function kampanyaYap(
  d: OyunDurumu,
  arac: KampanyaAraci,
  grup: string,
): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  if (
    d.ay < 16 ||
    !["reklam", "kapi", "kamu"].includes(arac) ||
    !GRUP_KIMLIKLERI.includes(grup)
  )
    return {
      ok: false,
      neden: "Kampanya son üç ayda açılır; bir hedef grup seçin.",
    };
  const s = d.yonetim.secim,
    maliyet = arac === "reklam" ? 15 : arac === "kapi" ? 8 : 5;
  if (s.kasa < maliyet || d.bosGun < 1)
    return { ok: false, neden: "Parti kasası veya boş gün yetersiz." };
  const key = `${d.ay}:${arac}`,
    kez = s.tekrar[key] ?? 0;
  if (kez >= 2)
    return {
      ok: false,
      neden: "Bu araç bu ay iki kez kullanıldı; örgütün kapasitesi doldu.",
    };
  s.tekrar[key] = kez + 1;
  s.kasa -= maliyet;
  d.bosGun--;
  let etki =
    arac === "kapi"
      ? 0.3
      : arac === "reklam"
        ? zarSayi(d.zar) < 0.22
          ? -0.5
          : 0.65
        : 0.5;
  etki *= kez ? 0.5 : 1;
  // Reklamın yankısı hedef grubun büyüklüğü ve tavrıyla sınırlı; toplam ±4 puan.
  etki *= 0.7 + (GOSTERGE[grup]?.nufus ?? 20) / 60;
  kampanyaEtkisi(d, etki);
  if (arac === "kamu")
    sicilEkle(d, "Kampanyada kamu kaynaklarıyla açılış ve yayın", "usulsuzluk");
  const haber = `${GOSTERGE[grup]!.ad} için ${arac === "reklam" ? "reklam filmi" : arac === "kapi" ? "kapı kapı çalışma" : "kamu açılışı"}: ${etki < 0 ? "mesaj ters tepti." : "örgüt sahadan olumlu izlenim bildirdi."}${kez ? " Aynı araç tekrarlandığı için etkisi yarıya indi." : ""}`;
  d.yonetim.ajanda.push({
    ay: d.ay,
    tur: "kampanya",
    hedef: grup,
    metin: haber,
  });
  notEkle(d, haber, "secim");
  return { ok: true, haber };
}
export function kampanyaSahneAc(
  d: OyunDurumu,
  tur: "miting" | "munazara",
): EylemSonucu {
  const hata = eylemUygun(d);
  if (hata) return { ok: false, neden: hata };
  if (d.ay < 16 || !["miting", "munazara"].includes(tur))
    return { ok: false, neden: "Kampanya henüz başlamadı." };
  if (d.meclis.sahneAy === d.ay || d.bosGun < 1 || d.yonetim.secim.kasa < 12)
    return {
      ok: false,
      neden: "Bir sahne, bir boş gün ve parti kasası gerekiyor.",
    };
  d.meclis.sahneAy = d.ay;
  d.bosGun--;
  d.yonetim.secim.kasa -= 12;
  d.yonetim.secim.sahne = { tur, adim: 0, cevaplar: [] };
  return { ok: true };
}
export const MITING_SORULARI = [
  "Meydana nasıl sesleniyorsunuz?",
  "Seçmene hangi sözü veriyorsunuz?",
  "Rakibin eleştirisine cevabınız ne?",
];
export const MUNAZARA_SORULARI = [
  "Enflasyon ve ücretler neden bu noktaya geldi?",
  "Yargı bağımsızlığını hangi kararınız korudu?",
  "Sızan dosyaların sorumluluğu kime ait?",
  "Bir dönem daha için neden size oy verilmeli?",
];
export const SAHNE_CEVAPLARI = [
  [
    "Birlik ve ortak gelecek",
    "Tabanın gücünü vurgula",
    "Rakibin sicilini hedef al",
  ],
  [
    "Maliyeti belli sınırlı program",
    "Geniş destek paketi sözü",
    "Sorunun çözüldüğünü söyle",
  ],
  [
    "Eleştiriyi kabul et, hesabı ver",
    "Rakibin açığını hatırlat",
    "Soruyu gazeteciye çevir",
  ],
  [
    "Dönemin sonuçlarını anlat",
    "Yeni başlangıç sözü ver",
    "Rakibin yönetemeyeceğini söyle",
  ],
];
export function kampanyaSahneSec(d: OyunDurumu, sec: number): EylemSonucu {
  const s = d.yonetim.secim.sahne;
  if (
    d.bitis ||
    !s ||
    !Number.isInteger(sec) ||
    sec < 0 ||
    sec > 2 ||
    s.adim >= (s.tur === "miting" ? 3 : 4)
  )
    return { ok: false, neden: "Sahne seçimi geçersiz." };
  const once = s.adim;
  s.cevaplar.push(sec);
  s.adim++;
  const guven = (d.gostergeler.guven ?? 50) / 100,
    kurum = (d.gostergeler.yargi ?? 45) / 100;
  const etki =
    sec === 0
      ? 0.1 + guven * 0.3
      : sec === 1
        ? zarSayi(d.zar) < 0.3
          ? -0.25
          : 0.4
        : 0.15 - kurum * 0.3;
  kampanyaEtkisi(d, etki + sahneIsabeti(d,once,sec));
  if ((s.tur === "miting" ? once === 1 : once === 0) && sec === 1)
    sozVer(d, {
      metin: "Kampanya meydanında açıklanan sosyal destek",
      kalem: "sosyal",
      maliyet: 0.2,
      vade: 1,
      grup: "grup.emekli",
    });
  if ((s.tur === "miting" ? once === 1 : once === 0) && sec === 2)
    sicilEkle(
      d,
      "Kampanyada sorunun çözüldüğüne dair yanıltıcı açıklama",
      "yalan",
    );
  const haber = `${s.tur === "miting" ? "Miting" : "Münazara"}: ${sahneCevaplari(d,s.tur,once)[sec]}. ${etki < 0 ? "Kararsız seçmende tepki oluştu." : "Mesaj seçmene ulaştı; rakip karşı açıklama hazırlıyor."}`;
  notEkle(d, haber, "secim");
  return { ok: true, haber };
}
export function kampanyaSahneKapat(d: OyunDurumu): EylemSonucu {
  const s = d.yonetim.secim.sahne;
  if (!s || s.adim < (s.tur === "miting" ? 3 : 4))
    return { ok: false, neden: "Sahneyi tamamlayın." };
  d.yonetim.secim.sahne = null;
  return { ok: true };
}
export function rakipHamlesi(d: OyunDurumu): string {
  const g = d.gostergeler;
  const sonKarar=d.gecmis.at(-1)?.kararlar.at(-1)??d.buAy.kararlar.at(-1);
  const konu =
    (g.enflasyon ?? 29) > 35
      ? "geçim krizini"
      : (g.basin ?? 45) < 35
        ? "basın üzerindeki baskıyı"
        : d.yonetim.ifsalar.length
          ? "sızan dosyaları"
          : "yerel yönetimlerin taleplerini";
  const haber = `${d.yonetim.secim.rakip}, ${konu} gündeme taşıdı. ${d.ay % 3 === 0 ? "Bölgesel ittifak görüşmesi yaptı." : d.ay % 3 === 1 ? "Büyükşehirde miting düzenledi." : "Canlı yayında hükümeti eleştirdi."}`;
  // Güçlü ve zayıf yanlar tepkiyi değiştirir; tek yönlü, durmadan yükselen rakip yok.
  const fark =
    (g.enflasyon ?? 29) > 35 || d.yonetim.ifsalar.length > 2 ? 0.6 : -0.15;
  etkiRakip(d, fark);
  if(sonKarar) return haber + ` “${sonKarar.baslik}” dosyasında verdiğiniz “${sonKarar.secenekMetni}” kararına karşı kendi programını açıkladı.`;
  return haber;
}
function etkiRakip(d: OyunDurumu, v: number): void {
  d.gostergeler.rakip = Math.max(
    0,
    Math.min(100, (d.gostergeler.rakip ?? 50) + v),
  );
}
export function secimiHazirla(d: OyunDurumu, I: IcerikPaketi): void {
  if (d.yonetim.secim.gece) return;
  let oy = 0,
    top = 0,
    kat = 0;
  for (const id of GRUP_KIMLIKLERI) {
    const destek = d.gostergeler[id] ?? 48,
      nufus = GOSTERGE[id]!.nufus ?? 0;
    const katilim = 0.68 + Math.abs(destek - 50) / 200;
    oy += destek * nufus * katilim;
    top += nufus * katilim;
    kat += nufus;
  }
  const sonuc = Math.max(
    5,
    Math.min(
      90,
      oy / top +
        d.yonetim.secim.etki -
        ((d.gostergeler.rakip ?? 50) - 50) * 0.08 +
        (zarSayi(d.zar) - 0.5) * 1.4,
    ),
  );
  const diger = Math.min(100 - sonuc, zarTam(d.zar, 5, 11));
  const rakip = 100 - sonuc - diger;
  const hayatlar = I.hayatlar.map((h) => ({
    kim: h.ad,
    metin: d.toplum.hayatlar[h.id]?.ayrildi
      ? "Bu seçim gecesini memleketindeki evinde geçirmedi. Son mektubu arşivde kaldı."
      : `${h.ad}, ${h.grup === "grup.emekli" ? "ilaç ve aylık hesabını" : h.grup === "grup.genc" ? "geleceğini" : "evindeki geçim hesabını"} düşündü. Oyunu ${(d.gostergeler[h.grup] ?? 48) >= 50 ? "size" : "değişim isteyen adaya"} verdi.`,
  }));
  const akis = [5, 18, 35, 57, 78, 92, 100].map((acilan, i) => ({
    acilan,
    ajansA: Math.max(0, Math.min(100, sonuc + (100 - acilan) * 0.13)),
    ajansB: Math.max(0, Math.min(100, sonuc - (100 - acilan) * 0.11)),
    not: [
      "İlk kırsal sandıklar açıldı.",
      "Büyükşehir sandıkları sisteme giriyor.",
      "Katılım ve sandık tutanakları karşılaştırılıyor.",
      "Yurt dışı oylarının bir bölümü eklendi.",
      "Beş yurttaşın seçim gecesinden notlar geldi.",
      "İki ajansın verileri birbirine yaklaşıyor.",
      "Sayım tamamlandı; ajanslar aynı tutanaklarda birleşti.",
    ][i]!,
  }));
  d.yonetim.secim.gece = {
    tur: 1,
    oy: sonuc,
    rakipOy: rakip,
    diger,
    katilim: Math.min(95, (top / kat) * 100),
    ikinciTur: sonuc <= 50 && rakip <= 50,
    itiraz: Math.abs(sonuc - rakip) < 1,
    tamam: false,
    akis,
    hayatlar,
  };
}
export function ikinciTur(d: OyunDurumu, sec: number): EylemSonucu {
  const g = d.yonetim.secim.gece;
  if (
    d.bitis ||
    !g ||
    !g.ikinciTur ||
    g.tur !== 1 ||
    !Number.isInteger(sec) ||
    sec < 0 ||
    sec > 2
  )
    return { ok: false, neden: "İkinci tur kararı beklenmiyor." };
  const aktarim = sec === 0 ? 0.6 : sec === 1 ? 0.48 : 0.3;
  g.oy = Math.max(
    0,
    Math.min(100, g.oy + g.diger * aktarim + (zarSayi(d.zar) - 0.5) * 0.3),
  );
  g.rakipOy = 100 - g.oy;
  g.diger = 0;
  g.tur = 2;
  g.ikinciTur = false;
  g.itiraz = Math.abs(g.oy - g.rakipOy) < 1;
  g.akis = [10, 40, 70, 100].map((acilan) => ({
    acilan,
    ajansA: Math.max(0, Math.min(100, g.oy + (100 - acilan) * 0.08)),
    ajansB: Math.max(0, Math.min(100, g.oy - (100 - acilan) * 0.08)),
    not: "İkinci tur: iki adayın oyları sayılıyor.",
  }));
  if (sec === 0) {
    d.gostergeler.kutuplasma = Math.max(
      0,
      (d.gostergeler.kutuplasma ?? 45) - 2,
    );
    notEkle(
      d,
      "İkinci turda üçüncü adayla politika tavizi karşılığında ittifak yapıldı.",
      "secim",
    );
  }
  return { ok: true };
}
export function secimiBitir(
  d: OyunDurumu,
  sec: "kabul" | "sayim" | "tanima",
): EylemSonucu {
  const g = d.yonetim.secim.gece;
  if (
    d.bitis ||
    !g ||
    g.tamam ||
    g.ikinciTur ||
    !["kabul", "sayim", "tanima"].includes(sec)
  )
    return { ok: false, neden: "Seçim sonucu henüz kapanamaz." };
  if (sec !== "kabul" && !g.itiraz)
    return {
      ok: false,
      neden: "İtiraz sahnesi yalnız fark bir puanın altındaysa açılır.",
    };
  if (sec === "sayim") {
    const fark = (zarSayi(d.zar) - 0.5) * 0.2;
    g.oy = Math.max(0, Math.min(100, g.oy + fark));
    g.rakipOy = 100 - g.diger - g.oy;
    notEkle(
      d,
      "Yeniden sayım tamamlandı. Mühürlü tutanaklar sonuca işlendi.",
      "secim",
    );
  }
  if (sec === "sayim" && g.tur === 1 && g.oy <= 50 && g.rakipOy <= 50) {
    g.ikinciTur = true;
    g.itiraz = false;
    return {
      ok: true,
      haber:
        "Yeniden sayımda hiçbir aday salt çoğunluğa ulaşamadı; ikinci tur yapılacak.",
    };
  }
  const tur =
    sec === "tanima"
      ? "devrilme"
      : g.oy > g.rakipOy
        ? "yeniden_secilme"
        : "yenilgi";
  g.tamam = true;
  d.bitis = {
    tur,
    ay: d.ay,
    aciklama:
      sec === "tanima"
        ? "Seçim sonucunu tanımamanız anayasal krize dönüştü. Kurumlar yönetimi devraldı."
        : `Geçerli oyların %${g.oy.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} oranını aldınız. ${tur === "yeniden_secilme" ? "Yeni dönem için yeniden seçildiniz." : "İktidarı rakibinize devrettiniz."}`,
  };
  return { ok: true };
}
export function sonsoz(d: OyunDurumu): string[] {
  const g = d.gostergeler;
  return [
    (g.enflasyon ?? 29) < 25
      ? "Beş yıl sonra enflasyon, dönemin başındaki düzeyin altındaydı. İstikrarın ilk yıllardaki işsizlik bedeli hâlâ tartışılıyordu."
      : "Beş yıl sonra geçim meselesi yeni hükümetlerin de gündemindeydi. Ücret kararlarınız eski pazar fişleriyle yan yana anılıyordu.",
    (g.yargi ?? 45) > 60
      ? "Mahkemelerin bağımsızlığı sonraki yönetimin de sınırı oldu. Size karşı verilen kararlar bu mirasın bir parçasıydı."
      : "Yargı üzerindeki siyasi etki sonraki yönetime de kaldı. Kurduğunuz araçlar bu kez sizin çevrenizdeki isimler için kullanıldı.",
    (g.konut ?? 35) > 55
      ? "Konut programıyla evine taşınan aileler yeni mahalleler kurdu. Borçların ve kira baskısının tamamı bitmedi."
      : "Konut bekleyenlerin dosyaları bir sonraki yönetimin masasına taşındı. Bazı çocuklar geçici yerleşimlerde büyüdü.",
    (g.basin ?? 45) > 60
      ? "Gazeteciler dönemin kararlarını farklı açılardan yazabildi. Sizi destekleyenler de eleştirenler de arşivde kaldı."
      : "Yayın kuruluşlarının el değiştirmesi uzun süre tartışıldı. Eski programların bir bölümü yurt dışından yayın yapmayı sürdürdü.",
    ...d.sicil
      .filter((s) => !s.ifsaOldu)
      .slice(0, 5)
      .map((s) => `Yıllar sonra ortaya çıkanlar: ${s.kaynak}.`),
    ...d.yonetim.ifsalar
      .slice(-3)
      .map((s) => `Arşivden: ${s.kaynak} — ${s.yanit}`),
  ];
}
