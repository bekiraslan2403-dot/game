import { botKarari } from "../yardim/bot.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";
import { yeniOyun, DURUM_SURUMU } from "../../cekirdek/durum.ts";
import { ayiAc, ayiBitir, oyunuBaslat } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { politikaDegistir, meclisOylamasi, seviye, teklifiGeriCek } from "../../cekirdek/politika.ts";
import { PARTILER, HIZIPLER } from "../../cekirdek/meclis-icerik.ts";
import { butceAyBasi } from "../../cekirdek/butce.ts";
import { oylamaEkle, kulisAc, kulisSec, kulisKapat, meclisAyBasi, meclisHazirla, oylamayiSay, oySonucu, oyEsigi, partiOlasiligi, vekilEgilimi, hizipleriGuncelle, vekilIliskisi } from "../../cekirdek/meclis.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { basinAc, basinCevapla, basinKapat } from "../../cekirdek/medya.ts";
import { ikinciTur, secimiBitir, kampanyaYap } from "../../cekirdek/secim.ts";
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

test("emekli oylaması gerçek etkiyi tutanağa yazar ve iki ayrı Ocak dosyası açar", () => {
  const gorulen = new Set<string>();
  for (let tohum = 1; tohum <= 80 && gorulen.size < 2; tohum++) {
    const d = kur(tohum);
    const emekliGideri = d.ekonomi.gider.emekli!;
    const emekliDestegi = d.gostergeler["grup.emekli"]!;
    const gsyh = d.ekonomi.gsyh;
    meclisOylamasi(d, I);
    const r = d.meclis.sonuclar[0]!;
    if (gorulen.has(r.sonuc)) continue;
    gorulen.add(r.sonuc);
    const kabul = r.sonuc === "kabul";
    const u = r.uygulama!;
    assert.equal(u.tur, kabul ? "yururluk" : "degismedi");
    assert.equal(u.kademe?.once, "Zam fiyat artışı kadar");
    assert.equal(u.kademe?.sonra, kabul ? "Zam fiyatların biraz önünde" : u.kademe?.once);
    assert.equal(d.ekonomi.gider.emekli, emekliGideri + (kabul ? 0.3 : 0));
    assert.equal(d.gostergeler["grup.emekli"], emekliDestegi + (kabul ? 3 : 0));
    if (kabul) {
      assert.equal(u.butce?.kalem, "emekli");
      assert.ok(Math.abs(u.butce!.farkTL - gsyh * 0.003) < 1e-9);
      assert.equal(u.etkiler["grup.emekli"], 3);
      assert.equal(u.etkiler.enflasyon, undefined);
    } else {
      assert.equal(u.butce, undefined);
      assert.equal(u.etkiler.parti_ici, 1.5);
    }

    const y = yukle(kaydet(d));
    assert.ok(y.ok);
    assert.deepEqual(y.durum.meclis.sonuclar[0]!.uygulama, u);
    const x = y.durum;
    x.ay++; ayiAc(x, I);
    const kart = x.masa.filter(m => m.kart.startsWith("emekli_oylama_"));
    assert.deepEqual(kart.map(m => m.kart), [kabul ? "emekli_oylama_bordro" : "emekli_oylama_nobet"]);
    assert.equal(u.takip?.ay, x.ay);
    assert.equal(u.takip?.baslik, I.kartlar[kart[0]!.kart]!.metin.baslik);
    const imza = x.imza;
    assert.ok(kararVer(x, I, kart[0]!.ornek, kabul ? 1 : 0).ok);
    assert.equal(x.imza, imza + 1);
    assert.equal(x.ekonomi.gider.emekli, d.ekonomi.gider.emekli);
    assert.equal(x.politika.emekli_aylik, d.politika.emekli_aylik);
    const odeme = x.ekonomi.sozler.at(-1)!;
    assert.equal(odeme.durum, "tutuldu");
    assert.equal(odeme.tekSeferlik, true);
    assert.equal(odeme.kalem, "sosyal");
    assert.equal(kararVer(x, I, kart[0]!.ornek, kabul ? 1 : 0).ok, false);
  }
  assert.deepEqual([...gorulen].sort(), ["kabul", "ret"]);
});

