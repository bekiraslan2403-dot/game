import { butceEtkisiniIsle } from "./butce.ts";
// Politika dosyası: kademeli politikalar ve yönetmelikler (Uygulama planı · Kapsam genişlemesi).
// Kararname hemen yürürlüğe girer; kanun ay sonunda Meclis'te oylanır. Her ay en fazla IMZA_HAKKI değişiklik.

import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Politika } from "./icerik.ts";
import type { EylemSonucu, Tahmin } from "./karar.ts";
import { kurumKarari } from "./yonetim.ts";
import { medyaYansit } from "./medya.ts";
import { PARTILER } from "./meclis-icerik.ts";
import { etkiUygula, KALEM, trilyonTL } from "./ekonomi.ts";
import { meclisHazirla, oylamayiSay, partiOlasiligi, partiSandalyesi, haberYaz, type OylamaUygulamasi } from "./meclis.ts";

export const IMZA_HAKKI = 3;

export interface MeclisTeklifi {
  politika: string;
  hedef: number;
  /** Teklifin verildiği oyun ayı */
  ay: number;
}

export function seviye(d: OyunDurumu, p: Politika): number {
  return d.politika[p.id] ?? p.baslangic;
}

export function bekleyenTeklif(d: OyunDurumu, id: string): MeclisTeklifi | undefined {
  return d.meclisGundemi.find((t) => t.politika === id);
}

/** Sandalye ağırlıklı destek oranı; olasılıkla tek zar atıp sonuç belirlemez. */
export function meclisDestegi(d: OyunDurumu, p?: Politika): number {
  const bloklar = PARTILER.reduce((toplam, parti) => toplam + partiSandalyesi(d, parti.id) * partiOlasiligi(d, parti.id, p), 0);
  return (bloklar + d.yonetim.parti.vekil * 0.12) / 592;
}

/** Bir kademe değişikliğinin danışman tahmini (durumu değiştirmez). */
export function politikaTahmini(d: OyunDurumu, p: Politika, hedef: number): Tahmin[] {
  const adim = hedef - seviye(d, p);
  if (!adim) return [];
  return Object.entries(p.adim).map(([id, v]) => ({ id, deger: v * adim }));
}

/** Bir politika ya da yönetmeliğin kademesini değiştirir (kararname) ya da Meclis'e teklif eder (kanun). */
export function politikaDegistir(d: OyunDurumu, icerik: IcerikPaketi, id: string, hedef: number): EylemSonucu {
  const p = icerik.politikalar[id];
  if (!p) return { ok: false, neden: "Böyle bir politika yok." };
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  if (!Number.isInteger(hedef) || hedef < 0 || hedef >= p.kademeler.length) return { ok: false, neden: "Geçersiz kademe." };
  if (hedef === seviye(d, p)) return { ok: false, neden: "Politika zaten bu kademede." };
  if (bekleyenTeklif(d, id)) return { ok: false, neden: "Bu konuda bir kanun teklifi Meclis'te bekliyor." };
  if (d.imza >= IMZA_HAKKI) return { ok: false, neden: `Bu ay ${IMZA_HAKKI} imza hakkının hepsi kullanıldı.` };
  d.imza += 1;
  const yeni = p.kademeler[hedef]!;
  if (p.yol === "kanun") {
    d.meclisGundemi.push({ politika: id, hedef, ay: d.ay });
    meclisHazirla(d, icerik);
    const haber = `${p.ad}: “${yeni}” için kanun teklifi Meclis'e sunuldu; ay sonunda oylanacak.`;
    haberYaz(d, haber);
    return { ok: true, haber };
  }
  uygula(d, p, hedef);
  const haber = `${p.ad}: Cumhurbaşkanı kararnamesiyle “${yeni}” dönemi başladı.`;
  haberYaz(d, haber);
  medyaYansit(d, icerik, `${p.ad}: ${yeni}`);
  return { ok: true, haber };
}

/** Bekleyen kanun teklifini geri çeker (imza iade edilmez). */
export function teklifiGeriCek(d: OyunDurumu, id: string): EylemSonucu {
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  if (d.meclis.kulis?.oylama === `${id}@${bekleyenTeklif(d, id)?.ay}`) return { ok: false, neden: "Önce kulis görüşmesini bitirin." };
  if (!bekleyenTeklif(d, id)) return { ok: false, neden: "Bu konuda bekleyen bir teklif yok." };
  d.meclisGundemi = d.meclisGundemi.filter((t) => t.politika !== id);
  d.meclis.oylamalar = d.meclis.oylamalar.filter(o => o.politika !== id);
  return { ok: true };
}

