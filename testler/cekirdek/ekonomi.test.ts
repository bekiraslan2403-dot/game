import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import {
  ekonomiAySonu, butceDegistir, toplamGider, toplamGelir, hissedilenEnflasyon, haneButcesi, ekonomiUyarilari, trilyonTL, aylikOran,
  GIDER_KALEMLERI, GELIR_KALEMLERI, SEPET,
} from "../../cekirdek/ekonomi.ts";
import { aracKullan, aracTahmini, aracDenetle, sozVer, sozTut, ARAC_ORANI } from "../../cekirdek/hazine.ts";
import { gostergeYaz } from "../../cekirdek/gostergeler.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const s = icerikDerle(join(dirname(fileURLToPath(import.meta.url)), "../../icerik"));
if (!s.paket) throw new Error(s.hatalar.join("\n"));
const I: IcerikPaketi = s.paket;
const acilVar = (id: string) => I.kartlar[id]?.tur === "acil";

/** Kararsız bir ay: yalnız ekonomi ilerler. */
function ayGecir(d: OyunDurumu, n = 1): void {
  for (let i = 0; i < n; i++) {
    d.ayBasi = { ...d.gostergeler };
    ekonomiAySonu(d, acilVar);
    d.ay += 1;
  }
}

const yakin = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;

test("başlangıç: 8 gösterge belge değerlerinde; bütçe 8 gider ve 5 gelir kalemiyle açığa denk", () => {
  const d = yeniOyun(1);
  const g = d.gostergeler;
  assert.deepEqual([g.enflasyon, g.buyume, g.issizlik, g.butce_acigi, g.kur, g.faiz], [29, 2.5, 8, 3.5, 50, 35]);
  assert.equal(gostergeYaz("guven", g.guven!), "orta");
  assert.equal(gostergeYaz("rezerv", g.rezerv!), "rahat");
  assert.equal(GIDER_KALEMLERI.length, 8);
  assert.equal(GELIR_KALEMLERI.length, 5);
  assert.ok(yakin(toplamGider(d) - toplamGelir(d), 3.5, 1e-9));
  assert.equal(SEPET.map((u) => u.id).join(","), "ekmek,cay,sut,peynir,yag,kiyma");
  // Sepetin geçen yıla göre artışı başlangıç enflasyonuna yakın (gıdada biraz üstünde)
  const his = hissedilenEnflasyon(d);
  assert.ok(his > 29 && his < 34, `hissedilen ${his}`);
});

test("hiçbir karar verilmezse ekonomi 18 ay boyunca yerinde sayar", () => {
  for (let t = 1; t <= 20; t++) {
    const d = yeniOyun(t);
    ayGecir(d, 18);
    const g = d.gostergeler;
    assert.ok(g.enflasyon! > 25 && g.enflasyon! < 34, `t${t} enflasyon ${g.enflasyon}`);
    assert.ok(g.buyume! > 1.5 && g.buyume! < 3.5, `t${t} büyüme ${g.buyume}`);
    assert.ok(Math.abs(g.issizlik! - 8) < 0.6, `t${t} işsizlik ${g.issizlik}`);
    assert.ok(Math.abs(g.butce_acigi! - 3.5) < 0.4, `t${t} açık ${g.butce_acigi}`);
    assert.ok(g.guven! > 40 && g.guven! < 60, `t${t} güven ${g.guven}`);
    assert.ok(g.kur! > 60 && g.kur! < 85, `t${t} kur ${g.kur}`);
    assert.equal(d.ekonomi.krizler.length, 0);
  }
});

test("göstergeler her ay hedefe doğru ilerler; ani sıçrama yalnız krizde olur", () => {
  const d = yeniOyun(4);
  d.ekonomi.katki.enflasyon = 10;
  let once = d.gostergeler.enflasyon!;
  for (let i = 0; i < 6; i++) {
    ayGecir(d);
    const fark = d.gostergeler.enflasyon! - once;
    assert.ok(fark < 4, `bir ayda ${fark} puan`);
    once = d.gostergeler.enflasyon!;
  }
  assert.ok(d.gostergeler.enflasyon! > 33);
});

