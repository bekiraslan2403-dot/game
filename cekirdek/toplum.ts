// Toplum (Sistem 4 ve 5): beş hayat, sabah gazeteleri, kapıda bekleyenler ve sokak eylemleri.

import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Hayat } from "./icerik.ts";
import { GOSTERGE, GRUP_KIMLIKLERI, gostergeEkle } from "./gostergeler.ts";
import { kosulSaglaniyor } from "./kosul.ts";
import { etkiUygula, butceDegistir } from "./ekonomi.ts";
import { zarKaristir, zarSayi, zarSec, zarTam } from "./zar.ts";
import type { EylemSonucu } from "./karar.ts";
import { ek } from "./ekler.ts";
import { kabulTakvimiDolu } from "./ziyaret.ts";

// ---------------------------------------------------------------- Durum

export interface HayatDurumu {
  /** Sahne kimliği → yaşandığı oyun ayı */
  olan: Record<string, number>;
  /** Son sahneler, yeniden eskiye */
  son: { ay: number; metin: string; ton: number }[];
  ayrildi: boolean;
}

export interface Gazete {
  ay: number;
  olay: string;
  mansetler: { gazete: string; baslik: string }[];
}

export interface Ziyaretci {
  id: string;
  durum: "bekliyor" | "kabul";
}

export interface Eylem {
  id: string;
  grup: string;
  il: string;
  /** Emniyete göre / düzenleyicilere göre kalabalık */
  emniyet: number;
  duzenleyici: number;
  basladi: number;
  /** Bu ay temsilciler dinlendi mi */
  dinlendi: boolean;
}

export interface ToplumDurumu {
  hayatlar: Record<string, HayatDurumu>;
  gazete: Gazete | null;
  kapi: Ziyaretci[];
  eylemler: Eylem[];
}

export function toplumBaslangic(): ToplumDurumu {
  return { hayatlar: {}, gazete: null, kapi: [], eylemler: [] };
}

// ---------------------------------------------------------------- Beş hayat

function hayatDurumu(d: OyunDurumu, id: string): HayatDurumu {
  return (d.toplum.hayatlar[id] ??= { olan: {}, son: [], ayrildi: false });
}

/** Kişinin ruh hâli (0–100): grubunun tutumu ve son yaşadıkları. */
export function ruhHali(d: OyunDurumu, h: Hayat): number {
  const s = hayatDurumu(d, h.id);
  const grup = d.gostergeler[h.grup] ?? GOSTERGE[h.grup]?.baslangic ?? 48;
  const son = s.son.slice(0, 3).reduce((t, x) => t + x.ton * 6, 0);
  return Math.min(100, Math.max(0, 50 + (grup - 46) * 1.6 + son));
}

export function ruhSozu(r: number): string {
  if (r >= 66) return "umutlu";
  if (r >= 48) return "idare ediyor";
  if (r >= 32) return "bunalmış";
  return "öfkeli";
}

/** Ay sonunda en fazla iki kişinin bir sahnesi yaşanır. Zarı ilerletir. */
export function hayatlarAySonu(d: OyunDurumu, icerik: IcerikPaketi): { kim: string; metin: string; ton: number }[] {
  const aday: [Hayat, Hayat["sahneler"][number]][] = [];
  for (const h of icerik.hayatlar) {
    const s = hayatDurumu(d, h.id);
    if (s.ayrildi) continue;
    for (const sh of h.sahneler) if (s.olan[sh.id] === undefined && kosulSaglaniyor(d, sh.kosul, icerik)) aday.push([h, sh]);
  }
  zarKaristir(d.zar, aday);
  const kullanilan = new Set<string>();
  const sonuc: { kim: string; metin: string; ton: number }[] = [];
  for (const [h, sh] of aday) {
    if (sonuc.length >= 2 || kullanilan.has(h.id)) continue;
    kullanilan.add(h.id);
    const s = hayatDurumu(d, h.id);
    s.olan[sh.id] = d.ay;
    Object.assign(d.bayraklar, sh.bayrak ?? {});
    s.son.unshift({ ay: d.ay, metin: sh.metin, ton: sh.ton });
    if (s.son.length > 6) s.son.length = 6;
    if (sh.ayrilis) s.ayrildi = true;
    sonuc.push({ kim: h.ad, metin: sh.metin, ton: sh.ton });
  }
  return sonuc;
}

