import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, DURUM_SURUMU } from "../../cekirdek/durum.ts";
import { ayiAc, ayiBitir, oyunuBaslat } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { politikaDegistir, meclisOylamasi, teklifiGeriCek } from "../../cekirdek/politika.ts";
import { PARTILER, HIZIPLER } from "../../cekirdek/meclis-icerik.ts";
import { kulisAc, kulisSec, kulisKapat, meclisAyBasi, meclisHazirla, oylamayiSay, oySonucu, oyEsigi, partiOlasiligi, vekilEgilimi, hizipleriGuncelle, vekilIliskisi } from "../../cekirdek/meclis.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { sozTut, sozleriDenetle } from "../../cekirdek/hazine.ts";

const I = icerikDerle(fileURLToPath(new URL("../../icerik", import.meta.url))).paket!;
function kur(tohum = 1, ay = 2) { const d = yeniOyun(tohum); d.ay = ay; ayiAc(d, I); return d; }
function gorus(tohum = 1, id = "halime") {
  const d = kur(tohum); const o = d.meclis.oylamalar[0]!;
  assert.ok(kulisAc(d, I, o.id, id).ok);
  return { d, o };
}

test("kilitli 600 sandalye ve üç hizip korunur; 12 vekil karakteri vardır", () => {
  assert.deepEqual(PARTILER.map(p => p.sandalye), [278, 46, 153, 56, 59]);
  assert.equal(PARTILER.reduce((a, p) => a + p.sandalye, 8), 600);
  assert.deepEqual(HIZIPLER.map(h => h.sandalye), [110, 80, 88]);
  assert.equal(I.meclis.vekiller.length, 12);
});

test("iki kritik oylamada sekizer aday, toplam 12 farklı vekil; ay başı yinelenmez", () => {
  const d = kur(); const ilk = d.meclis.oylamalar[0]!;
  assert.equal(ilk.politika, "emekli_aylik");
  assert.equal(ilk.adaylar.length, 8);
  meclisAyBasi(d, I); assert.equal(d.meclis.oylamalar.length, 1);
  const x = kur(1, 4); const ikinci = x.meclis.oylamalar[0]!;
  assert.equal(ikinci.politika, "yargi_reformu");
  assert.equal(ikinci.adaylar.length, 8);
  assert.equal(new Set([...ilk.adaylar, ...ikinci.adaylar]).size, 12);
});

test("592 oyda aday iki kez sayılmaz; parti toplamları ve salt çoğunluk tutar", () => {
  for (let tohum = 1; tohum <= 50; tohum++) {
    const d = kur(tohum); const o = d.meclis.oylamalar[0]!;
    const r = oylamayiSay(d, I, o);
    assert.equal(r.oylar.length, 592);
    assert.equal(new Set(r.oylar.map(v => v.kim)).size, 592);
    assert.equal(r.evet + r.hayir + r.cekimser, 592);
    assert.equal(r.esik, 297);
    for (const p of PARTILER) assert.equal(r.oylar.filter(v => v.parti === p.id).length, p.sandalye);
    for (const id of o.adaylar) {
      const ad = I.meclis.vekiller.find(v => v.id === id)!.ad;
      assert.equal(r.oylar.filter(v => v.kim === ad).length, 1);
    }
  }
});

test("eşitlik ret, çekimser katılımda; anayasa için 360 ve 400 eşikleri", () => {
  assert.equal(oyEsigi("kanun", 592), 297);
  assert.equal(oySonucu("kanun", 296, 592), "ret");
  assert.equal(oySonucu("kanun", 297, 592), "kabul");
  assert.equal(oyEsigi("kanun", 500), 251);
  assert.equal(oySonucu("anayasa", 359, 592), "ret");
  assert.equal(oySonucu("anayasa", 360, 592), "halkoylamasi");
  assert.equal(oySonucu("anayasa", 399, 592), "halkoylamasi");
  assert.equal(oySonucu("anayasa", 400, 592), "kabul");
});

test("sahne ayda bir; geçersiz eylem ve yinelenen karar durumu değiştirmez", () => {
  const { d, o } = gorus();
  const once = structuredClone(d);
  assert.equal(kulisAc(d, I, o.id, "yok").ok, false);
  assert.equal(kulisSec(d, I, "yok" as never).ok, false);
  assert.deepEqual(d, once);
  assert.ok(kulisSec(d, I, "soz").ok);
  const sonra = structuredClone(d);
  assert.equal(kulisSec(d, I, "soz").ok, false); assert.deepEqual(d, sonra);
  assert.ok(kulisKapat(d).ok);
  assert.equal(kulisAc(d, I, o.id, "selma").ok, false);
  d.ay++; assert.ok(kulisAc(d, I, o.id, "selma").ok);
});

test("ikna bir gün alır; boş gün yoksa zar ve sahne sonucu değişmez", () => {
  const { d } = gorus(7, "orhan"); d.bosGun = 0;
  const once = structuredClone(d);
  assert.equal(kulisSec(d, I, "ikna").ok, false); assert.deepEqual(d, once);
  d.bosGun = 2;
  assert.ok(kulisSec(d, I, "ikna").ok); assert.equal(d.bosGun, 1);
});