/** Aynı tohumla iki ekonomi: biri değiştirilir, farkın aylara göre seyri döner. */
function fark(degistir: (d: OyunDurumu) => void, olc: (d: OyunDurumu) => number, ay = 12): number[] {
  const a = yeniOyun(1), b = yeniOyun(1);
  const sonuc: number[] = [];
  for (let i = 0; i < ay; i++) {
    for (const d of [a, b]) {
      d.ayBasi = { ...d.gostergeler };
      // Değişiklik ilk ayın içinde olur (bir karar gibi)
      if (i === 0 && d === b) degistir(b);
      ekonomiAySonu(d, acilVar);
      d.ay += 1;
    }
    sonuc.push(olc(b) - olc(a));
  }
  return sonuc;
}

test("gecikme: harcamanın büyümeye etkisi 2–4 ayda, faizin enflasyona etkisi 3–6 ayda tam görülür", () => {
  const h = fark((d) => butceDegistir(d, "sosyal", 1), (d) => d.gostergeler.buyume!);
  const hTepe = Math.max(...h);
  assert.ok(h[0]! < 0.5 * hTepe, "harcama ilk ayda tam etki göstermemeli");
  assert.ok(h[3]! >= 0.85 * hTepe, `harcama 4. ayda ${h[3]} / ${hTepe}`);
  const f = fark((d) => { d.gostergeler.faiz = 40; }, (d) => d.ekonomi.gercekEnflasyon);
  const fTepe = Math.min(...f);
  const tepeAyi = f.indexOf(fTepe) + 1;
  assert.ok(fTepe < -1, "faiz artışı enflasyonu düşürmeli");
  assert.ok(f[1]! > 0.5 * fTepe, "faiz ikinci ayda tam etki göstermemeli");
  assert.ok(tepeAyi >= 3 && tepeAyi <= 7, `faizin etkisi ${tepeAyi}. ayda tepe yaptı`);
});

test("kur ile enflasyon birbirini besler: kur sıçraması enflasyonu, Merkez Bankası baskısı kuru yükseltir", () => {
  const k = fark((d) => { d.gostergeler.kur = 60; }, (d) => d.ekonomi.gercekEnflasyon, 6);
  assert.ok(k[5]! > 1, `kur şoku enflasyonu ${k[5]} artırdı`);
  const d = yeniOyun(2);
  const kur = d.gostergeler.kur!;
  assert.ok(aracKullan(d, "mb_baski").ok);
  assert.equal(d.gostergeler.faiz, 33);
  assert.ok(d.gostergeler.kur! > kur);
  assert.ok(d.gostergeler.guven! < 50);
  assert.ok(d.sicil.some((x) => x.tur === "baski"));
});

test("Merkez Bankası faizi kendi belirler: baskı sönünce faiz enflasyona göre geri döner", () => {
  const d = yeniOyun(3);
  aracKullan(d, "mb_baski");
  ayGecir(d, 14);
  assert.ok(Math.abs(d.gostergeler.faiz! - (d.gostergeler.enflasyon! + 6 + 0.5 * (d.gostergeler.enflasyon! - 29))) < 3);
  const y = yeniOyun(3);
  y.gostergeler.enflasyon = 40;
  y.ekonomi.gercekEnflasyon = 40;
  ayGecir(y, 6);
  assert.ok(y.gostergeler.faiz! > 40, `enflasyon yükselince faiz ${y.gostergeler.faiz}`);
});

test("kart etkileri: enflasyon aylar içinde, bütçe açığı kalem üzerinden, kur anında değişir", () => {
  for (let t = 1; t < 400; t++) {
    const d = oyunuBaslat(yeniOyun(t), I);
    const m = d.masa.find((x) => x.kart === "faiz_karari");
    if (!m) continue;
    const enf = d.gostergeler.enflasyon!, kur = d.gostergeler.kur!;
    assert.ok(kararVer(d, I, m.ornek, 2).ok);
    assert.equal(d.gostergeler.enflasyon, enf, "enflasyon anında değişmemeli");
    assert.ok(d.ekonomi.katki.enflasyon! > 0);
    assert.ok(d.gostergeler.kur! > kur, "kur anında değişmeli");
    break;
  }
  for (let t = 1; t < 400; t++) {
    const d = oyunuBaslat(yeniOyun(t), I);
    const m = d.masa.find((x) => x.kart === "akkopru_finansman" || x.kart === "okul_yemegi");
    if (!m) continue;
    const kalem = m.kart === "okul_yemegi" ? "egitim" : "yatirim";
    const once = d.ekonomi.gider[kalem]!;
    assert.ok(kararVer(d, I, m.ornek, m.kart === "okul_yemegi" ? 0 : 1).ok);
    assert.ok(d.ekonomi.gider[kalem]! > once, `${kalem} artmalı`);
    assert.ok(yakin(d.gostergeler.butce_acigi!, toplamGider(d) - toplamGelir(d)));
    return;
  }
  assert.fail("bütçe kartı gelmedi");
});

