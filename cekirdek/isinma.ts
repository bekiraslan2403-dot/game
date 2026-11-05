// Bir tarife kararı, program ödeneği ve haneye ulaşan yardım ayrı kayıtlardır.
import type { OyunDurumu, MasaKarti } from "./durum.ts";
import type { IsinmaDosyasi } from "./isinma-durum.ts";
import { butceDegistir } from "./ekonomi.ts";

/** Örnek hanenin toplam faturasındaki doğal gaz payı; oyun varsayımı. */
export const GAZ_PAYI = .55;
const ILK = ["isinma_tahsilat", "isinma_sayac", "isinma_bakim"];
const TAKIP: Record<string, string[]> = {
  isinma_tahsilat: ["isinma_destek", "isinma_itiraz", "isinma_kesim"],
  isinma_sayac: ["isinma_itiraz", "isinma_destek", "isinma_kesim"],
  isinma_bakim: ["isinma_bakim_son", "isinma_bakim_son", "isinma_bakim_eksik"],
};
const SONUC: Record<string, string[]> = {
  isinma_destek: ["liste", "ikinci_destek", "destek_bitti"],
  isinma_itiraz: ["ayri_hesap", "borc_destegi", "tahsilat"],
  isinma_kesim: ["yeniden_baglanti", "ek_sure", "kesim_suruyor"],
  isinma_bakim_son: ["guvenlik_testi", "gecici_isinma", "mevcut_ekip"],
  isinma_bakim_eksik: ["geciken_bakim", "gecici_isinma", "mevcut_ekip"],
};

export function isinmaKarti(id: string): boolean { return id === "dogalgaz_zammi" || id.startsWith("isinma_"); }
export function isinmaDosyasi(d: OyunDurumu, m?: MasaKarti): IsinmaDosyasi | undefined {
  if (!m) return d.isinma.at(-1);
  return d.isinma.find(p => p.id === (m.kart === "dogalgaz_zammi" ? m.ornek : m.degisken.isinma));
}
export function isinmaEngeli(d: OyunDurumu, m: MasaKarti, sec: number): string | null {
  if (!isinmaKarti(m.kart)) return null;
  if (m.kart === "dogalgaz_zammi") return d.isinma.some(p => p.asama !== "tamam") ? "Önce açık kış dosyasını tamamla." : null;
  const p = isinmaDosyasi(d, m);
  if (!p || p.hedef !== m.kart || p.asama !== "masada") return "Bu kış kararının bağlı uygulama dosyası bulunamadı.";
  if (m.kart === "isinma_bakim_son" && sec === 0 && p.bakim !== "hazir") return "Parça değişimi yapılmadı. Güvenlik testine hazır tesis yok.";
  return null;
}