test("yatırım sözü Hazine'ye yazılır; tutulunca maliyeti ödenir, kırılınca sicile düşer", () => {
  const { d } = gorus(); assert.ok(kulisSec(d, I, "soz").ok);
  const s = d.ekonomi.sozler[0]!;
  assert.equal(s.vade, d.ay + 2); assert.equal(s.maliyet, 0.08);
  const e = d.ekonomi.gider.yatirim!;
  assert.ok(sozTut(d, s.id).ok); assert.ok(d.ekonomi.gider.yatirim! > e);
  const x = gorus(3).d; kulisSec(x, I, "soz"); x.ay += 2; sozleriDenetle(x);
  assert.equal(x.ekonomi.sozler[0]!.durum, "kirildi");
  assert.ok(x.sicil.some(s => s.tur === "kirilan_soz" && s.kaynak.includes("Halime")));
});

test("baskı her sonuçta sicile yazılır; algı ve lider pazarlığının bedeli vardır", () => {
  const a = gorus().d; kulisSec(a, I, "baski");
  assert.ok(a.sicil.some(s => s.tur === "baski"));
  assert.ok(a.meclis.vekiller.halime!.iliski < 50);
  const b = gorus().d; const basin = b.gostergeler.basin!; kulisSec(b, I, "algi");
  assert.ok(b.gostergeler.basin! < basin); assert.equal(b.sicil[0]!.tur, "baski");
  const c = gorus(4, "rauf").d; const kalan = c.gostergeler["grup.kalan"]!;
  kulisSec(c, I, "pazarlik"); assert.equal(c.meclis.oylamalar[0]!.taviz, "bayrak");
  assert.ok(c.gostergeler["grup.kalan"]! < kalan);
});

test("aynı tohum ve kararlar aynı oyları üretir; tahmine bakmak zarı tüketmez", () => {
  const a = gorus(8), b = gorus(8);
  const once = structuredClone(a.d);
  for (let i = 0; i < 20; i++) vekilEgilimi(a.d, a.o, I.meclis.vekiller[0]!, I);
  assert.deepEqual(a.d, once);
  kulisSec(a.d, I, "soz"); kulisSec(b.d, I, "soz");
  assert.deepEqual(oylamayiSay(a.d, I, a.o), oylamayiSay(b.d, I, b.o));
});

test("evet sözüne rağmen ihanet mümkündür, adıyla tutanakta ve raporda görünür", () => {
  let ihanet = 0, sadakat = 0;
  for (let tohum = 1; tohum <= 80; tohum++) {
    const { d } = gorus(tohum); kulisSec(d, I, "soz"); kulisKapat(d);
    const olaylar = meclisOylamasi(d, I);
    const r = d.meclis.sonuclar[0]!;
    const halime = r.oylar.find(v => v.kim === "Halime Kor")!;
    if (halime.fire) { ihanet++; assert.ok(olaylar.some(o => o.includes("Son dakika firesi: Halime Kor"))); }
    else sadakat++;
  }
  assert.ok(ihanet > 0 && sadakat > 0);
});

test("hizip çöküşü fireleri artırır; kararların izleri hizip memnuniyetine yazılır", () => {
  const d = kur(); const once = partiOlasiligi(d, "yukselis");
  d.meclis.hizipler.eski = 0; assert.ok(partiOlasiligi(d, "yukselis") < once);
  const teknokrat = d.meclis.hizipler.teknokrat;
  d.gostergeler.guven = d.ayBasi.guven! - 20; hizipleriGuncelle(d);
  assert.ok(d.meclis.hizipler.teknokrat < teknokrat);
});

test("açık sahne sırasında ay bitmez ve teklif geri çekilemez; kapanınca çekilebilir", () => {
  const { d, o } = gorus(); d.masa = [];
  assert.equal(ayiBitir(d, I).ok, false);
  assert.equal(teklifiGeriCek(d, o.politika!).ok, false);
  kulisKapat(d);
  assert.ok(teklifiGeriCek(d, o.politika!).ok);
  assert.equal(d.meclis.oylamalar.length, 0);
  assert.equal(d.meclis.sahneAy, d.ay);
});

test("Ekim'de bütçe zorunludur; etkiler kabul bekler, ret geçici bütçe ve yeniden oylama getirir", () => {
  let kabul = false, ret = false;
  for (let t = 1; t <= 60 && !(kabul && ret); t++) {
    const d = kur(t, 12); const o = d.meclis.oylamalar[0]!;
    assert.equal(o.tur, "butce"); assert.equal(d.masa[0]!.kart, "yillik_butce");
    const yatirim = d.ekonomi.gider.yatirim!;
    assert.ok(kararVer(d, I, d.masa[0]!.ornek, 0).ok);
    assert.equal(d.ekonomi.gider.yatirim, yatirim);
    const olaylar = meclisOylamasi(d, I);
    const r = d.meclis.sonuclar[0]!;
    if (r.sonuc === "kabul") { kabul = true; assert.ok(d.ekonomi.gider.yatirim! > yatirim); assert.equal(d.meclis.butce.gecici, false); }
    else { ret = true; assert.equal(d.ekonomi.gider.yatirim, yatirim); assert.ok(olaylar.some(x => x.includes("geçici bütçe")));
      d.ay++; meclisAyBasi(d, I); assert.equal(d.meclis.oylamalar[0]!.tur, "butce");
      assert.equal(d.meclis.oylamalar[0]!.butceEtki.butce_acigi, 0.3);
    }
  }
  assert.ok(kabul && ret);
});

