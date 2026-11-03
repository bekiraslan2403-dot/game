import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi } from "./icerik.ts";
import type { EylemSonucu } from "./karar.ts";
import { kosulSaglaniyor } from "./kosul.ts";
import { etkiUygula } from "./ekonomi.ts";
import { doldur } from "./metin.ts";

/** Aynı aylık sahne ve dört günlük takvim kullanılır; görüşmeler ayrı bir kaynak üretmez. */
export function anlatiAc(d: OyunDurumu, I: IcerikPaketi, ornek: string): EylemSonucu {
  const m = d.masa.find(m => m.ornek === ornek);
  if (!m || !I.kartlar[m.kart]?.anlati?.sahne) return { ok: false, neden: "Bu dosyada görüşme bulunmuyor." };
  if (d.bitis || d.yonetim.secim.gece || d.anlati.sahne || d.meclis.kulis || d.yonetim.medya.basin || d.yonetim.secim.sahne)
    return { ok: false, neden: "Önce açık sahneyi tamamlayın." };
  const telefon = m.kart === "akkopru_telefon";
  if (d.meclis.sahneAy === d.ay || (!telefon && d.bosGun < 1)) return { ok: false, neden: telefon ? "Bu ayın görüşmesi yapıldı." : "Görüşme için bir boş gün ve bu ayın sahne hakkı gerekiyor." };
  if (d.anlati.notlar.some(n => n.ornek === ornek)) return { ok: false, neden: "Bu dosyanın görüşmesi yapıldı." };
  if (!telefon) d.bosGun--;
  d.meclis.sahneAy = d.ay;
  d.anlati.sahne = { ornek, adim: 0, cevap: null };
  return { ok: true };
}

export function anlatiCevapla(d: OyunDurumu, I: IcerikPaketi, secenek: number): EylemSonucu {
  const s = d.anlati.sahne;
  const m = s && d.masa.find(m => m.ornek === s.ornek);
  const k = m && I.kartlar[m.kart];
  const adim = s && k?.anlati?.sahne?.adimlar[s.adim];
  const cevap = adim?.secenekler[secenek];
  if (d.bitis || !s || !m || !k || !adim || !cevap || s.cevap !== null) return { ok: false, neden: "Yanıt bekleyen bir görüşme yok." };
  if (cevap.kosul && !kosulSaglaniyor(d, cevap.kosul, I)) return { ok: false, neden: cevap.kilitNedeni ?? "Bu yanıt için gereken güven veya belge yok." };
  for (const [id, v] of Object.entries(cevap.etki)) etkiUygula(d, id, v, k.kalem ?? "sosyal");
  Object.assign(d.bayraklar, cevap.bayrak ?? {});
  for (const [kim, fark] of Object.entries(cevap.iliski)) d.anlati.iliskiler[kim] = Math.min(100, Math.max(0, (d.anlati.iliskiler[kim] ?? 50) + fark));
  const metin = doldur(cevap.cevap, m.degisken);
  d.anlati.notlar.push({ ay: d.ay, ornek: m.ornek, kart: m.kart, kim: adim.kim, metin, soru: s.adim, secenek });
  d.buAy.olaylar.push(`Görüşme — ${I.karakterler[adim.kim]?.ad}: ${metin}`);
  s.cevap = secenek;
  return { ok: true };
}

export function anlatiDevam(d: OyunDurumu): EylemSonucu {
  const s = d.anlati.sahne;
  if (!s || s.cevap === null) return { ok: false, neden: "Önce yanıtınızı seçin." };
  if (s.adim === 2) d.anlati.sahne = null;
  else { s.adim++; s.cevap = null; }
  return { ok: true };
}
