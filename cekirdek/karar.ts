// Karar verme, erteleme, ikinci görüş ve danışman tahmini (Sistem 1).

import type { OyunDurumu, MasaKarti } from "./durum.ts";
import type { IcerikPaketi, Kart } from "./icerik.ts";
import { GOSTERGE } from "./gostergeler.ts";
import { etkiUygula, KATEGORI_KALEMI } from "./ekonomi.ts";
import { sozVer } from "./hazine.ts";
import { doldur } from "./metin.ts";
import { degiskenCoz } from "./kosul.ts";
import { zarNormal } from "./zar.ts";

export const AGIR_CARPAN = 1.5;
/** Gerçek etkinin tasarlanan değerden sapması (standart sapma, oran) */
export const GERCEK_SAPMA = 0.15;

export type EylemSonucu = { ok: true; haber?: string } | { ok: false; neden: string };

export interface Tahmin {
  id: string;
  deger: number;
  /** Etki aylar içinde görülür (göstergenin türünden bağımsız olarak) */
  gecikmeli?: boolean;
}

function bul(d: OyunDurumu, ornek: string): MasaKarti | undefined {
  return d.masa.find((m) => m.ornek === ornek);
}

/** Kartın metinlerini değişkenlerle doldurulmuş olarak verir (arayüz için). */
export function kartMetni(icerik: IcerikPaketi, m: MasaKarti): { kart: Kart; baslik: string; durum: string; kulis: string | null; secenekler: string[] } {
  const kart = icerik.kartlar[m.kart];
  if (!kart) throw new Error(`Kart bulunamadı: ${m.kart}`);
  return {
    kart,
    baslik: doldur(kart.metin.baslik, m.degisken),
    durum: doldur(kart.metin.durum, m.degisken),
    kulis: kart.metin.kulis ? doldur(kart.metin.kulis, m.degisken) : null,
    secenekler: kart.secenekler.map((s) => doldur(s.metin, m.degisken)),
  };
}

/** Durumu değiştirmeyen, kararlı bir [-1, 1] sayısı (tahmin gürültüsü için). */
function karma(...parcalar: (string | number)[]): number {
  let h = 2166136261;
  for (const c of parcalar.join("|")) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return ((h % 20001) / 10000) - 1;
}

/** Danışmanın bir seçenek için tahmini. Ekranda görmek durumu ya da zarı değiştirmez. */
export function tahminEt(d: OyunDurumu, icerik: IcerikPaketi, ornek: string, secenek: number): Tahmin[] {
  const m = bul(d, ornek);
  const kart = m && icerik.kartlar[m.kart];
  const s = kart?.secenekler[secenek];
  if (!m || !kart || !s) return [];
  const carpan = m.agir ? AGIR_CARPAN : 1;
  return Object.entries(s.etki).map(([id, v]) => {
    const ekonomi = GOSTERGE[id]?.alan === "ekonomi";
    const danisman = icerik.karakterler[ekonomi ? "ekonomi_danismani" : "kamuoyu_danismani"];
    const hataPayi = (1 - (danisman?.yetkinlik ?? 0.5)) * 0.8 * (m.ikinciGorus ? 0.5 : 1);
    return { id, deger: v * carpan * (1 + hataPayi * karma(d.tohum, ornek, secenek, id, m.ikinciGorus ? 2 : 1)) };
  });
}