/** Genel kart etkisinden önce alınır; bu dosyanın gerçek bütçe farkını saklar. */
export function isinmaOncesi(d: OyunDurumu) { return { fatura: d.ekonomi.hane.fatura, sosyal: d.ekonomi.gider.sosyal ?? 0 }; }
function haber(d: OyunDurumu, p: IsinmaDosyasi, metin: string) {
  p.sonHaber = metin; p.sonAy = d.ay;
  d.buAy.olaylar.push(`Kış dosyası — ${metin}`);
}
function odemeyiKaydet(d: OyunDurumu, p: IsinmaDosyasi, amac: "fatura" | "bakim" | "gecici") {
  const s = d.ekonomi.sozler.at(-1);
  if (!s || s.durum !== "tutuldu" || s.verildi !== d.ay || !s.metin.startsWith("Kış dosyası:")) return;
  if (p.odemeler.some(o => o.soz === s.id)) return;
  // GSYH sonraki aylarda değişse de geçmiş ödeme yeniden hesaplanmaz.
  p.odemeler.push({ soz: s.id, ay: d.ay, amac, tutarTL: d.ekonomi.gsyh * 1e12 * s.maliyet / 100 / 12, uygulandi: false });
}
export function isinmaKarar(d: OyunDurumu, m: MasaKarti, sec: number, once: ReturnType<typeof isinmaOncesi>): void {
  if (!isinmaKarti(m.kart)) return;
  if (m.kart === "dogalgaz_zammi") {
    const artis = [38, 12, 0][sec]!;
    d.ekonomi.hane.fatura *= 1 + GAZ_PAYI * artis / 100;
    const p: IsinmaDosyasi = {
      id: m.ornek, ay: d.ay, ilk: (["zam", "kademe", "dondurma"] as const)[sec]!,
      asama: "bekleyen", hedef: ILK[sec]!, hedefAy: Math.min(18, d.ay + 1),
      faturaOnce: once.fatura, faturaSonra: d.ekonomi.hane.fatura,
      hazineFarki: (d.ekonomi.gider.sosyal ?? 0) - once.sosyal,
      yanit: null, sonuc: null, kesme: "normal", ortakSayac: false, bakim: "yok",
      isinma: sec === 2 ? "haber_yok" : "borc_riski", odemeler: [], sonAy: d.ay,
      sonHaber: ["Yeni tarife çıktı. İlk tahsilat sonucu gelecek ay gelecek.", "Kademeli tarife çıktı. Ortak sayaçlı binaların itirazı henüz incelenmedi.", "Konut tarifesi donduruldu. Dağıtım bakımına ayrıca ödenek verilmedi."][sec]!,
    };
    d.isinma.push(p); m.degisken.isinma = p.id;
    haber(d, p, p.sonHaber); return;
  }
  const p = isinmaDosyasi(d, m)!;
  if (m.kart === "isinma_bakim_eksik" && sec === 0) {
    p.yanit = "geciken_bakim"; p.bakim = "hazine"; odemeyiKaydet(d, p, "bakim");
    p.hedef = "isinma_bakim_son"; p.hedefAy = Math.min(18, d.ay + 1); p.asama = "bekleyen";
    haber(d, p, "Geciken bakımın ödeneği şimdi ödendi. Önceki soğuk dönem silinmedi; montaj tutanağı sonraki dosyada gelecek.");
    return;
  }
  if (TAKIP[m.kart]) {
    p.yanit = `${m.kart}:${sec}`;
    p.hedef = TAKIP[m.kart]![sec]!; p.hedefAy = Math.min(18, d.ay + 1); p.asama = "bekleyen";
    if ((m.kart === "isinma_tahsilat" && sec === 0) || (m.kart === "isinma_sayac" && sec === 1)) {
      odemeyiKaydet(d, p, "fatura"); haber(d, p, "Fatura yardımına ödenek aktarıldı. Şirketin abone eşleştirmesi bekleniyor.");
    } else if ((m.kart === "isinma_tahsilat" && sec === 1) || (m.kart === "isinma_sayac" && sec === 0)) {
      p.kesme = "askida";
      haber(d, p, "İtirazlı kesmeler inceleme boyunca durduruldu. Borç silinmedi; bina hesabı gelecek ay dönecek.");
    } else if (m.kart === "isinma_bakim") {
      if (sec === 0) { p.bakim = "hazine"; odemeyiKaydet(d, p, "bakim"); }
      else if (sec === 1) {
        p.bakim = "tarife";
        d.ekonomi.hane.fatura *= 1 + GAZ_PAYI * .15;
        p.faturaSonra *= 1 + GAZ_PAYI * .15;
        butceDegistir(d, "sosyal", -.15); p.hazineFarki -= .15;
      }
      haber(d, p, sec === 0 ? "Yedek parça ve gece ekibinin ödeneği ödendi. Montaj ve güvenlik testi henüz yapılmadı." : sec === 1 ? "Tarifeye sınırlı artış yapıldı; bakım şirketin tarifeden elde edeceği kaynağa bağlandı. Hazine bakım ödemesi yapmadı." : "Yeni bakım kaynağı ayrılmadı. Şirket mevcut ekiple ancak arızalı hattı izleyebileceğini bildirdi.");
    } else { p.kesme = "suruyor"; haber(d, p, "Şirketin tahsilat ve kesme süreci sürdü. Hane desteğine yeni ödenek ayrılmadı."); }
    return;
  }
  p.sonuc = SONUC[m.kart]![sec]!; p.asama = "uygulama"; p.hedef = null; p.hedefAy = null;
  const borcYardimi = (m.kart === "isinma_destek" || m.kart === "isinma_itiraz") && sec === 1;
  if (borcYardimi || (m.kart === "isinma_kesim" && sec === 0)) odemeyiKaydet(d, p, "fatura");
  if (["isinma_bakim_son", "isinma_bakim_eksik"].includes(m.kart) && sec === 1) odemeyiKaydet(d, p, "gecici");
  haber(d, p, "Son talimat gönderildi. İşletmenin uygulama yanıtı bu ayın kapanışında gelecek.");
}

