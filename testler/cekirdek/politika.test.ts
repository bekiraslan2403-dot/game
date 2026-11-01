import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { toplamGider, toplamGelir } from "../../cekirdek/ekonomi.ts";
import { IMZA_HAKKI, politikaDegistir, politikaTahmini, seviye, meclisDestegi, teklifiGeriCek, vatandasSesi } from "../../cekirdek/politika.ts";
import { gercekDestek, anketOrtalamasi, sonAnketler, anketSeyri, ANKET_SIRKETLERI } from "../../cekirdek/kamuoyu.ts";
import { GRUP_KIMLIKLERI } from "../../cekirdek/gostergeler.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const s = icerikDerle(join(dirname(fileURLToPath(import.meta.url)), "../../icerik"));
if (!s.paket) throw new Error(s.hatalar.join("\n"));
const I: IcerikPaketi = s.paket;

function ayiOyna(d: OyunDurumu, sec = 1): OyunDurumu {
  while (d.masa.length) kararVer(d, I, d.masa[0]!.ornek, sec);
  const r = ayiBitir(d, I);
  assert.ok(r.ok, r.ok ? "" : r.neden);
  return r.ok ? r.durum : d;
}

const yakin = (a: number, b: number, t = 1e-9) => Math.abs(a - b) <= t;

test("politika dosyası en az 35 ayar içerir; her ayarın başlangıç kademesi geçerlidir", () => {
  const p = Object.values(I.politikalar);
  assert.ok(p.length >= 35, `${p.length} ayar`);
  for (const x of p) assert.ok(x.baslangic < x.kademeler.length, x.id);
  assert.ok(p.some((x) => x.yol === "kanun") && p.some((x) => x.yol === "kararname"));
});

test("kararname hemen yürürlüğe girer: tahminle aynı etki, bütçe kalemi değişir, imza azalır", () => {
  const d = oyunuBaslat(yeniOyun(1), I);
  const p = I.politikalar.memur_maas!;
  const t = politikaTahmini(d, p, 3);
  const memur = d.gostergeler["grup.memur"]!, personel = d.ekonomi.gider.personel!;
  const r = politikaDegistir(d, I, "memur_maas", 3);
  assert.ok(r.ok);
  assert.equal(seviye(d, p), 3);
  assert.equal(d.imza, 1);
  assert.ok(yakin(d.gostergeler["grup.memur"]! - memur, t.find((x) => x.id === "grup.memur")!.deger));
  assert.ok(yakin(d.ekonomi.gider.personel! - personel, 0.25));
  assert.ok(yakin(d.gostergeler.butce_acigi!, toplamGider(d) - toplamGelir(d)));
  assert.ok(d.ekonomi.katki.enflasyon! > 0, "zam enflasyonu aylar içinde etkiler");
  // Aşağı inmek etkiyi tersine çevirir
  assert.ok(politikaDegistir(d, I, "memur_maas", 2).ok);
  assert.ok(yakin(d.gostergeler["grup.memur"]!, memur, 1e-9));
  assert.ok(yakin(d.ekonomi.gider.personel!, personel, 1e-9));
  assert.ok(vatandasSesi(d, p, true).length > 5);
});

test("imza hakkı ayda üçtür ve yeni ayda yenilenir; geçersiz değişiklikler reddedilir", () => {
  let d = oyunuBaslat(yeniOyun(2), I);
  assert.equal(politikaDegistir(d, I, "yok_boyle", 1).ok, false);
  assert.equal(politikaDegistir(d, I, "plastik", 0).ok, false, "aynı kademe");
  assert.equal(politikaDegistir(d, I, "plastik", 9).ok, false, "olmayan kademe");
  for (const id of ["plastik", "agac", "hiz_sinir"]) assert.ok(politikaDegistir(d, I, id, 2).ok, id);
  assert.equal(d.imza, IMZA_HAKKI);
  const r = politikaDegistir(d, I, "emisyon", 1);
  assert.equal(r.ok, false);
  d = ayiOyna(d);
  assert.equal(d.imza, 0);
  assert.ok(politikaDegistir(d, I, "emisyon", 1).ok);
});

test("kanun teklifi ay sonunda Meclis'te oylanır; geçerse uygulanır, geçmezse parti içi huzursuzluk artar", () => {
  let gecti = 0, kaldi = 0;
  for (let t = 1; t <= 40; t++) {
    let d = oyunuBaslat(yeniOyun(t), I);
    const kiraci = d.gostergeler["grup.kiraci"]!;
    assert.ok(politikaDegistir(d, I, "kira_siniri", 3).ok);
    assert.equal(seviye(d, I.politikalar.kira_siniri!), 2, "kanun hemen yürürlüğe girmez");
    assert.equal(politikaDegistir(d, I, "kira_siniri", 4).ok, false, "bekleyen teklif varken yeni teklif verilmez");
    const parti = d.gostergeler.parti_ici!;
    d = ayiOyna(d);
    assert.equal(d.meclisGundemi.length, 0);
    const son = d.gecmis.at(-1)!;
    if (seviye(d, I.politikalar.kira_siniri!) === 3) {
      gecti++;
      assert.ok(son.olaylar.some((o) => o.startsWith("Meclis kabul etti")));
      assert.ok(d.gostergeler["grup.kiraci"]! > kiraci - 3);
    } else {
      kaldi++;
      assert.ok(son.olaylar.some((o) => o.startsWith("Meclis reddetti")));
      assert.ok(d.gostergeler.parti_ici! >= parti);
    }
  }
  assert.ok(gecti > 10 && kaldi > 3, `geçti ${gecti}, kaldı ${kaldi}`);
});

