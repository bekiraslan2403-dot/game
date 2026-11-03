// Deste: ay başında masanın doldurulması (Sistem 1 · Kartların seçilme kuralı).
// Sıra: zamanı gelen bekleyen kartlar → ayın ana kararı → 2–3 masa kartı.

import type { OyunDurumu, MasaKarti, Degiskenler } from "./durum.ts";
import type { IcerikPaketi, Kart } from "./icerik.ts";
import { kosulSaglaniyor, degiskenCoz } from "./kosul.ts";
import { zarAgirlikli } from "./zar.ts";
import { takvimAyi } from "./takvim.ts";

export const TEKRAR_ARALIGI = 12;
export const KATEGORI_SINIRI = 2;
const ANA_YAYLAR = new Set(["akkopru", "rakip_yayi", "aile_yayi"]);

/** Henüz açılmamış, ertelenen tohumlar açık zincir sayılmaz. */
function acikZincirler(d: OyunDurumu, icerik: IcerikPaketi): Set<string> {
  const kartlar = [
    ...d.masa.map(m => icerik.kartlar[m.kart]),
    ...d.bekleyen.map(b => icerik.kartlar[b.kart]).filter(k => k?.asama !== "tohum"),
  ];
  return new Set(kartlar.flatMap(k => k?.zincir ? [k.zincir] : []));
}

function ornekEkle(d: OyunDurumu, kart: Kart, degisken: Degiskenler, agir: boolean): MasaKarti {
  d.sayac += 1;
  const m: MasaKarti = { ornek: `${kart.id}#${d.sayac}`, kart: kart.id, degisken, agir, ikinciGorus: false };
  d.masa.push(m);
  d.gorulen[kart.id] = d.ay;
  return m;
}

/** Kart rastgele seçime uygun mu? (bekleyen kartlar bu denetimden geçmez) */
export function rastgeleUygun(d: OyunDurumu, kart: Kart, icerik?: IcerikPaketi): boolean {
  if (kart.tur === "zincir" || kart.tur === "acil") return false;
  if (kart.zincir && kart.asama !== "tohum") return false;
  if (kart.zincir && icerik) {
    const acik = acikZincirler(d, icerik);
    if (!acik.has(kart.zincir) && acik.size >= 3) return false;
  }
  const son = d.gorulen[kart.id];
  if (son !== undefined && !kart.tekrar) return false;
  if (son !== undefined && d.ay - son < TEKRAR_ARALIGI) return false;
  if (d.masa.some((m) => m.kart === kart.id)) return false;
  if (d.bekleyen.some((b) => b.kart === kart.id)) return false;
  return kosulSaglaniyor(d, kart.kosul, icerik);
}

/** Ay başında masayı kurar. Masa önceden kurulduysa hiçbir şey yapmaz. */
export function masaKur(d: OyunDurumu, icerik: IcerikPaketi): void {
  if (d.masaKuruldu) return;
  const K = icerik.kartlar;

  // 1. Zamanı gelen bekleyen kartlar (zincirler, ertelenenler)
  const zamani = d.bekleyen.filter((b) => b.ay <= d.ay);
  const yayKartlari = zamani.map(b => K[b.kart]).filter((k): k is Kart => !!k?.zincir && ANA_YAYLAR.has(k.zincir));
  const ayinYayi = (yayKartlari.find(k => k.asama !== "tohum") ?? yayKartlari[0])?.zincir;
  // Zamanı gelen devam kartları kuyruktan çıkarılmadan önce yerleri ayrılır.
  // Böylece kuyrukta önce gelen yeni bir hikâye, devam eden üçünü aşamaz.
  const acik = acikZincirler(d, icerik);
  d.bekleyen = d.bekleyen.filter((b) => b.ay > d.ay);
  for (const b of zamani) {
    const kart = K[b.kart];
    if (kart?.zincir && ANA_YAYLAR.has(kart.zincir) && ayinYayi && kart.zincir !== ayinYayi) {
      d.bekleyen.push({ ...b, ay: d.ay + 1 });
      continue;
    }
    if (kart?.zincir && kart.asama === "tohum") {
      if (!acik.has(kart.zincir) && acik.size >= 3) {
        d.bekleyen.push({ ...b, ay: d.ay + 1 });
        continue;
      }
      acik.add(kart.zincir);
    }
    if (kart) ornekEkle(d, kart, degiskenCoz(d, icerik, kart, b.degisken), b.agir);
  }

  // 2. Ayın ana kararı: takvime bağlı kart önce gelir
  if (!d.masa.some((m) => K[m.kart]?.tur === "ana")) {
    const anaAday = Object.values(K).filter((k) => k.tur === "ana" && rastgeleUygun(d, k, icerik));
    const buAy = takvimAyi(d.ay).ay;
    const takvimli = anaAday.filter((k) => k.kosul.takvim_ayi?.includes(buAy));
    const butce = takvimli.find(k => k.id === "yillik_butce");
    const havuz = butce ? [butce] : takvimli.length ? takvimli : anaAday.filter((k) => !k.kosul.takvim_ayi);
    if (havuz.length) {
      const k = zarAgirlikli(d.zar, havuz, (x) => x.agirlik);
      ornekEkle(d, k, degiskenCoz(d, icerik, k), false);
    }
  }

  // 3. Masa kartları: zincir kartı geldiyse 2, gelmediyse 3
  const zincirVar = d.masa.some(m => K[m.kart]?.zincir);
  const hedef = d.ay >= 16 ? 2 : zincirVar ? 2 : 3;
  const getirenler = new Set(d.masa.map((m) => K[m.kart]?.getiren));
  for (let eklenen = 0; eklenen < hedef; ) {
    const kategoriSay = (kat: string) => d.masa.filter((m) => K[m.kart]?.kategori === kat).length;
    const havuz = Object.values(K).filter(
      (k) => k.tur === "masa" && rastgeleUygun(d, k, icerik) && kategoriSay(k.kategori) < KATEGORI_SINIRI && !getirenler.has(k.getiren),
    );
    if (!havuz.length) break;
    // Kur baskısı yüksekken ekonomi kartları 2 kat sık gelir
    const kurBaskisi = d.ekonomi.krizler.length > 0 || (d.gostergeler.guven ?? 50) < 30;
    const k = zarAgirlikli(d.zar, havuz, (x) => x.agirlik * (kurBaskisi && x.kategori === "ekonomi" ? 2 : 1));
    ornekEkle(d, k, degiskenCoz(d, icerik, k), false);
    getirenler.add(k.getiren);
    eklenen++;
  }
  // Ana karar her zaman ilk sırada, acil karar hemen ardından
  const sira = (m: MasaKarti) => (K[m.kart]?.tur === "ana" ? 0 : K[m.kart]?.tur === "acil" ? 1 : 2);
  d.masa.sort((a, b) => sira(a) - sira(b));
  d.masaKuruldu = true;
}
