import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, durumKopya, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiAc } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { belediyeDurumu } from "../../cekirdek/belediye.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { sonsoz } from "../../cekirdek/secim.ts";

const I = icerikDerle(fileURLToPath(new URL("../../icerik", import.meta.url))).paket!;
const il = "Turunçlu";
function kur() {
  const d = oyunuBaslat(yeniOyun(672), I);
  d.masa = [{ ornek: `belediye_maas_1#${++d.sayac}`, kart: "belediye_maas_1", degisken: { il }, agir: false, ikinciGorus: false }];
  return d;
}
function sec(d: OyunDurumu, id: string, yanit: number) {
  const m = d.masa.find(m => m.kart === id);
  assert.ok(m, `${id} masada bulunamadı`);
  const r = kararVer(d, I, m.ornek, yanit);
  assert.ok(r.ok, r.ok ? "" : r.neden);
}
function ay(d: OyunDurumu, n: number) { d.ay = n; ayiAc(d, I); }

test("üç ilk yanıt ve üç ikinci yanıt üç ayrı son dosyaya gider; şehir değişmez", () => {
  const ilk = ["belediye_maas_2a", "belediye_maas_2b", "belediye_maas_2c"];
  const son = ["belediye_maas_hizmet", "belediye_maas_hesap", "belediye_maas_3"];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const d = kur(); sec(d, "belediye_maas_1", a);
    assert.equal(d.bayraklar.belediye_il, il);
    ay(d, 2); assert.equal(d.masa.find(m => m.kart === ilk[a])?.degisken.il, il);
    sec(d, ilk[a]!, b); assert.equal(d.bayraklar.belediye_ikinci_yol, ["odeme", "hesap", "muda"][b]);
    ay(d, 3); assert.equal(d.masa.find(m => m.kart === son[b])?.degisken.il, il);
    const n = d.ekonomi.sozler.filter(s => s.metin.startsWith(`${il} belediyesi`) && s.durum === "tutuldu").length;
    assert.equal(n, Number(a === 0) + Number(b === 0), "yalnız seçilen ücret dönemleri ödenir");
    for (let c = 0; c < 3; c++) {
      const x = durumKopya(d); sec(x, son[b]!, c);
      assert.ok(x.bayraklar.belediye_sonuc);
      assert.equal(x.bekleyen.filter(z => z.kart === "belediye_maas_3").length, 0);
      assert.ok(x.buAy.olaylar.some(o => o.includes(`${il} garajının son tutanağı`)));
      assert.ok(sonsoz(x).some(s => s.includes(`${il} garajı`)));
    }
  }
});

test("hesabın yayımlanması ve hastane taşımacılığı ücret ödemesi değildir", () => {
  const d = kur(); sec(d, "belediye_maas_1", 1);
  ay(d, 2); sec(d, "belediye_maas_2b", 1);
  assert.equal(belediyeDurumu(d, il).ucret, "Bu dosyada ücret ödemesi yok");
  assert.ok(belediyeDurumu(d, il).hesap.includes("ayrı yayımlandı"));
  ay(d, 3); const once = d.ekonomi.sozler.length;
  sec(d, "belediye_maas_hesap", 0);
  assert.equal(d.ekonomi.sozler.length, once + 1);
  assert.equal(d.ekonomi.sozler.at(-1)?.kalem, "yatirim");
  assert.equal(belediyeDurumu(d, il).ucret, "Bu dosyada ücret ödemesi yok");
  assert.ok(belediyeDurumu(d, il).hizmet.includes("geçici taşıma"));
  const y = yukle(kaydet(d)); assert.ok(y.ok, y.ok ? "" : y.hata);
  if (y.ok) assert.deepEqual(belediyeDurumu(y.durum, il), belediyeDurumu(d, il));
  d.ay += 2;
  assert.ok(belediyeDurumu(d, il).hizmet.includes("güncel sefer doğrulanmadı"));
  assert.ok(sonsoz(d).some(s => s.includes("Bir dönemlik geçici taşıma ücret alacağını kapatmadı")));
});

test("müdahale hem sicil hem ayrı hizmet kararı bırakır, eski tamamlanan kartlar değişmez", () => {
  const d = kur(); sec(d, "belediye_maas_1", 2);
  ay(d, 2); sec(d, "belediye_maas_2c", 2);
  const once = d.sicil.length;
  ay(d, 3); sec(d, "belediye_maas_3", 1);
  assert.equal(d.sicil.length, once);
  assert.equal(d.bayraklar.belediye_sonuc, "guvenli_hat");
  assert.equal(d.bayraklar.belediye_hizmet, "gecici");
  assert.equal(belediyeDurumu(d, il).ucret, "Bu dosyada ücret ödemesi yok");
  const eski = kur(); eski.ay = 4; eski.masa = [];
  eski.gecmis.push({ ay: 3, kararlar: [{ kart: "belediye_maas_3", baslik: "Eski belediye başkanı dosyası", secenek: 0, secenekMetni: "Eski uzlaşma" }], ertelenen: [], haberler: [], olaylar: [], hayatlar: [], degisim: [] });
  assert.equal(eski.bayraklar.belediye_sonuc, undefined);
  assert.equal(eski.gecmis[0]?.kararlar[0]?.baslik, "Eski belediye başkanı dosyası");
});

test("son uygun ayda başlayan zincir seçim ayına kadar tamamlanır; geçici hizmet kalıcı sayılmaz", () => {
  const odendi = kur(); odendi.ay = 16; sec(odendi, "belediye_maas_1", 0);
  ay(odendi, 17); sec(odendi, "belediye_maas_2a", 0);
  ay(odendi, 18); sec(odendi, "belediye_maas_hizmet", 0);
  assert.equal(odendi.bayraklar.belediye_hizmet, "calisiyor");
  const eksik = kur(); eksik.ay = 16; sec(eksik, "belediye_maas_1", 1);
  ay(eksik, 17); sec(eksik, "belediye_maas_2b", 0);
  ay(eksik, 18); sec(eksik, "belediye_maas_hizmet", 0);
  assert.equal(eksik.bayraklar.belediye_hizmet, "sinirli");
  assert.equal(belediyeDurumu(odendi, il).ucret, "İki ayrı dönem için ücret ödeneği ödendi");
  assert.equal(belediyeDurumu(eksik, il).ucret, "Bir dönem için ücret ödeneği ödendi");
});

test("eski kayıttan seçim ayına düşen devam kartı dönem dışına kaybolmaz", () => {
  const d = kur(); d.ay = 18; sec(d, "belediye_maas_1", 1);
  assert.ok(d.masa.some(m => m.kart === "belediye_maas_2b"));
  assert.ok(!d.bekleyen.some(b => b.kart === "belediye_maas_2b" && b.ay > 18));
  sec(d, "belediye_maas_2b", 2);
  assert.ok(d.masa.some(m => m.kart === "belediye_maas_3"));
  sec(d, "belediye_maas_3", 0);
  assert.equal(d.masa.length, 0);
});