test("yargı oylaması iki sonucu da üretir; kura, kapalı liste ve sıra ayrı izler bırakır", () => {
  let kabul: ReturnType<typeof kur> | undefined;
  let ret: ReturnType<typeof kur> | undefined;
  for (let tohum = 1; tohum <= 80 && !(kabul && ret); tohum++) {
    const d = kur(tohum, 4);
    meclisOylamasi(d, I);
    if (d.meclis.sonuclar[0]!.sonuc === "kabul") kabul ??= d;
    else ret ??= d;
  }
  assert.ok(kabul && ret);
  assert.equal(kabul.politika.yargi_reformu, 3);
  assert.equal(seviye(ret, I.politikalar.yargi_reformu!), 2);
  assert.equal(kabul.meclis.sonuclar[0]!.uygulama?.takip?.baslik, "Kura listesinde iki isim eksik");
  assert.equal(ret.meclis.sonuclar[0]!.uygulama?.takip?.baslik, "Evrak kalemde kaldı");

  kabul.ay++; ayiAc(kabul, I);
  for (const [secim, takip] of [[0, "kura"], [1, "liste"], [2, "sira"]] as const) {
    const d: ReturnType<typeof kur> = structuredClone(kabul);
    const m = d.masa.find(m => m.kart === "yargi_oylama_kabul")!;
    const gun = d.bosGun;
    assert.ok(kararVer(d, I, m.ornek, secim).ok);
    assert.equal(d.bosGun, gun - (secim === 0 ? 1 : 0));
    assert.equal(d.ekonomi.sozler.some(s => s.tekSeferlik && s.durum === "tutuldu"), secim === 0);
    assert.equal(d.sicil.some(s => s.tur === "baski"), secim === 1);
    const y = yukle(kaydet(d));
    assert.ok(y.ok);
    y.durum.ay++; ayiAc(y.durum, I);
    const dosya = y.durum.masa.filter(m => m.kart.startsWith("yargi_oylama_"));
    assert.deepEqual(dosya.map(m => m.kart), ["yargi_oylama_" + takip]);
    if (takip === "liste") {
      assert.ok(kararVer(y.durum, I, dosya[0]!.ornek, 0).ok);
      assert.ok(y.durum.sicil.some(s => s.tur === "baski" && s.kaynak.includes("kapalı aday listesi")));
    }
  }

  ret.ay++; ayiAc(ret, I);
  const m = ret.masa.find(m => m.kart === "yargi_oylama_ret")!;
  const x = structuredClone(ret);
  assert.ok(kararVer(x, I, m.ornek, 1).ok);
  assert.equal(seviye(x, I.politikalar.yargi_reformu!), 2);
  assert.ok(x.ekonomi.sozler.some(s => s.tekSeferlik && s.durum === "tutuldu"));
  assert.ok(kararVer(ret, I, m.ornek, 0).ok);
  assert.equal(ret.imza, 1);
  assert.equal(seviye(ret, I.politikalar.yargi_reformu!), 2);
  const o = ret.meclis.oylamalar.find(o => o.id === "yargi_reformu@5")!;
  assert.ok(o);
  // Kulis uzlaşması destek oranını değiştirir. İkinci sayım hâlâ gerçek oylamadır.
  o.taviz = "demokrat";
  meclisOylamasi(ret, I);
  const ikinci = ret.meclis.sonuclar.find(r => r.id === o.id)!;
  assert.equal(ikinci.sonuc, "kabul");
  assert.equal(ret.politika.yargi_reformu, 3);
  assert.equal(ikinci.uygulama?.takip?.ay, 6);
});

test("Ekim taslağı Aralık oylamasını bekler; kabul yürürlük, ret geçici bütçe getirir", () => {
  let kabul = false, ret = false;
  for (let t = 1; t <= 60 && !(kabul && ret); t++) {
    const d = kur(t, 12);
    const yatirim = d.ekonomi.gider.yatirim!;
    assert.equal(d.masa[0]!.kart, "yillik_butce");
    assert.ok(kararVer(d, I, d.masa[0]!.ornek, 0).ok);
    assert.equal(d.meclis.butce.taslak.butce_acigi, 0.3);
    assert.equal(d.meclis.oylamalar.length, 0);
    d.ay++; ayiAc(d, I);
    const komisyon = d.masa.find(m => m.kart === "butce_komisyonu")!;
    assert.ok(kararVer(d, I, komisyon.ornek, 2).ok);
    assert.equal(d.meclis.oylamalar.length, 0);
    d.ay++; ayiAc(d, I);
    assert.equal(d.meclis.oylamalar[0]!.tur, "butce");
    assert.equal(d.meclis.oylamalar[0]!.butceEtki.butce_acigi, 0.3);
    const olaylar = meclisOylamasi(d, I);
    assert.equal(d.ekonomi.gider.yatirim, yatirim);
    const b = d.meclis.butce;
    if (d.meclis.sonuclar[0]!.sonuc === "kabul") {
      kabul = true;
      assert.equal(d.meclis.sonuclar[0]!.uygulama?.tur, "bekliyor");
      assert.equal(d.meclis.sonuclar[0]!.uygulama?.butce, undefined);
      assert.equal(b.plan!.kabulAy, 14);
      assert.equal(b.plan!.uygulamaAy, null);
      d.ay++; ayiAc(d, I);
      assert.equal(b.plan!.uygulamaAy, 15);
      assert.equal(d.ekonomi.gider.yatirim, yatirim + 0.3);
      assert.equal(b.gider.yatirim, d.ekonomi.gider.yatirim);
      butceAyBasi(d);
      assert.equal(d.ekonomi.gider.yatirim, yatirim + 0.3);
    } else {
      ret = true;
      assert.ok(olaylar.some(x => x.includes("Geçici bütçe")));
      assert.equal(b.gecici, true);
      assert.equal(d.meclis.sonuclar[0]!.uygulama?.tur, "gecici");
      d.ay++; ayiAc(d, I);
      assert.equal(d.ekonomi.gider.yatirim, yatirim);
      assert.equal(d.meclis.oylamalar[0]!.butceEtki.butce_acigi, 0.3);
    }
  }
  assert.ok(kabul && ret);
});

