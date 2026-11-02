import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {icerikDerle} from '../../derleyici/icerik-derle.ts';
import {yeniOyun} from '../../cekirdek/durum.ts';
import {oyunuBaslat} from '../../cekirdek/ay.ts';
import {kararVer} from '../../cekirdek/karar.ts';
import {soruBaglami,sahneSorusu,sahneCevaplari,sahneIsabeti} from '../../cekirdek/sahne-derinlik.ts';
import {basinAc,basinCevapla} from '../../cekirdek/medya.ts';
import {kaydet,yukle} from '../../cekirdek/kayit.ts';
const I=icerikDerle(fileURLToPath(new URL('../../icerik',import.meta.url))).paket!;
test('muhabir bütçeyi, tutulmayan sözü ve gerçek karar metnini sorar',()=>{
 const d=oyunuBaslat(yeniOyun(44),I);kararVer(d,I,d.masa[0]!.ornek,1);const karar=d.buAy.kararlar[0]!;assert.ok(soruBaglami(d,'selin').includes(karar.secenekMetni));d.gostergeler.butce_acigi=7.2;assert.ok(soruBaglami(d,'murat').includes('7.2'));assert.notEqual(sahneSorusu(d,'miting',0),sahneSorusu(d,'munazara',0));assert.notDeepEqual(sahneCevaplari(d,'miting',1),sahneCevaplari(d,'munazara',1));
});
test('aynı kampanya yanıtı ekonomik koşullara göre farklı sonuçlanır',()=>{
 const d=yeniOyun(1),e=yeniOyun(1);d.gostergeler.enflasyon=20;e.gostergeler.enflasyon=60;assert.ok(sahneIsabeti(d,0,2)>sahneIsabeti(e,0,2));assert.deepEqual(d.zar,e.zar);
});
test('tekrarlanan yalanın getirisi azalır ve sicil kayıtla korunur',()=>{
 const d=oyunuBaslat(yeniOyun(2),I);basinAc(d,I);for(let i=0;i<3;i++)assert.ok(basinCevapla(d,I,'yalan').ok);assert.ok(d.yonetim.medya.gecmis[2]!.sonuc.includes('tekrar'));assert.equal(d.sicil.length,3);const y=yukle(kaydet(d));assert.ok(y.ok);if(y.ok)assert.deepEqual(y.durum,d);
});
test('sekiz yeni hikayenin tüm dalları iki ayrı sona ulaşır ve kaybedenleri vardır',()=>{
 for(const z of ['su_hakki','ilac_patenti','kurye_sigorta','yurt_laboratuvar','afet_teslim','tarim_kooperatif','veri_sizintisi','liman_donusum']){
  const kok=I.kartlar[z+'_1']!;assert.ok(kok);const ziyaret=new Set<string>();const gez=(id:string)=>{if(ziyaret.has(id))return;ziyaret.add(id);for(const s of I.kartlar[id]!.secenekler)for(const n of s.sonraki)gez(n.kart);};gez(kok.id);assert.equal(ziyaret.size,5);assert.ok(ziyaret.has(z+'_son_a')&&ziyaret.has(z+'_son_b'));for(const id of ziyaret)assert.ok(I.kartlar[id]!.secenekler.some(s=>Object.values(s.etki).some(v=>v<0)));
 }
});
test('karar raporu anlık etki ile gecikmeli hedefi ayırır',()=>{
 const d=oyunuBaslat(yeniOyun(8),I);const m=d.masa[0]!;kararVer(d,I,m.ornek,0);assert.ok(d.buAy.olaylar.some(o=>o.startsWith('Karar izi:')&&o.includes(d.buAy.kararlar[0]!.baslik)));assert.ok(yukle(kaydet(d)).ok);
});