test("sürüm 5 göçü mevcut teklifleri ve bütçeyi korur; açık kulis ve tutanak kayıttan sürer", () => {
  assert.equal(DURUM_SURUMU, 6);
  const eski = JSON.parse(kaydet(kur(17, 1))); eski.surum = 5; eski.durum.surum = 5; delete eski.durum.meclis;
  eski.durum.meclisGundemi = [{ politika: "kira_siniri", hedef: 3, ay: 1 }];
  const g = yukle(JSON.stringify(eski)); assert.ok(g.ok); if (!g.ok) return;
  assert.deepEqual(g.durum.ekonomi, eski.durum.ekonomi);
  meclisHazirla(g.durum, I); const o = g.durum.meclis.oylamalar[0]!;
  assert.equal(o.adaylar.length, 8); assert.equal(o.politika, "kira_siniri");
  const zar = structuredClone(g.durum.zar); meclisHazirla(g.durum, I); assert.deepEqual(g.durum.zar, zar);
  kulisAc(g.durum, I, o.id, o.adaylar[0]!); kulisSec(g.durum, I, "soz");
  const y = yukle(kaydet(g.durum)); assert.ok(y.ok); if (!y.ok) return;
  assert.deepEqual(y.durum, g.durum);
  kulisKapat(y.durum); meclisOylamasi(y.durum, I);
  const son = yukle(kaydet(y.durum)); assert.ok(son.ok); if (son.ok) assert.deepEqual(son.durum, y.durum);
});

test("tutulan ve kırılan söz sonraki oylamadaki ilişkiyi değiştirir; tutanak tekrar zar atmaz", () => {
  const { d, o } = gorus(15); kulisSec(d, I, "soz");
  const soz = d.ekonomi.sozler[0]!;
  const ilk = vekilIliskisi(d, "halime");
  soz.durum = "tutuldu"; assert.ok(vekilIliskisi(d, "halime") > ilk);
  soz.durum = "kirildi"; assert.ok(vekilIliskisi(d, "halime") < ilk);
  const r = oylamayiSay(d, I, o); const once = structuredClone(d);
  assert.deepEqual(oylamayiSay(d, I, o), r); assert.deepEqual(d, once);
  const ham = JSON.parse(kaydet(d)); ham.durum.meclis.sonuclar[0].evet++;
  assert.equal(yukle(JSON.stringify(ham)).ok, false, "tutanağın sayıları oynanmış kayıt reddedilmeli");
});

test("kurum başkanları ayrı ekran olmadan karar kartı olarak gelir", () => {
  const d = kur(1, 3);
  assert.ok(d.masa.some(m => m.kart === "anayasa_mahkemesi_uyari"));
  assert.equal(I.kartlar.anayasa_mahkemesi_uyari!.getiren, "anayasa_mahkemesi");
  assert.equal(I.kartlar.faiz_karari!.getiren, "merkez_bankasi");
});

test("1.000 bot oyununda 17 ay, Meclis aritmetiği ve son kayıt bozulmaz", { timeout: 180000 }, () => {
  for (let tohum = 1; tohum <= 1000; tohum++) {
    let d = oyunuBaslat(yeniOyun(tohum), I);
    while (d.ay < 18) {
      const o = d.meclis.oylamalar[0];
      if (o && d.meclis.sahneAy !== d.ay) {
        assert.ok(kulisAc(d, I, o.id, o.adaylar[tohum % o.adaylar.length]!).ok);
        assert.ok(kulisSec(d, I, tohum % 3 === 0 ? "baski" : tohum % 3 === 1 ? "soz" : "ikna").ok);
        kulisKapat(d);
      }
      let kart = 0;
      while (d.masa.length) { assert.ok(kararVer(d, I, d.masa[0]!.ornek, (tohum + kart++) % 3).ok); assert.ok(kart < 60); }
      const r = ayiBitir(d, I); assert.ok(r.ok, r.ok ? "" : r.neden); if (!r.ok) break; d = r.durum;
    }
    for (const o of d.meclis.sonuclar) assert.equal(o.evet + o.hayir + o.cekimser, 592);
    assert.ok(d.meclis.sonuclar.length >= 3);
    for (const n of Object.values(d.gostergeler)) assert.ok(Number.isFinite(n));
    if (tohum % 100 === 0) { const y = yukle(kaydet(d)); assert.ok(y.ok, y.ok ? "" : y.hata); }
  }
});