// ---------------------------------------------------------------- Gazeteler

/** Ayın en çok ses getiren kararından üç gazetenin manşetini kurar. Zarı ilerletir. */
export function gazeteKur(d: OyunDurumu, icerik: IcerikPaketi): void {
  const oylama = d.meclis.sonuclar.filter(o => o.ay === d.ay).at(-1);
  if (oylama) {
    const fire = oylama.oylar.find(v => v.fire && !v.kim.includes(" sıra "));
    d.toplum.gazete = { ay: d.ay, olay: oylama.baslik, mansetler: [
      { gazete: "Doruk Sabah", baslik: oylama.sonuc === "kabul" ? `Meclis'ten icraata yol: ${oylama.baslik}` : "Hükümet çalışıyor, Meclis engelliyor" },
      { gazete: "Halkın Sesi", baslik: fire ? `${fire.kim} sözünden döndü: kulis hesabı tutmadı` : oylama.sonuc === "ret" ? "Hükümet kendi teklifini geçiremedi" : `Pazarlıkların ardından ${oylama.evet} evet` },
      { gazete: "Finans Gündem", baslik: oylama.tur === "butce" && oylama.sonuc === "ret" ? "Bütçe reddedildi; geçici ödenek dönemi" : `${oylama.evet} kabul, ${oylama.hayir} ret: piyasa uygulamayı bekliyor` },
    ] };
    return;
  }

  let en: { olay: string; skor: number } | null = null;
  for (const k of d.buAy.kararlar) {
    const kart = icerik.kartlar[k.kart];
    const s = kart?.secenekler[k.secenek];
    if (!kart || !s) continue;
    let skor = 0, buyukluk = 0;
    for (const [id, v] of Object.entries(s.etki)) {
      const t = GOSTERGE[id];
      if (!t) continue;
      const agirlik = t.alan === "secmen" ? 1 : t.alan === "ekonomi" ? 0.6 : 0.4;
      const yon = t.iyi === "yuksek" ? 1 : t.iyi === "dusuk" ? -1 : 0;
      skor += v * yon * agirlik;
      buyukluk += Math.abs(v) * agirlik;
    }
    if (kart.tur === "ana") buyukluk *= 1.3;
    if (!en || buyukluk > Math.abs(en.skor) + 1e-9) en = { olay: k.baslik, skor: skor >= 0 ? buyukluk : -buyukluk };
  }
  if (!en) return;
  const olumlu = en.skor >= 0;
  d.toplum.gazete = {
    ay: d.ay,
    olay: en.olay,
    mansetler: icerik.toplum.gazeteler.map((g) => ({ gazete: g.ad, baslik: zarSec(d.zar, olumlu ? g.olumlu : g.olumsuz) })),
  };
}

// ---------------------------------------------------------------- Kapıda bekleyenler

/** Ay başında üç ziyaretçi seçilir. Zarı ilerletir. */
export function kapiKur(d: OyunDurumu, icerik: IcerikPaketi): void {
  const l = icerik.toplum.ziyaretciler.filter(z => !z.gorusme || d.gorulen[z.gorusme] === undefined);
  zarKaristir(d.zar, l);
  d.toplum.kapi = l.slice(0, 3).map((z) => ({ id: z.id, durum: "bekliyor" }));
}