/** Masaya gerçekten gelen ara dosya önceki ayın uygulama tutanağıdır. */
export function isinmaDosyaGeldi(d: OyunDurumu, m: MasaKarti): void {
  if (!m.kart.startsWith("isinma_")) return;
  // İçerik çözücüsü yalnız tanımlı şehir değişkenlerini devralır. Bu dosyanın
  // kimliği tek açık kış kaydından yeniden bağlanır; eski tarihçeden üretilmez.
  const p = isinmaDosyasi(d, m) ?? d.isinma.find(p => p.hedef === m.kart && p.asama === "bekleyen");
  if (!p || p.hedef !== m.kart || p.asama !== "bekleyen") return;
  m.degisken.isinma = p.id;
  p.asama = "masada";
  if (m.kart === "isinma_tahsilat" || m.kart === "isinma_sayac") p.isinma = "borc_riski";
  else if (m.kart === "isinma_bakim") p.isinma = "sinirli";
  else if (m.kart === "isinma_destek") {
    for (const o of p.odemeler.filter(o => o.amac === "fatura")) o.uygulandi = true;
    p.isinma = "acik";
  } else if (m.kart === "isinma_itiraz") { p.ortakSayac = true; p.kesme = "itirazli"; }
  else if (m.kart === "isinma_kesim") { p.isinma = "kesik"; p.kesme = "suruyor"; }
  else if (m.kart === "isinma_bakim_son" && p.bakim !== "yok") {
    p.bakim = "hazir";
    for (const o of p.odemeler.filter(o => o.amac === "bakim")) o.uygulandi = true;
  }
  p.sonHaber = m.kart === "isinma_destek" ? "Şirket ilk yardımın abone faturalarıyla eşleştiğini teyit etti. Adresi uyuşmayan başvurular dışarıda kaldı."
    : m.kart === "isinma_itiraz" ? "İnceleme bitti: ortak borç kaydı ödeme yapan daireleri ayrı göstermiyor. Kesme işlemi inceleme boyunca askıda kaldı."
    : m.kart === "isinma_kesim" ? "Şirket kesme işlemini teyit etti. Füsun'un binasında gaz kapalı; eski ödeme fişleri dosyada duruyor."
    : m.kart === "isinma_bakim_son" ? (p.bakim === "hazir" ? "Parça değişimi iş emrine işlendi. Güvenlik testi ve hizmete dönüş henüz teyit edilmedi." : "Yeni parça takılmadı. Basınç sorunu geçici müdahalelerle sürüyor.")
    : m.kart === "isinma_bakim_eksik" ? "Yeni parça takılmadı. Gece ekibi aynı arızaya dönüyor; güvenli hizmet teyidi yok."
    : m.kart === "isinma_bakim" ? "Tarife değişmedi; bölge hattındaki basınç sorunu teyit edildi. Bakım için ayrı iş emri gerekiyor."
    : m.kart === "isinma_sayac" ? "Ortak sayaç altı daireyi tek yüksek tüketimli abone gösteriyor. Daire başına tüketim alt kademede."
    : "İlk faturalar kesildi. Şirket ortak sayaçlı bina için kesme günü bildirdi; ödeme fişleri henüz ayrılmadı.";
  p.sonAy = d.ay;
}

