import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Kart, Secenek } from "./icerik.ts";

/** Bölümün yanlış yoldan, iki defa veya geçmiş kayda sonuç uydurarak oynanmasını engeller. */
export function acilisEngeli(d: OyunDurumu, k: Kart, s: Secenek): string | null {
  if (k.id === "akkopru_telefon" && d.acilis) return "İlk gecenin kararı zaten kayda geçti.";
  if (k.acilis && (!d.acilis || d.acilis.sabahKarti !== k.id || d.acilis.sabah !== null))
    return "Bu sabah dosyası ilk geceki talimatınıza bağlı değil veya zaten yanıtlandı.";
  if (k.acilis && !s.acilis_sonuc) return "Sabah dosyasının sonucu tanımlı değil.";
  return null;
}

/** Bütçe icraEt ile ödenir. Burada fiziksel sonuç, tanık ve sonraki olay yolu tutulur. */
export function acilisUygula(d: OyunDurumu, I: IcerikPaketi, k: Kart, s: Secenek, secim: number): void {
  if (k.id === "akkopru_telefon") {
    const sonraki = I.kartlar[s.sonraki.find(n => n.gecikme === 0 && I.kartlar[n.kart]?.acilis)?.kart ?? ""];
    if (!sonraki?.acilis) return;
    const a = sonraki.acilis;
    d.acilis = {
      gece: secim, sabahKarti: sonraki.id as NonNullable<OyunDurumu["acilis"]>["sabahKarti"], sabah: null,
      trafik: a.trafik, sevkiyat: a.sevkiyat, deniz: a.deniz,
      hamKayit: d.bayraklar.akkopru_ham_veri === true,
      harcamaTL: d.ekonomi.gsyh * (s.icra?.odeme?.maliyet ?? 0) / 100 / 12 * 1e12, sonuc: null,
      olaylar: [{ saat: "23.55", metin: s.metin }, ...a.olaylar],
    };
    for (const o of a.olaylar) d.buAy.olaylar.push(`Akköprü · ${o.saat} — ${o.metin}`);
    return;
  }
  if (!k.acilis || !d.acilis || !s.acilis_sonuc) return;
  const a = d.acilis, x = s.acilis_sonuc;
  a.sabah = secim;
  a.trafik = x.trafik; a.sevkiyat = x.sevkiyat; a.deniz = x.deniz;
  a.harcamaTL += d.ekonomi.gsyh * (s.icra?.odeme?.maliyet ?? 0) / 100 / 12 * 1e12;
  a.sonuc = { baslik: x.baslik, metin: x.metin };
  a.olaylar.push(...x.olaylar);
  // Bu bayrak bir zamanlar verilmiş emri değil, yürürlükteki yük sınırını anlatır.
  // İlk talimatın kendisi a.gece ve karar arşivinde aynen kalır.
  if (x.trafik === "acik") delete d.bayraklar.akkopru_yuk_kisiti;
  else d.bayraklar.akkopru_yuk_kisiti = true;
  const fark = x.deniz === "gorevden_cekildi" ? -25 : x.deniz === "baski_altinda" ? -8 : 4;
  d.anlati.iliskiler.deniz_alaz = Math.max(0, Math.min(100, (d.anlati.iliskiler.deniz_alaz ?? 50) + fark));
  if (x.deniz === "gorevden_cekildi" && d.bayraklar.akkopru_gorev_guvencesi) {
    d.sicil.push({ id: `sicil#${++d.sayac}`, tur: "kirilan_soz", kaynak: "Deniz'in görev işlemlerini takip etme sözünün ardından ölçümden uzaklaştırılması", ay: d.ay, ifsaOldu: false });
  }
  d.bayraklar.akkopru_ilk_gun = true;
  for (const o of x.olaylar) d.buAy.olaylar.push(`Akköprü · ${o.saat} — ${o.metin}`);
  const haber = `Akköprü: ${x.baslik}. ${x.metin}`;
  d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "yerel" });
  d.haberler = d.haberler.slice(0, 120);
  d.buAy.haberler.push(haber);
  d.buAy.olaylar.push(`Akköprü · Gün sonu — ${x.baslik}. ${x.metin}`);
}
