// İçerik derleyici: icerik/ altındaki YAML dosyalarını okur, şemaya ve kurallara göre denetler,
// denetlenmiş paketi uretilen/icerik.json dosyasına yazar. Hata varsa derleme durur.
// Kullanım: node --import tsx derleyici/icerik-derle.ts

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parse } from "yaml";
import { z } from "zod";
import { medyaIcerikSemasi, type MedyaIcerigi } from "../cekirdek/medya-icerik.ts";
import { kartSemasi, karakterSemasi, sehirSemasi, politikaSemasi, hayatSemasi, toplumSemasi, type IcerikPaketi, type Kart, type Politika, type Hayat, type ToplumIcerigi } from "../cekirdek/icerik.ts";
import { GOSTERGE } from "../cekirdek/gostergeler.ts";
import { yerTutucular, sozcukSayisi } from "../cekirdek/metin.ts";

import { meclisIcerikSemasi, type MeclisIcerigi } from "../cekirdek/meclis-icerik.ts";

export interface DerlemeSonucu {
  paket: IcerikPaketi | null;
  hatalar: string[];
  uyarilar: string[];
}

const SINIR = { durum: 60, secenek: 12, baslik: 10, kulis: 30 };

// Zod hata iletileri Türkçe: içerik yazarı hatayı kod bilmeden anlayabilmeli.
z.setErrorMap((sorun, baglam) => {
  switch (sorun.code) {
    case "invalid_type":
      return { message: sorun.received === "undefined" ? "zorunlu alan eksik" : `${sorun.expected} bekleniyordu, ${sorun.received} geldi` };
    case "invalid_enum_value":
      return { message: `geçersiz değer "${String(sorun.received)}"; izin verilenler: ${sorun.options.join(", ")}` };
    case "unrecognized_keys":
      return { message: `tanınmayan alan: ${sorun.keys.join(", ")}` };
    case "too_small":
      return { message: sorun.type === "string" ? `en az ${sorun.minimum} karakter olmalı` : sorun.type === "array" ? `en az ${sorun.minimum} öğe olmalı` : `en az ${sorun.minimum} olmalı` };
    case "too_big":
      return { message: sorun.type === "array" ? `en fazla ${sorun.maximum} öğe olmalı` : `en fazla ${sorun.maximum} olmalı` };
    default:
      return { message: baglam.defaultError };
  }
});

function yamlDosyalari(klasor: string): string[] {
  const sonuc: string[] = [];
  for (const ad of readdirSync(klasor).sort()) {
    const yol = join(klasor, ad);
    if (statSync(yol).isDirectory()) sonuc.push(...yamlDosyalari(yol));
    else if (ad.endsWith(".yaml") || ad.endsWith(".yml")) sonuc.push(yol);
  }
  return sonuc;
}

function zodHatasi(e: z.ZodError, onek: string): string[] {
  return e.issues.map((i) => `${onek} › ${i.path.join(".") || "(kök)"}: ${i.message}`);
}

