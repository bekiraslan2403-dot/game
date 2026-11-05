import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { yeniOyun, DURUM_SURUMU } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer, ertele } from "../../cekirdek/karar.ts";
import { kapiKur, ziyaretciKabul } from "../../cekirdek/toplum.ts";
import { ziyaretSonucu, gorusmeDestegi } from "../../cekirdek/ziyaret.ts";
import { politikaDegistir, meclisOylamasi } from "../../cekirdek/politika.ts";
import { sozTut, sozleriDenetle } from "../../cekirdek/hazine.ts";
import { yonetimAySonu } from "../../cekirdek/yonetim.ts";
import { ekonomiAySonu, butceDegistir } from "../../cekirdek/ekonomi.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { rastgeleUygun, masaKur } from "../../cekirdek/deste.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const I = JSON.parse(readFileSync(new URL("../../uretilen/icerik.json", import.meta.url), "utf8")) as IcerikPaketi;
function kabul(id = "emekli", tohum = 51) {
  const d = oyunuBaslat(yeniOyun(tohum), I);
  d.toplum.kapi = [{ id, durum: "bekliyor" }];
  const r = ziyaretciKabul(d, I, id);
  assert.ok(r.ok); if (!r.ok || !r.ornek) throw new Error("görüşme açılmadı");
  return { d, ornek: r.ornek };
}

test("kabul gün ayırır; ücretsiz memnuniyet, imza veya sahne hakkı tüketimi vermez", () => {
  const d = oyunuBaslat(yeniOyun(1), I);
  const once = structuredClone(d), id = d.toplum.kapi[0]!.id;
  const r = ziyaretciKabul(d, I, id);
  assert.ok(r.ok && r.ornek);
  assert.equal(d.bosGun, once.bosGun - 1);
  assert.deepEqual(d.gostergeler, once.gostergeler);
  assert.deepEqual(d.zar, once.zar);
  assert.equal(d.imza, once.imza);
  assert.equal(d.meclis.sahneAy, once.meclis.sahneAy);
  assert.equal(d.masa.length, once.masa.length + 1);
  const acik = JSON.stringify(d);
  assert.equal(ziyaretciKabul(d, I, id).ok, false);
  assert.equal(JSON.stringify(d), acik);
  assert.equal(ayiBitir(d, I).ok, false);
});

test("bütün heyetler üç gerçek yanıt ve ulaşılabilir takip dosyası taşır", () => {
  for (const z of I.toplum.ziyaretciler) for (const sec of [0,1,2]) {
    const { d, ornek } = kabul(z.id);
    const k = I.kartlar[z.gorusme!]!;
    assert.equal(k.secenekler.length, 3);
    assert.equal(rastgeleUygun(d, k, I), false);
    assert.equal(ertele(d, I, ornek).ok, false);
    const r = kararVer(d, I, ornek, sec);
    assert.ok(r.ok, `${z.id}/${sec}`);
    assert.ok(d.bekleyen.some(b => I.kartlar[b.kart]?.ziyaret?.asama === "takip"));
    assert.ok(ziyaretSonucu(d, I, z.id));
    const y = yukle(kaydet(d));
    assert.ok(y.ok, `${z.id}/${sec}: kayıt`);
    if (y.ok) assert.deepEqual(y.durum, d);
  }
});

test("emekli görüşmesi gerçek kanun teklifini açar; oylamadan önce politika değişmez", () => {
  const { d, ornek } = kabul();
  const once = d.gostergeler["grup.emekli"];
  assert.ok(kararVer(d, I, ornek, 0).ok);
  assert.equal(d.imza, 1);
  assert.equal(d.politika.emekli_aylik ?? I.politikalar.emekli_aylik!.baslangic, 2);
  assert.equal(d.meclisGundemi[0]!.politika, "emekli_aylik");
  assert.equal(d.meclisGundemi[0]!.hedef, 3);
  assert.ok(d.meclis.oylamalar.some(o => o.id === "emekli_aylik@1"));
  assert.equal(d.gostergeler["grup.emekli"], once);
  assert.match(ziyaretSonucu(d, I, "emekli")!.durum, /hâlâ Meclis/);
});

test("imza biterse yanıt başarısız olur ve durumun hiçbir alanı değişmez", () => {
  const { d, ornek } = kabul(); d.imza = 3;
  const once = structuredClone(d);
  assert.equal(kararVer(d, I, ornek, 0).ok, false);
  assert.deepEqual(d, once);
  assert.ok(kararVer(d, I, ornek, 1).ok, "destek sözü için politika imzası gerekmez");
});

test("bekleyen aynı teklif yeniden sunulmaz; çelişen teklif sessizce ezilmez", () => {
  const { d, ornek } = kabul();
  assert.ok(politikaDegistir(d, I, "emekli_aylik", 3).ok);
  assert.ok(kararVer(d, I, ornek, 0).ok);
  assert.equal(d.imza, 1); assert.equal(d.meclisGundemi.length, 1);
  const b = kabul(); politikaDegistir(b.d, I, "emekli_aylik", 1);
  const once = structuredClone(b.d);
  assert.equal(kararVer(b.d, I, b.ornek, 0).ok, false);
  assert.deepEqual(b.d, once);
});

