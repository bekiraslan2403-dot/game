import { BUTCE_KOMISYONU, butceKomisyonuBitir, butceTaslakYaz } from "./butce.ts";
import { incelemeEngeli, incelemeUygula } from "./inceleme.ts";
import { santiyeEngeli, santiyeUygula } from "./santiye.ts";
import { hesaplasmaEngeli, hesaplasmaUygula } from "./hesaplasma.ts";
import { acilisEngeli, acilisUygula } from "./acilis.ts";
import { icraEngeli, icraEt } from "./icra.ts";
import { hafizaEngeli, hafizaKarar } from "./hafiza.ts";
import { belediyeKarar } from "./belediye.ts";
import { isinmaEngeli, isinmaOncesi, isinmaKarar, isinmaKarti, isinmaDosyaGeldi } from "./isinma.ts";
// Karar verme, erteleme, ikinci görüş ve danışman tahmini (Sistem 1).

import type { OyunDurumu, MasaKarti } from "./durum.ts";
import type { IcerikPaketi, Kart } from "./icerik.ts";
import { GOSTERGE, gostergeYaz } from "./gostergeler.ts";
import { etkiUygula, KATEGORI_KALEMI } from "./ekonomi.ts";
import { sozVer } from "./hazine.ts";
import { doldur } from "./metin.ts";
import { degiskenCoz } from "./kosul.ts";
import { kosulSaglaniyor } from "./kosul.ts";
import { ozelKarar } from "./yonetim.ts";
import { medyaYansit } from "./medya.ts";
import { zarNormal } from "./zar.ts";
import { sahaKararVer } from "./saha.ts";
import { gorusmeTalimati, gorusmeDestegi } from "./ziyaret.ts";

export const AGIR_CARPAN = 1.5;
/** Gerçek etkinin tasarlanan değerden sapması (standart sapma, oran) */
export const GERCEK_SAPMA = 0.15;

