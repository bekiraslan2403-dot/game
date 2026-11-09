import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ayiAc, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { ekonomiAySonu } from "../../cekirdek/ekonomi.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const I = JSON.parse(readFileSync(new URL("../../uretilen/icerik.json", import.meta.url), "utf8")) as IcerikPaketi;
const kartlar = ["istatistik_bos_tepsi", "istatistik_iki_zarf", "istatistik_tarti_fisi"];

function kur(ay = 2) {
  const d = yeniOyun(726);
  d.ay = ay;
  ayiAc(d, I);
  d.masa = [{ kart: "istatistik_baskani", ornek: `istatistik_baskani#${++d.sayac}`, degisken: {}, agir: false, ikinciGorus: false }];
  return d;
}

function takip(yol: number) {
  const d = kur();
  assert.ok(kararVer(d, I, d.masa[0]!.ornek, yol).ok);
  assert.equal(d.bekleyen.filter(b => kartlar.includes(b.kart)).length, 1);
  const y = yukle(kaydet(d));
  assert.ok(y.ok);
  const kapanis = ayiBitir(y.durum, I);
  assert.ok(kapanis.ok);
  const m = kapanis.durum.masa.find(m => m.kart === kartlar[yol]);
  assert.ok(m);
  return { d: kapanis.durum, ornek: m.ornek };
}

test("üç atama yolu ayrı takip açar; saha ve evrak ödenekleri gerçek ve tek seferliktir", () => {
  for (const yol of [0, 2]) {
    const { d, ornek } = takip(yol);
    const parasiz = structuredClone(d);
    parasiz.bosGun = 0;
    const once = structuredClone(parasiz);
    assert.equal(kararVer(parasiz, I, ornek, 0).ok, false);
    assert.deepEqual(parasiz, once);
    const bekle = structuredClone(d);
    assert.ok(kararVer(bekle, I, ornek, 1).ok);
    assert.ok(kararVer(d, I, ornek, 0).ok);
    assert.equal(d.bosGun, bekle.bosGun - 1);
    assert.ok(d.ekonomi.gider.personel! > bekle.ekonomi.gider.personel!);
    assert.equal(d.ekonomi.sozler.at(-1)?.durum, "tutuldu");
    assert.ok(d.yonetim.uygulamalar.some(u => u.tekSeferlik && u.kalem === "personel"));
  }
});

test("tek bülten, yetki devri ve kapatma sonraki ayın hesabında ayrışır", () => {
  const { d: kaynak, ornek } = takip(1);
  assert.ok(kaynak.ekonomi.makyaj > 0);
  const [tek, devir, kapali] = [0, 1, 2].map(secim => {
    const d = structuredClone(kaynak);
    assert.ok(kararVer(d, I, ornek, secim).ok);
    const y = yukle(kaydet(d));
    assert.ok(y.ok);
    return y.durum;
  }) as [typeof kaynak, typeof kaynak, typeof kaynak];
  const aySonu = ekonomiAySonu(tek, () => false);
  ekonomiAySonu(devir, () => false);
  ekonomiAySonu(kapali, () => false);
  assert.equal(tek.gostergeler.enflasyon, tek.ekonomi.gercekEnflasyon);
  assert.equal(tek.bayraklar.istatistik_tek_bulten_duzelt, undefined);
  assert.equal(tek.ekonomi.istatistik, "sadik");
  assert.ok(tek.ekonomi.makyaj > 0, "tek bülten kurum içindeki baskıyı sıfırlamaz");
  assert.ok(aySonu.olaylar.some(o => o.includes("teknik seriyi yayımladı")));
  assert.ok(tek.ekonomi.gider.emekli! > kapali.ekonomi.gider.emekli!);
  assert.ok(tek.ekonomi.gider.personel! > kapali.ekonomi.gider.personel!);
  assert.ok(kapali.sicil.some(s => s.kaynak.includes("teknik enflasyon serisinin")));
  ekonomiAySonu(tek, () => false);
  ekonomiAySonu(devir, () => false);
  assert.ok(tek.ekonomi.makyaj > 0);
  assert.equal(devir.ekonomi.makyaj, 0);
});

test("eski kayıttan seçim ayına ertelenen başkanlık dosyası aynı ay tamamlanabilir", () => {
  const d = kur(18);
  assert.ok(kararVer(d, I, d.masa[0]!.ornek, 1).ok);
  assert.equal(d.masa[0]?.kart, "istatistik_iki_zarf");
  assert.ok(!d.bekleyen.some(b => kartlar.includes(b.kart)));
  assert.ok(kararVer(d, I, d.masa[0]!.ornek, 0).ok);
  const kapanis = ayiBitir(d, I);
  assert.ok(kapanis.ok);
  assert.ok(kapanis.rapor.olaylar.some(o => o.includes("teknik seriyi yayımladı")));
});