test("takip başka ayın oylamasını başarı sanmaz; gerçek ret ve kabulü ayırt eder", () => {
  const bulunan = new Set<string>();
  for (let tohum = 1; tohum <= 60 && bulunan.size < 2; tohum++) {
    const { d, ornek } = kabul("emekli", tohum);
    kararVer(d, I, ornek, 0); meclisOylamasi(d, I);
    const sonuc = d.meclis.sonuclar.find(s => s.id === "emekli_aylik@1")!;
    bulunan.add(sonuc.sonuc);
    const rapor = ziyaretSonucu(d, I, "emekli")!.durum;
    assert.match(rapor, sonuc.sonuc === "kabul" ? /kabul edildi/ : /reddedildi/);
    assert.match(rapor, new RegExp(`${sonuc.evet} evet, ${sonuc.hayir} ret`));
  }
  assert.deepEqual([...bulunan].sort(), ["kabul", "ret"]);
});

test("destek sözü ödeme sayılmaz; hem Hazine hem takip aynı sözü tek kez yerine getirir", () => {
  const { d, ornek } = kabul();
  const once = d.ekonomi.gider.emekli!;
  kararVer(d, I, ornek, 1);
  const soz = d.ekonomi.sozler[0]!;
  assert.equal(soz.durum, "bekliyor"); assert.equal(soz.tekSeferlik, true);
  assert.equal(d.ekonomi.gider.emekli, once);
  assert.match(ziyaretSonucu(d, I, "emekli")!.durum, /henüz çıkarılmadı/);
  assert.ok(sozTut(d, soz.id).ok);
  const odendi = structuredClone(d);
  assert.ok(gorusmeDestegi(d, I, "kabul_emekli", true).ok);
  assert.deepEqual(d, odendi);
  assert.ok(Math.abs(d.ekonomi.gider.emekli! - once - soz.maliyet) < 1e-9);
  assert.match(ziyaretSonucu(d, I, "emekli")!.durum, /ödeneği çıkarıldı/);
});

test("tek seferlik destek yalnız ödendiği ayı yükler; normal sözler sürekli gider kalır", () => {
  const { d, ornek } = kabul();
  kararVer(d, I, ornek, 1); const soz=d.ekonomi.sozler[0]!;
  const gider=d.ekonomi.gider.emekli!;
  sozTut(d, soz.id);
  const odendi = structuredClone(d), desteksiz=structuredClone(d);
  butceDegistir(desteksiz,"emekli",-soz.maliyet);
  desteksiz.yonetim.uygulamalar=desteksiz.yonetim.uygulamalar.filter(u=>!u.tekSeferlik);
  ekonomiAySonu(odendi,()=>false); ekonomiAySonu(desteksiz,()=>false);
  assert.ok(odendi.ekonomi.harcamaEtkisi > desteksiz.ekonomi.harcamaEtkisi, "ödeme gerçekten harcama kanalına yansımalı");
  yonetimAySonu(odendi);yonetimAySonu(desteksiz);
  assert.ok(Math.abs(odendi.ekonomi.gider.emekli! - desteksiz.ekonomi.gider.emekli!) < .001, "destek kalıcı aylığa endekslenmemeli");
  yonetimAySonu(d);
  assert.ok(Math.abs(d.ekonomi.gider.emekli!-gider)<1e-9);
  const kayit=yukle(kaydet(d));assert.ok(kayit.ok);
  const eski = kabul(); kararVer(eski.d, I, eski.ornek, 1);
  eski.d.ekonomi.sozler[0]!.tekSeferlik=false;
  const normal=eski.d.ekonomi.gider.emekli!;
  sozTut(eski.d, eski.d.ekonomi.sozler[0]!.id);yonetimAySonu(eski.d);
  assert.ok(eski.d.ekonomi.gider.emekli! > normal);
});

test("takipte yeni dar destek ödenebilir; tekrar çağrı ikinci bir söz veya ödeme yaratmaz", () => {
  const { d, ornek } = kabul();kararVer(d,I,ornek,2);
  assert.ok(gorusmeDestegi(d,I,"kabul_emekli",true).ok);
  const once=structuredClone(d);
  assert.ok(gorusmeDestegi(d,I,"kabul_emekli",true).ok);
  assert.deepEqual(d,once);
});

test("ödenmeyen destek silinmez; vadesinde sicile yansır ve yeniden ödeme gibi kullanılamaz", () => {
  const {d,ornek}=kabul();kararVer(d,I,ornek,1);
  d.ay=3;sozleriDenetle(d);
  assert.equal(d.ekonomi.sozler[0]!.durum,"kirildi");
  assert.ok(d.sicil.some(s=>s.tur==="kirilan_soz"));
  assert.match(ziyaretSonucu(d,I,"emekli")!.durum,/vadesinde yerine getirilmedi/);
  const once=structuredClone(d);
  assert.equal(gorusmeDestegi(d,I,"kabul_emekli",true).ok,false);
  assert.deepEqual(d,once);
});

