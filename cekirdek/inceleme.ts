import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Kart, Secenek } from "./icerik.ts";
import { INCELEME_RAPORLARI } from "./inceleme-durum.ts";

export function incelemeKanit(d: OyunDurumu): void {
  d.bayraklar.inceleme_kanit_var = d.inceleme?.hamKayit === true || d.bayraklar.akkopru_ham_veri === true || d.inceleme?.tanikBeyani === true || d.bayraklar.inceleme_beyan_teslim === true;
}
function iz(d: OyunDurumu, metin: string): void {
  d.inceleme!.izler.push({ ay: d.ay, metin });
  d.buAy.olaylar.push(`Akköprü incelemesi — ${metin}`);
}
/** Görüşme yeni delil uydurmaz; alınan imzalı beyan ayrı bir ek olur. */
export function incelemeKonusma(d: OyunDurumu, k: Kart): void {
  if (!k.inceleme) return;
  incelemeKanit(d);
  if (d.inceleme && d.bayraklar.inceleme_beyan_teslim === true && !d.inceleme.tanikBeyani) {
    d.inceleme.tanikBeyani = true;
    iz(d, "Deniz'in imzalı beyanı avukatı üzerinden ayrı ek olarak alındı; geçmiş ölçüm kaydının yerine konmadı.");
  }
}
export function incelemeEngeli(d: OyunDurumu, k: Kart, s: Secenek): string | null {
  if (!k.inceleme) return null;
  if (!s.inceleme) return "İnceleme talimatı tanımlı değil.";
  if (k.inceleme.asama === "baslangic") return d.inceleme ? "Bu inceleme zaten başlatıldı." : null;
  if (!d.inceleme || d.inceleme.raporKarti !== k.id || d.inceleme.asama !== "rapor") return "Bu rapor henüz teslim edilmedi veya kararı zaten verildi.";
  return null;
}
export function incelemeAyBasi(d: OyunDurumu, I: IcerikPaketi): void {
  const p = d.inceleme;
  if (!p || p.asama !== "bekliyor" || d.ay < p.raporAy) return;
  const r = I.kartlar[p.raporKarti]?.inceleme?.rapor;
  if (!r) return;
  p.rapor = {
    tanikBeyani: p.tanikBeyani, baslik: r.baslik,
    bulgular: [...r.bulgular, ...(p.hamKayit ? [r.ham_var] : []), ...(p.tanikBeyani ? [r.beyan_var] : [])],
    eksikler: [...r.eksikler, ...(!p.hamKayit ? [r.ham_yok] : []), ...(!p.tanikBeyani ? [r.beyan_yok] : [])],
  };
  p.asama = "rapor";
  incelemeKanit(d);
  iz(d, `${r.baslik} teslim edildi. Raporu almak, yayımlamak veya köprüyü onarılmış saymak değildir.`);
}
export function incelemeUygula(d: OyunDurumu, k: Kart, s: Secenek): void {
  const a = s.inceleme;
  if (!k.inceleme || !a) return;
  const maliyet = d.ekonomi.gsyh * (s.icra?.odeme?.maliyet ?? 0) / 100 / 12 * 1e12;
  if (a.islem === "baslat") {
    d.inceleme = {
      baslangicAy: d.ay, yol: a.yol, asama: "bekliyor", raporAy: d.ay + 1,
      raporKarti: INCELEME_RAPORLARI[a.yol], hamKayit: d.bayraklar.akkopru_ham_veri === true,
      tanikBeyani: d.bayraklar.inceleme_beyan_teslim === true, tanikDurumu: d.acilis?.deniz ?? "eski_kayit",
      harcamaTL: maliyet, yayin: "bekliyor", rapor: null, oncekiRaporlar: [], sonuc: null, izler: [],
    };
    iz(d, a.metin);
  } else if (a.islem === "devret") {
    const p = d.inceleme!;
    iz(d, a.metin);
    if (p.rapor) p.oncekiRaporlar.push({ ay: d.ay, yol: p.yol, rapor: structuredClone(p.rapor) });
    p.yol = "bagimsiz"; p.asama = "bekliyor"; p.raporAy = d.ay + 1;
    p.raporKarti = INCELEME_RAPORLARI.bagimsiz; p.rapor = null; p.sonuc = null; p.yayin = "bekliyor";
    p.harcamaTL += maliyet;
  } else {
    const p = d.inceleme!;
    p.asama = "tamam"; p.yayin = a.yayin; p.sonuc = { baslik: a.baslik, metin: a.metin }; p.harcamaTL += maliyet;
    const haber = `${a.baslik}. ${a.metin}`;
    iz(d, haber);
    d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "yerel" }); d.haberler = d.haberler.slice(0, 120);
    d.buAy.haberler.push(haber);
  }
  incelemeKanit(d);
}
