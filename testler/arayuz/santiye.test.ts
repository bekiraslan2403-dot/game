import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { yeniOyun, bosAyKaydi, type OyunDurumu } from "../../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir } from "../../cekirdek/ay.ts";
import { botKarari } from "../yardim/bot.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
const root=fileURLToPath(new URL("../..",import.meta.url)),key="akkopru-2026:otomatik";
const I=JSON.parse(readFileSync(root+"/uretilen/icerik.json","utf8")) as IcerikPaketi;
let browser:Browser;
before(async()=>{browser=await chromium.launch();mkdirSync(root+"/testler/ciktilar",{recursive:true});});
after(async()=>{await browser?.close();});
function ilk(){const d=oyunuBaslat(yeniOyun(889),I);d.ay=4;d.buAy=bosAyKaydi(4);d.bekleyen=[];d.masa=[{kart:"akkopru_onarim",ornek:`santiye#${++d.sayac}`,degisken:{il:"Akköprü"},agir:false,ikinciGorus:false}];return d;}
function ilerle(d:OyunDurumu,id:string){let n=0;while(!d.masa.some(m=>m.kart===id)){while(d.masa.length){botKarari(d,I,d.masa[0]!.ornek,2);assert.ok(++n<80);}const r=ayiBitir(d,I);if(!r.ok)throw Error(r.neden);d=r.durum;assert.ok(d.ay<=8);}return d;}
async function koy(p:Page,d:OyunDurumu){await p.evaluate(({key,s})=>localStorage.setItem(key,s),{key,s:kaydet(d)});await p.reload();}
async function durum(p:Page){const r=yukle(await p.evaluate(key=>localStorage.getItem(key)!,key));if(!r.ok)throw Error(r.hata);return r.durum;}
async function boyut(p:Page){
 await p.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
 const r=await p.evaluate(()=>({yatay:document.documentElement.scrollWidth>innerWidth,pencere:[...document.querySelectorAll<HTMLElement>(".pencere")].some(e=>e.scrollWidth>e.clientWidth),kucuk:[...document.querySelectorAll("button,select")].some(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44;})}));assert.deepEqual(r,{yatay:false,pencere:false,kucuk:false});
}
for(const[ad,width,height]of[["masaustu",1366,900],["telefon",440,956]]as const)test(`${ad}: yapım, fiziksel teslim, bağımsız deney ve açılış ayrı sonuçlarda görünür`,async()=>{
 const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors:string[]=[];p.on("pageerror",e=>errors.push(e.message));
 await p.goto("file://"+root+"/dist/index.html");await koy(p,ilk());
 const ac=async(baslik:string)=>{await p.locator(".dosya-satir").filter({hasText:baslik}).click();await p.locator(".karar-dosyasi .inceleme-izleme, .karar-dosyasi .inceleme-giris").waitFor();await boyut(p);};
 const uygula=async(i:number)=>{await p.locator(".karar-dosyasi .secenek").nth(i).click();await p.getByText("Şantiye işlemi kaydedildi",{exact:true}).waitFor();assert.equal(await p.locator(".pencere").evaluate(e=>e.scrollTop),0);assert.equal(await p.locator(".sonuc").evaluate(e=>e===document.activeElement),true);await boyut(p);};
 await ac("Şantiye kapısındaki üç imza");await uygula(0);let d=await durum(p);assert.equal(d.santiye!.asama,"yapim");assert.equal(d.santiye!.ucret,"bekliyor");await p.locator(".pencere").screenshot({path:root+`/testler/ciktilar/${ad}-santiye-baslangic.png`});
 await p.getByRole("button",{name:"Masaya dön",exact:true}).click();d=ilerle(d,"akkopru_teslim");await koy(p,d);await ac("Teslim tutanağındaki boşluk");assert.equal((await durum(p)).santiye!.asama,"fiziksel_teslim");await uygula(0);d=await durum(p);assert.equal(d.santiye!.teknik,"bekliyor");
 await p.getByRole("button",{name:"Masaya dön",exact:true}).click();d=ilerle(d,"akkopru_kabul");await koy(p,d);await ac("Yük deneyinin mühürü");assert.equal((await durum(p)).santiye!.teknik,"uygun");await uygula(0);d=await durum(p);assert.equal(d.santiye!.asama,"kabul");assert.ok(d.masa.some(m=>m.kart==="akkopru_son"));
 await p.getByRole("button",{name:"Masaya dön",exact:true}).click();await p.reload();assert.deepEqual(await durum(p),d);assert.deepEqual(errors,[]);await ctx.close();
});