/** Bir ziyaretçiyi kabul eder: takvimden bir gün gider. */
export function ziyaretciKabul(d: OyunDurumu, icerik: IcerikPaketi, id: string): EylemSonucu {
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  if (d.anlati.sahne || d.meclis.kulis || d.yonetim.medya.basin || d.yonetim.secim.sahne) return { ok: false, neden: "Önce açık görüşmeyi tamamla." };
  const k = d.toplum.kapi.find((x) => x.id === id);
  const z = icerik.toplum.ziyaretciler.find((x) => x.id === id);
  if (!k || !z) return { ok: false, neden: "Bu ziyaretçi kapıda değil." };
  if (k.durum !== "bekliyor") return { ok: false, neden: "Bu ziyaretçi zaten kabul edildi." };
  if (d.bosGun <= 0) return { ok: false, neden: "Bu ay takvimde boş gün kalmadı." };
  if (kabulTakvimiDolu(d)) return { ok: false, neden: "Bu ayın karar takvimi dolu. Yeni bir kabul için yer kalmadı." };
  const kart = z.gorusme && icerik.kartlar[z.gorusme];
  if (!kart) return { ok: false, neden: "Bu ziyaretçinin görüşme dosyası bulunamadı." };
  if (d.masa.some(m => m.kart === kart.id) || d.gorulen[kart.id] !== undefined) return { ok: false, neden: "Bu görüşme zaten açıldı." };
  d.bosGun -= 1;
  k.durum = "kabul";
  d.sayac += 1;
  const ornek = `${kart.id}#${d.sayac}`;
  d.masa.push({ ornek, kart: kart.id, degisken: {}, agir: false, ikinciGorus: false });
  d.gorulen[kart.id] = d.ay;
  const haber = `Cumhurbaşkanı ${ek(icerik.karakterler[kart.getiren]?.ad ?? z.kim, "i")} kabul etti.`;
  d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "toplum" });
  d.buAy.haberler.push(haber);
  return { ok: true, haber, ornek };
}

/** Ay sonunda kabul edilmeyen ziyaretçiler küser. */
export function kapiKapanis(d: OyunDurumu, icerik: IcerikPaketi): string[] {
  const olaylar: string[] = [];
  for (const k of d.toplum.kapi) {
    if (k.durum !== "bekliyor") continue;
    const z = icerik.toplum.ziyaretciler.find((x) => x.id === k.id);
    if (!z) continue;
    for (const [g, v] of Object.entries(z.ihmal)) etkiUygula(d, g, v, "sosyal");
    if (Object.keys(z.ihmal).length) olaylar.push(`${z.kim} Cumhurbaşkanlığından randevu alamadıklarını açıkladı.`);
  }
  d.toplum.kapi = [];
  return olaylar;
}

// ---------------------------------------------------------------- Sokak eylemleri

export const OFKE_ESIGI = 30;
export const EN_COK_EYLEM = 3;

export type EylemMudahalesi = "dinle" | "karsila" | "polis";

export function eylemTanimi(icerik: IcerikPaketi, grup: string) {
  return icerik.toplum.eylemler[grup];
}

/** Ay sonunda eylemler büyür ya da söner; öfkeli gruplar yeni eylem başlatır. Zarı ilerletir. */
export function eylemlerAySonu(d: OyunDurumu, icerik: IcerikPaketi): string[] {
  const olaylar: string[] = [];
  const kalan: Eylem[] = [];
  for (const e of d.toplum.eylemler) {
    const t = eylemTanimi(icerik, e.grup);
    const ad = t?.ad ?? "Eylem";
    const destek = d.gostergeler[e.grup] ?? 45;
    const sure = d.ay - e.basladi;
    // Grup öfkesi geçtiyse ya da üç ay dolduysa söner
    if (destek >= OFKE_ESIGI + 8 || sure >= 3) {
      olaylar.push(`${ek(e.il, "deki")} ${ad.toLocaleLowerCase("tr")} sona erdi.`);
      continue;
    }
    const carpan = e.dinlendi ? 0.6 : 1.5;
    e.emniyet = Math.round(e.emniyet * carpan);
    e.duzenleyici = Math.round(e.duzenleyici * carpan);
    e.dinlendi = false;
    gostergeEkle(d.gostergeler, "huzur", carpan > 1 ? -2 : -0.5);
    if (carpan > 1) gostergeEkle(d.gostergeler, "kutuplasma", 1);
    if (e.emniyet < 1000) {
      olaylar.push(`${ek(e.il, "deki")} ${ad.toLocaleLowerCase("tr")} dağıldı.`);
      continue;
    }
    if (carpan > 1) olaylar.push(`${ad} büyüyor: ${ek(e.il, "de")} emniyete göre ${e.emniyet.toLocaleString("tr-TR")}, düzenleyicilere göre ${e.duzenleyici.toLocaleString("tr-TR")} kişi.`);
    kalan.push(e);
  }
  d.toplum.eylemler = kalan;

  for (const g of GRUP_KIMLIKLERI) {
    if (d.toplum.eylemler.length >= EN_COK_EYLEM) break;
    if ((d.gostergeler[g] ?? 50) >= OFKE_ESIGI) continue;
    if (d.toplum.eylemler.some((e) => e.grup === g)) continue;
    const t = eylemTanimi(icerik, g);
    if (!t || zarSayi(d.zar) > 0.6) continue;
    const il = zarSec(d.zar, icerik.sehirler).ad;
    const emniyet = Math.round((t.taban * zarTam(d.zar, 70, 130)) / 100);
    d.sayac += 1;
    d.toplum.eylemler.push({ id: `eylem#${d.sayac}`, grup: g, il, emniyet, duzenleyici: Math.round(emniyet * zarTam(d.zar, 25, 45) / 10), basladi: d.ay, dinlendi: false });
    olaylar.push(`${ek(il, "de")} ${t.ad.toLocaleLowerCase("tr")} başladı: ${t.talep}.`);
  }
  return olaylar;
}

