import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import {chromium,type Browser,type Page} from "playwright";
import {readFileSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {yeniOyun,type OyunDurumu} from "../../cekirdek/durum.ts";
import {oyunuBaslat,ayiBitir} from "../../cekirdek/ay.ts";
import {kararVer} from "../../cekirdek/karar.ts";
import {kaydet,yukle} from "../../cekirdek/kayit.ts";
import type {IcerikPaketi} from "../../cekirdek/icerik.ts";
const root=fileURLToPath(new URL("../..",import.meta.url)),key="akkopru-2026:otomatik";
const I=JSON.parse(readFileSync(root+"/uretilen/icerik.json","utf8")) as IcerikPaketi;
let browser:Browser;
before(async()=>{browser=await chromium.launch();mkdirSync(root+"/testler/ciktilar",{recursive:true});});
after(async()=>{await browser?.close();});
async function kayit(p:Page){const s=await p.evaluate(k=>localStorage.getItem(k)!,key),y=yukle(s);if(!y.ok)throw Error(y.hata);return y.durum;}
async function yerlestir(p:Page,d:OyunDurumu){await p.evaluate(({key,s})=>localStorage.setItem(key,s),{key,s:kaydet(d)});await p.reload();}
async function boyut(p:Page){
 await p.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
 const r=await p.evaluate(()=>({tasma:document.documentElement.scrollWidth>innerWidth,pencere:[...document.querySelectorAll<HTMLElement>(".pencere")].some(e=>e.scrollWidth>e.clientWidth),kucuk:[...document.querySelectorAll("button,select")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height<44;}).map(e=>e.textContent)}));
 assert.deepEqual(r,{tasma:false,pencere:false,kucuk:[]});
}
async function konus(p:Page,adim:number,secenek=0){await p.locator(".anlati-sahnesi .secenek").nth(secenek).click();await p.getByRole("button",{name:adim===2?"Kararını ver":"Konuşmayı sürdür",exact:true}).click();}
function ay(d:OyunDurumu){let n=0;while(d.masa.length){assert.ok(kararVer(d,I,d.masa[0]!.ornek,2).ok);assert.ok(++n<80);}const r=ayiBitir(d,I);if(!r.ok)throw Error(r.neden);return r.durum;}
for(const[ad,width,height]of[["masaustu",1366,900],["telefon",440,956]] as const){
 test(`${ad}: saha görüşmesi kayıttan sürer; gecikme, dönüş ziyareti ve fiilî sonuç görülür`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage();const errors:string[]=[];p.on("pageerror",e=>errors.push(e.message));
  const ilk=oyunuBaslat(yeniOyun(51),I);
  await p.goto("file://"+root+"/dist/index.html");await yerlestir(p,ilk);
  await p.getByRole("button",{name:/Ajandayı aç/}).click();await p.getByLabel("Şehir",{exact:true}).selectOption("Taşhan");
  assert.equal(await p.getByLabel("Şehir",{exact:true}).locator("option").count(),3);
  await p.getByRole("button",{name:"Ziyarete git",exact:true}).click();
  await p.locator(".anlati-sahnesi").waitFor();assert.equal(await p.getByRole("dialog").count(),1);
  await boyut(p);await p.screenshot({path:root+`/testler/ciktilar/${ad}-saha-ilk.png`,fullPage:true});
  const acik=await kayit(p);assert.equal(acik.bosGun,3);assert.equal(acik.meclis.sahneAy,1);assert.deepEqual(acik.gostergeler,ilk.gostergeler);
  await p.locator(".anlati-sahnesi .secenek").nth(0).click();await p.locator(".anlati-gozlem").waitFor();
  await p.reload();await p.getByRole("button",{name:"Konuşmayı sürdür",exact:true}).click();
  assert.equal((await kayit(p)).bosGun,3);
  await konus(p,1);await konus(p,2,1);
  await p.locator(".karar-dosyasi").waitFor();assert.equal(await p.getByRole("dialog").count(),1);
  await boyut(p);await p.screenshot({path:root+`/testler/ciktilar/${ad}-saha-karar.png`,fullPage:true});
  await p.locator(".karar-dosyasi .secenek").nth(0).click();await p.getByRole("button",{name:"Masaya dön",exact:true}).click();
  let d=await kayit(p);assert.equal(d.saha.tashan!.durum,"program");assert.equal(d.imza,1);assert.equal(d.saha.tashan!.faydaUygulandi,false);
  const harcama=d.saha.tashan!.harcama;d=ay(ay(ay(d)));assert.equal(d.saha.tashan!.durum,"aksadi");
  await yerlestir(p,d);await p.getByRole("button",{name:/Ajandayı aç/}).click();
  await p.locator(".saha-izleme > p").filter({hasText:/ekip koordinasyonu/}).waitFor();
  await p.getByRole("button",{name:"Dönüş ziyaretine git",exact:true}).click();
  await konus(p,0);await konus(p,1);await konus(p,2);
  await p.locator(".karar-dosyasi").waitFor();await boyut(p);
  await p.screenshot({path:root+`/testler/ciktilar/${ad}-saha-donus.png`,fullPage:true});
  await p.locator(".karar-dosyasi .secenek").nth(0).click();await p.getByRole("button",{name:"Masaya dön",exact:true}).click();
  d=await kayit(p);assert.equal(d.saha.tashan!.guclendirildi,true);assert.ok(d.saha.tashan!.harcama>harcama);
  d=ay(ay(d));assert.equal(d.saha.tashan!.durum,"tamamlandi");await yerlestir(p,d);
  await p.getByRole("button",{name:/Ajandayı aç/}).click();await p.locator(".saha-izleme > p").filter({hasText:/fiilî teslim açıldı/}).waitFor();
  assert.ok(await p.getByRole("button",{name:"Ziyaret tamamlandı",exact:true}).isDisabled());
  await boyut(p);assert.deepEqual(errors,[]);await ctx.close();
 });
}

test("ortak sahne hakkı ve doğrulanmamış kayıt oyun içinde görünür biçimde kısıtlar",async()=>{
 const ctx=await browser.newContext(),p=await ctx.newPage();let d=oyunuBaslat(yeniOyun(3),I);d.meclis.sahneAy=1;
 await p.goto("file://"+root+"/dist/index.html");await yerlestir(p,d);await p.getByRole("button",{name:/Ajandayı aç/}).click();
 assert.ok(await p.getByRole("button",{name:"Ziyarete git",exact:true}).isDisabled());await p.getByText(/Bu ayın sahne hakkı kullanıldı/).waitFor();
 d=oyunuBaslat(yeniOyun(3),I);await yerlestir(p,d);await p.getByRole("button",{name:/Ajandayı aç/}).click();await p.getByRole("button",{name:"Ziyarete git",exact:true}).click();
 await konus(p,0,2);
 assert.ok(await p.locator(".anlati-sahnesi .secenek").nth(0).isDisabled());
 await konus(p,1,1);await konus(p,2,0);
 assert.ok(await p.locator(".karar-dosyasi .secenek").nth(0).isDisabled());await p.getByText(/Yerinde kayıt doğrulanmadı/).waitFor();
 assert.ok(await p.locator(".karar-dosyasi .secenek").nth(1).isEnabled());await ctx.close();
});