export function isinmaAySonu(d: OyunDurumu): string[] {
  const olaylar: string[] = [];
  for (const p of d.isinma.filter(p => p.asama === "uygulama")) {
    const s = p.sonuc!;
    const metin = s === "guvenlik_testi" ? "Gece ekibi değişen parçanın sızdırmazlık testini tamamladı. Bölge hattı yeniden devreye alındı."
      : s === "gecici_isinma" ? "Geçici ısınma desteği teslim edildi. Gaz hattının güvenlik kabulü yapılmadı; destek yalnız bu dönem için."
      : s === "mevcut_ekip" ? (p.bakim === "hazir" ? "Parça yerinde; bağımsız güvenlik tutanağı yok. İşletme sınırlı hizmeti sürdürüyor." : "Yeni parça takılmadı. İşletme hattaki basınç sorununu geçici müdahalelerle izliyor.")
      : s === "ayri_hesap" ? (p.ilk === "kademe" ? "Şirket ortak sayacı daire kaydıyla yeniden hesapladı; yanlış yüksek kademe farkı abone hesabına alacak yazıldı. Ödeyen daireler ayrıldı, itirazlı kesmeler durdu. Borçlu dairelerin kalan borcu silinmedi." : "Şirket, ödeme yapan daireleri toplu borçtan ayırdı; itirazlı abonelerin kesmesi durdu. Kalan borç diğer dairelere aktarılamadı.")
      : ["borc_destegi", "yeniden_baglanti"].includes(s) ? "Doğrulanmış hanelerin bu dönem borcu yardımla eşleşti; şirket yeniden bağlantıyı teyit etti. Eski borcun tümü silinmedi."
      : s === "ek_sure" ? "Şirket bir dönemlik yeniden bağlantıyı teyit etti. Borç tahsil edilmedi; sonraki dönem için yeni güvence verilmedi."
      : ["tahsilat", "kesim_suruyor"].includes(s) ? "İtiraz dosyası açık kaldı. Şirket borçlu abonelerde kesme işlemini sürdürdü; yeni yardım verilmedi."
      : s === "ikinci_destek" ? "İkinci dönem yardımı abone faturalarıyla eşleşti. İlk yardım ikinci kez ödenmedi; yeni gider ayrıca kaydedildi."
      : s === "liste" ? "Muhtarlığın gelir kaydıyla dağıtım listesindeki adlar eşleştirildi. İlk yardımda kapsam dışında kalanlar için yeni ödeme yapılmadı."
      : "İlk yardım faturaya ulaştı. Program uzatılmadı; gelecek faturayı hane kendi karşılayacak.";
    p.isinma = ["guvenlik_testi", "ayri_hesap", "borc_destegi", "yeniden_baglanti", "ikinci_destek", "liste", "destek_bitti"].includes(s) ? "acik" : ["tahsilat", "kesim_suruyor"].includes(s) ? "kesik" : s === "gecici_isinma" || s === "ek_sure" ? "gecici" : "sinirli";
    if (s === "guvenlik_testi") p.bakim = "kabul";
    if (s === "ayri_hesap") p.kesme = "itirazli";
    else p.kesme = ["tahsilat", "kesim_suruyor"].includes(s) ? "suruyor" : "normal";
    for (const o of p.odemeler) o.uygulandi = true;
    p.asama = "tamam"; p.sonAy = d.ay; p.sonHaber = metin;
    olaylar.push(`Kış dosyası — ${metin}`);
  }
  return olaylar;
}

export function isinmaDurumu(d: OyunDurumu, p: IsinmaDosyasi): string {
  if (d.ay - p.sonAy >= (p.isinma === "gecici" ? 1 : 2)) return "Son teyit arşivde; bugünkü ısınma doğrulanmadı.";
  return ({ haber_yok: "İşletmenin ilk yanıtı bekleniyor", borc_riski: "Gaz açık; fatura ve kesme riski var", acik: "İşletme gazın açık olduğunu teyit etti", sinirli: "Basınç sorunu sürüyor; hizmet sınırlı", kesik: "Borçlu abonelerde kesinti teyit edildi", gecici: "Bir dönemlik geçici çözüm; sonraki ay güvence yok" })[p.isinma];
}
