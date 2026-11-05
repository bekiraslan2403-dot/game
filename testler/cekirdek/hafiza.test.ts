import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, durumKopya, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiAc } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { kopruAcik, hafizaSatirlari } from "../../cekirdek/hafiza.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { sahneCevaplari } from "../../cekirdek/sahne-derinlik.ts";

const I = icerikDerle(fileURLToPath(new URL("../../icerik", import.meta.url))).paket!;
function tek(d: OyunDurumu, kart: string) {
  const ornek = `${kart}#${++d.sayac}`;
  d.masa = [{ kart, ornek, degisken: {}, agir: false, ikinciGorus: false }];
  return ornek;
}
function basla() {
  const d = oyunuBaslat(yeniOyun(8124), I);
  const sonuc = kararVer(d, I, tek(d, "akkopru_tazminat"), 0);
  assert.ok(sonuc.ok, sonuc.ok ? "" : sonuc.neden);
  assert.equal(d.bekleyen.filter(b => b.kart === "akkopru_gecim").length, 1);
  return d;
}

test("yerel geçim şantiyenin bir kez açtığı gerçek takip dosyasıdır", () => {
  const d = basla();
  d.ay = 2; ayiAc(d, I);
  assert.equal(d.masa.filter(m => m.kart === "akkopru_gecim").length, 1);
  const m = d.masa.find(m => m.kart === "akkopru_gecim")!;
  assert.ok(kararVer(d, I, m.ornek, 1).ok);
  assert.equal(d.bayraklar.akkopru_gecim_yolu, "basvuru");
  assert.equal(d.bayraklar.akkopru_gecim_sonuc, undefined);
  assert.ok(hafizaSatirlari(d).some(s => s.includes("ödeme ayrıca")));
  const onarim = d.masa.find(m => m.kart === "akkopru_onarim");
  if (onarim) assert.ok(kararVer(d, I, onarim.ornek, 0).ok);
  d.ay = 3; ayiAc(d, I);
  assert.ok(d.masa.some(m => m.kart === "akkopru_gecim_basvuru"));
  const once = d.ekonomi.sozler.length;
  assert.ok(kararVer(d, I, d.masa.find(m => m.kart === "akkopru_gecim_basvuru")!.ornek, 0).ok);
  assert.equal(d.bayraklar.akkopru_gecim_sonuc, "odeme");
  assert.equal(d.ekonomi.sozler.length, once + 1);
  assert.ok(hafizaSatirlari(d).some(s => s.includes("geçici ödeme")));
  const y = yukle(kaydet(d)); assert.ok(y.ok, y.ok ? "" : y.hata);
  if (y.ok) assert.deepEqual(hafizaSatirlari(y.durum), hafizaSatirlari(d));
});

test("ilk sevkiyatın uzatılması yol açıldığında reddedilir ve zarı harcamaz", () => {
  const d = basla(); d.ay = 2; ayiAc(d, I);
  assert.ok(kararVer(d, I, d.masa.find(m => m.kart === "akkopru_gecim")!.ornek, 0).ok);
  d.ay = 3; ayiAc(d, I);
  const ornek = d.masa.find(m => m.kart === "akkopru_gecim_servis")!.ornek;
  d.santiye!.asama = "kabul"; d.santiye!.teknik = "uygun"; d.santiye!.numune = true; d.santiye!.yuklenici = "yeni";
  d.bayraklar.akkopru_sonuc = "acik";
  const once = durumKopya(d);
  assert.equal(kararVer(d, I, ornek, 0).ok, false);
  assert.deepEqual(d, once);
  assert.ok(kararVer(d, I, ornek, 1).ok);
  assert.equal(d.bayraklar.akkopru_gecim_sonuc, "servis");
});

test("bekleyen yüklenici zararı otomatik ödeme değildir; ikinci karar seçilir", () => {
  const d = basla(); d.ay = 2; ayiAc(d, I);
  const once = d.ekonomi.sozler.length;
  assert.ok(kararVer(d, I, d.masa.find(m => m.kart === "akkopru_gecim")!.ornek, 2).ok);
  assert.equal(d.ekonomi.sozler.length, once);
  d.ay = 3; ayiAc(d, I);
  assert.ok(kararVer(d, I, d.masa.find(m => m.kart === "akkopru_gecim_bekle")!.ornek, 2).ok);
  assert.equal(d.ekonomi.sozler.length, once);
  assert.ok(hafizaSatirlari(d).some(s => s.includes("gideri ayrılmadı")));
});

test("kampanya görüntüsü gerçek teknik kabul yokken başarı üretmez; eski kayıt olduğu gibi kalır", () => {
  const d = basla(); d.ay = 16; d.bayraklar.akkopru_oynandi = true; d.bayraklar.akkopru_ham_veri = false;
  const e = durumKopya(d);
  e.santiye!.asama = "kabul"; e.santiye!.teknik = "uygun"; e.santiye!.numune = true; e.santiye!.yuklenici = "yeni";
  e.bayraklar.akkopru_sonuc = "acik";
  assert.equal(kopruAcik(d), false); assert.equal(kopruAcik(e), true);
  const a = tek(d, "akkopru_kampanya"), b = tek(e, "akkopru_kampanya");
  const once = d.yonetim.secim.etki, onceAcik = e.yonetim.secim.etki;
  assert.ok(kararVer(d, I, a, 1).ok); assert.ok(kararVer(e, I, b, 1).ok);
  assert.ok(e.yonetim.secim.etki - onceAcik > d.yonetim.secim.etki - once);
  assert.ok(d.buAy.olaylar.some(x => x.includes("Kapalı yol görüntüsü")));
  assert.ok(!d.buAy.olaylar.some(x => x.includes("Tamamlanan iş görüntüleri")));
  assert.equal(d.bekleyen.filter(x => x.kart === "akkopru_kampanya_yanit").length, 1);
  d.ay = 17; ayiAc(d, I);
  const m = d.masa.find(x => x.kart === "akkopru_kampanya_yanit")!;
  assert.ok(m);
  assert.ok(kararVer(d, I, m.ornek, 0).ok);
  assert.ok(d.buAy.olaylar.some(x => x.includes("eksik ölçüm serisi")));
  assert.equal(d.bayraklar.akkopru_kampanya_yaniti, "kayit");
  assert.equal(sahneCevaplari(d, "munazara", 2).length, 3);
});