/** Bir içerik klasörünü derler. Testler de bu fonksiyonu geçici klasörlerle çağırır. */
export function icerikDerle(kok: string): DerlemeSonucu {
  const hatalar: string[] = [];
  const uyarilar: string[] = [];
  const hash = createHash("sha256");
  const oku = (yol: string): unknown => {
    const metin = readFileSync(yol, "utf8");
    hash.update(metin);
    try {
      return parse(metin);
    } catch (e) {
      hatalar.push(`${relative(kok, yol)}: YAML okunamadı — ${(e as Error).message.split("\n")[0]}`);
      return null;
    }
  };

  // Karakterler
  const karakterler: Record<string, IcerikPaketi["karakterler"][string]> = {};
  const kHam = oku(join(kok, "karakterler.yaml"));
  if (Array.isArray(kHam)) {
    kHam.forEach((k, i) => {
      const s = karakterSemasi.safeParse(k);
      if (!s.success) return hatalar.push(...zodHatasi(s.error, `karakterler.yaml › [${i}]`));
      if (karakterler[s.data.id]) hatalar.push(`karakterler.yaml › ${s.data.id}: aynı kimlik iki kez`);
      karakterler[s.data.id] = s.data;
    });
  } else hatalar.push("karakterler.yaml: bir liste olmalı");

  // Şehirler
  const sehirler: IcerikPaketi["sehirler"] = [];
  const sHam = oku(join(kok, "sehirler.yaml"));
  if (Array.isArray(sHam)) {
    sHam.forEach((k, i) => {
      const s = sehirSemasi.safeParse(k);
      if (!s.success) hatalar.push(...zodHatasi(s.error, `sehirler.yaml › [${i}]`));
      else sehirler.push(s.data);
    });
    if (sehirler.filter((s) => s.baskent).length !== 1) hatalar.push("sehirler.yaml: tam bir başkent olmalı");
  } else hatalar.push("sehirler.yaml: bir liste olmalı");

  // Kartlar
  const kartlar: Record<string, Kart> = {};
  const kaynak: Record<string, string> = {};
  for (const yol of yamlDosyalari(join(kok, "kartlar"))) {
    const dosya = relative(kok, yol);
    const ham = oku(yol);
    if (ham === null) continue;
    if (!Array.isArray(ham)) {
      hatalar.push(`${dosya}: kart dosyası bir liste olmalı`);
      continue;
    }
    ham.forEach((k, i) => {
      const s = kartSemasi.safeParse(k);
      const ad = (k as { id?: string })?.id ?? `[${i}]`;
      if (!s.success) return hatalar.push(...zodHatasi(s.error, `${dosya} › ${ad}`));
      if (kartlar[s.data.id]) return hatalar.push(`${dosya} › ${s.data.id}: aynı kimlik ${kaynak[s.data.id]} dosyasında da var`);
      kartlar[s.data.id] = s.data;
      kaynak[s.data.id] = dosya;
    });
  }

  // Kurallar ve çapraz başvurular
  // Bu üç koşul yalnız çekirdek tarafından açılan dosyaları rastgele havuzdan çıkarır.
  const bayrakYazilan = new Set<string>(["sistem_atama", "sistem_ifsa", "sistem_kriz"]);
  const bayrakOkunan = new Map<string, string>();
  const zincirler = new Map<string, Kart[]>();
  for (const k of Object.values(kartlar)) {
    const yer = `${kaynak[k.id]} › ${k.id}`;
    if (!karakterler[k.getiren]) hatalar.push(`${yer} › getiren: "${k.getiren}" karakterler.yaml içinde yok`);
    if (k.zincir) {
      if (!k.asama) hatalar.push(`${yer}: zincir kartında aşama belirtilmeli`);
      zincirler.set(k.zincir, [...(zincirler.get(k.zincir) ?? []), k]);
    }
    if (k.tur === "zincir" && !k.zincir) hatalar.push(`${yer}: "zincir" türündeki kart bir zincire bağlı olmalı`);
    if (k.ertelenince && !kartlar[k.ertelenince]) hatalar.push(`${yer} › ertelenince: "${k.ertelenince}" adlı kart yok`);
    if (k.ertelenince && k.tur === "ana") hatalar.push(`${yer}: ana karar ertelenemez, ertelenince alanı kaldırılmalı`);

    // Metinler: uzunluk ve yer tutucular
    const izinli = new Set(Object.keys(k.degiskenler));
    const metinler: [string, string, number | null][] = [
      ["metin.baslik", k.metin.baslik, SINIR.baslik],
      ["metin.durum", k.metin.durum, SINIR.durum],
      ["metin.kulis", k.metin.kulis ?? "", SINIR.kulis],
      ...k.secenekler.flatMap((s, i): [string, string, number | null][] => [
        [`secenekler[${i}].metin`, s.metin, SINIR.secenek],
        [`secenekler[${i}].haber`, s.haber ?? "", null],
      ]),
    ];
    for (const [alan, metin, sinir] of metinler) {
      if (!metin) continue;
      if (sinir !== null && sozcukSayisi(metin) > sinir) hatalar.push(`${yer} › ${alan}: ${sozcukSayisi(metin)} sözcük; sınır ${sinir}`);
      try {
        for (const y of yerTutucular(metin)) if (!izinli.has(y.ad)) hatalar.push(`${yer} › ${alan}: {${y.ad}} değişkeni "degiskenler" içinde tanımlı değil`);
      } catch (e) {
        hatalar.push(`${yer} › ${alan}: ${(e as Error).message}`);
      }
    }

    // Seçenekler
    k.secenekler.forEach((s, i) => {
      for (const anahtar of Object.keys(s.etki)) if (!GOSTERGE[anahtar]) hatalar.push(`${yer} › secenekler[${i}].etki: bilinmeyen gösterge "${anahtar}"`);
      for (const n of s.sonraki) if (!kartlar[n.kart]) hatalar.push(`${yer} › secenekler[${i}].sonraki: "${n.kart}" adlı kart yok`);
      for (const b of Object.keys(s.bayrak ?? {})) bayrakYazilan.add(b);
      const soz = s.ekonomi?.soz;
      if (soz?.grup && GOSTERGE[soz.grup]?.alan !== "secmen") hatalar.push(`${yer} › secenekler[${i}].ekonomi.soz.grup: "${soz.grup}" bir seçmen grubu değil`);
      if (soz && sozcukSayisi(soz.metin) > SINIR.secenek) hatalar.push(`${yer} › secenekler[${i}].ekonomi.soz.metin: ${sozcukSayisi(soz.metin)} sözcük; sınır ${SINIR.secenek}`);
      if (!Object.keys(s.etki).length && !s.bayrak && !s.sonraki.length && !s.sicil) uyarilar.push(`${yer} › secenekler[${i}]: hiçbir sonucu yok`);
    });
    if (k.secenekler.every((s) => Object.values(s.etki).every((v) => v >= 0)) && !k.secenekler.some((s) => s.sicil))
      uyarilar.push(`${yer}: hiçbir seçeneğin kaybedeni yok (tasarım ilkesi: her seçeneğin bir bedeli olmalı)`);

    for (const b of [...Object.keys(k.kosul.bayrak ?? {}), ...(k.kosul.bayrak_yok ?? [])]) bayrakOkunan.set(b, yer);
  }
  for (const [b, yer] of bayrakOkunan) if (!bayrakYazilan.has(b)) uyarilar.push(`${yer}: "${b}" bayrağını hiçbir kart yazmıyor`);
  for (const [ad, liste] of zincirler) {
    if (!liste.some((k) => k.asama === "tohum")) hatalar.push(`zincir "${ad}": tohum kartı yok`);
    for (const k of liste) if (k.asama !== "tohum" && k.tur !== "zincir") hatalar.push(`zincir "${ad}" › ${k.id}: tohum dışındaki aşamalar "zincir" türünde olmalı`);
  }
  // Ulaşılamayan zincir kartları
  const hedefler = new Set(Object.values(kartlar).flatMap((k) => k.secenekler.flatMap((s) => s.sonraki.map((n) => n.kart))));
  for (const k of Object.values(kartlar)) {
    if (k.tur === "zincir" && !hedefler.has(k.id)) uyarilar.push(`${kaynak[k.id]} › ${k.id}: hiçbir seçenek bu karta götürmüyor`);
    if (k.ertelenince) hedefler.add(k.ertelenince);
  }

  // Politika dosyası
  const politikalar: Record<string, Politika> = {};
  const pYol = join(kok, "politikalar.yaml");
  let pHam: unknown = [];
  try {
    statSync(pYol);
    pHam = oku(pYol);
  } catch {
    pHam = [];
  }
  if (Array.isArray(pHam)) {
    pHam.forEach((k, i) => {
      const s = politikaSemasi.safeParse(k);
      const ad = (k as { id?: string })?.id ?? `[${i}]`;
      if (!s.success) return hatalar.push(...zodHatasi(s.error, `politikalar.yaml › ${ad}`));
      const p = s.data;
      const yer = `politikalar.yaml › ${p.id}`;
      if (politikalar[p.id]) hatalar.push(`${yer}: aynı kimlik iki kez`);
      if (!karakterler[p.getiren]) hatalar.push(`${yer} › getiren: "${p.getiren}" karakterler.yaml içinde yok`);
      if (p.baslangic >= p.kademeler.length) hatalar.push(`${yer} › baslangic: ${p.kademeler.length} kademe var, başlangıç ${p.baslangic} olamaz`);
      for (const g of Object.keys(p.adim)) if (!GOSTERGE[g]) hatalar.push(`${yer} › adim: bilinmeyen gösterge "${g}"`);
      if (p.adim.butce_acigi !== undefined && !p.kalem) hatalar.push(`${yer}: bütçe etkisi var ama "kalem" belirtilmemiş`);
      if (!Object.values(p.adim).some((v) => v < 0) && !Object.values(p.adim).some((v) => v > 0)) uyarilar.push(`${yer}: etkisi yok`);
      politikalar[p.id] = p;
    });
  } else hatalar.push("politikalar.yaml: bir liste olmalı");

  // Koşullardaki politika ve gösterge kimlikleri
  const kosulDenetle = (yer: string, k: { gosterge?: Record<string, unknown>; politika?: Record<string, unknown> }) => {
    for (const g of Object.keys(k.gosterge ?? {})) if (!GOSTERGE[g]) hatalar.push(`${yer} › kosul.gosterge: bilinmeyen gösterge "${g}"`);
    for (const p of Object.keys(k.politika ?? {})) if (!politikalar[p]) hatalar.push(`${yer} › kosul.politika: bilinmeyen politika "${p}"`);
  };
  for (const k of Object.values(kartlar)) kosulDenetle(`${kaynak[k.id]} › ${k.id}`, k.kosul);

  // Beş hayat
  const hayatlar: Hayat[] = [];
  const hHam = (() => { try { statSync(join(kok, "hayatlar.yaml")); return oku(join(kok, "hayatlar.yaml")); } catch { return []; } })();
  if (Array.isArray(hHam)) {
    hHam.forEach((h, i) => {
      const s = hayatSemasi.safeParse(h);
      const ad = (h as { id?: string })?.id ?? `[${i}]`;
      if (!s.success) return hatalar.push(...zodHatasi(s.error, `hayatlar.yaml › ${ad}`));
      if (GOSTERGE[s.data.grup]?.alan !== "secmen") hatalar.push(`hayatlar.yaml › ${ad} › grup: "${s.data.grup}" bir seçmen grubu değil`);
      const kim = new Set<string>();
      for (const sh of s.data.sahneler) {
        if (kim.has(sh.id)) hatalar.push(`hayatlar.yaml › ${ad} › ${sh.id}: aynı sahne kimliği iki kez`);
        kim.add(sh.id);
        kosulDenetle(`hayatlar.yaml › ${ad} › ${sh.id}`, sh.kosul);
      }
      hayatlar.push(s.data);
    });
  } else hatalar.push("hayatlar.yaml: bir liste olmalı");

  // Gazeteler, ziyaretçiler, eylemler
  let toplum: ToplumIcerigi = { gazeteler: [], ziyaretciler: [], eylemler: {} };
  const tHam = (() => { try { statSync(join(kok, "toplum.yaml")); return oku(join(kok, "toplum.yaml")); } catch { return null; } })();
  if (tHam !== null) {
    const s = toplumSemasi.safeParse(tHam);
    if (!s.success) hatalar.push(...zodHatasi(s.error, "toplum.yaml"));
    else {
      toplum = s.data;
      for (const z of toplum.ziyaretciler)
        for (const g of [...Object.keys(z.kabul), ...Object.keys(z.ihmal)]) if (!GOSTERGE[g]) hatalar.push(`toplum.yaml › ziyaretciler › ${z.id}: bilinmeyen gösterge "${g}"`);
      for (const g of Object.keys(toplum.eylemler)) if (GOSTERGE[g]?.alan !== "secmen") hatalar.push(`toplum.yaml › eylemler: "${g}" bir seçmen grubu değil`);
    }
  }

  let meclis: MeclisIcerigi = { vekiller: [] };
  if (existsSync(join(kok, "meclis.yaml"))) {
    const m = meclisIcerikSemasi.safeParse(oku(join(kok, "meclis.yaml")));
    if (!m.success) hatalar.push(...zodHatasi(m.error, "meclis.yaml"));
    else {
      meclis = m.data;
      for (const v of meclis.vekiller) if (!sehirler.some(s => s.ad === v.il)) hatalar.push(`meclis.yaml › ${v.id}: bilinmeyen seçim bölgesi "${v.il}"`);
    }
  }
  let medya: MedyaIcerigi | undefined;
  if (existsSync(join(kok, "medya.yaml"))) {
    const m = medyaIcerikSemasi.safeParse(oku(join(kok, "medya.yaml")));
    if (!m.success) hatalar.push(...zodHatasi(m.error, "medya.yaml"));
    else { medya = m.data; for (const k of medya.kuruluslar) if (GOSTERGE[k.grup]?.alan !== "secmen") hatalar.push(`medya.yaml: bilinmeyen grup ${k.grup}`); }
  }
  if (hatalar.length) return { paket: null, hatalar, uyarilar };
  return {
    paket: { surum: hash.digest("hex").slice(0, 12), kartlar, karakterler, sehirler, politikalar, hayatlar, toplum, meclis, medya },
    hatalar,
    uyarilar,
  };
}

// Komut satırından çalıştırıldığında: derle ve yaz
const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const s = icerikDerle(join(KOK, "icerik"));
  for (const u of s.uyarilar) console.warn(`uyarı: ${u}`);
  if (!s.paket) {
    for (const h of s.hatalar) console.error(`hata: ${h}`);
    console.error(`İçerik derlenemedi: ${s.hatalar.length} hata.`);
    process.exit(1);
  }
  mkdirSync(join(KOK, "uretilen"), { recursive: true });
  writeFileSync(join(KOK, "uretilen/icerik.json"), JSON.stringify(s.paket));
  console.log(`İçerik: ${Object.keys(s.paket.kartlar).length} kart, ${Object.keys(s.paket.politikalar).length} politika, ${Object.keys(s.paket.karakterler).length} karakter, ${s.paket.sehirler.length} şehir · ${s.uyarilar.length} uyarı`);
}