export type EylemSonucu = { ok: true; haber?: string; ornek?: string; tepkiler?: { kim: string; metin: string }[] } | { ok: false; neden: string };

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
  if (d.anlati.sahne) return { ok: false, neden: "Önce görüşmeyi tamamlayın." };
  const m = bul(d, ornek);
  if (!m) return { ok: false, neden: "Bu karar masada değil." };
  const kart = icerik.kartlar[m.kart];
  const s = kart?.secenekler[secenek];
  if (!kart || !s) return { ok: false, neden: "Geçersiz seçenek." };
  const butceDosyasi = kart.id === "yillik_butce" || kart.id === "butce_teklifi";
  const komisyon = kart.id === BUTCE_KOMISYONU;
  const plan = d.meclis.butce.plan;
  if (komisyon && (!plan || plan.kabulAy !== null || plan.komisyon !== null))
    return { ok: false, neden: "Bu komisyon dosyasının açık bir bütçe taslağı yok." };
  const kisEngeli = isinmaEngeli(d, m, secenek); if (kisEngeli) return { ok: false, neden: kisEngeli };

  const raporEngeli = incelemeEngeli(d, kart, s); if (raporEngeli) return { ok: false, neden: raporEngeli };
  const santiyeHata = santiyeEngeli(d, kart, s); if (santiyeHata) return { ok: false, neden: santiyeHata };
  const hesapHata = hesaplasmaEngeli(d, kart, s); if (hesapHata) return { ok: false, neden: hesapHata };
  const hafizaHata = hafizaEngeli(d, kart, s); if (hafizaHata) return { ok: false, neden: hafizaHata };
  const bolumEngeli = acilisEngeli(d, kart, s); if (bolumEngeli) return { ok: false, neden: bolumEngeli };
  if (s.kosul && !kosulSaglaniyor(d, s.kosul, icerik)) return { ok: false, neden: s.kilitNedeni ?? "Bu karar için gereken kayıt yok." };
  const engel = icraEngeli(d, s); if (engel) return { ok: false, neden: engel };
  if (kart.saha && d.anlati.notlar.filter(n => n.ornek === ornek).length !== 3) return { ok: false, neden: "Önce yerindeki görüşmeyi tamamla." };
  const saha = kart.saha ? sahaKararVer(d, icerik, kart, s) : undefined;
  if (saha && !saha.ok) return saha;
  // İmza/teklif koşulları etkilerden ve zardan önce denetlenir. Başarısız talimat
  // kartı tüketmez; kamuoyu, tarihçe ve rastgelelik de değişmez.
  const destekOnay = s.destek ? gorusmeDestegi(d, icerik, s.destek.kaynak) : undefined;
  if (destekOnay && !destekOnay.ok) return destekOnay;
  const talimat = s.politika ? gorusmeTalimati(d, icerik, s.politika) : undefined;
  if (talimat && !talimat.ok) return talimat;
  const destek = s.destek ? gorusmeDestegi(d, icerik, s.destek.kaynak, true) : undefined;
  if (destek && !destek.ok) return destek;

  const isinmaOnce = isinmaOncesi(d);
  const izler:string[]=[];
  if (s.icra) izler.push(icraEt(d, s, m));
  if (saha?.ok && saha.haber) izler.push(saha.haber);
  if (talimat?.ok && talimat.haber) izler.push(talimat.haber);
  if (destek?.ok && destek.haber) izler.push(destek.haber);
  const carpan = m.agir ? AGIR_CARPAN : 1;
  const kalem = s.ekonomi?.kalem ?? kart.kalem ?? KATEGORI_KALEMI[kart.kategori] ?? "sosyal";
  if (butceDosyasi) butceTaslakYaz(d, s.metin, s.etki);
  else for (const [id, v] of Object.entries(s.etki)) {
    const once=d.gostergeler[id]??0;
    const uygulanan=v * carpan * (1 + GERCEK_SAPMA * zarNormal(d.zar));
    etkiUygula(d,id,uygulanan,kalem);
    if(["enflasyon","buyume","issizlik"].includes(id))izler.push(`${GOSTERGE[id]?.ad}: hedef ${uygulanan>=0?"+":""}${uygulanan.toLocaleString("tr-TR",{maximumFractionDigits:2})} puan; göstergeye aylar içinde yansır`);
    else if(Math.abs((d.gostergeler[id]??0)-once)>0.01) {
      const sonra = d.gostergeler[id]!;
      const a = gostergeYaz(id, once), b = gostergeYaz(id, sonra);
      izler.push(`${GOSTERGE[id]?.ad}: ${a === b ? `${b} (${sonra > once ? "yükseliyor" : "geriliyor"})` : `${a} → ${b}`}`);
    }
  }
  if (komisyon) butceKomisyonuBitir(d, secenek);
  for (const [b, v] of Object.entries(s.bayrak ?? {})) d.bayraklar[b] = v;
  const ek = s.ekonomi;
  if (ek) {
    const e = d.ekonomi;
    if (ek.asgari_artis) {
      e.hane.asgari *= 1 + ek.asgari_artis / 100;
      izler.push(`Asgari ücret: ${Math.round(e.hane.asgari).toLocaleString("tr-TR")} TL`);
    }
    if (ek.fatura_artis) {
      e.hane.fatura *= 1 + ek.fatura_artis / 100;
      izler.push(`Hane faturası: ${Math.round(e.hane.fatura).toLocaleString("tr-TR")} TL`);
    }
    if (ek.istatistik) e.istatistik = ek.istatistik;
    if (ek.soz) sozVer(d, { ...ek.soz, ...(kart.ziyaret ? { vade: Math.min(ek.soz.vade, 18 - d.ay) } : {}), metin: doldur(ek.soz.metin, m.degisken) });
  }
  if (s.sicil) {
    d.sayac += 1;
    d.sicil.push({ id: `sicil#${d.sayac}`, tur: s.sicil.tur, kaynak: doldur(s.sicil.kaynak, m.degisken), ay: d.ay, ifsaOldu: false });
  }
  acilisUygula(d, icerik, kart, s, secenek);
  incelemeUygula(d, kart, s);
  santiyeUygula(d, kart, s);
  hesaplasmaUygula(d, kart, s);
  isinmaKarar(d, m, secenek, isinmaOnce);
  for (const n of s.sonraki) {
    if (butceDosyasi && n.kart === BUTCE_KOMISYONU && !d.meclis.butce.plan) continue;
    if (n.kosul && !kosulSaglaniyor(d, n.kosul, icerik)) continue;
    const sonraki = icerik.kartlar[n.kart];
    // Eski kayıtlarda belediye zinciri seçim ayına sarkmış olabilir. Sonraki
    // dosyayı 19. aya düşürüp oyuncunun kararını yanıtsız bırakma.
    const sonAyBelediye = d.ay === 18 && kart.id.startsWith("belediye_maas_") && n.kart.startsWith("belediye_maas_");
    const sonAyIsinma = d.ay === 18 && isinmaKarti(kart.id) && isinmaKarti(n.kart);
    const sonAyIstatistik = d.ay === 18 && kart.id === "istatistik_baskani";
    const sonAyKongre = d.ay === 18 && (kart.id === "il_kongresi" || kart.id === "kongre_tutanak");
    if ((n.gecikme === 0 || (kart.ziyaret && d.ay === 18) || sonAyBelediye || sonAyIsinma || sonAyIstatistik || sonAyKongre) && sonraki) {
      // Aynı ay içinde devam eden kart (kriz masasının ertesi günü): hemen masaya gelir
      d.sayac += 1;
      d.masa.push({ ornek: `${sonraki.id}#${d.sayac}`, kart: sonraki.id, degisken: degiskenCoz(d, icerik, sonraki, m.degisken), agir: false, ikinciGorus: false });
      isinmaDosyaGeldi(d, d.masa.at(-1)!);
      d.gorulen[sonraki.id] = d.ay;
    } else d.bekleyen.push({ kart: n.kart, ay: d.ay + Math.max(1, n.gecikme), degisken: { ...m.degisken }, agir: false });
  }

  const baslik = doldur(kart.metin.baslik, m.degisken);
  const haber = [s.haber ? doldur(s.haber, m.degisken) : "", talimat?.ok ? talimat.haber : "", destek?.ok ? destek.haber : "", saha?.ok ? saha.haber : ""].filter(Boolean).join(" ") || undefined;
  if (haber) {
    if (!d.haberler.some(h => h.ay === d.ay && h.metin === haber)) d.haberler.unshift({ ay: d.ay, metin: haber, kategori: kart.kategori });
    if (d.haberler.length > 120) d.haberler.length = 120;
    if (!d.buAy.haberler.includes(haber)) d.buAy.haberler.push(haber);
  }
  d.buAy.kararlar.push({ kart: kart.id, baslik, secenek, secenekMetni: doldur(s.metin, m.degisken) });
  d.buAy.olaylar.push(`Karar izi: ${baslik} — ${doldur(s.metin, m.degisken)}. ${butceDosyasi || komisyon ? "Bütçe cetveli, yürürlük başlayınca değişecek." :izler.length ? izler.join("; ") + "." : "Göstergelerde doğrudan değişim olmadı."}${(s.sonraki.length && (!butceDosyasi || d.meclis.butce.plan)) ? " Devam dosyası kararınıza göre takvime alındı." : ""}`);
  ozelKarar(d, kart.id, secenek);
  belediyeKarar(d, m, secenek);
  hafizaKarar(d, kart.id, secenek);
  const tepkiler = (s.tepkiler ?? []).filter(t => !t.kosul || kosulSaglaniyor(d, t.kosul, icerik)).map(t => ({ kim: t.kim, metin: doldur(t.metin, m.degisken) }));
  for (const t of tepkiler) d.buAy.olaylar.push(`Hikâye — ${icerik.karakterler[t.kim]?.ad}: ${t.metin}`);
  medyaYansit(d, icerik, baslik, !s.sicil);
  d.masa = d.masa.filter((x) => x.ornek !== ornek);
  return { ok: true, ...(haber ? { haber } : {}), ...(tepkiler.length ? { tepkiler } : {}) };
}

/** Bir masa kararını ertesi aya erteler; ayda bir kez, ana karar ertelenemez. */
export function ertele(d: OyunDurumu, icerik: IcerikPaketi, ornek: string): EylemSonucu {
  if (d.anlati.sahne) return { ok: false, neden: "Önce görüşmeyi tamamlayın." };
  const m = bul(d, ornek);
  const kart = m && icerik.kartlar[m.kart];
  if (!m || !kart) return { ok: false, neden: "Bu karar masada değil." };
  if (kart.saha) return { ok: false, neden: "Ziyaretin sonunda bu dosyaya yanıt vermelisin." };
  if (kart.ziyaret) return { ok: false, neden: "Bu görüşmenin yanıtı bu ay verilmeli." };
  if (kart.tur === "ana") return { ok: false, neden: "Ayın ana kararı ertelenemez." };
  if (kart.id === BUTCE_KOMISYONU) return { ok: false, neden: "Bütçe komisyonu Genel Kurul takvimi nedeniyle ertelenemez." };
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