test("ziyaretçi aynı hikâyeyi tekrar başlatmaz; takip dosyası sonraki ay ve kayıt sonrasında ulaşılır", () => {
  const {d,ornek}=kabul();kararVer(d,I,ornek,1);
  kapiKur(d,I);assert.ok(d.toplum.kapi.every(z=>z.id!=="emekli"));
  d.masa=[];d.ay=2;d.masaKuruldu=false;masaKur(d,I);
  assert.ok(d.masa.some(m=>m.kart==="takip_emekli"));
  const y=yukle(kaydet(d));assert.ok(y.ok);
  if(y.ok) assert.deepEqual(ziyaretSonucu(y.durum,I,"emekli"),ziyaretSonucu(d,I,"emekli"));
});

test("son ayda başlayan görüşmenin takibi dönem dışına kaybolmaz", () => {
  const {d,ornek}=kabul(); d.ay=18;
  assert.ok(kararVer(d,I,ornek,2).ok);
  assert.ok(d.masa.some(m=>m.kart==="takip_emekli"));
  assert.ok(!d.bekleyen.some(b=>b.kart==="takip_emekli"));
  const sozlu=kabul();sozlu.d.ay=18;kararVer(sozlu.d,I,sozlu.ornek,1);
  assert.equal(sozlu.d.ekonomi.sozler[0]!.vade,18,"son ayın ödeme taahhüdü dönem dışına taşmaz");
});

test("8 → 9 göçü eski kabul, söz, karar ve zar kayıtlarını korur", () => {
  const {d}=kabul();
  // Eski sürüm kabulü: görüşme veya karar varmış gibi tamamlanmaz.
  d.masa=d.masa.filter(m=>m.kart!=="kabul_emekli");delete d.gorulen.kabul_emekli;
  const k=JSON.parse(kaydet(d));k.surum=8;k.durum.surum=8;
  k.durum.ekonomi.sozler=[{id:"eski#1",metin:"Eski yatırım sözü",kalem:"yatirim",maliyet:.1,verildi:1,vade:3,grup:null,asgariArtis:0,durum:"bekliyor"}];
  const y=yukle(JSON.stringify(k));assert.ok(y.ok);
  if(!y.ok)return;
  assert.equal(y.durum.surum,DURUM_SURUMU);
  assert.equal(y.durum.ekonomi.sozler[0]!.tekSeferlik,false);
  assert.deepEqual(y.durum.zar,d.zar);
  assert.deepEqual(y.durum.toplum.kapi,d.toplum.kapi);
  assert.equal(ziyaretSonucu(y.durum,I,"emekli"),null);
});

test("kabul ve takip ayın karar bütçesine dahildir; dolu takvime kabul eklenmez", () => {
  const {d,ornek}=kabul();kararVer(d,I,ornek,1);
  d.masa=[];d.ay=2;d.masaKuruldu=false;masaKur(d,I);
  assert.ok(d.masa.some(m=>m.kart==="takip_emekli"));
  assert.ok(d.masa.filter(m=>I.kartlar[m.kart]?.tur==="masa").length<=3);
  d.toplum.kapi=[{id:"kiraci",durum:"bekliyor"}];
  while(d.buAy.kararlar.length+d.masa.length<6)d.buAy.kararlar.push({kart:"eski",baslik:"Önceki karar",secenek:0,secenekMetni:"Yanıt"});
  const once=structuredClone(d);
  assert.equal(ziyaretciKabul(d,I,"kiraci").ok,false);
  assert.deepEqual(d,once);
});

test("kabul, teklif, takip ve ödemeler gerçek ay akışında kilitlenmeden dönem sonuna ilerler", () => {
  let gorusme=0,takip=0;
  for(let seed=100;seed<110;seed++){
    let d=oyunuBaslat(yeniOyun(seed),I),n=0;
    while(!d.bitis && d.ay<18){
      for(const z of [...d.toplum.kapi].slice(0,2))ziyaretciKabul(d,I,z.id);
      let adim=0;
      while(d.masa.length){
        const m=d.masa[0]!,kart=I.kartlar[m.kart]!;
        if(kart.ziyaret?.asama==="gorusme")gorusme++;
        if(kart.ziyaret?.asama==="takip")takip++;
        const r=kararVer(d,I,m.ornek,(seed+d.ay+adim)%3);
        if(!r.ok)assert.ok(kararVer(d,I,m.ornek,2).ok,r.neden);
        assert.ok(++adim<80);
      }
      const r=ayiBitir(d,I);assert.ok(r.ok);if(!r.ok)break;
      d=r.durum;assert.ok(++n<=18);
    }
    assert.ok(yukle(kaydet(d)).ok);
  }
  assert.ok(gorusme>=20);assert.ok(takip>=20);
});