test("Meclis desteği parti içi huzursuzluk ve temel hak kısıtlamasıyla düşer; teklif geri çekilebilir", () => {
  const d = oyunuBaslat(yeniOyun(3), I);
  const once = meclisDestegi(d);
  assert.ok(meclisDestegi(d, I.politikalar.medya_denetim) < once);
  d.gostergeler.parti_ici = 70;
  assert.ok(meclisDestegi(d) < once);
  assert.ok(politikaDegistir(d, I, "yargi_reformu", 3).ok);
  assert.ok(teklifiGeriCek(d, "yargi_reformu").ok);
  assert.equal(d.meclisGundemi.length, 0);
  assert.equal(teklifiGeriCek(d, "yargi_reformu").ok, false);
});

test("anketler: başlangıçta üç şirket var; aylık açıklanır, Saha Kamuoyu iki ayda bir", () => {
  let d = oyunuBaslat(yeniOyun(4), I);
  assert.equal(sonAnketler(d).length, 3);
  const g = gercekDestek(d);
  assert.ok(g > 44 && g < 50, `gerçek destek ${g}`);
  const ort = anketOrtalamasi(d)!;
  assert.ok(Math.abs(ort - g - (2.5 - 1.5 + 0) / 3) < 0.2);
  d = ayiOyna(d);
  d = ayiOyna(d);
  const ay1 = d.anketler.filter((a) => a.ay === 1).map((a) => a.sirket).sort();
  const ay2 = d.anketler.filter((a) => a.ay === 2).map((a) => a.sirket).sort();
  assert.deepEqual(ay1, ["merkez", "panorama", "saha"]);
  assert.deepEqual(ay2, ["merkez", "panorama"]);
  assert.equal(anketSeyri(d).length, 3);
  // Eğilimler ortalamada görünür: Merkez Araştırma Panorama'dan cömerttir
  let m = 0, p = 0;
  for (let t = 1; t <= 20; t++) {
    let x = oyunuBaslat(yeniOyun(t), I);
    x = ayiOyna(x);
    m += x.anketler.find((a) => a.ay === 1 && a.sirket === "merkez")!.oran;
    p += x.anketler.find((a) => a.ay === 1 && a.sirket === "panorama")!.oran;
  }
  assert.ok(m / 20 - p / 20 > 2.5, `fark ${(m - p) / 20}`);
  assert.equal(ANKET_SIRKETLERI.length, 3);
});

test("hayat pahalılığı grupları aşındırır: hissedilen enflasyon yükselince emekliler ve işçiler kaybeder", () => {
  const a = oyunuBaslat(yeniOyun(5), I), b = oyunuBaslat(yeniOyun(5), I);
  b.ekonomi.katki.enflasyon = 25;
  b.ekonomi.gercekEnflasyon = 45;
  let x = a, y = b;
  for (let i = 0; i < 6; i++) {
    x = ayiOyna(x, 2);
    y = ayiOyna(y, 2);
  }
  assert.ok(y.gostergeler["grup.emekli"]! < x.gostergeler["grup.emekli"]! - 1.5);
  assert.ok(y.gostergeler["grup.isci"]! < x.gostergeler["grup.isci"]! - 1.5);
  assert.ok(gercekDestek(y) < gercekDestek(x));
  assert.ok(y.gostergeler.huzur! < x.gostergeler.huzur!);
  for (const id of GRUP_KIMLIKLERI) assert.ok(Number.isFinite(y.gostergeler[id]!));
});

test("politika, Meclis gündemi ve anketler kayıtla geri yüklenir; sürüm 3 kaydı göçle açılır", () => {
  const d = oyunuBaslat(yeniOyun(6), I);
  politikaDegistir(d, I, "okul_yemek", 2);
  politikaDegistir(d, I, "bedelli", 1);
  const y = yukle(kaydet(d));
  assert.ok(y.ok, y.ok ? "" : y.hata);
  if (y.ok) assert.deepEqual(y.durum, d);
  const eski = JSON.parse(kaydet(yeniOyun(3)));
  eski.surum = 3;
  eski.durum.surum = 3;
  for (const k of ["politika", "imza", "meclisGundemi", "anketler"]) delete eski.durum[k];
  delete eski.durum.gostergeler.huzur;
  const g = yukle(JSON.stringify(eski));
  assert.ok(g.ok, g.ok ? "" : g.hata);
  if (!g.ok) return;
  assert.equal(g.durum.gostergeler.huzur, 55);
  assert.equal(g.durum.anketler.length, 3);
  assert.deepEqual(g.durum.politika, {});
});