/** Bir eyleme müdahale: temsilcileri dinle (1 gün), talebi karşıla (bütçe), polisi gönder (kalıcı bedel). */
export function eylemeMudahale(d: OyunDurumu, icerik: IcerikPaketi, id: string, nasil: EylemMudahalesi): EylemSonucu {
  const e = d.toplum.eylemler.find((x) => x.id === id);
  if (!e) return { ok: false, neden: "Bu eylem sürmüyor." };
  const t = eylemTanimi(icerik, e.grup);
  const ad = t?.ad ?? "Eylem";
  let haber: string;
  switch (nasil) {
    case "dinle":
      if (e.dinlendi) return { ok: false, neden: "Temsilciler bu ay zaten dinlendi." };
      if (d.bosGun <= 0) return { ok: false, neden: "Bu ay takvimde boş gün kalmadı." };
      d.bosGun -= 1;
      e.dinlendi = true;
      gostergeEkle(d.gostergeler, e.grup, 2);
      haber = `Cumhurbaşkanı ${ek(e.il, "deki")} eylemcilerin temsilcilerini dinledi.`;
      break;
    case "karsila":
      butceDegistir(d, "sosyal", 0.12);
      gostergeEkle(d.gostergeler, e.grup, 5);
      gostergeEkle(d.gostergeler, "huzur", 2);
      d.toplum.eylemler = d.toplum.eylemler.filter((x) => x !== e);
      haber = `Hükümet ${ad.toLocaleLowerCase("tr")} talebini karşıladı: ${t?.talep ?? ""}. Eylem sona erdi.`;
      break;
    case "polis": {
      gostergeEkle(d.gostergeler, e.grup, -6);
      gostergeEkle(d.gostergeler, "basin", -2);
      gostergeEkle(d.gostergeler, "kutuplasma", 4);
      gostergeEkle(d.gostergeler, "itibar", -1.5);
      gostergeEkle(d.gostergeler, "guvenlik", 1);
      const yarali = zarTam(d.zar, 5, 40) + Math.round(e.emniyet / 2000);
      d.sayac += 1;
      d.sicil.push({ id: `sicil#${d.sayac}`, tur: "baski", kaynak: `${ek(e.il, "deki")} ${ad.toLocaleLowerCase("tr")} polis müdahalesi (${yarali} yaralı)`, ay: d.ay, ifsaOldu: false });
      d.toplum.eylemler = d.toplum.eylemler.filter((x) => x !== e);
      haber = `${ek(e.il, "deki")} ${ad.toLocaleLowerCase("tr")} polis müdahalesiyle dağıtıldı: ${yarali} yaralı, yüzlerce gözaltı.`;
      break;
    }
  }
  d.haberler.unshift({ ay: d.ay, metin: haber, kategori: "toplum" });
  if (d.haberler.length > 120) d.haberler.length = 120;
  d.buAy.haberler.push(haber);
  return { ok: true, haber };
}
