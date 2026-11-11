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
function ilk(id:string){const d=oyunuBaslat(yeniOyun(527),I);d.ay=4;d.buAy=bosAyKaydi(4);d.bekleyen=[];d.anlati.iliskiler.suna_ekin=70;d.anlati.iliskiler.deniz_alaz=65;d.masa=[{kart:id,ornek:`hesap#${++d.sayac}`,degisken:{},agir:false,ikinciGorus:false}];return d;}
function ilerle(d:OyunDurumu,id:string){let n=0;while(!d.masa.some(m=>m.kart===id)){while(d.masa.length){botKarari(d,I,d.masa[0]!.ornek,2);assert.ok(++n<80);}const r=ayiBitir(d,I);if(!r.ok)throw Error(r.neden);d=r.durum;assert.ok(d.ay<=8);}return d;}
async function koy(p:Page,d:OyunDurumu){await p.evaluate(({key,s})=>localStorage.setItem(key,s),{key,s:kaydet(d)});await p.reload();}
async function durum(p:Page){const r=yukle(await p.evaluate(key=>localStorage.getItem(key)!,key));if(!r.ok)throw Error(r.hata);return r.durum;}
async function boyut(p:Page){await p.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});const r=await p.evaluate(()=>({yatay:document.documentElement.scrollWidth>innerWidth,pencere:[...document.querySelectorAll<HTMLElement>(".pencere")].some(e=>e.scrollWidth>e.clientWidth),kucuk:[...document.querySelectorAll("button,select")].some(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44;})}));assert.deepEqual(r,{yatay:false,pencere:false,kucuk:false});}
for(const[ad,width,height]of[["masaustu",1366,900],["telefon",440,956]]as const){
 test(`${ad}: kaza, ilk oturum, Suna yanıtı ve gerçek yardım kayıttan sürer`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors:string[]=[];p.on("pageerror",e=>errors.push(e.message));await p.goto("file://"+root+"/dist/index.html");await koy(p,ilk("akkopru_kaza"));
  const ac=async(t:string)=>{await p.locator(".dosya-satir").filter({hasText:t}).click();await p.locator(".karar-dosyasi .inceleme-giris, .karar-dosyasi .inceleme-izleme").waitFor();await boyut(p);};
  const sec=async(i:number)=>{await p.locator(".karar-dosyasi .secenek").nth(i).click();await p.getByText("Hesap dosyası güncellendi",{exact:true}).waitFor();assert.equal(await p.locator(".pencere").evaluate(e=>e.scrollTop),0);await boyut(p);};
  await ac("Hastane koridorundaki liste");await sec(0);let d=await durum(p);assert.equal(d.hesaplasma!.harcamaTL,0);assert.equal(d.hesaplasma!.asama,"bekleyen");await p.locator(".pencere").screenshot({path:root+`/testler/ciktilar/${ad}-kaza-yanit.png`});
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();d=ilerle(d,"akkopru_durusma");await koy(p,d);await ac("İlk oturum, açık kalan tarih");await sec(0);d=await durum(p);assert.equal(d.hesaplasma!.bakan,"uzaklastirildi");assert.equal(d.hesaplasma!.harcamaTL,0);
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();d=ilerle(d,"akkopru_durusma_takip");await koy(p,d);await ac("Suna’nın avukatından ikinci zarf");assert.equal((await durum(p)).hesaplasma!.aile,"gorusur");assert.ok(await p.locator(".karar-dosyasi .secenek").nth(1).isEnabled());await sec(1);d=await durum(p);assert.ok(d.hesaplasma!.harcamaTL>0);assert.equal(d.bayraklar.akkopru_sonuc,"kaza_yardim");
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();await p.reload();assert.deepEqual(await durum(p),d);assert.deepEqual(errors,[]);await ctx.close();
 });
 test(`${ad}: Deniz’in gönüllü ifadesi eski ham kaydı yaratmaz`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors:string[]=[];p.on("pageerror",e=>errors.push(e.message));await p.goto("file://"+root+"/dist/index.html");await koy(p,ilk("akkopru_tanik"));
  await p.locator(".dosya-satir").filter({hasText:"Deniz’in taşınma kutuları"}).click();await p.getByLabel("Kazadan devralınanlar").waitFor();await boyut(p);
  await p.locator(".karar-dosyasi .secenek").nth(0).click();await p.getByText("Hesap dosyası güncellendi",{exact:true}).waitFor();let d=await durum(p);assert.equal(d.hesaplasma!.beyan,false);assert.equal(d.bayraklar.akkopru_ham_veri,undefined);
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();d=ilerle(d,"akkopru_tanik_takip");await koy(p,d);
  await p.locator(".dosya-satir").filter({hasText:"Deniz’in gönderdiği zarf"}).click();await p.getByLabel("Akköprü hesaplaşma kaydı").waitFor();await boyut(p);assert.equal((await durum(p)).hesaplasma!.deniz,"ifade_istegi");
  await p.locator(".karar-dosyasi .secenek").nth(0).click();await p.getByText("Hesap dosyası güncellendi",{exact:true}).waitFor();d=await durum(p);assert.equal(d.hesaplasma!.beyan,true);assert.equal(d.bayraklar.akkopru_ham_veri,undefined);await boyut(p);await p.locator(".pencere").screenshot({path:root+`/testler/ciktilar/${ad}-deniz-ifade.png`});
  await p.getByRole("button",{name:"Masaya dön",exact:true}).click();await p.reload();assert.deepEqual(await durum(p),d);assert.deepEqual(errors,[]);await ctx.close();
 });
}
