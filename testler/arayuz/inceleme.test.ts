import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { yeniOyun, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { anlatiAc, anlatiCevapla, anlatiDevam } from "../../cekirdek/anlati.ts";
import { botKarari } from "../yardim/bot.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const root = fileURLToPath(new URL("../..", import.meta.url)), key = "akkopru-2026:otomatik";
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;
let browser: Browser;
before(async () => { browser = await chromium.launch(); mkdirSync(root + "/testler/ciktilar", { recursive: true }); });
after(async () => { await browser?.close(); });
function ay(d: OyunDurumu) { let n=0; while(d.masa.length){botKarari(d,I,d.masa[0]!.ornek,2);assert.ok(++n<80);}const r=ayiBitir(d,I);if(!r.ok)throw Error(r.neden);return r.durum; }
function kur(ham=false){
 let d=oyunuBaslat(yeniOyun(742),I),m=d.masa.find(m=>m.kart==="akkopru_telefon")!;
 if(ham){anlatiAc(d,I,m.ornek);for(let i=0;i<3;i++){anlatiCevapla(d,I,0);anlatiDevam(d);}}
 kararVer(d,I,m.ornek,2);m=d.masa.find(m=>m.kart===d.acilis!.sabahKarti)!;kararVer(d,I,m.ornek,2);return ay(d);
}
async function yerlestir(p:Page,d:OyunDurumu){await p.evaluate(({key,s})=>localStorage.setItem(key,s),{key,s:kaydet(d)});await p.reload();}
async function durum(p:Page){const y=yukle(await p.evaluate(k=>localStorage.getItem(k)!,key));if(!y.ok)throw Error(y.hata);return y.durum;}
async function boyut(p:Page){
 await p.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
 const r=await p.evaluate(()=>({yatay:document.documentElement.scrollWidth>innerWidth,pencere:[...document.querySelectorAll<HTMLElement>(".pencere")].some(e=>e.scrollWidth>e.clientWidth),kucuk:[...document.querySelectorAll("button,select")].some(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44;})}));assert.deepEqual(r,{yatay:false,pencere:false,kucuk:false});
}
for(const[ad,width,height]of[["masaustu",1366,900],["telefon",440,956]]as const){
 for(let yol=0;yol<3;yol++)test(`${ad}: inceleme ${yol}, teslim, beyan veya yeniden inceleme ve sonuç kayıtta sürer`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),hatalar:string[]=[];p.on("pageerror",e=>hatalar.push(e.message));
  await p.goto("file://"+root+"/dist/index.html");await yerlestir(p,kur(yol!==0));
  await p.locator(".dosya-satir").filter({hasText:"Bakanın dosyası, mühendisin itirazı"}).click();
  await p.getByLabel("İlk günden devralınanlar",{exact:true}).waitFor();await boyut(p);
  await p.locator(".karar-dosyasi .secenek").nth(yol).click();await p.getByText("İnceleme takvime alındı",{exact:true}).waitFor();
  assert.equal(await p.locator(".pencere").evaluate(e=>e.scrollTop),0);
  let d=await durum(p);assert.equal(d.inceleme!.rapor,null);assert.equal(d.inceleme!.asama,"bekliyor");
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();
  d=ay(d);await yerlestir(p,d);await p.getByRole("button",{name:"Raporu aç",exact:true}).click();await p.locator(".karar-dosyasi").waitFor();assert.equal(await p.getByRole("dialog").count(),1);
  const ilkRapor=structuredClone(d.inceleme!.rapor);
  if(yol===0){
   assert.ok(await p.locator(".karar-dosyasi .secenek").nth(0).isEnabled()===false);
   await p.getByRole("button",{name:"Görüşmeye git · 1 gün",exact:true}).click();
   await p.locator(".anlati-sahnesi .secenek").nth(2).click();await p.getByRole("button",{name:"Konuşmayı sürdür",exact:true}).click();
   assert.ok(await p.locator(".anlati-sahnesi .secenek").nth(0).isEnabled()===false);
   await p.locator(".anlati-sahnesi .secenek").nth(1).click();await p.getByRole("button",{name:"Konuşmayı sürdür",exact:true}).click();
   await p.locator(".anlati-sahnesi .secenek").nth(0).click();await p.reload();
   await p.getByRole("button",{name:"Dosyaya dön",exact:true}).click();
   await p.locator(".karar-dosyasi .inceleme-ek").waitFor();assert.ok(await p.locator(".karar-dosyasi .secenek").nth(0).isEnabled());
   const y=await durum(p);assert.deepEqual(y.inceleme!.rapor,ilkRapor);assert.equal(y.inceleme!.hamKayit,false);assert.equal(y.inceleme!.tanikBeyani,true);
  }
  await boyut(p);await p.locator(".pencere").screenshot({path:root+`/testler/ciktilar/${ad}-inceleme-${yol}.png`});
  await p.locator(".karar-dosyasi .secenek").nth(yol===2?2:0).click();
  if(yol===1){
   await p.getByText("İnceleme takvime alındı",{exact:true}).waitFor();d=await durum(p);assert.equal(d.inceleme!.oncekiRaporlar.length,1);assert.deepEqual(d.inceleme!.oncekiRaporlar[0]!.rapor,ilkRapor);
   d=ay(d);await yerlestir(p,d);await p.getByRole("button",{name:"Raporu aç",exact:true}).click();await p.locator(".karar-dosyasi").waitFor();
   await p.locator(".karar-dosyasi .secenek").nth(0).click();
  }
  await p.getByText("Rapor kararı kaydedildi",{exact:true}).waitFor();assert.equal(await p.locator(".pencere").evaluate(e=>e.scrollTop),0);
  d=await durum(p);assert.equal(d.inceleme!.asama,"tamam");assert.equal(d.inceleme!.yayin,yol===2?"kapali":"acik");
  await boyut(p);await p.locator(".pencere").screenshot({path:root+`/testler/ciktilar/${ad}-inceleme-sonuc-${yol}.png`});
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();await p.reload();assert.equal(await p.getByRole("dialog").count(),0);
  assert.deepEqual(await durum(p),d);assert.deepEqual(hatalar,[]);await ctx.close();
 });
}
test("yetersiz gün ve imza görünür; eski kayda görevlendirme uydurulmaz",async()=>{
 const ctx=await browser.newContext(),p=await ctx.newPage();await p.goto("file://"+root+"/dist/index.html");const d=kur();d.bosGun=0;d.imza=3;await yerlestir(p,d);
 await p.locator(".dosya-satir").filter({hasText:"Bakanın dosyası, mühendisin itirazı"}).click();
 assert.ok(!await p.locator(".karar-dosyasi .secenek").nth(0).isEnabled());assert.ok(await p.locator(".karar-dosyasi .secenek").nth(1).isEnabled());assert.ok(!await p.locator(".karar-dosyasi .secenek").nth(2).isEnabled());
 await p.getByText("Bu ayın üç imzası kullanıldı.",{exact:true}).waitFor();
 const h=JSON.parse(kaydet(d));delete h.durum.inceleme;h.surum=11;h.durum.surum=11;
 await p.evaluate(({key,s})=>localStorage.setItem(key,s),{key,s:JSON.stringify(h)});await p.reload();assert.equal((await durum(p)).inceleme,null);assert.equal(await p.getByLabel("Akköprü inceleme kaydı",{exact:true}).count(),0);await ctx.close();
});