function uygula(d: OyunDurumu, p: Politika, hedef: number): void {
  const adim = hedef - seviye(d, p);
  kurumKarari(d, p, adim);
  d.politika[p.id] = hedef;
}

/** Ay sonunda her teklif 592 dolu sandalye üzerinden ayrı ayrı sayılır. */
export function meclisOylamasi(d: OyunDurumu, icerik: IcerikPaketi): string[] {
  meclisHazirla(d, icerik);
  const olaylar: string[] = [];
  for (const o of d.meclis.oylamalar) {
    const r = oylamayiSay(d, icerik, o);
    if (r.uygulama) continue;
    const gecti = r.sonuc === "kabul";
    const p = o.politika ? icerik.politikalar[o.politika] : undefined;
    const once = p ? seviye(d, p) : undefined;
    const gostergeler = { ...d.gostergeler };
    const kalem = o.tur === "butce" ? "yatirim" : p?.kalem ?? "sosyal";
    const cetvel = KALEM[kalem]?.tur === "gelir" ? d.ekonomi.gelir : d.ekonomi.gider;
    const oncekiButce = cetvel[kalem] ?? 0;
    const uygulama: OylamaUygulamasi = { tur: gecti ? "yururluk" : r.sonuc === "halkoylamasi" ? "halkoylamasi" : "degismedi", etkiler: {} };
    if (p && once !== undefined) {
      if (gecti) uygula(d, p, o.hedef);
      uygulama.kademe = { once: p.kademeler[once]!, sonra: p.kademeler[seviye(d, p)]! };
    }
    if (r.sonuc === "ret") etkiUygula(d, "parti_ici", 1.5, "sosyal");
    const haber = `Meclis ${gecti ? "kabul etti" : r.sonuc === "halkoylamasi" ? "halkoylamasına sundu" : "reddetti"}: ${o.baslik}. ${r.evet} evet, ${r.hayir} ret, ${r.cekimser} çekimser; gereken ${r.esik}.`;
    olaylar.push(haber); haberYaz(d, haber);
    for (const v of r.oylar.filter(v => v.fire && !v.kim.includes(" sıra "))) {
      const ihanet = `Son dakika firesi: ${v.kim}, evet sözüne rağmen ret oyu verdi.`;
      olaylar.push(ihanet); haberYaz(d, ihanet);
    }
    if (o.tur === "butce") {
      const b = d.meclis.butce;
      b.sonOylama = d.ay;
      b.gecici = !gecti;
      if (gecti) {
        if (b.plan) {
          uygulama.tur = "bekliyor";
          b.plan.kabulAy = d.ay;
          b.taslak = { ...o.butceEtki };
          olaylar.push(`${b.plan.maliYil} bütçesi kabul edildi. Yeni ödenek ilk uygun ayın başında yürürlüğe girecek.`);
        } else {
          butceEtkisiniIsle(d, o.butceEtki);
        }
      } else {
        uygulama.tur = "gecici";
        etkiUygula(d, "itibar", -3, "sosyal");
        etkiUygula(d, "guven", -3, "sosyal");
        olaylar.push("Yıllık bütçe geçmedi. Geçici bütçe mevcut ödeneklerle devam ediyor; yeni paket gelecek ay yeniden oylanacak.");
      }
    }
    const fark = (cetvel[kalem] ?? 0) - oncekiButce;
    if (Math.abs(fark) > 1e-9) uygulama.butce = { kalem, farkTL: trilyonTL(d, fark) };
    for (const [id, deger] of Object.entries(d.gostergeler)) {
      const fark = deger - (gostergeler[id] ?? deger);
      if (id !== "butce_acigi" && Math.abs(fark) > 1e-9) uygulama.etkiler[id] = fark;
    }
    if (d.ay === 2 && o.id === "emekli_aylik@2" && o.hedef === 3) {
      const kart = icerik.kartlar[gecti ? "emekli_oylama_bordro" : "emekli_oylama_nobet"];
      if (kart) {
        const ay = d.ay + 1;
        d.bekleyen.push({ kart: kart.id, ay, degisken: {}, agir: false });
        uygulama.takip = { ay, baslik: kart.metin.baslik };
      }
    }
    r.uygulama = uygulama;
  }
  d.meclisGundemi = [];
  d.meclis.oylamalar = [];
  return olaylar;
}

/** Bir değişiklik sonrası vatandaşların söylediklerinden biri (kararlı seçim). */
export function vatandasSesi(d: OyunDurumu, p: Politika, artis: boolean): string {
  const l = artis ? p.sesler.artis : p.sesler.azalis;
  return l[(d.ay + d.imza + p.id.length) % l.length] ?? "";
}
