import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { ziyaretciKabul, eylemeMudahale, eylemlerAySonu, hayatlarAySonu, ruhHali, ruhSozu, OFKE_ESIGI } from "../../cekirdek/toplum.ts";
import { kosulSaglaniyor } from "../../cekirdek/kosul.ts";
import { politikaDegistir } from "../../cekirdek/politika.ts";
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

test("beş hayat: beş kişi, her ay sahne gelir, bir sahne yalnız bir kez yaşanır", () => {
  assert.equal(I.hayatlar.length, 5);
  let d = oyunuBaslat(yeniOyun(1), I);
  const goruldu = new Set<string>();
  let toplam = 0;
  for (let ay = 1; ay < 18; ay++) {
    d = ayiOyna(d, ay % 3);
    const h = d.gecmis.at(-1)!.hayatlar;
    assert.ok(h.length <= 2);
    assert.equal(new Set(h.map((x) => x.kim)).size, h.length, "aynı kişi aynı ay iki kez");
    for (const x of h) {
      assert.ok(!goruldu.has(x.metin), `tekrar eden sahne: ${x.metin}`);
      goruldu.add(x.metin);
    }
    toplam += h.length;
  }
  assert.ok(toplam >= 17, `${toplam} sahne`);
  const r = ruhHali(d, I.hayatlar[0]!);
  assert.ok(r >= 0 && r <= 100);
  assert.ok(["umutlu", "idare ediyor", "bunalmış", "öfkeli"].includes(ruhSozu(r)));
});

test("ülkeden ayrılan kişinin sahnesi bir daha gelmez", () => {
  const d = oyunuBaslat(yeniOyun(2), I);
  d.ay = 8;
  d.gostergeler["grup.genc"] = 20;
  for (let i = 0; i < 30 && !d.toplum.hayatlar.ece?.ayrildi; i++) hayatlarAySonu(d, I);
  assert.ok(d.toplum.hayatlar.ece?.ayrildi, "Ece ayrılmadı");
  const once = d.toplum.hayatlar.ece!.son.length;
  for (let i = 0; i < 10; i++) hayatlarAySonu(d, I);
  assert.equal(d.toplum.hayatlar.ece!.son.length, once);
});

test("koşullarda politika kademesi kullanılabilir", () => {
  const d = oyunuBaslat(yeniOyun(3), I);
  const k = { politika: { pazar_tatil: { en_az: 1 } } };
  assert.equal(kosulSaglaniyor(d, k, I), false);
  assert.ok(politikaDegistir(d, I, "pazar_tatil", 1).ok);
  assert.equal(kosulSaglaniyor(d, k, I), true);
});

test("gazeteler: ayın kararından üç manşet kurulur", () => {
  let d = oyunuBaslat(yeniOyun(4), I);
  d = ayiOyna(d);
  const g = d.toplum.gazete!;
  assert.ok(g);
  assert.equal(g.ay, 1);
  assert.equal(g.mansetler.length, 3);
  assert.ok(d.gecmis[0]!.kararlar.some((k) => k.baslik === g.olay));
});

test("kapıda bekleyenler: her ay üç ziyaretçi; kabul bir gün alır, kabul edilmeyen küser", () => {
  let d = oyunuBaslat(yeniOyun(5), I);
  assert.equal(d.toplum.kapi.length, 3);
  const [a, b] = d.toplum.kapi;
  const gun = d.bosGun;
  assert.ok(ziyaretciKabul(d, I, a!.id).ok);
  assert.equal(d.bosGun, gun - 1);
  assert.equal(ziyaretciKabul(d, I, a!.id).ok, false);
  d.bosGun = 0;
  assert.equal(ziyaretciKabul(d, I, b!.id).ok, false, "boş gün yokken kabul edilmez");
  d = ayiOyna(d);
  assert.equal(d.toplum.kapi.length, 3, "yeni ayda yeni ziyaretçiler");
  assert.ok(d.toplum.kapi.every((k) => k.durum === "bekliyor"));
});

test("sokak: öfkeli grup eylem başlatır; dinlemek küçültür, karşılamak bitirir, polis sicile düşer", () => {
  const d = oyunuBaslat(yeniOyun(6), I);
  d.gostergeler["grup.isci"] = OFKE_ESIGI - 8;
  d.gostergeler["grup.genc"] = OFKE_ESIGI - 8;
  for (let i = 0; i < 10 && d.toplum.eylemler.length < 2; i++) eylemlerAySonu(d, I);
  assert.ok(d.toplum.eylemler.length >= 2, "eylem başlamadı");
  const [e1, e2] = d.toplum.eylemler;
  assert.ok(e1!.duzenleyici > e1!.emniyet, "düzenleyiciler daha kalabalık söyler");
  const isci = d.gostergeler[e1!.grup]!;
  assert.ok(eylemeMudahale(d, I, e1!.id, "dinle").ok);
  assert.ok(d.gostergeler[e1!.grup]! > isci);
  assert.equal(eylemeMudahale(d, I, e1!.id, "dinle").ok, false);
  const acik = d.gostergeler.butce_acigi!;
  assert.ok(eylemeMudahale(d, I, e1!.id, "karsila").ok);
  assert.ok(d.gostergeler.butce_acigi! > acik);
  assert.ok(!d.toplum.eylemler.some((e) => e.id === e1!.id));
  const sicil = d.sicil.length;
  assert.ok(eylemeMudahale(d, I, e2!.id, "polis").ok);
  assert.equal(d.sicil.length, sicil + 1);
  assert.equal(d.sicil.at(-1)!.tur, "baski");
  assert.match(d.sicil.at(-1)!.kaynak, /yaralı/);
});

test("görmezden gelinen eylem büyür ve en geç üç ayda biter", () => {
  const d = oyunuBaslat(yeniOyun(7), I);
  d.gostergeler["grup.emekli"] = 15;
  for (let i = 0; i < 10 && !d.toplum.eylemler.length; i++) eylemlerAySonu(d, I);
  const e = d.toplum.eylemler[0]!;
  const ilk = e.emniyet;
  d.ay += 1;
  eylemlerAySonu(d, I);
  const sonra = d.toplum.eylemler.find((x) => x.id === e.id);
  assert.ok(sonra && sonra.emniyet > ilk, "eylem büyümedi");
  d.ay += 3;
  eylemlerAySonu(d, I);
  assert.ok(!d.toplum.eylemler.some((x) => x.id === e.id));
});

test("toplum durumu kayıtla geri yüklenir; sürüm 4 kaydı göçle açılır", () => {
  let d = oyunuBaslat(yeniOyun(8), I);
  d = ayiOyna(d);
  ziyaretciKabul(d, I, d.toplum.kapi[0]!.id);
  const y = yukle(kaydet(d));
  assert.ok(y.ok, y.ok ? "" : y.hata);
  if (y.ok) assert.deepEqual(y.durum, d);
  const eski = JSON.parse(kaydet(yeniOyun(3)));
  eski.surum = 4;
  eski.durum.surum = 4;
  delete eski.durum.toplum;
  delete eski.durum.buAy.hayatlar;
  const g = yukle(JSON.stringify(eski));
  assert.ok(g.ok, g.ok ? "" : g.hata);
  if (g.ok) assert.deepEqual(g.durum.toplum.eylemler, []);
});