test("araçlar: tahmin uygulamayla aynıdır, durumu değiştirmez; her araç ayda bir kez kullanılır", () => {
  const d = yeniOyun(5);
  const once = JSON.stringify(d);
  const t = aracTahmini(d, "kesinti", "emekli");
  assert.equal(JSON.stringify(d), once);
  const acik = d.gostergeler.butce_acigi!;
  const emekli = d.gostergeler["grup.emekli"]!;
  assert.ok(aracKullan(d, "kesinti", "emekli").ok);
  assert.ok(yakin(d.gostergeler.butce_acigi! - acik, t.find((x) => x.id === "butce_acigi")!.deger, 1e-9));
  assert.ok(yakin(d.gostergeler.butce_acigi!, acik - 5 * ARAC_ORANI, 1e-9));
  assert.equal(d.gostergeler["grup.emekli"], emekli - 4);
  assert.equal(aracKullan(d, "kesinti", "savunma").ok, false);
  assert.equal(aracDenetle(d, "vergi").ok, false, "kalem seçilmeden vergi artırılamaz");
  assert.ok(aracKullan(d, "vergi", "kdv").ok);
  assert.ok(d.ekonomi.katki.enflasyon! > 0, "KDV artışı fiyatlara yansır");
  const rezerv = d.gostergeler.rezerv!, faiz = d.ekonomi.gider.faiz!;
  assert.ok(aracKullan(d, "borclanma").ok);
  assert.equal(d.gostergeler.rezerv, rezerv + 12);
  ayGecir(d, 6);
  assert.ok(d.ekonomi.gider.faiz! > faiz, "borçlanma faiz giderini artırır");
  assert.ok(aracKullan(d, "kesinti", "savunma").ok, "yeni ayda araç yeniden kullanılır");
});

test("harcama kesintisinin bir tabanı vardır", () => {
  const d = yeniOyun(6);
  let n = 0;
  while (aracKullan(d, "kesinti", "savunma").ok) {
    d.ay += 1;
    n++;
    assert.ok(n < 30);
  }
  assert.ok(n >= 8 && d.ekonomi.gider.savunma! >= 1.8 * 0.6);
});

test("söz defteri: tutulan söz bütçeye yazılır; vadesinde tutulmayan söz sicile kırılan söz olarak düşer", () => {
  const d = oyunuBaslat(yeniOyun(7), I);
  const a = sozVer(d, { metin: "Asgari ücrete ara zam", kalem: "sosyal", maliyet: 0.25, vade: 2, grup: "grup.isci", asgari_artis: 10 });
  const b = sozVer(d, { metin: "Emeklilere ek ödeme", kalem: "emekli", maliyet: 0.2, vade: 1, grup: "grup.emekli" });
  const acik = d.gostergeler.butce_acigi!, asgari = d.ekonomi.hane.asgari;
  assert.ok(sozTut(d, a.id).ok);
  assert.ok(yakin(d.gostergeler.butce_acigi!, acik + 0.25));
  assert.ok(yakin(d.ekonomi.hane.asgari, asgari * 1.1));
  assert.equal(sozTut(d, a.id).ok, false);
  const emekli = d.gostergeler["grup.emekli"]!;
  // Vade 1: verildiği ayın ertesi ayının sonuna kadar tutulabilir
  while (d.masa.length) kararVer(d, I, d.masa[0]!.ornek, 1);
  const r1 = ayiBitir(d, I);
  assert.ok(r1.ok);
  if (!r1.ok) return;
  assert.equal(r1.durum.ekonomi.sozler.find((x) => x.id === b.id)!.durum, "bekliyor");
  const d2 = r1.durum;
  while (d2.masa.length) kararVer(d2, I, d2.masa[0]!.ornek, 1);
  const r = ayiBitir(d2, I);
  assert.ok(r.ok);
  if (!r.ok) return;
  const k = r.durum.ekonomi.sozler.find((x) => x.id === b.id)!;
  assert.equal(k.durum, "kirildi");
  assert.ok(r.durum.sicil.some((x) => x.tur === "kirilan_soz" && x.kaynak === "Emeklilere ek ödeme"));
  assert.ok(r.rapor.olaylar.some((o) => o.includes("Emeklilere ek ödeme")));
  assert.ok(r.durum.gostergeler["grup.emekli"]! < emekli + 0.5);
});

