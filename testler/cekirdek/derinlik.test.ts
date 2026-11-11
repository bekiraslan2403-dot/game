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
import {masaKur} from '../../cekirdek/deste.ts';
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
test('karar raporu anlık etki ile gecikmeli hedefi ayırır ve yalnız açılan dosyayı kaydeder', () => {
 const d = yeniOyun(8);
 const kart = structuredClone(I.kartlar.asgari_ucret!);
 kart.secenekler[0]!.etki = { enflasyon: 1, 'grup.emekli': 2 };
 kart.secenekler[0]!.sonraki = [
  { kart: 'emekli_bordro_sira', gecikme: 1, kosul: { bayrak: { kilitli: true } } },
  { kart: 'emekli_bordro_makbuz', gecikme: 2 },
  { kart: 'acik_sehir', gecikme: 2 },
 ];
 const hedefKart = { ...I.kartlar.emekli_bordro_sira!, metin: { ...I.kartlar.emekli_bordro_sira!.metin, baslik: '{il:de} banka sırası' } };
 const paket = { ...I, kartlar: { ...I.kartlar, [kart.id]: kart, acik_sehir: hedefKart } };
 d.masa = [{ ornek: 'ucret#1', kart: kart.id, degisken: {}, agir: false, ikinciGorus: false }];

 const sonuc = kararVer(d, paket, 'ucret#1', 0);
 assert.ok(sonuc.ok && sonuc.uygulama);
 const uygulama = sonuc.uygulama;
 assert.ok(uygulama.etkiler.some(m => m.startsWith('Enflasyon hedefine') && m.includes('zamanla')));
 assert.ok(uygulama.etkiler.some(m => m.includes('seçmen desteği') && m.includes('arttı')));
 assert.deepEqual(uygulama.takip, [{ ay: 3, baslik: 'Eczacı makbuzu getirdi' }, { ay: 3, baslik: 'Yeni karar dosyası' }]);

 const geri = yukle(kaydet(d));
 assert.ok(geri.ok);
 assert.deepEqual(geri.durum.buAy.kararlar[0]?.uygulama, uygulama);
 const eski = JSON.parse(kaydet(d));
 delete eski.durum.buAy.kararlar[0].uygulama;
 eski.durum.buAy.olaylar = ['Karar izi: Eski kararın tarihî notu.'];
 const arsiv = yukle(JSON.stringify(eski));
 assert.ok(arsiv.ok);
 assert.equal(arsiv.durum.buAy.kararlar[0]?.uygulama, undefined);
 assert.deepEqual(arsiv.durum.buAy.olaylar, eski.durum.buAy.olaylar);
});

test('bekleyen yeni hikâye, aynı ayı gelen üç devam zincirinin önüne geçemez', () => {
 const d=yeniOyun(71);d.ay=5;
 const ids=['su_hakki_1','ilac_patenti_2a','kurye_sigorta_2a','yurt_laboratuvar_2a'];
 const paket={...I,kartlar:Object.fromEntries(ids.map(id=>[id,I.kartlar[id]!]))};
 d.bekleyen=ids.map(kart=>({kart,ay:5,degisken:{},agir:false}));
 masaKur(d,paket);
 assert.deepEqual(d.masa.map(m=>m.kart),ids.slice(1));
 assert.equal(d.bekleyen[0]?.kart,'su_hakki_1');
 assert.equal(d.bekleyen[0]?.ay,6);
 assert.equal(new Set(d.masa.map(m=>paket.kartlar[m.kart]!.zincir)).size,3);
 assert.ok(yukle(kaydet(d)).ok);
});

test('ertelenen hikâye kendi yerini kilitlemez; üç zincir bitince sırayla açılır', () => {
 const zincirler=['su_hakki','ilac_patenti','kurye_sigorta','yurt_laboratuvar'];
 const paket={...I,kartlar:Object.fromEntries(Object.entries(I.kartlar).filter(([,k])=>zincirler.includes(k.zincir??'')))};
 const d=yeniOyun(72);d.ay=5;
 d.bekleyen=zincirler.map(z=>({kart:z+'_1',ay:5,degisken:{il:'Taşhan'},agir:false}));
 masaKur(d,paket);
 assert.equal(d.masa.length,3);
 assert.equal(d.bekleyen[0]?.kart,'yurt_laboratuvar_1');
 assert.equal(d.bekleyen[0]?.degisken.il,'Taşhan');
 for(let ay=5;ay<=7;ay++) {
  assert.ok(!d.masa.some(m=>m.kart==='yurt_laboratuvar_1'));
  while(d.masa.length)assert.ok(kararVer(d,paket,d.masa[0]!.ornek,0).ok);
  d.ay++;d.masaKuruldu=false;masaKur(d,paket);
 }
 assert.equal(d.masa[0]?.kart,'yurt_laboratuvar_1');
 assert.equal(d.bekleyen.length,0);
});

test('karar izi yer tutucuları çözer ve ücret/fatura etkilerini atlamaz', () => {
 const d=yeniOyun(73);
 const kart=structuredClone(I.kartlar.asgari_ucret!);
 kart.secenekler[0]!.metin='{il:de} ücret ve fatura düzenle';
 kart.secenekler[0]!.ekonomi={asgari_artis:10,fatura_artis:5};
 const paket={...I,kartlar:{[kart.id]:kart}};
 d.masa=[{ornek:'ucret#1',kart:kart.id,degisken:{il:'Taşhan'},agir:false,ikinciGorus:false}];
 assert.ok(kararVer(d,paket,'ucret#1',0).ok);
 const karar = d.buAy.kararlar[0]!;
 assert.ok(karar.secenekMetni.includes("Taşhan'da"));
 assert.ok(!karar.secenekMetni.includes('{il'));
 assert.ok(karar.uygulama?.etkiler.some(iz => iz.startsWith('Asgari ücret ')));
 assert.ok(karar.uygulama?.etkiler.some(iz => iz.startsWith('Hane faturası ')));
});
