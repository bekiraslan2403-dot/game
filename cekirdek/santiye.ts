import type { OyunDurumu } from "./durum.ts";
import type { Kart, Secenek } from "./icerik.ts";
import type { SantiyeKaydi } from "./santiye-durum.ts";

const KARTLAR = new Set(["akkopru_tazminat", "akkopru_onarim", "akkopru_teslim", "akkopru_kabul", "akkopru_son"]);
function iz(d: OyunDurumu, metin: string) {
  d.santiye!.izler.push({ ay: d.ay, metin });
  d.buAy.olaylar.push(`Akköprü şantiyesi — ${metin}`);
}
export function santiyeEngeli(d: OyunDurumu, k: Kart, s: Secenek): string | null {
  if (!KARTLAR.has(k.id)) return null;
  const p = d.santiye;
  if (k.id === "akkopru_son") return p && p.asama !== "kabul" ? "Bağımsız teknik kabul olmadan köprü açılamaz." : null;
  if (!s.santiye) return "Şantiye işlemi tanımlı değil.";
  if (s.santiye.ucret && (p?.ucret === "odendi" || d.bayraklar.akkopru_ucret_odendi === true)) return "Bu işçi alacağı daha önce ödendi; ikinci kez ödenemez.";
  if (k.id === "akkopru_tazminat") return p && p.protokol !== "yok" ? "Protokol zaten karara bağlandı." : null;
  if (k.id === "akkopru_onarim") return p && !["protokol", "hazirlik", "durduruldu"].includes(p.asama) ? "Şantiyede başka bir işlem sürüyor." : null;
  if (k.id === "akkopru_teslim" && p?.asama !== "fiziksel_teslim") return "Fiziksel teslim henüz yapılmadı.";
  if (k.id === "akkopru_kabul" && (p?.asama !== "kabul_bekliyor" || p.isAy !== null)) return "Bağımsız deneyin sonucu henüz gelmedi.";
  if (k.id === "akkopru_kabul" && s.santiye.asama === "kabul" && p?.teknik !== "uygun") return "Bağımsız deney uygun değil; teknik kabul imzalanamaz.";
  return null;
}
export function santiyeAyBasi(d: OyunDurumu) {
  const p = d.santiye;
  if (!p || p.isAy === null || d.ay < p.isAy) return;
  if (p.asama === "yapim") {
    p.asama = "fiziksel_teslim";
    iz(d, `${p.yuklenici === "yeni" ? "Yeni" : "Eski"} yüklenici güçlendirme işini teslim etti. Malzeme ve yük deneyi yapılmadı; trafik kapalı.`);
  } else if (p.asama === "kabul_bekliyor") {
    p.teknik = p.numune && p.yuklenici === "yeni" ? "uygun" : "eksik";
    d.bayraklar.santiye_teknik_uygun = p.teknik === "uygun";
    iz(d, p.teknik === "uygun" ? "Bağımsız yük deneyi uygun; korunan numune ve yapım tutanağı karşılaştırıldı." : "Bağımsız deney açıkları saptadı; eksik numune veya eski yüklenicinin işi için kabul verilmedi.");
  }
  p.isAy = null;
}
export function santiyeUygula(d: OyunDurumu, k: Kart, s: Secenek) {
  if (!s.santiye) return;
  const a = s.santiye;
  if (!d.santiye) {
    d.santiye = {
      baslangicAy: d.ay, asama: "hazirlik", yuklenici: "belirsiz", ucret: d.bayraklar.akkopru_ucret_odendi === true ? "odendi" : "bekliyor",
      protokol: "yok", sorumluluk: "sakli", numune: d.bayraklar.akkopru_numune_korundu === true,
      isAy: null, harcamaTL: 0, teknik: "bekliyor", izler: [],
    } satisfies SantiyeKaydi;
  }
  const p = d.santiye;
  p.harcamaTL += d.ekonomi.gsyh * (s.icra?.odeme?.maliyet ?? 0) / 100 / 12 * 1e12;
  if (a.ucret) p.ucret = a.ucret;
  if (a.ucret === "odendi") d.bayraklar.akkopru_ucret_odendi = true;
  if (a.protokol) p.protokol = a.protokol;
  if (a.sorumluluk) p.sorumluluk = a.sorumluluk;
  if (a.numune) p.numune = true;
  if (a.yuklenici) p.yuklenici = a.yuklenici;
  if (a.asama) p.asama = a.asama;
  if (a.takvim) p.isAy = d.ay + a.takvim;
  if (a.asama === "kabul") p.teknik = "uygun";
  if (a.asama === "yapim") { p.teknik = "bekliyor"; d.bayraklar.santiye_teknik_uygun = false; }
  iz(d, a.metin);
}