test("grev uyarısında verilen ara zam sözü söz defterine yazılır", () => {
  const d = oyunuBaslat(yeniOyun(9), I);
  d.masa = [];
  d.sayac += 1;
  d.masa.push({ ornek: "grev_uyarisi#x", kart: "grev_uyarisi", degisken: {}, agir: false, ikinciGorus: false });
  assert.ok(kararVer(d, I, "grev_uyarisi#x", 0).ok);
  const soz = d.ekonomi.sozler[0];
  assert.ok(soz);
  assert.equal(soz!.durum, "bekliyor");
  assert.equal(soz!.vade, d.ay + 6);
  assert.equal(soz!.grup, "grup.isci");
});

test("sadık istatistik başkanı resmî oranı 3–8 puan düşük açıklar, endeksli ödemeler rahatlar, güven azalır", () => {
  const a = yeniOyun(11), b = yeniOyun(11);
  b.ekonomi.istatistik = "sadik";
  ayGecir(a, 8);
  ayGecir(b, 8);
  const fark = b.ekonomi.gercekEnflasyon - b.gostergeler.enflasyon!;
  assert.ok(fark >= 3 && fark <= 8, `makyaj ${fark}`);
  assert.ok(yakin(a.ekonomi.gercekEnflasyon, a.gostergeler.enflasyon!, 1e-9), "liyakatli başkanla iki oran aynıdır");
  assert.ok(b.ekonomi.gider.emekli! < a.ekonomi.gider.emekli! - 0.1);
  assert.ok(b.gostergeler.guven! < a.gostergeler.guven! - 3);
});

test("kur şoku: güven çok zayıf ve rezerv sıkışıkken başlar, acil kart gelir, güven toparlanınca kapanır", () => {
  const d = oyunuBaslat(yeniOyun(13), I);
  d.gostergeler.guven = 15;
  d.ekonomi.katki.guven = -40;
  d.gostergeler.rezerv = 50;
  assert.ok(ekonomiUyarilari(d).length > 0, "danışman eşiğe yaklaşıldığında uyarır");
  while (d.masa.length) kararVer(d, I, d.masa[0]!.ornek, 1);
  const kur = d.gostergeler.kur!;
  const r = ayiBitir(d, I);
  assert.ok(r.ok);
  if (!r.ok) return;
  const y = r.durum;
  assert.equal(y.ekonomi.krizler[0]?.id, "kur_soku");
  assert.ok(y.gostergeler.kur! / kur > 1.06, `kur ${kur} → ${y.gostergeler.kur}`);
  assert.equal(y.masa[1]?.kart, "kur_soku_1", "acil karar ana karardan hemen sonra gelir");
  assert.ok(r.rapor.olaylar.some((o) => o.includes("sıçradı")));
  // Faiz artırımı seçilir, güven toparlanır
  kararVer(y, I, y.masa[1]!.ornek, 0);
  y.ekonomi.katki.guven = 0;
  y.gostergeler.guven = 40;
  while (y.masa.length) kararVer(y, I, y.masa[0]!.ornek, 1);
  const r2 = ayiBitir(y, I);
  assert.ok(r2.ok);
  if (r2.ok) assert.equal(r2.durum.ekonomi.krizler.length, 0);
});

test("hane bütçesi ve market sepeti: fiyatlar her ay gerçek enflasyonla artar, asgari ücret kararı geliri değiştirir", () => {
  let d = oyunuBaslat(yeniOyun(15), I);
  const h0 = haneButcesi(d);
  assert.equal(h0.gelir, 28000);
  assert.ok(Math.abs(h0.kalan) < 1500, "başlangıçta aile ancak geçiniyor");
  while (d.masa.length) kararVer(d, I, d.masa[0]!.ornek, 1);
  const r = ayiBitir(d, I);
  assert.ok(r.ok);
  if (!r.ok) return;
  d = r.durum;
  assert.ok(haneButcesi(d).mutfak > h0.mutfak);
  // Aralık: asgari ücret ana kararı; %32 seçeneği
  const m = d.masa.find((x) => x.kart === "asgari_ucret")!;
  kararVer(d, I, m.ornek, 1);
  assert.ok(yakin(d.ekonomi.hane.asgari, 28000 * 1.32, 1e-6));
  assert.ok(haneButcesi(d).kalan > 0);
  assert.ok(aylikOran(29) > 0.021 && aylikOran(29) < 0.022);
});

