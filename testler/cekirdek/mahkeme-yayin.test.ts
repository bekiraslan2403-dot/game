import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ayiAc, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { halkTvArsivNotu, medyaMudahale } from "../../cekirdek/medya.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { yeniOyun, type OyunDurumu } from "../../cekirdek/durum.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const I = JSON.parse(readFileSync(new URL("../../uretilen/icerik.json", import.meta.url), "utf8")) as IcerikPaketi;
const ilk = "anayasa_mahkemesi_uyari";
const devam = ["mahkeme_yayin_kopya", "mahkeme_yayin_ayna", "mahkeme_yayin_tutanak"];
const durumlar = [
  ["duzeltildi", "emanet", "altyazi_acik"],
  ["tedbir", "emanet", "kapali"],
  ["duzeltildi", "emanet", "kapali"],
];

function tekrarAc(d: OyunDurumu) {
  const y = yukle(kaydet(d));
  assert.ok(y.ok);
  return y.durum;
}

function ilkAy() {
  const d = yeniOyun(401);
  d.ay = 3;
  ayiAc(d, I);
  d.masa = d.masa.filter(m => m.kart === ilk);
  assert.equal(d.masa.length, 1);
  return d;
}

test("mahkeme uyarısı üç ayrı takip ve dokuz kaydedilebilir sonuç üretir", () => {
  for (const [yol, takip] of devam.entries()) {
    const d = ilkAy();
    assert.ok(kararVer(d, I, d.masa[0]!.ornek, yol).ok);
    assert.ok(halkTvArsivNotu(d));
    assert.equal(d.bekleyen.filter(b => devam.includes(b.kart)).length, 1);
    const kapanis = ayiBitir(tekrarAc(d), I);
    assert.ok(kapanis.ok);
    const m = kapanis.durum.masa.find(m => m.kart === takip);
    assert.ok(m);
    for (let yanit = 0; yanit < 3; yanit++) {
      const x: OyunDurumu = structuredClone(kapanis.durum);
      const r = kararVer(x, I, m.ornek, yanit);
      assert.ok(r.ok);
      assert.ok(r.tepkiler?.length);
      assert.equal(tekrarAc(x).bayraklar.mahkeme_yayin_durumu, durumlar[yol]![yanit]);
      assert.equal(x.sicil.filter(s => s.tur === "baski").length, (yol === 1 ? 1 : 0) + (yanit === 2 ? 1 : 0));
    }
  }
});

test("yeniden açılan arşivin tedbiri yalnız aynı ay ve Halk TV için işler", () => {
  const d = ilkAy();
  assert.ok(kararVer(d, I, d.masa[0]!.ornek, 1).ok);
  const kapanis = ayiBitir(d, I);
  assert.ok(kapanis.ok);
  const m = kapanis.durum.masa.find(m => m.kart === devam[1])!;
  assert.ok(kararVer(kapanis.durum, I, m.ornek, 0).ok);
  const x = tekrarAc(kapanis.durum);
  const once = structuredClone(x);
  assert.deepEqual(medyaMudahale(x, I, "halk_tv", "engel"), { ok: false, neden: "Mahkeme bu ay Halk TV için yeni genel erişim engelini durdurdu." });
  assert.deepEqual(x, once);
  assert.ok(medyaMudahale(x, I, "merkez_tv", "engel").ok);
  x.ay++;
  ayiAc(x, I);
  assert.ok(medyaMudahale(x, I, "halk_tv", "engel").ok);
});

test("eski kayıtların bitmiş uyarısı yeni takip veya tedbir yaratmaz", () => {
  const d = ilkAy();
  d.masa = [];
  d.ay = 4;
  ayiAc(d, I);
  const x = tekrarAc(d);
  assert.equal(halkTvArsivNotu(x), undefined);
  assert.ok(!x.masa.some(m => devam.includes(m.kart)));
  assert.ok(medyaMudahale(x, I, "halk_tv", "engel").ok);
});