test("komisyon tercihi taslak ödeneğini ve grup desteğini değiştirir; kayıt kararı korur", () => {
  const d = kur(1, 12);
  assert.ok(kararVer(d, I, d.masa[0]!.ornek, 0).ok);
  d.ay++; ayiAc(d, I);
  const komisyon = d.masa.find(m => m.kart === "butce_komisyonu")!;
  for (const [secim, etki, taviz] of [[0, 0.2, null], [1, 0.36, "bayrak"], [2, 0.3, null]] as const) {
    const x = structuredClone(d);
    assert.ok(kararVer(x, I, komisyon.ornek, secim).ok);
    assert.equal(x.ekonomi.gider.yatirim, d.ekonomi.gider.yatirim);
    const y = yukle(kaydet(x));
    assert.ok(y.ok);
    y.durum.ay++; ayiAc(y.durum, I);
    const o = y.durum.meclis.oylamalar[0]!;
    assert.equal(o.butceEtki.butce_acigi, etki);
    assert.equal(o.taviz, taviz);
  }
});

test("önceki sürümden açık Ekim bütçe oylaması takvimini ve taslağını korur", () => {
  const d = kur(1, 12);
  oylamaEkle(d, I, { id: "butce@12", ay: 12, baslik: "2027 yıllık bütçe kanunu", tur: "butce", politika: null, hedef: 0 });
  const y = yukle(kaydet(d));
  assert.ok(y.ok);
  assert.ok(kararVer(y.durum, I, y.durum.masa[0]!.ornek, 0).ok);
  assert.equal(y.durum.meclis.butce.plan, undefined);
  assert.equal(y.durum.meclis.oylamalar[0]!.butceEtki.butce_acigi, 0.3);
  assert.equal(y.durum.bekleyen.some(m => m.kart === "butce_komisyonu"), false);
});

test("sürüm 5 göçü mevcut teklifleri ve bütçeyi korur; açık kulis ve tutanak kayıttan sürer", () => {
  assert.ok(DURUM_SURUMU >= 6);
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

test("1.000 bot oyununda 18 ay, basın, kampanya ve seçim hatasız biter", { timeout: 180000 }, () => {
  for (let tohum = 1; tohum <= 1000; tohum++) {
    let d = oyunuBaslat(yeniOyun(tohum), I);
    while (!d.bitis && !d.yonetim.secim.gece) {
      const o = d.meclis.oylamalar[0];
      if (o && d.meclis.sahneAy !== d.ay) {
        assert.ok(kulisAc(d, I, o.id, o.adaylar[tohum % o.adaylar.length]!).ok);
        assert.ok(kulisSec(d, I, tohum % 3 === 0 ? "baski" : tohum % 3 === 1 ? "soz" : "ikna").ok);
        kulisKapat(d);
      }
      if (d.meclis.sahneAy !== d.ay && tohum % 4 === 0) {
        assert.ok(basinAc(d, I).ok); for (let i=0;i<3;i++) assert.ok(basinCevapla(d,I,(["acik","mujde","yalan"] as const)[(tohum+i)%3]!).ok); assert.ok(basinKapat(d).ok);
      }
      if(d.ay>=16 && d.bosGun>0) kampanyaYap(d,"kapi","grup.genc");
      let kart = 0;
      while (d.masa.length) { assert.ok(botKarari(d, I, d.masa[0]!.ornek, (tohum + kart++) % 3).ok); assert.ok(kart < 60); }
      const r = ayiBitir(d, I); assert.ok(r.ok, r.ok ? "" : r.neden); if (!r.ok) break; d = r.durum;
    }
    if(d.yonetim.secim.gece?.ikinciTur) assert.ok(ikinciTur(d,tohum%3).ok);
    if(!d.bitis) assert.ok(secimiBitir(d,"kabul").ok);
    assert.ok(d.bitis);
    for (const o of d.meclis.sonuclar) assert.equal(o.evet + o.hayir + o.cekimser, 592);
    const kapananAy = d.gecmis.at(-1)?.ay ?? 0;
    for (const [ay, id] of [[2, "emekli_aylik@2"], [4, "yargi_reformu@4"], [14, "butce@14"]] as const) {
      if (kapananAy >= ay) assert.ok(d.meclis.sonuclar.some(o => o.id === id), `Tohum ${tohum}: ${id} tutanağı yok`);
    }
    for (const n of Object.values(d.gostergeler)) assert.ok(Number.isFinite(n));
    if (tohum % 100 === 0) { const y = yukle(kaydet(d)); assert.ok(y.ok, y.ok ? "" : y.hata); }
  }
});
