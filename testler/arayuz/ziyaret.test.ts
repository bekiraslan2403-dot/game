import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const root=fileURLToPath(new URL("../..",import.meta.url));
const I=JSON.parse(readFileSync(root+"/uretilen/icerik.json","utf8")) as IcerikPaketi;
const key="akkopru-2026:otomatik";
let browser:Browser;
before(async()=>{browser=await chromium.launch();mkdirSync(root+"/testler/ciktilar",{recursive:true});});
after(async()=>{await browser?.close();});
async function kaydiOku(p:Page){return (await p.evaluate(k=>JSON.parse(localStorage.getItem(k)!).durum,key));}
async function boyut(p:Page){
 const r=await p.evaluate(()=>({tasma:document.documentElement.scrollWidth>innerWidth,pencere:[...document.querySelectorAll<HTMLElement>(".pencere")].some(e=>e.scrollWidth>e.clientWidth),kucuk:[...document.querySelectorAll("button,select")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44;}).map(e=>e.textContent)}));
 assert.deepEqual(r,{tasma:false,pencere:false,kucuk:[]});
}
for(const [ad,width,height] of [["masaustu",1366,900],["telefon",440,956]] as const){
 test(`${ad}: kabul görüşmeyi açar; yenileme günü yeniden harcatmaz; söz takipte ödenir`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage();
  const errors:string[]=[];p.on("pageerror",e=>errors.push(e.message));
  const d=oyunuBaslat(yeniOyun(51),I);d.toplum.kapi=[{id:"emekli",durum:"bekliyor"}];
  await p.goto("file://"+root+"/dist/index.html");
  await p.evaluate(({key,metin})=>localStorage.setItem(key,metin),{key,metin:kaydet(d)});await p.reload();
  await p.getByRole("button",{name:"Görüşmeyi aç · 1 gün",exact:true}).click();
  await p.locator(".karar-dosyasi").getByRole("heading",{name:"İkramiyeyi bekleyen zarf",exact:true}).waitFor();
  await boyut(p);
  assert.equal(await p.getByText(/danışman tahmini/).count(),0);
  assert.equal(await p.getByRole("button",{name:/İkinci görüş al/}).count(),0);
  const kabul=await kaydiOku(p);assert.equal(kabul.bosGun,d.bosGun-1);
  assert.equal(kabul.gostergeler["grup.emekli"],d.gostergeler["grup.emekli"]);
  await p.screenshot({path:root+`/testler/ciktilar/${ad}-kabul.png`,fullPage:true});
  await p.reload();await p.getByRole("button",{name:"Görüşmeye dön",exact:true}).click();
  assert.equal((await kaydiOku(p)).bosGun,kabul.bosGun);
  await p.locator(".karar-dosyasi .secenek").nth(1).click();
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();
  await p.locator(".kapi-yanit").filter({hasText:/Düşük aylıklı emekliler/}).waitFor();
  const kayit=await p.evaluate(k=>localStorage.getItem(k)!,key),y=yukle(kayit);if(!y.ok)throw new Error(y.hata);
  const ilk=y.durum;assert.equal(ilk.ekonomi.sozler[0]!.durum,"bekliyor");
  while(ilk.masa.length){const r=kararVer(ilk,I,ilk.masa[0]!.ornek,2);assert.ok(r.ok);}
  const sonraki=ayiBitir(ilk,I);if(!sonraki.ok)throw new Error(sonraki.neden);
  await p.evaluate(({key,metin})=>localStorage.setItem(key,metin),{key,metin:kaydet(sonraki.durum)});await p.reload();
  await p.locator(".dosya-satir").filter({hasText:"Zarfın ardından"}).click();
  await p.getByLabel("Önceki görüşmenin sonucu").getByText(/ödenek henüz çıkarılmadı/).waitFor();
  await boyut(p);await p.screenshot({path:root+`/testler/ciktilar/${ad}-kabul-takip.png`,fullPage:true});
  await p.locator(".karar-dosyasi .secenek").nth(1).click();
  await p.locator(".sonuc .haber-alinti").filter({hasText:/Söz tutuldu: Düşük aylıklı emeklilere geçici destek/}).waitFor();
  const son=await kaydiOku(p);assert.equal(son.ekonomi.sozler[0].durum,"tutuldu");
  assert.equal(son.ekonomi.sozler.filter((s:{metin:string})=>s.metin==="Düşük aylıklı emeklilere geçici destek").length,1);
  await p.reload();assert.equal((await kaydiOku(p)).ekonomi.sozler[0].durum,"tutuldu");
  assert.deepEqual(errors,[]);await ctx.close();
 });
}

test("imza yoksa politika yanıtı gerekçesiyle kilitlenir; diğer yanıtlar kullanılabilir",async()=>{
 const ctx=await browser.newContext(),p=await ctx.newPage(),d=oyunuBaslat(yeniOyun(1),I);
 d.toplum.kapi=[{id:"emekli",durum:"bekliyor"}];d.imza=3;
 await p.goto("file://"+root+"/dist/index.html");await p.evaluate(({key,metin})=>localStorage.setItem(key,metin),{key,metin:kaydet(d)});await p.reload();
 await p.getByRole("button",{name:"Görüşmeyi aç · 1 gün",exact:true}).click();
 assert.ok(await p.locator(".karar-dosyasi .secenek").nth(0).isDisabled());
 await p.getByText(/Bu ayın üç imzası kullanıldı/).waitFor();
 assert.ok(await p.locator(".karar-dosyasi .secenek").nth(1).isEnabled());
 await ctx.close();
});