/** Bir kartta karar verir: etkiler, bayraklar, sicil, zincirin devamı ve haber. */
export function kararVer(d: OyunDurumu, icerik: IcerikPaketi, ornek: string, secenek: number): EylemSonucu {
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  const m = bul(d, ornek);
  if (!m) return { ok: false, neden: "Bu karar masada değil." };
  const kart = icerik.kartlar[m.kart];
  const s = kart?.secenekler[secenek];
  if (!kart || !s) return { ok: false, neden: "Geçersiz seçenek." };

  const carpan = m.agir ? AGIR_CARPAN : 1;
  const kalem = s.ekonomi?.kalem ?? kart.kalem ?? KATEGORI_KALEMI[kart.kategori] ?? "sosyal";
  for (const [id, v] of Object.entries(s.etki)) etkiUygula(d, id, v * carpan * (1 + GERCEK_SAPMA * zarNormal(d.zar)), kalem);
  for (const [b, v] of Object.entries(s.bayrak ?? {})) d.bayraklar[b] = v;
  const ek = s.ekonomi;
  if (ek) {
    const e = d.ekonomi;
    if (ek.asgari_artis) e.hane.asgari *= 1 + ek.asgari_artis / 100;
    if (ek.fatura_artis) e.hane.fatura *= 1 + ek.fatura_artis / 100;
    if (ek.istatistik) e.istatistik = ek.istatistik;
    if (ek.soz) sozVer(d, { ...ek.soz, metin: doldur(ek.soz.metin, m.degisken) });
  }
  if (s.sicil) {
    d.sayac += 1;
    d.sicil.push({ id: `sicil#${d.sayac}`, tur: s.sicil.tur, kaynak: doldur(s.sicil.kaynak, m.degisken), ay: d.ay, ifsaOldu: false });
  }
  for (const n of s.sonraki) {
    const sonraki = icerik.kartlar[n.kart];
    if (n.gecikme === 0 && sonraki) {
      // Aynı ay içinde devam eden kart (kriz masasının ertesi günü): hemen masaya gelir
      d.sayac += 1;
      d.masa.push({ ornek: `${sonraki.id}#${d.sayac}`, kart: sonraki.id, degisken: degiskenCoz(d, icerik, sonraki, m.degisken), agir: false, ikinciGorus: false });
      d.gorulen[sonraki.id] = d.ay;
    } else d.bekleyen.push({ kart: n.kart, ay: d.ay + Math.max(1, n.gecikme), degisken: { ...m.degisken }, agir: false });
  }

  const baslik = doldur(kart.metin.baslik, m.degisken);
  const haber = s.haber ? doldur(s.haber, m.degisken) : undefined;
  if (haber) {
    d.haberler.unshift({ ay: d.ay, metin: haber, kategori: kart.kategori });
    if (d.haberler.length > 120) d.haberler.length = 120;
    d.buAy.haberler.push(haber);
  }
  d.buAy.kararlar.push({ kart: kart.id, baslik, secenek, secenekMetni: doldur(s.metin, m.degisken) });
  d.masa = d.masa.filter((x) => x.ornek !== ornek);
  return haber ? { ok: true, haber } : { ok: true };
}

/** Bir masa kararını ertesi aya erteler; ayda bir kez, ana karar ertelenemez. */
export function ertele(d: OyunDurumu, icerik: IcerikPaketi, ornek: string): EylemSonucu {
  const m = bul(d, ornek);
  const kart = m && icerik.kartlar[m.kart];
  if (!m || !kart) return { ok: false, neden: "Bu karar masada değil." };
  if (kart.tur === "ana") return { ok: false, neden: "Ayın ana kararı ertelenemez." };
  if (kart.tur === "acil") return { ok: false, neden: "Acil karar ertelenemez." };
  if (d.ertelemeKullanildi) return { ok: false, neden: "Bu ay bir kararı zaten erteledin." };
  if (m.agir) return { ok: false, neden: "Bu karar bir kez ertelendi; artık beklemez." };
  d.ertelemeKullanildi = true;
  d.masa = d.masa.filter((x) => x.ornek !== ornek);
  d.bekleyen.push({ kart: kart.ertelenince ?? kart.id, ay: d.ay + 1, degisken: { ...m.degisken }, agir: true });
  d.buAy.ertelenen.push(doldur(kart.metin.baslik, m.degisken));
  return { ok: true };
}

/** İkinci bir danışman görüşü: takvimden bir gün alır, tahminin hata payını yarıya indirir. */
export function ikinciGorus(d: OyunDurumu, ornek: string): EylemSonucu {
  const m = bul(d, ornek);
  if (!m) return { ok: false, neden: "Bu karar masada değil." };
  if (m.ikinciGorus) return { ok: false, neden: "Bu karar için ikinci görüş zaten alındı." };
  if (d.bosGun <= 0) return { ok: false, neden: "Bu ay takvimde boş gün kalmadı." };
  d.bosGun -= 1;
  m.ikinciGorus = true;
  return { ok: true };
}
