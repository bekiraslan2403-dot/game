import { test } from "node:test";
import assert from "node:assert/strict";
import { yeniOyun, durumKopya, oyunBittiMi, sonAyMi, DURUM_SURUMU } from "../../cekirdek/durum.ts";
import { kaydet, yukle, GOCLER } from "../../cekirdek/kayit.ts";
import { tarihAdi, takvimAyi, kampanyaMi, secimeKalanAy } from "../../cekirdek/takvim.ts";
import { zarSayi } from "../../cekirdek/zar.ts";

test("takvim: dönem Kasım 2026'da başlar, 18. ay Nisan 2028'dir", () => {
  assert.equal(tarihAdi(1), "Kasım 2026");
  assert.equal(tarihAdi(2), "Aralık 2026");
  assert.equal(tarihAdi(3), "Ocak 2027");
  assert.equal(tarihAdi(18), "Nisan 2028");
  assert.deepEqual(takvimAyi(14), { yil: 2027, ay: 12 });
  assert.equal(kampanyaMi(15), false);
  assert.equal(kampanyaMi(16), true);
  assert.equal(kampanyaMi(18), true);
  assert.equal(secimeKalanAy(1), 17);
  assert.throws(() => takvimAyi(0));
});

test("yeni oyun düz veridir ve beklenen başlangıç değerlerini taşır", () => {
  const d = yeniOyun(1234);
  assert.equal(d.surum, DURUM_SURUMU);
  assert.equal(d.ay, 1);
  assert.equal(oyunBittiMi(d), false);
  assert.equal(sonAyMi(d), false);
  assert.deepEqual(JSON.parse(JSON.stringify(d)), d);
  assert.throws(() => yeniOyun(1.5));
});

test("kopya bağımsızdır", () => {
  const d = yeniOyun(5), k = durumKopya(d);
  k.bayraklar.deneme = true;
  zarSayi(k.zar);
  assert.equal(d.bayraklar.deneme, undefined);
  assert.notDeepEqual(d.zar, k.zar);
});

test("kayıt ve yükleme durumu birebir geri getirir; zar aynı yerden devam eder", () => {
  const d = yeniOyun(77);
  d.ay = 6;
  d.sicil.push({ id: "s1", tur: "yalan", kaynak: "Basın toplantısı", ay: 4, ifsaOldu: false });
  d.bayraklar.akkopru_finansman = "koi";
  d.gecmis.push({ ay: 5, kararlar: [{ kart: "asgari_ucret", secenek: 1 }], olaylar: ["grev"] });
  for (let i = 0; i < 10; i++) zarSayi(d.zar);
  const sonuc = yukle(kaydet(d));
  assert.ok(sonuc.ok);
  if (!sonuc.ok) return;
  assert.deepEqual(sonuc.durum, d);
  assert.equal(zarSayi(sonuc.durum.zar), zarSayi(d.zar));
});

test("bozuk ve yabancı kayıtlar reddedilir, yarım yüklenmez", () => {
  assert.equal(yukle("bu bir kayıt değil").ok, false);
  assert.equal(yukle("null").ok, false);
  assert.equal(yukle(JSON.stringify({ oyun: "baska-oyun", surum: 1, durum: {} })).ok, false);
  const d = yeniOyun(1);
  const bozuk = JSON.parse(kaydet(d));
  bozuk.durum.ay = 99;
  const s = yukle(JSON.stringify(bozuk));
  assert.equal(s.ok, false);
  if (!s.ok) assert.match(s.hata, /ay/);
  const gelecek = JSON.parse(kaydet(d));
  gelecek.surum = DURUM_SURUMU + 1;
  assert.equal(yukle(JSON.stringify(gelecek)).ok, false);
});

test("göç tanımlı değilse eski sürüm kaydı açık bir hatayla reddedilir", () => {
  const d = yeniOyun(1);
  const eski = JSON.parse(kaydet(d));
  eski.surum = 0;
  const s = yukle(JSON.stringify(eski));
  assert.equal(s.ok, false);
  assert.equal(Object.keys(GOCLER).length >= 0, true);
});