test("tutarlar millî gelirden hesaplanır; bütçe açığı her zaman kalemlerin farkına eşittir", () => {
  for (let t = 1; t <= 10; t++) {
    let d = oyunuBaslat(yeniOyun(t), I);
    assert.ok(yakin(trilyonTL(d, 3.5), 2.24, 1e-9));
    for (let ay = 1; ay < 18; ay++) {
      if (ay % 3 === 0) aracKullan(d, "kesinti", "yatirim");
      if (ay % 4 === 0) aracKullan(d, "vergi", "akaryakit");
      while (d.masa.length) kararVer(d, I, d.masa[0]!.ornek, (ay + t) % 3);
      const r = ayiBitir(d, I);
      assert.ok(r.ok, r.ok ? "" : r.neden);
      if (!r.ok) return;
      d = r.durum;
      assert.ok(yakin(d.gostergeler.butce_acigi!, toplamGider(d) - toplamGelir(d), 1e-9), `t${t} ay${ay}`);
      for (const v of [...Object.values(d.ekonomi.gider), ...Object.values(d.ekonomi.gelir), d.ekonomi.gsyh]) assert.ok(Number.isFinite(v) && v >= 0);
    }
    assert.ok(d.ekonomi.gsyh > 64);
  }
});

test("denge: ihtiyatlı oyunda kur şoku olmaz; her ay Merkez Bankası'na baskı yapan oyunda olur", () => {
  let ihtiyatli = 0, baskici = 0;
  for (let t = 1; t <= 20; t++) {
    for (const baski of [false, true]) {
      let d = oyunuBaslat(yeniOyun(t), I);
      let kriz = false;
      for (let ay = 1; ay < 18; ay++) {
        if (baski) aracKullan(d, "mb_baski");
        while (d.masa.length) {
          const m = d.masa[0]!;
          const k = I.kartlar[m.kart]!;
          // İhtiyatlı: açığı en az büyüten, güveni en az bozan seçenek
          const puan = (i: number) => (k.secenekler[i]!.etki.butce_acigi ?? 0) * 10 - (k.secenekler[i]!.etki.guven ?? 0) + (k.secenekler[i]!.sicil ? 3 : 0);
          kararVer(d, I, m.ornek, baski ? (ay + t) % 3 : [0, 1, 2].sort((a, b) => puan(a) - puan(b))[0]!);
        }
        const r = ayiBitir(d, I);
        if (!r.ok) throw new Error(r.neden);
        d = r.durum;
        if (d.ekonomi.krizler.length) kriz = true;
      }
      if (kriz) baski ? baskici++ : ihtiyatli++;
    }
  }
  assert.equal(ihtiyatli, 0);
  assert.ok(baskici >= 18, `baskıcı oyunlarda kur şoku ${baskici}/20`);
});

test("ekonomi durumu kayıtla birebir geri yüklenir; sürüm 2 kaydı göçle açılır", () => {
  let d = oyunuBaslat(yeniOyun(17), I);
  aracKullan(d, "vergi", "kurumlar");
  sozVer(d, { metin: "Çiftçiye mazot desteği", kalem: "sosyal", maliyet: 0.1, vade: 3 });
  while (d.masa.length) kararVer(d, I, d.masa[0]!.ornek, 0);
  const r = ayiBitir(d, I);
  assert.ok(r.ok);
  if (!r.ok) return;
  d = r.durum;
  const y = yukle(kaydet(d));
  assert.ok(y.ok, y.ok ? "" : y.hata);
  if (y.ok) assert.deepEqual(y.durum, d);

  const eski = JSON.parse(kaydet(yeniOyun(3)));
  eski.surum = 2;
  eski.durum.surum = 2;
  delete eski.durum.ekonomi;
  delete eski.durum.buAy.olaylar;
  eski.durum.gostergeler.butce_acigi = 4.2;
  eski.durum.gostergeler.enflasyon = 31;
  const g = yukle(JSON.stringify(eski));
  assert.ok(g.ok, g.ok ? "" : g.hata);
  if (!g.ok) return;
  assert.equal(g.durum.ekonomi.gercekEnflasyon, 31);
  assert.ok(yakin(toplamGider(g.durum) - toplamGelir(g.durum), 4.2, 1e-9));
  assert.deepEqual(g.durum.buAy.olaylar, []);
});
