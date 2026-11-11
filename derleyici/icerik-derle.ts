import { INCELEME_RAPORLARI } from "../cekirdek/inceleme-durum.ts";
import { ACILIS_SABAHLAR } from "../cekirdek/acilis-durum.ts";
import { sahaIcerikSemasi, type SahaDosyasi } from "../cekirdek/saha-icerik.ts";
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

    if (k.inceleme) {
      bayrakYazilan.add("inceleme_kanit_var");
      if (k.zincir !== "akkopru" || k.tur !== "zincir") hatalar.push(`${yer}: inceleme aynı Akköprü zincirinde olmalı`);
      if (k.inceleme.asama === "baslangic" && k.id !== "akkopru_inceleme") hatalar.push(`${yer}: inceleme başlangıcının kimliği geçersiz`);
      if (k.inceleme.asama === "rapor" && (!k.inceleme.yol || k.id !== INCELEME_RAPORLARI[k.inceleme.yol] || !k.inceleme.rapor)) hatalar.push(`${yer}: rapor kimliği, yolu veya metni geçersiz`);
      const r = k.inceleme.rapor;
      if (r && (sozcukSayisi(r.baslik) > 10 || [...r.bulgular, ...r.eksikler, r.ham_var, r.ham_yok, r.beyan_var, r.beyan_yok].some(m => sozcukSayisi(m) > 60))) hatalar.push(`${yer}: inceleme raporu metin sınırını aşıyor`);
    }
    if (k.hesaplasma) {
      const h = k.hesaplasma;
      const kimlikler = h.asama === "ilk" ? h.tur === "kaza" ? ["akkopru_kaza"] : ["akkopru_tanik"]
        : h.asama === "oturum" ? ["akkopru_durusma"] : h.tur === "kaza" ? ["akkopru_durusma_takip"] : ["akkopru_tanik_takip"];
      if (!kimlikler.includes(k.id) || k.tur !== "zincir" || k.zincir !== "akkopru") hatalar.push(`${yer}: hesaplaşma aşaması kart kimliğiyle uyuşmuyor`);
    }
    if (k.id === "akkopru_kabul") bayrakYazilan.add("santiye_teknik_uygun");
    if (k.acilis) {
      if (k.id !== ACILIS_SABAHLAR[k.acilis.gece]) hatalar.push(`${yer}: sabah kimliği ilk gece tercihiyle uyuşmuyor`);
      if (k.tur !== "zincir" || k.zincir !== "akkopru" || k.anlati?.sahne) hatalar.push(`${yer}: ilk sabah dosyası aynı Akköprü zincirinde sahnesiz bir devam olmalı`);
      for (const o of k.acilis.olaylar) if (sozcukSayisi(o.metin) > 60) hatalar.push(`${yer}: ilk sabah olayı 60 sözcüğü aşıyor`);
    }
    // Seçenekler
    const replikDenetle = (kim: string, metin: string, alan: string, sinir = 60) => {
      if (!karakterler[kim]) hatalar.push(`${yer} › ${alan}: "${kim}" karakterler.yaml içinde yok`);
      if (sozcukSayisi(metin) > sinir) hatalar.push(`${yer} › ${alan}: ${sozcukSayisi(metin)} sözcük; sınır ${sinir}`);
    };
    const kosulBayraklari = (kosul: Kart["kosul"] | undefined) => {
      for (const b of [...Object.keys(kosul?.bayrak ?? {}), ...(kosul?.bayrak_yok ?? [])]) bayrakOkunan.set(b, yer);
      for (const kim of Object.keys(kosul?.iliski ?? {})) if (!karakterler[kim]) hatalar.push(`${yer} › kosul.iliski: bilinmeyen karakter "${kim}"`);
    };
    if (k.anlati) {
      for (const r of [...k.anlati.sesler, ...k.anlati.hatirlatmalar]) { replikDenetle(r.kim, r.metin, "anlati.replik"); kosulBayraklari(r.kosul); }
      for (const a of k.anlati.sahne?.adimlar ?? []) {
        replikDenetle(a.kim, a.metin, "anlati.sahne");
        if (a.secenekler.every(s => s.kosul)) hatalar.push(`${yer} › anlati.sahne: en az bir koşulsuz yanıt gerekir`);
        for (const s of a.secenekler) {
          replikDenetle(a.kim, s.metin, "anlati.sahne.secenek", 12);
          replikDenetle(a.kim, s.cevap, "anlati.sahne.cevap");
          for (const id of Object.keys(s.etki)) if (!GOSTERGE[id]) hatalar.push(`${yer} › anlati.sahne.etki: bilinmeyen gösterge "${id}"`);
          for (const kim of Object.keys(s.iliski)) if (!karakterler[kim]) hatalar.push(`${yer} › anlati.iliski: bilinmeyen karakter "${kim}"`);
          for (const b of Object.keys(s.bayrak ?? {})) bayrakYazilan.add(b);
          kosulBayraklari(s.kosul);
        }
      }
    }
    k.secenekler.forEach((s, i) => {
      kosulBayraklari(s.kosul);
      if (!!k.inceleme !== !!s.inceleme) hatalar.push(`${yer}: inceleme seçeneği dosyayla uyuşmuyor`);
      if (["akkopru_tazminat", "akkopru_onarim", "akkopru_teslim", "akkopru_kabul"].includes(k.id) !== !!s.santiye) hatalar.push(`${yer}: şantiye seçeneği dosyayla uyuşmuyor`);
      if (!!k.hesaplasma !== !!s.hesaplasma) hatalar.push(`${yer}: hesaplaşma seçeneği dosyayla uyuşmuyor`);
      if (s.hesaplasma) {
        const a = s.hesaplasma;
        if (k.zincir !== "akkopru" || s.inceleme || s.santiye || s.politika || s.saha_karari) hatalar.push(`${yer}: hesaplaşma işlemi geçersiz dosyada`);
        if ((k.hesaplasma?.asama === "ilk") !== (a.islem === "baslat") || (k.hesaplasma?.asama === "oturum") !== (a.islem === "oturum")) hatalar.push(`${yer}: hesaplaşma işlemi yanlış aşamada`);
        if (a.islem === "baslat" && (!a.yol || !s.sonraki.some(n => n.kart === (k.hesaplasma?.tur === "kaza" ? "akkopru_durusma" : "akkopru_tanik_takip") && n.gecikme === 1))) hatalar.push(`${yer}: ilk kararın gelecek ay dosyası eksik`);
        if (a.islem === "baslat" && a.yol && (k.hesaplasma?.tur === "kaza" ? !["acik", "sirket", "gizlilik"].includes(a.yol) : !["koruma", "gorev", "serbest"].includes(a.yol))) hatalar.push(`${yer}: hesaplaşma başlangıç yolu yanlış türde`);
        if (a.islem === "oturum" && !s.sonraki.some(n => n.kart === "akkopru_durusma_takip" && n.gecikme === 1)) hatalar.push(`${yer}: duruşmanın sonraki ay yanıtı eksik`);
        if (a.islem === "bitir" && (!a.baslik || s.sonraki.length)) hatalar.push(`${yer}: sonuç başlığı veya bitiş bağlantısı geçersiz`);
        if (a.beyan && (a.kosul !== "beyan" || k.id !== "akkopru_tanik_takip")) hatalar.push(`${yer}: tanık beyanı ancak gönüllü ifadeyle alınır`);
        if (a.kosul === "aile" && (!s.icra?.odeme || s.icra.odeme.kalem !== "sosyal")) hatalar.push(`${yer}: aileye yardım gerçek sosyal ödeme gerektirir`);
        if (sozcukSayisi(a.metin) > 60 || (a.baslik && sozcukSayisi(a.baslik) > 10)) hatalar.push(`${yer}: hesaplaşma sonucu metin sınırını aşıyor`);
      }
      if (s.santiye) {
        if (k.zincir !== "akkopru" || s.inceleme || s.saha_karari || s.politika || s.destek) hatalar.push(`${yer}: şantiye işlemi geçersiz dosyada veya başka uygulamayla birleşti`);
        if (sozcukSayisi(s.santiye.metin) > 60) hatalar.push(`${yer}: şantiye sonucu 60 sözcüğü aşıyor`);
        if (s.santiye.ucret && (!s.icra?.odeme || s.icra.odeme.kalem !== "personel" || !s.icra.maas || k.degiskenler.il !== "baskent")) hatalar.push(`${yer}: ücret ancak ilgili şehirde gerçek personel ödemesiyle kapanır`);
        if (s.santiye.asama === "yapim" && (!s.icra?.odeme || s.icra.odeme.kalem !== "yatirim" || !s.santiye.takvim || !s.sonraki.some(n => n.kart === "akkopru_teslim" && n.gecikme === s.santiye?.takvim))) hatalar.push(`${yer}: yapım ödenek ve fiziksel teslim takvimi ister`);
        if (s.santiye.asama === "kabul" && (k.id !== "akkopru_kabul" || !s.sonraki.some(n => n.kart === "akkopru_son"))) hatalar.push(`${yer}: teknik kabul yalnız deney dosyasından açılışa bağlanır`);
      }
      if (s.inceleme) {
        if (s.politika || s.destek || s.saha_karari || s.acilis_sonuc) hatalar.push(`${yer}: inceleme başka uygulamayla birleştirilemez`);
        if ((k.inceleme?.asama === "baslangic") !== (s.inceleme.islem === "baslat")) hatalar.push(`${yer}: inceleme işlemi yanlış aşamada`);
        if (sozcukSayisi(s.inceleme.metin) > 60 || (s.inceleme.islem === "bitir" && sozcukSayisi(s.inceleme.baslik) > 10)) hatalar.push(`${yer}: inceleme sonucu metin sınırını aşıyor`);
        const hedef = s.inceleme.islem === "baslat" ? INCELEME_RAPORLARI[s.inceleme.yol] : s.inceleme.islem === "devret" ? INCELEME_RAPORLARI.bagimsiz : null;
        if (hedef && !s.sonraki.some(n => n.kart === hedef && n.gecikme === 1)) hatalar.push(`${yer}: inceleme için gelecek ayın raporu bağlanmalı`);
        if (s.inceleme.islem === "devret" && k.inceleme?.yol === "bagimsiz") hatalar.push(`${yer}: bağımsız rapor kendi kendine yeniden devredilemez`);
      }
      if (!!k.acilis !== !!s.acilis_sonuc) hatalar.push(`${yer}: ilk sabah sonucu dosyayla uyuşmuyor`);
      if (s.acilis_sonuc) {
        if (sozcukSayisi(s.acilis_sonuc.baslik) > 10 || sozcukSayisi(s.acilis_sonuc.metin) > 60 || s.acilis_sonuc.olaylar.some(o => sozcukSayisi(o.metin) > 60)) hatalar.push(`${yer}: ilk gün sonucu metin sınırını aşıyor`);
        if (s.politika || s.destek || s.saha_karari) hatalar.push(`${yer}: ilk sabah sonucu başka uygulama talimatıyla birleşemez`);
      }
      for (const anahtar of Object.keys(s.etki)) if (!GOSTERGE[anahtar]) hatalar.push(`${yer} › secenekler[${i}].etki: bilinmeyen gösterge "${anahtar}"`);
      for (const n of s.sonraki) {
        if (!kartlar[n.kart]) hatalar.push(`${yer} › secenekler[${i}].sonraki: "${n.kart}" adlı kart yok`);
        kosulBayraklari(n.kosul);
      }
      for (const r of s.tepkiler ?? []) { replikDenetle(r.kim, r.metin, "tepkiler"); kosulBayraklari(r.kosul); }
      for (const b of Object.keys(s.bayrak ?? {})) bayrakYazilan.add(b);
      const soz = s.ekonomi?.soz;
      if (soz?.grup && GOSTERGE[soz.grup]?.alan !== "secmen") hatalar.push(`${yer} › secenekler[${i}].ekonomi.soz.grup: "${soz.grup}" bir seçmen grubu değil`);
      if (soz && sozcukSayisi(soz.metin) > SINIR.secenek) hatalar.push(`${yer} › secenekler[${i}].ekonomi.soz.metin: ${sozcukSayisi(soz.metin)} sözcük; sınır ${SINIR.secenek}`);
      if (!Object.keys(s.etki).length && !s.bayrak && !s.sonraki.length && !s.sicil && !s.politika && !s.destek && !s.saha_karari && !s.icra) uyarilar.push(`${yer} › secenekler[${i}]: hiçbir sonucu yok`);
    });
    if (!k.saha && k.secenekler.every((s) => Object.values(s.etki).every((v) => v >= 0)) && !k.secenekler.some((s) => s.sicil))
      uyarilar.push(`${yer}: hiçbir seçeneğin kaybedeni yok (tasarım ilkesi: her seçeneğin bir bedeli olmalı)`);

    for (const b of [...Object.keys(k.kosul.bayrak ?? {}), ...(k.kosul.bayrak_yok ?? [])]) bayrakOkunan.set(b, yer);
  }
  for (const [b, yer] of bayrakOkunan) if (!bayrakYazilan.has(b)) uyarilar.push(`${yer}: "${b}" bayrağını hiçbir kart yazmıyor`);
  for (const [ad, liste] of zincirler) {
    if (!liste.some((k) => k.asama === "tohum")) hatalar.push(`zincir "${ad}": tohum kartı yok`);
    for (const k of liste) if (k.asama !== "tohum" && k.tur !== "zincir") hatalar.push(`zincir "${ad}" › ${k.id}: tohum dışındaki aşamalar "zincir" türünde olmalı`);
  }
  const ilkGece = kartlar.akkopru_telefon;
  if (ilkGece) ilkGece.secenekler.forEach((s, i) => {
    const sabahlar = s.sonraki.filter(n => n.gecikme === 0 && kartlar[n.kart]?.acilis?.gece === i);
    if (sabahlar.length !== 1) hatalar.push(`akkopru_telefon: ${i}. tercih için tek bir aynı ay sabah dosyası gerekir`);
  });
  // Ulaşılamayan zincir kartları
  const hedefler = new Set(Object.values(kartlar).flatMap((k) => k.secenekler.flatMap((s) => s.sonraki.map((n) => n.kart))));
  // Şantiyenin ilk işleminde çekirdek tarafından bir kez takvime alınır.
  if (kartlar.akkopru_gecim) hedefler.add("akkopru_gecim");
  for (const k of Object.values(kartlar)) {
    if (k.tur === "zincir" && !k.ziyaret && !hedefler.has(k.id)) uyarilar.push(`${kaynak[k.id]} › ${k.id}: hiçbir seçenek bu karta götürmüyor`);
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
  for (const k of Object.values(kartlar)) {
    kosulDenetle(`${kaynak[k.id]} › ${k.id}`, k.kosul);
    for (const s of k.secenekler) {
      if (s.kosul) kosulDenetle(`${k.id} › seçenek`, s.kosul);
      if (s.icra && (s.politika || s.destek || s.saha_karari || k.saha || s.ekonomi?.soz)) hatalar.push(`${k.id}: icra başka bir ödeme veya uygulama talimatıyla birleştirilemez`);
      if (s.icra?.maas && !s.icra.odeme) hatalar.push(`${k.id}: ücret müdahalesi ödeme gerektirir`);
      if (s.icra?.maas && !k.degiskenler.il) hatalar.push(`${k.id}: ücret müdahalesi için il değişkeni gerekir`);
      if (s.icra?.odeme?.grup && GOSTERGE[s.icra.odeme.grup]?.alan !== "secmen") hatalar.push(`${k.id}: ödeme grubu bir seçmen grubu olmalı`);
      if (s.politika && s.destek) hatalar.push(`${k.id}: tek seçenekte hem politika hem destek talimatı olamaz`);
      if (s.destek && !kartlar[s.destek.kaynak]?.secenekler.some(x => x.ekonomi?.soz)) hatalar.push(`${k.id}: destek kaynağı bulunamadı`);
    }
    for (const s of k.secenekler) if (s.politika) {
      const p = politikalar[s.politika.id];
      if (!p || s.politika.hedef >= p.kademeler.length) hatalar.push(`${k.id}: geçersiz politika talimatı ${s.politika.id}`);
    }
  }

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
      const ziyaretKimlikleri = new Set<string>();
      for (const z of toplum.ziyaretciler) {
        if (ziyaretKimlikleri.has(z.id)) hatalar.push(`toplum.yaml: yinelenen ziyaretçi ${z.id}`);
        ziyaretKimlikleri.add(z.id);
        if (z.gorusme && (kartlar[z.gorusme]?.ziyaret?.id !== z.id || kartlar[z.gorusme]?.ziyaret?.asama !== "gorusme")) hatalar.push(`toplum.yaml: ${z.id} için geçersiz görüşme dosyası`);
      }
      for (const k of Object.values(kartlar)) if (k.ziyaret && !ziyaretKimlikleri.has(k.ziyaret.id)) hatalar.push(`${k.id}: bilinmeyen ziyaretçi ${k.ziyaret.id}`);
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
  let saha: SahaDosyasi[] = [];
  if (existsSync(join(kok, "saha.yaml"))) {
    const r = sahaIcerikSemasi.safeParse(oku(join(kok, "saha.yaml")));
    if (!r.success) hatalar.push(...zodHatasi(r.error, "saha.yaml"));
    else saha = r.data;
  }
  const sahaIds = new Set<string>(), sahaIller = new Set<string>();
  for (const t of saha) {
    if (sahaIds.has(t.id) || sahaIller.has(t.il)) hatalar.push(`saha.yaml: yinelenen dosya/şehir ${t.id}`);
    sahaIds.add(t.id); sahaIller.add(t.il);
    if (!sehirler.some(s => s.ad === t.il)) hatalar.push(`saha.yaml: şehir bulunamadı ${t.il}`);
    if (GOSTERGE[t.grup]?.alan !== "secmen") hatalar.push(`saha.yaml: geçersiz grup ${t.grup}`);
    for (const g of Object.keys(t.fayda)) if (!GOSTERGE[g]) hatalar.push(`saha.yaml: bilinmeyen gösterge ${g}`);
    for (const [id, asama] of [[t.ilk, "ilk"], [t.takip, "takip"]]) if (kartlar[id!]?.saha?.id !== t.id || kartlar[id!]?.saha?.asama !== asama || !kartlar[id!]?.anlati?.sahne) hatalar.push(`saha.yaml: ${t.id} için geçersiz görüşme ${id}`);
  }
  for (const k of Object.values(kartlar)) {
    if (k.saha && !sahaIds.has(k.saha.id)) hatalar.push(`${k.id}: bilinmeyen saha dosyası`);
    for (const s of k.secenekler) {
      if (!!k.saha !== !!s.saha_karari) hatalar.push(`${k.id}: saha kararı dosyayla uyuşmuyor`);
      if (s.saha_karari && (s.politika || s.destek || s.ekonomi || s.sonraki.length)) hatalar.push(`${k.id}: saha ödeneği ikinci bir talimatla birleştirilemez`);
    }
  }
  if (hatalar.length) return { paket: null, hatalar, uyarilar };
  return {
    paket: { surum: hash.digest("hex").slice(0, 12), kartlar, karakterler, sehirler, politikalar, hayatlar, toplum, meclis, medya, saha },
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
