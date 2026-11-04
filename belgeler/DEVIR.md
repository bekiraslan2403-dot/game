# Akköprü 2026 — devir notu (2 Kasım 2026)

Bu not, geliştirmeyi devralacak kişi ya da yapay zekâ içindir. Birlikte gönderilen `TASARIM_BELGESI.md` oyunun tam tasarım belgesidir; kurallar ve kilitli kararlar oradadır. Bu not, şimdiye kadar ne yapıldığını, kodun nasıl düzenlendiğini ve sırada ne olduğunu anlatır.

## Proje
Kurgusal "Doruk Cumhuriyeti"nde geçen, anlatı ağırlıklı, Türkçe bir siyaset simülasyonu. Oyuncu, seçime 18 ay kala göreve gelen cumhurbaşkanıdır. Oyun Kasım 2026'da başlar; 18. ay (Nisan 2028) seçim ayıdır. Ton: kara mizahlı dram. Ülke, kişiler, partiler ve kurumlar kurgusaldır.

- Depo: https://github.com/bekiraslan2403-dot/game (güncel geliştirme dalı: `feat/masaustu-macos`; `main` henüz toplu çalışmayı içermez)
- Depodaki `README.md` komutları, klasörleri ve ilerleme tablosunu içerir.
- Tasarım belgesi ve oynanabilir sürüm claude.ai'de gizli bağlantılardadır; tasarım belgesinin tam metni `TASARIM_BELGESI.md` dosyasındadır.

## Teknik yapı
- TypeScript, React 19, esbuild. Oyun tek dosyaya derlenir: `dist/index.html` (internetsiz çalışır).
- İçerik YAML dosyalarındadır, Zod şemasıyla denetlenir.
- Testler: Node test aracı (çekirdek), Playwright (tarayıcıda duman testi; masaüstü 1366×900 ve iPhone 17 Pro Max 440×956).
- Masaüstü: Tauri 2 Mac sarmalayıcısı `src-tauri/` içinde. Apple Silicon + Intel evrensel DMG derlemesi `.github/workflows/macos.yml` ile yapılır. Mobil Capacitor henüz kurulmadı.
- Kurulum: `npm install` ve `npx playwright install chromium`.
- Komutlar: `npm run derle`, `npm test`, `npm run test:arayuz`, `npm run tipler`, `npm run icerik`, `npm run denetle` (hepsi sırayla; her değişiklikten sonra geçmeli).
- `tipler/react-shim.d.ts`: @types/react kurulamadığı için yazılmış küçük tip dosyası. `npm install -D @types/react @types/react-dom` sonrası silinebilir.
- `araclar/yerel-paketler.sh` yalnız Claude'un bulut ortamı içindir; normal ortamda gerekmez.
- 0.4.0 itibarıyla IBM Plex Sans/Serif/Mono çevrimdışı gömülüdür; SIL OFL lisansları `arayuz/fontlar/` içindedir.
- GitHub Actions: `.github/workflows/denetle.yml` her push'ta `npm run denetle` çalıştırır.

## Kurallar
- Oyun durumu tek bir düz veri nesnesidir (`cekirdek/durum.ts`, `OyunDurumu`) ve kayda olduğu gibi yazılır.
- Bütün rastgelelik tohumlu zardan gelir (`cekirdek/zar.ts`). `Math.random` yalnız yeni oyunun tohumunu üretir. Aynı tohum ve aynı kararlar aynı oyunu üretir.
- Durum biçimi değişirse `DURUM_SURUMU` artırılır ve `cekirdek/kayit.ts` içine göç yazılır. Şu anki sürüm: 13 (1→2→3→4→5→6→7→8→9→10→11→12→13 göçleri var).
- `cekirdek/` DOM'a erişmez. Arayüz `arayuz/` klasöründedir.
- Testler geçmeden bir iş bitmiş sayılmaz.
- Tasarım belgesinde kilitli bir karar değişecekse önce belge güncellenir, sonra kod.
- Kart kuralları: her kartta tam 3 seçenek; durum metni en fazla 60, seçenek metni en fazla 12, başlık en fazla 10, kulis notu en fazla 30 sözcük; her kartta en az bir seçeneğin bir kaybedeni olmalı.
- Metinlerde `{il}` ve ekli biçim `{il:de}` kullanılır ("Yalıkent'te"). Ekler: de, deki, den, e, i, in, le (`cekirdek/ekler.ts`, `cekirdek/metin.ts`).
- Arayüz önce telefon için tasarlanır. Her düğme ve seçim kutusu en az 44 nokta; yatay taşma olmaz (duman testi denetler).
- Görsel dil: kâğıt beyazı zemin, mürekkep laciverdi yazı, mühür kırmızısı vurgu; koyu tema var. Ekonomi sayıyla, kamuoyu ve siyaset sözlü gösterilir ("öfkeli/kırgın/kararsız/memnun/coşkulu", "çok zayıf…çok güçlü").

## Klasörler ve dosyalar
- `cekirdek/`
  - `durum.ts`: durum tipi, yeni oyun
  - `ay.ts`: ay başı ve ay sonu
  - `deste.ts`: masanın doldurulması
  - `karar.ts`: karar, erteleme, ikinci görüş, danışman tahmini
  - `kosul.ts`: kart ve sahne koşulları
  - `gostergeler.ts`: göstergeler
  - `ekonomi.ts`: ekonomi modeli
  - `hazine.ts`: Hazine araçları, söz defteri
  - `politika.ts`: politika dosyası, Meclis oylaması
  - `kamuoyu.ts`: grupların aylık değişimi, anketler
  - `toplum.ts`: beş hayat, gazeteler, ziyaretçiler, sokak eylemleri
  - `kayit.ts`: kayıt, yükleme, göçler
  - `icerik.ts`: Zod şemaları
  - `takvim.ts`, `zar.ts`, `metin.ts`, `ekler.ts`
- `arayuz/`
  - `ekranlar.tsx`: açılış, masa, karar dosyası, ay sonu raporu, alt menü
  - `hazine.tsx`: gösterge şeridi, Hazine masası
  - `ulke.tsx`: Ülke ekranı
  - `dosyalar.tsx`: politika dosyası
  - `toplum.tsx`: gazeteler, beş hayat, kapı, sokak
  - `useOyun.ts`: durum kancası, otomatik kayıt
  - `bicim.ts`, `bilesenler.tsx`, `kalici.ts`, `stil.css`
- `derleyici/icerik-derle.ts`: YAML'ı okur, denetler, `uretilen/icerik.json` dosyasına yazar.
- `icerik/`
  - `kartlar/ana.yaml`, `masa.yaml`, `zincirler.yaml`, `ekonomi.yaml`, `olaylar.yaml`, `kriz_masasi.yaml`, `genisleme.yaml`
  - `politikalar.yaml`, `hayatlar.yaml`, `toplum.yaml`, `karakterler.yaml`, `sehirler.yaml`
- `testler/cekirdek/`: akis, durum, ekler, icerik, zar, ekonomi, politika, toplum
- `testler/arayuz/duman.test.ts`

## Ayın akışı
Ay başında (`ayiAc`) takvimde 4 boş gün açılır, erteleme hakkı ve 3 imza hakkı yenilenir, masa kurulur ve kapıya 3 ziyaretçi gelir.

Masa sırası:
1. Zamanı gelen bekleyen kartlar
2. Ayın ana kararı (takvime bağlı olan önce gelir)
3. 2–3 masa kartı

Masa kuralları:
- Aynı kategoriden ayda en fazla 2 kart, aynı kişiden en fazla 1 kart gelir.
- Görülen bir kart 12 ay tekrar gelmez (`tekrar: true` olanlar gelebilir).
- Kur baskısı varken ekonomi kartları 2 kat sık gelir.

Masada kart bekliyorsa ay bitmez. Oyuncu ayda bir masa kartını erteleyebilir; ertelenen kart ertesi ay etkileri 1,5 kat olarak gelir. Ana karar ve acil karar ertelenemez. İkinci görüş takvimden 1 gün alır ve tahminin hata payını yarıya indirir.

Ay sonu (`ayiBitir`) sırası:
1. Meclis oylaması
2. Sözlerin vadesi
3. Ekonominin bir aylık ilerleyişi
4. Kamuoyu ve anketler
5. Kabul edilmeyen ziyaretçiler
6. Sokak eylemleri
7. Beş hayat sahneleri
8. Gazete manşetleri
9. Ayın raporu (`AyKaydi`: kararlar, ertelenenler, haberler, olaylar, hayatlar, gösterge değişimleri)

18. ayda `ayiBitir` seçim gecesini bir kez hesaplar; rapordan sonra sayım, gerekiyorsa ikinci tur ve itiraz, ardından sonsöz açılır.

## Tamamlananlar

### Altyapı (iş listesi madde 1–6)
- Proje iskeleti, durum, tohumlu zar, sürümlü kayıt ve göçler.
- İçerik derleyici ve Türkçe hata iletileri, Türkçe ek motoru.
- Ayın akışı, masa ekranı, karar dosyası, ay sonu raporu, görsel dil.

### Ekonomi (madde 7, Sistem 3)
- 8 gösterge: enflasyon %29, büyüme %2,5, işsizlik %8, bütçe açığı %3,5 GSYH, dolar 50 TL, politika faizi %35, yatırımcı güveni "orta", rezerv "rahat".
- Enflasyon, büyüme ve işsizlik karar etkisiyle anında değişmez. Etki bir hedefi kaydırır (katkı her ay %8 söner); gösterge her ay hedefe doğru ilerler.
- Gecikmeler: harcama 2–4 ayda, faiz 3–6 ayda tam etki eder. Güven ve rezerv anında değişir. Kur ve enflasyon birbirini besler.
- Faizi Merkez Bankası kendi kuralıyla belirler (enflasyon + 6 + 0,5 × (enflasyon − 29) − baskı). Oyuncu yalnız baskı yapabilir.
- Bütçe: 8 gider kalemi (emekli, personel, faiz, sağlık, eğitim, savunma, sosyal, yatırım) ve 5 gelir kalemi (gelir vergisi, KDV-ÖTV, kurumlar, akaryakıt-tütün, diğer). Açık, kalemlerin farkıdır. Karttaki `butce_acigi` etkisi kartın `kalem` alanındaki kaleme yazılır; alan yoksa kategoriye göre seçilir.
- Hazine masası: 4 araç, her biri ayda bir kez. Harcama kesintisi %5, vergi artışı %5, dış borçlanma (rezerv +12, kalıcı faiz yükü), Merkez Bankası'na baskı (faiz −2, kur +%3, güven −5, sicile kayıt). Ayrıca söz defteri (tutulmayan söz sicile "kırılan söz" olarak düşer).
- Resmî ve gerçek enflasyon ayrımı: sadık bir İstatistik Kurumu başkanı resmî oranı 3–8 puan düşük açıklar.
- Hissedilen ekonomi: 6 ürünlük market sepeti (ekmek, çay, süt, peynir, ayçiçek yağı, kıyma) ve asgari ücretli 4 kişilik ailenin bütçesi.
- Kriz: yalnız kur şoku. Güven 20'nin, rezerv 55'in altına inince başlar; kur %6–10 sıçrar ve acil kart zinciri gelir. Güven 30'u geçince kapanır. Aynı anda en fazla 2 kriz.

### Politika dosyası (kapsam genişlemesi)
- 38 kademeli ayar (14 politika, 24 yönetmelik), 6 bölümde.
- Kararname hemen yürürlüğe girer. Kanun teklifi ay sonunda Meclis'te oylanır; geçme olasılığı Sistem 2 sandalye ve vekil oylarıyla sayılır. Reddedilen teklif parti içi huzursuzluğu artırır.
- Ayda 3 imza hakkı. Her kademe değişikliği `adim` etkisini uygular; kademe düşünce etki ters işaretle uygulanır.

### Kamuoyu ve Ülke ekranı (madde 8)
- 12 seçmen grubu (nüfus payları örtüşür), 6 toplum göstergesi (sosyal huzur, güvenlik, yargı, kamu hizmetleri, konuta erişim, deprem hazırlığı), 5 siyaset göstergesi.
- Gruplar her ay hissedilen pahalılığa, işsizliğe ve hane bütçesine tepki verir.
- 3 anket şirketi:
  - Merkez Araştırma: iktidara +2,5 puan, her ay
  - Panorama: −1,5 puan, her ay
  - Saha Kamuoyu: yansız, iki ayda bir
- Ekranda üç şirketin son anketlerinin ortalaması gösterilir.

### Sokak (madde 9)
- Bir grup 30'un altına düşünce eylem başlayabilir (en fazla 3 eylem).
- Kalabalık iki rakamla verilir: emniyete göre / düzenleyicilere göre.
- Müdahaleler: temsilcileri dinle (1 gün), talebi karşıla (bütçe), polisi gönder (sicile kayıt, yaralı sayısı). Görmezden gelinen eylem büyür; eylem en geç 3 ayda biter.
- Henüz yok: ülke haritası.

### Kartlar
- 113 kart: takvime bağlı ana kararlar, prototipten taşınan olaylar, zincirler.
- 6 kriz masası: orman yangını, maden, gaz kesintisi, banka, salgın, rehine. Her biri aynı ay içinde 5 adım ilerler (`sonraki` içinde `gecikme: 0`).
- Simülasyonda ayda ortalama 5 karar geldi ve 111 kartın hepsi en az bir kez masaya geldi.

### Toplum
- Beş hayat: Sevim (emekli öğretmen), Mert (motokurye), Necdet (bakkal), Ece (tıp öğrencisi), Ayşe (depremzede). Toplam 54 sahne; ayda en fazla 2 sahne gelir, simülasyonda ortalama 1,5. Kişiler ruh hâliyle görünür ve kalıcı olarak ayrılabilir.
- Sabah gazeteleri: Doruk Sabah (yandaş), Halkın Sesi (muhalif), Finans Gündem. Ayın en çok ses getiren kararından manşet çıkar.
- Kapıda bekleyenler: her ay 3 ziyaretçi; kabul takvimden 1 gün alır; kabul edilmeyen ay sonunda küser.

### Arayüz
- Alt menü: Masa, Ülke, Hazine, Dosyalar ve "Ayı bitir".
- Gösterge şeridi geçen ayın yön oklarını gösterir.

### Testler
Güncel doğrulama sayıları son sürüm notunda belirtilir; çekirdek testlerine 18 aylık 1.000 bot oyunu dahildir.

## İçerik biçimi (YAML)
- Kart alanları: `id`, `kategori`, `tur` (ana/masa/zincir/acil), `zincir` ve `asama` (tohum/gelisme/doruk/sonuc), `getiren` (karakter), `kalem`, `kosul`, `agirlik`, `tekrar`, `degiskenler` (ör. `{ il: muhalif_sehir }`), `ertelenince`, `metin` (`baslik`, `durum`, `kulis`), `secenekler` (tam 3).
- Seçenek alanları: `metin`, `etki`, `bayrak`, `sonraki` (`[{kart, gecikme}]`), `sicil` (`{tur, kaynak}`; türler: usulsuzluk/yalan/kirilan_soz/baski), `haber`, `ekonomi`.
  - `ekonomi` içinde: `kalem`, `asgari_artis`, `fatura_artis`, `istatistik` (liyakatli/sadik), `soz`.
- Koşul alanları: `ay_en_az`, `ay_en_cok`, `takvim_ayi`, `bayrak`, `bayrak_yok`, `gosterge` (`{id: {en_az, en_cok}}`), `politika` (`{id: {en_az, en_cok}}`, kademe 0'dan başlar).
- Etki birimleri:
  - Ekonomi göstergeleri: puan, kur için TL
  - Gruplar ve sözlü göstergeler: 0–100 ölçeğinde puan
- Gösterge kimlikleri:
  - Ekonomi: enflasyon, buyume, issizlik, butce_acigi, kur, faiz, guven, rezerv
  - Seçmen grupları: grup.muhafazakar, grup.laik, grup.milliyetci, grup.kalan, grup.emekli, grup.isci, grup.memur, grup.esnaf, grup.is_dunyasi, grup.genc, grup.kentli, grup.kiraci
  - Siyaset: kutuplasma, rakip, parti_ici, basin, itibar
  - Toplum: huzur, guvenlik, yargi, kamu_hizmet, konut, deprem

## Tasarım belgesiyle kodun farkları
- Tasarım belgesinde ayda 1 ana karar ve 2–3 masa kararı ile 25–30 kalemlik bir "Program" listesi öngörülüyordu. Oyuncu geri bildirimi üzerine (1 Kasım 2026) 38 ayarlık politika dosyası ve 111 kartlık havuz eklendi. Bu genişleme `TASARIM_BELGESI.md` içindeki "Kapsam genişlemesi" bölümünde yazılıdır.
- Sistem 3'te kriz eşiği "güven çok zayıf ve rezerv sıkışık" diye geçer; kodda güven 20'nin, rezerv 55'in altıdır.
- Sistem 4'te sokak müdahalesi 4 seçeneklidir (dinle, karşıla, polis, görmezden gel). Kodda "görmezden gel" ayrı bir düğme değildir; hiçbir şey yapılmazsa eylem büyür.
- Tasarım belgesindeki klasör ağacında Svelte yazar; React 19 kullanılıyor.
- Kapıda bekleyen ziyaretçiler prototipten taşındı; tasarım belgesinde ayrı bir bölüm olarak yer almaz.

## Yapılacaklar (tasarım belgesindeki iş listesi)
10. **Tamamlandı (dikey kesit): Meclis, oylama ve kulis sahnesi (Sistem 2).** Ayrıntılar aşağıda; 11 ve devamı 0.3.0 toplu tarayıcı sürümünde genişletildi.
11. **Gündem ekranı.** Kanallar, sosyal medya ve gündem listesi. Sabah gazeteleri yapıldı.
12. **Basın toplantısı sahnesi** (tam ekran sahne; 3 soru, 5 gazeteci, cevap türleri: açık, kaçamak, müjde, yalan, iftira, gazeteciyi azarlama).
13. **Sicil, ifşa ve olay zincirleri.** Sicil kayıtları birikiyor ama ifşa mekanizması yok. Tasarıma göre her kayıt her ay belli bir olasılıkla ifşa olur. İfşa anında üç yol sunulur: kabul et ve sorumluyu feda et, inkâr et (yeni yalan kaydı), karşı saldırı (kutuplaşma artar). İfşa olmayan kayıtlar sonsözde "yıllar sonra ortaya çıkanlar" olarak anlatılır.
14. **Ay sonu raporu ve beş hayatın kalanı.** Seçim gecesi beş kişinin oyu ve sonsözdeki akıbetleri.
15. **Vektör portre üreticisi** (yüz, saç, gözlük, bıyık parçalarından; 3 ifade) ve 24 ince çizgi ikon. Şu an kişiler baş harf rozetiyle gösteriliyor.
16. **Ses efektleri.** Web Audio ile kodla üretilen 20 efekt. Ses ve müzik ayrı ayrı açılıp kapanır.
17. **İçerik.** Hedef 40 kart ve 3 zincirdi, 111 kart yazıldı. Tasarımdaki 3 zincirden "sokaktan gelen protesto" zinciri ile Akköprü kazası ve rakibin dosyası zincirleri yazılacak.
18. **Anlatı yayları.** Akköprü, rakip aday ve aile yaylarının ilk bölümleri; beş hayatın ilk 6 ayı.
19. **İngilizce metin.**
20. **Denge.** Bot oyunlarıyla denge; iPhone ve masaüstü testi.
21. **Oyun testi paketi.** 5–10 kişi için bağlantı, geri bildirim formu, test verisi.

Ayrıca eksik olanlar:
- **Seçim (Sistem 6):** 0.3.0 sürümünde tamamlandı; kampanya, sayım, ikinci tur, itiraz, sonuç ve sonsöz oynanabilir.
- **Ajanda ekranı ve sahneler:** miting, kulis, münazara.
- **Acil kararlarda süre:** tasarımda 45 saniye.
- **Ekonominin diğer 4 krizi:**
  - Hayat pahalılığı: enflasyon %38'in üstünde başlar, %33'ün altında kapanır
  - Banka paniği: kur şoku iki ay sürerse
  - Not indirimi: açık %5'in üstünde iki ay; %4'ün altında kapanır
  - Grev dalgası: asgari ücret artışı enflasyonun altında kalırsa
- **Kabine:** prototipteki bakan yetkinliği ve sadakati ekranı.
- **Kayıt:** 0.3.0 tarayıcı sürümünde üç yuva (IndexedDB), dosya indirme/yükleme ve dönüş kopyası vardır; otomatik kayıt taşınabilir JSON önbelleğindedir.
- **Erişilebilirlik:** 0.3.0 sürümünde üç yazı boyutu ve pencere içi klavye odağı eklendi.

## Çalışma biçimi
- Her oturum iş listesindeki tek bir maddeyi bitirir; madde bitince oynanabilir bir sürüm çıkar.
- Değişiklik GitHub'daki depoya kaydedilir. `npm run denetle` geçmeden commit yapılmaz.
- Durum biçimi değişirse `DURUM_SURUMU` artırılır, göç yazılır ve göç için test eklenir.

## 10. madde devri (1 Kasım 2026)

- Yeni çekirdek: `cekirdek/meclis.ts`, sabitler ve içerik şeması `cekirdek/meclis-icerik.ts`, 12 vekil `icerik/meclis.yaml`, arayüz `arayuz/meclis.tsx`.
- Kilitli sandalye dağılımı korunur. Dolu 592 sandalye ayrı oy verir; kararsız vekiller parti ve hizip bloklarından çıkarılır. Kanun: katılanların salt çoğunluğu (592 katılımda 297); anayasa: 360 halkoylaması, 400 doğrudan kabul. Anayasa/halkoylaması sahnesi bu dikey kesitte yoktur.
- Üç hizip: 110 eski kadro, 80 teknokrat, 88 muhafazakâr. Ekonomi, hukuk, taban tepkileri ve parti huzursuzluğu memnuniyeti/fireleri etkiler. Veliaht, ayrılma ve kurultay tam oyun işidir; bu oturumda eklenmedi.
- Ay 2 emekli aylığı ve ay 4 yargı reformu kritik teklifleri: sekizer kararsız vekil, birleşimde 12 karakter. Diğer kanun teklifleri de aynı oy sayımıyla sonuçlanır. Meclis masadan ve Dosyalar'dan açılır.
- `kulisAc` ayın sahnesini kullanır. Açık kulis kayıtla korunur ve bitmeden ay kapatılamaz/ilgili teklif çekilemez. İkna bir gün alır; söz Hazine'ye iki ay vadeyle yazılır. Tutulan/kırılan söz ilişkiyi ve ihaneti etkiler. Baskı, algı ve kadro/yargı pazarlığı sicile yazılır. Lider tavizi ilgili seçmen gruplarını etkiler.
- `oylamayiSay` tutanağı bir kez üretir. Sayım arayüzü yalnız kayıtlı oyları gösterir; atlamak, açmak ve yenilemek sonucu değiştirmez. İhanet isimle habere, rapora ve gazete manşetine düşer.
- Ekim bütçe kartı öncelikli ana karardır; seçilen etkiler kabul edilene kadar bekler. Ret: geçici bütçe, itibar/güven kaybı ve aynı paketin ertesi ay yeniden oylanması. Hazine'de geçici bütçe uyarısı vardır.
- Anayasa Mahkemesi Başkanı kartı ay 3'te gelir; Merkez Bankası Başkanı mevcut faiz kartıyla gelir. Kurumlar ayrı yönetim ekranına taşınmadı.
- `DURUM_SURUMU = 6`. 5→6 göçü Meclis durumunu ekler; mevcut teklif, ekonomi ve göstergeler korunur. `meclisHazirla` eski bekleyen teklifler için adayları bir kez kurar. Yeni tutanakların toplamları yüklemede denetlenir.
- `npm run denetle` temiz kurulumdaki eksik üretilen JSON sorununu gidermek için içerik derlemesini önce çalıştırır. Sonraki oturumda da her değişiklik sonrası tamamı geçmelidir.

## Masaüstü yönü — kullanıcı kararı (1 Kasım 2026)

Kullanıcı oyunu kendi Mac'inde bağımsız bir uygulama olarak oynamak istiyor. Esas dağıtım hedefi artık Mac masaüstüdür; ChatGPT Sites bağlantısı ana oynama yolu olarak sunulmayacak.

- Dosyalar'daki “Oyunu bırak, yeni oyun” düğmesi ve bu düğmenin kayıt silen `birak` eylemi kaldırıldı. Yeni oyun/ana menü ileride bilinçli bir kayıt yönetimi akışıyla ele alınacak.
- `src-tauri/`: native pencere, gömülü çevrimdışı içerik, sabit uygulama kimliği, `kayit_oku` / `kayit_yaz` yerel dosya komutları. Kayıt: `~/Library/Application Support/com.bekiraslan.akkopru2026/kayitlar/`.
- `arayuz/kalici.ts`: masaüstü açılırken asıl kayıt/yedek/önbellekten geçerli en yeni kayıt seçilir. Bozuk kayıt ezilmez. Disk yazıları sıralıdır, önce geçici dosyaya yazılır. `arayuz/giris.tsx` disk yüklemesini bekler. Kalıcı hata kullanıcıya gösterilir.
- macOS 12+, hem Intel hem Apple Silicon için tek DMG. Ad-hoc imza vardır; Apple Developer ID ve noter onayı henüz yoktur.
- Oyun durumunun alanları değişmedi: sürüm 6 kalır. Tauri, arayüz ve paketleme değişiklikleri için yeni oyun durumu göçü gerekmez.
- 0.2.0 tesliminde seçim, ana menü ve üç kayıt yuvası yoktu; 0.3.0 tarayıcı sürümünde eklendiler. Kurulum talimatı `belgeler/MAC_KURULUM.md`.


## Toplu geliştirme ve tarayıcı yönü — kullanıcı kararı (2 Kasım 2026)

Kullanıcı ara sürümleri tek tek kurmak yerine sistemlerin birlikte geliştirilmesini, doğrulanmış sonucun topluca sunulmasını istedi. Hızlı geliştirme için ilk aşamada tarayıcı sürümünü seçti; Mac paketleme oynanış testinden sonra yapılacak. Önceki “oturumda tek madde” teslim kuralı bu çalışma için kullanıcı kararıyla toplu teslim olarak uygulanır. Kilitli oyun kararları değişmez.

- 0.3.0 tarayıcı sürümü: medya ve üç kanal, karara bağlı sosyal akış, üç soruluk basın toplantısı, ajanda, saha ziyaretleri ve özel anket, atama kartları, kurum uygulama gecikmeleri/mahkeme incelemesi, hizip görüşmeleri/ayrılma/kurultay, ifşa, üç anlatı yayı, dört ek ekonomik kriz, son üç ay kampanya, miting ve münazara, seçim gecesi/ikinci tur/itiraz ve dört bitişin sonsözü.
- Yeni çekirdek: genis-durum.ts, yonetim.ts, medya.ts, secim.ts. Yeni metinler: icerik/medya.yaml ve kartlar/tam_donem.yaml. 132 kart, 38 politika. Yeni kartlar mevcut derleyicinin üç seçenek ve metin sınırlarından geçer.
- DURUM_SURUMU=7; 6→7 göçü yeni alanları ekler, önceki kayıt/kararlar/zar/açık kulis korunur. Sahne sıraları ve seçim oy toplamları yüklemede denetlenir. Sahne hakkı Meclis, basın ve kampanya arasında ortaktır.
- Parti ayrılmasında başlangıçtaki kilitli 278/46/153/56/59/8 dağılımı değişmez; oynanışta 15–30 YP vekili yeni gruba geçebilir. Tutanakta parti seçildiği listeyi, grup alanı ayrılmayı gösterir; hiçbir sandalye ikinci kez sayılmaz.
- Menü: üç tarayıcı kayıt yuvası, JSON dışa/içe aktarma, yüklemeden/yeni oyundan önce dönüş kopyası, tema, üç yazı boyutu ve isteğe bağlı kısa ses efektleri. Kayıt bu tarayıcı/cihazdadır; sunucu eşitlemesi yoktur.
- Portreler adlardan kararlı üretilen vektör yüzlerdir; nötr/memnun/öfkeli ifadeler vardır. Ülke ekranında 12 şehir için kurgusal yerleşim şeması bulunur.
- Mac otomatik paketleme hızlı tarayıcı döngüsünden ayrıldı; elle veya ana dalda native kaynak değişince çalışır. Son dağıtılmış DMG hâlâ 0.2.0'dır; 0.3.0 için yeni native paket üretildiği iddia edilmez.
- Gerçek oyuncu denge testi, editör incelemesi, İngilizce, lisanslı müzik ve Apple noter onayı tamamlanmış sayılmaz. Bu bir tam dönem oynanabilen geliştirme sürümüdür.


## 0.4.0 — ilk altı kalite paketi (2 Kasım 2026)

Kullanıcı önceki planın 7 (gerçek oyuncu beta testi) ve 8 (İngilizce/Mac/mağaza dağıtımı) maddelerini kapsam dışında bıraktı. Bu teslim Türkçe tarayıcı oyunundaki ilk altı kalite paketini uygular. Zorunlu otomatik teknik denetim sürer.

- İlk ay görev notu, başlangıç brifingi ve karar nedenlerinin ay raporuna yazılması.
- Toplam 188 kart: sekiz yeni beş kartlık dallanan hikâye ve sekiz eski kısa zincire alternatif kapanışlar. Mert, Ece, Ayşe, Sevim ve Necdet'in politikalarla bağları metinlere işlendi.
- Muhabirler güncel bütçeyi, son kararı ve kamuya yansıyan dosyaları sorar. Miting/münazara ayrı yanıtlar kullanır; başarı konu, ekonomik koşullar ve sicille değişir. Aynı yalanın tekrar getirisi azalır. Rakip son kararınızı alıntılar.
- IBM Plex Sans/Serif/Mono çevrimdışı gömülür. SIL OFL lisansları arayuz/fontlar içindedir. 24 çizgi ikon, ilk ay notu ve sahne kompozisyonları eklendi.
- Anlamlı kâğıt/mühür/telefon/onay efektleri, özgün olarak Web Audio ile bestelenen beş kısa müzik döngüsü; ses ve müzik bağımsız ve varsayılan kapalıdır. Sekme arka plana geçince müzik durur.
- Oyun durumuna yeni alan eklenmedi: mevcut bayraklar, karar geçmişi ve rapor olayları kullanılır. DURUM_SURUMU 7 kalır; 6→7 göçü korunur.
- Denge için dört kusursuz-bilgi bot stratejisiyle 120 oyun karşılaştırıldı. Bu sonuçlar gerçek oyuncu davranışı veya bitmiş denge iddiası değildir. Ayrıntı DENGE_0_4.md.


## 0.4.1 — kararların izlenmesi ve hikâye akışı (2 Kasım 2026)

Kullanıcı bu ortamda geliştirmeye devam edilmesini ve rutin uygulama kararlarının özerk alınmasını istedi. Önceki 7 ve 8 istisnaları sürer: gerçek oyuncu beta organizasyonu, İngilizce, yeni Mac paketi ve mağaza dağıtımı bu teslimin dışındadır.

- Menü → Karar ve rapor arşivi: geçmiş ay raporları, devam eden ayın kararları, bütün dönemde Türkçe büyük/küçük harfe duyarsız karar araması. Sonsözden de erişilir; seçim ayı iki kez sayılmaz.
- Arşiv yalnız kayıtlı `gecmis`/`buAy` verilerini okur; eski ayın rakamlarını bugünkü göstergelerle yeniden hesaplamaz. Eski kayıtlarda bulunmayan tarihî market sepeti oranı uydurulmaz. Arşivi gezmek kararları, zarı veya otomatik kaydı değiştirmez.
- Karar izleri yer tutucuları çözer, aynı sözlü düzey içindeki yükseliş/gerilemeyi açıklar ve ücret/fatura etkilerini de gösterir. Dördüncü etkiden sonraki sonuçların sessizce atılması kaldırıldı.
- Üç açık zincir sınırı: aynı ayı gelen devam kartlarının yerleri yeni tohumlardan önce ayrılır. Henüz açılmayan ertelenmiş hikâyeler açık zincir sayılmaz; yer açılınca sırayla gelir. Bu düzeltme kayıtlı kararları değiştirmez, sonraki masa kuruluşunda uygulanır.
- Durum biçimi değişmedi; DURUM_SURUMU=7 ve tüm göçler korunur.
- Doğrulama: `npm run denetle` — 112 çekirdek testi (1.000 tam dönem bot oyunu dahil), 11 tarayıcı testi; 188 kart ve 38 politika. Arşiv masaüstü ve telefon boyutlarında, yenileme sonrası ve dönem sonunda denetlenir.


## 0.5.0 — kararların anlatıya dönüşmesi (2 Kasım 2026)

Kullanıcı açıkça hikâyenin eksik, kararların yüzeysel ve deneyimin oyun hissinden uzak olduğunu belirtti. Sayaç/ek araç ekleme işi geri plana alındı. Bu teslim bütün kartların derinleştirildiğini iddia etmez: Akköprü ana yayını, sonraki yazım için kullanılabilecek gerçek görüşme ve koşullu sonuç altyapısıyla yeniden işler.

- Yeni oyunun ilk ay ana kararı “Gece hattındaki ses”tir; ertelenemez. Ana karar ve kaynak sınırları korunur. Köprü mühendisi Deniz Alaz, bakan Yusuf, sendika, Hazine, bakkal Necdet ve kaza yolunda işçi yakını Suna farklı çıkarlarla karşılaşır.
- Akköprüye bağlı 11 dosyada mekân, somut amaç, çelişen kişiler, incelenebilir belgeler, önceki karara bağlı hatırlatmalar ve her seçeneğin gerekçesi/bedeli bulunur. Kart durumları 60, seçim metinleri 12 sözcük sınırında kalır; ek replikler de 60 sözcükle denetlenir.
- Üç ayrı üç adımlı görüşme: ilk telefon, tanık ifadesi öncesi ve hastane. Bir gün ve ortak aylık tek sahne hakkı kullanır. Görüşme ücretsiz bir ek sahne üretmez; aynı ay kulis, basın ve kampanya ile paylaşılır. Görüşme yapılmadan dosya sonuçlandırılabilir.
- Karakter ilişkileri sözlü görünür. Deniz'in güveni kurulmadıysa ilk görüşmede ham veriyi istemek mümkün olmaz. Yanıtlar güveni, eldeki belgeyi ve koruma koşullarını değiştirir. Ayrı seçenekler aynı metne yeniden etiketlenmez.
- Aynı gece bakımı kararı, ilk gece ağır yükü durdurup durdurmadığına göre güvenli açılışa veya kazaya gider. Aynı savcılık başvurusu, ham delil varsa teknik kapanışa, yoksa eksik delil/tanık dosyasına gider. Alternatif kapanışlar tazminat, tanığın akıbeti ve kaza sonrası duruşma olarak ayrıdır; toplam 12 karar izi sonsözde özel metne dönüşür.
- Ana anlatı yayları aynı ay üst üste binmez; devam eden yay yeni tohuma göre önceliklidir, ertelenen kart kaybolmaz. Eski bekleyen kart kimlikleri korunur.
- Yeni altyapı `cekirdek/anlati.ts`, `anlati-durum.ts`, `arayuz/anlati.tsx`. İçerik kartın `anlati` alanındadır; seçeneklerin `sonraki[].kosul` alanı bayrak, ilişki ve mevcut koşullarla gerçek dallanır. `tepkiler` karar sonrası kişilerin sözlerini gösterir ve ay kaydına yazar.
- DURUM_SURUMU=8. 7→8 göçü yalnız boş anlatı durumu ekler; karar, ekonomi, açık kulis ve zar aynen korunur. Görüşmenin mevcut yanıtı, notları ve sırası kayda yazılır; yenileyince aynı yerden sürer. Bozuk sıra/kayıp dosya/eşzamanlı sahne yüklemede reddedilir.
- Otomatik denetim: 123 çekirdek testi (1.000 tam dönem bot oyunu dahil), 13 tarayıcı testi. Toplam 193 kart ve 38 politika. Testler farklı yollardan ayrı sonlara gerçek ay akışıyla ulaşmayı ve telefon/masaüstü görüşmesini yenileme sırasında korumayı kapsar.
- İlk gece yalnız yeni oyunda başlar; mevcut kayıt zorla sıfırlanmaz. Eski kaydın henüz gelmemiş Akköprü dosyaları yeni metin ve koşullarla devam eder. Daha önce verilmiş kararlar yeniden yazılmaz.

- İlk geceki dosya 16. ay kampanyasında geri gelir. Görüşme çağrısının seçim etkisi, önceden kurulmuş güvene göre değişir. Miting ve münazarada rakip eski Akköprü kararını gerçek geçmişten alıntılar; o soruya özel yanıtlar vardır. Başarı dili kayıp yaşandıysa, delil iddiası ham kayıt alınmadıysa geri tepebilir.

## Çalışma biçimi değişikliği — kullanıcı kararı (3 Kasım 2026)

Kullanıcı oyunun tamamına küçük iyileştirmeler yaymak yerine bir bölümü metni, oynanışı, arayüzü ve sonuçlarıyla bitirip sonra diğerine geçilmesini istedi. Önceki toplu genişletme yönü bu kararla değişti.

- Aktif tek bölüm: ilk gece telefonundan ilk talimatın uygulanmasına kadar açılış.
- Yazım ve oynanış taslağı: `SAHNE_01.md`. Bu dosya canlı sürüme uygulanmış veya bitmiş sayılmaz.
- Başka yay, kart havuzu, sayaç veya yan sistem genişletilmez. Açılışı tamamlamak için gereken altyapı düzeltmeleri bu bölümün kapsamında kalır.
- Önce metnin ve nedenselliğin editoryal kontrolü, sonra uygulama, oynayarak inceleme ve zorunlu teknik denetim yapılır. Testlerin geçmesi tek başına anlatının bitmesi anlamına gelmez.
- İlk bölüm kullanıcı tarafından oynanıp değerlendirilmeden ikinci bölüme geçilmez. Bir önceki sürümün kusurlarına yeni özellik eklemek kalite artışı olarak sunulmaz.
- Kilitli oyun kararları ve kayıt göçü kuralları korunur.

## 0.5.1 — ilk sahnenin düzenlenmesi (3 Kasım 2026)

Kullanıcı “değiştir” ile mevcut sahnenin düzenlenmesini, geliştirilmesini ve hatalarının giderilmesini kastettiğini açıkladı. SAHNE_01.md'deki alternatif yeniden kurgu uygulanmadı; mevcut ilk gece ve üç ana kararın yönü korunur. İkinci bölüm kapsam dışıdır.

- İlk gece metinleri, seçenekler ve karar sonrası karşılıklar düzenlendi. Fotoğraf/ölçüm tutarsızlığı giderildi; şirket bilgisayarındaki ölçüm kaydı ile gönderilen çıktı ayrıldı. Mühendis bilmediği şeyi kesin bir teknik hükümle anlatmaz.
- Erken tanık koruması yerine görevle ilgili başvurunun yazılı takibi vardır. İlk telefonda yeni bir tanık koruma kaydı oluşturulmaz; eski kayıtlardaki geçmiş veriler değiştirilmez.
- Telefon günlük saha faaliyeti değildir; takvimden gün düşmez. Ortak aylık tek sahne hakkı korunur. Diğer yüz yüze anlatı görüşmeleri hâlâ bir gün ister. Ek danışman değerlendirmesi de bir gündür.
- İlk sahnede amaç paragrafı, tekrar eden kulis notu, “Göze aldığın” şablonu, anlık grup tepkileri ve ilişki derecesi etiketleri konuşmanın arasından çıkarıldı. Kaynak açıklaması ve ikinci görüş açılır danışman alanındadır. Diğer sahneler aynı kalır.
- Ödenek kesintisi yapıldığı yönündeki yanlış anlatım kaldırıldı. İki ulaşım kararının gideri yatırım hesabına yazılır; bütçe açığı etkileri ilk gece ölçeği için 0,04/0,02 yerine 0,00004/0,00002 GSYH puanıdır. Bu değerler kurgu ekonomisinin geçici ulaşım ödenekleridir; gerçek bir maliyet çalışması değildir.
- Oyun durumunun biçimi değişmedi: DURUM_SURUMU=8. Göçler korunur. Eski kararlara geriye dönük düzeltme uygulanmaz.
- Denetim kapsamı: 124 çekirdek testi (1.000 tam dönem botu dahil), 13 tarayıcı testi. Gece telefonunun gün tüketmemesi, boş gün kalmasa da açılması, sonraki görüşmelerin gün gerektirmesi ve yenileme sonrası kayıt ayrı ayrı denetlenir.
- Bu sürüm ilk sahnenin düzenlemesidir. Bir sonraki bölüme geçiş kullanıcı değerlendirmesini bekler.


## 0.5.2 — Kabul salonu: karar, uygulama ve takip (3 Kasım 2026)

Kullanıcı, kabul/ziyaret/anket eylemlerinin yalnız görünüşte iş yaptırmasını eleştirdi. İstenen çalışma biçimi: bir bölümü dili, oynanışı ve sonucu birlikte ele alarak bitirmek; bütün oyuna küçük eklemeler dağıtmamak. Bu sekanstaki kapsam **Kabul salonu**dur. Saha ziyareti ve özel anket derinleştirmesi henüz yapılmadı.

- 15 heyet için adlandırılmış temsilci, somut dosya, karşı görüş ve üç yanıt yazıldı. Kabul bir gün ayırıp dosyayı açar; destek puanı vermez. Kapatıp yenileyince “Görüşmeye dön” ile sürer; ikinci gün harcanmaz. Eski sürümde yapılmış salt kabullerden yeni karar uydurulmaz.
- Kartın `ziyaret` alanı kabul/takip bağlantısıdır. Bu dosyalar rastgele masaya düşmez; her kabul hikâyesi dönem içinde bir kez açılır. Takip mevcut `bekleyen` ve `masa` kaydıyla sürer. Kabul de takip de aylık karar bütçesine dahildir; altı karar ayrılmışsa yeni kabul açılmaz. Takipler masadaki rastgele karar kontenjanından düşülür. Var olan zorunlu kriz ve kayıtlar kesilmez.
- Seçenekteki `politika` talimatı gerçek `politikaDegistir` yolunu kullanır: kararname, imza sınırı, Meclis teklifi/oylaması, kurum gecikmesi ve yargı incelemesi korunur. Aynı yürürlük veya aynı bekleyen teklif ikinci imza tüketmez; çelişen teklif sessizce ezilmez. Başarısız işlem zarı, etkileri veya tarihçeyi değiştirmez.
- Dar destek yanıtı `ekonomi.soz` ile gerçek bir taahhüt oluşturur. Sözü vermek ödeme değildir. Takipteki `destek.kaynak` ilk görüşmenin aynı sözünü yerine getirir; henüz söz verilmediyse tanımlı dar desteği çıkarır. Hazine’den daha önce ödenmişse ikinci ödeme olmaz. Vadesi geçen söz geri alınmaz, sicilde kalır.
- **DURUM_SURUMU=9.** `Soz.tekSeferlik` ve uygulama kuyruğunda geçici gider kapanışı eklendi. 8→9 göçü eski sözlere `false` yazar; eski bütçe davranışı, kararlar, zar ve kabul durumları korunur. Yeni geçici destek yalnız ödeme ayını yükler; kalıcı maaş gibi sonraki aylarda tekrarlanmaz veya endekslenmez. Tutar arayüzde yıllıklaştırılmış oran yerine tek ödeme olarak gösterilir.
- Takipte `ziyaretSonucu`, ilk yanıtı, ilgili ayın gerçek Meclis tutanağını, mevcut politikayı ve bekleyen uygulamayı birlikte okur. Ret kabul gibi gösterilmez. Son ayın devamı dönem dışına kaybolmaz; aynı ay masaya gelir.
- Bu bölümde otomatik kamuoyu tahmini ve ikinci görüş düğmesi kaldırıldı. Bütçe gerektiren tercihin tutarı ve imza/oylama gereği seçimden önce okunur. Kuliste “Hazine notu” paragrafı sürekli görünmek yerine bütçe ayrıntısı altında açılır.
- Çekirdek ve masaüstü/telefon tarayıcı kontrolleri; ödeme tekrarının önlenmesi, eski kayıt göçü, gerçek kabul/ret, takvim sınırı, kayıt sonrası devam ve ziyaretlerle tam ay akışı için genişletildi. Teslim öncesi `npm run denetle` zorunludur.
- Sonraki bölüm **saha ziyareti**: seçilen şehrin somut ihtiyacı, temsilciler arası çatışma, uygulanabilir müdahale ve sonraki ziyarette görülen sonuç. Ardından **özel anket**: belirli bir karar sorusu, örneklem belirsizliği ve elde edilen bilgiyle değişen seçenek. Mevcut düğmeler bu derinliğe henüz ulaşmış sayılmaz.


## 0.5.3 — Saha ziyaretleri: ilk üç tam dosya (3 Kasım 2026)

Bu teslim, saha ziyaretlerinin ilk paketidir: **Taşhan** (konut bağlantıları), **Karaburç** (okul atölyesinin kullanım kabulü), **Serhatkent** (pompa ve mahalle bağlantısı). Kalan dokuz şehir için yeni dosyalar ve özel anketin derinleştirilmesi henüz yapılmadı. Ajandada yalnız açık dosyalar programlanır; diğer şehirlere sahte sonuç üreten eski ziyaret yolu çalışmaz. Ülke haritası on iki şehri korur.

- Kabul salonu aynen korunur. Yeni `sahaBaslat` mevcut anlatı sahnesini kullanır: bir gün, ortak aylık tek sahne ve aylık karar bütçesinden bir yer. Başlatmak ücretsiz ilişki/kamuoyu artışı veya otomatik eylem azaltımı üretmez. Sahne bitmeden uygulama kararı verilemez; yenileme aynı yanıttan sürer.
- Her dosyanın ilk ve dönüş ziyareti, üç konuşma adımı ve sonunda üç uygulama tercihi vardır. Yerel temsilciyi dışlamak ortak tespiti engelleyebilir. Yerinde kapsam doğrulanmadan yapım talimatı kilitlidir. Bütün yolların çözüm üretmesi garanti değildir.
- `icerik/saha.yaml` maliyet, ilgili grup, kurum kapasitesi ve gerçekleşmiş sonuç metinlerini taşır. `icerik/kartlar/saha.yaml` kişileri, karşı görüşü, kayıtları ve seçimleri yazar. Derleyici şehir, gösterge, dosya bağlantıları ve sahne varlığını denetler; saha kartları rastgele desteye girmez.
- İlk tercihler: iki aylık kalıcı iş; bir aylık geçici hizmet desteği; mevcut programla devam. Kalıcı iş bir imza ve gerçek tek seferlik ödenek kullanır. Para mevcut Hazine/söz/aylık bütçe yolundan çıkar; geçici gider sonraki aylarda kalmaz. Yeni harcama veya imza başarısız seçimde yazılmaz.
- `sahaAySonu` vadesi gelen işi kurum liyakatiyle karşılaştırır. Kapasite yetersizse iş aksar; yüksek kapasitede tamamlanır. Fiziksel sonuç ve ilgili yerel eylem etkisi bir kez uygulanır. İlgisiz şehir ve grupların eylemleri otomatik küçülmez. Ek ekip ödeneği gecikmiş işi ertesi ay tamamlayabilir; önceki kayıt silinmez.
- Kesin teslim tarihi açıklamak olumlu beklenti yaratır ama kaynak ayrılmaz veya iş yetişmezse bir kez kırılan söz kaydı üretir. Dönüşte ek ekip, bağımsız uygulama denetimi veya yeni ödenek ayırmama tercih edilir. Bağımsız rapor sonraki ay gelir ve bitmemiş işi bitmiş göstermez. Tamamlanmış işe ikinci ödeme/imza/fayda verilmez.
- Ajanda ve harita gerçek uygulama kaydını okur. Harcanmış kaynak, önceki karar ve tarihçe açılır ayrıntıdadır. Sonsöz görev bitimindeki son saha kaydını saklar; dönem sonrasına kalan işi tamamlandı diye anlatmaz.
- **DURUM_SURUMU=10.** `saha` uygulama kayıtları ve anlatıcı gözlemi notları eklendi. 9→10 göçü boş saha kaydı açar; eski ziyaretlere geriye dönük proje veya ödeme uydurmaz. Eski kayıtta Ayşe'nin anahtar aldığı görülüyorsa yerleşmişlik bayrağı eklenir; eski hayat kaydı ve zar değişmez. Yeni konuşmalarda anlatıcı metni karakterin kendi sözü gibi gösterilmez.
- Ayşe'nin hayat sahneleri yerleşmişlik bilgisini paylaşır. Taşhan işi tamamlanınca yeni taşınma olayı mümkün olur; evine yerleşmiş Ayşe için konteynerde yaşama metinleri tekrar seçilmez. Diğer dört kişinin akışı korunur.
- Kontroller: üç dosyanın bütün karar yolları, kayıt sonrası konuşma, ortak sahne ve imza sınırı, gerçek ay akışı, gecikme/ek ekip, ödeme tekrarı, bağımsız rapor, yalnız ilgili yerel eylem, eski kayıt ve Ayşe'nin devamlılığı. Masaüstü/telefon tarayıcı akışı ziyaret → gecikme → dönüş → fiilî sonuca kadar denenir. Teslim öncesi `npm run denetle` zorunludur.

## 0.5.4 — İhracat, kongre, belediye ücreti ve aile başvurusu (4 Kasım 2026)

Kullanıcının gösterdiği dört sığ dosya bu paketin kapsamıdır. Bütün oyun yeniden yazılmış değildir. Diğer şehirler ve özel anketin derinleştirilmesi bekler.

- İhracat: işverenin siparişi ve mükerrer çalışan listesi, aynı ay doğrulama → ödeme kararı; Merkez Bankası ile ayrı telefon ve ertesi ay bordro/çıkış hesabı. Telefon belirli bir döviz fiyatı üretmez. Tek fabrikanın desteğine ülke işsizliğini aniden düşüren bir etki yazılmaz. Sınırlı ücret desteği ile koşulsuz şirket ödemesi farklı gerçek gider ve sicil taşır; sonraki dosya önceki yolu hatırlar.
- Kongre: çelişen delege tutanakları, itiraz, eski kadro ve teknokrat kanat; tercih gerçek `meclis.hizipler` kaydını değiştirir ve Meclis oy hesabına girer. Sonraki ay üyelik incelemesi ile yenileme/destek pazarlığı/geçici yönetim kararı gelir. Hazine bakanı parti içi itirazın anlatıcısı değildir.
- Belediye: bordro, personel dışı faturalar ve Hazine kesintisi ayrılır. Ödeme tek seferlik gerçek personel ödeneğidir; yalnız aynı şehirdeki işçi eylemini azaltır. İnceleme bir gün kullanır, ödeme yapmaz. Ödenen, reddedilen ve incelenen dosyaların devamı farklıdır; yeni ay ödeneği otomatik doğmaz.
- Şehit aileleri: yeni görüşmeler `kabul_sehit_gorev`/`takip_sehit_gorev` üzerinden cevapsız dilekçeler, sorumlu makam ve hukuki başvuru desteğini işler. Genel sağlık politikasıyla ilgisiz eşleştirme kaldırılır. Geçmişte oynanmış eski `kabul_sehit`/`takip_sehit` tanımları korunur; gerçek eski karar yeni hikâyeye çevrilmez.
- Yeni içerik alanı `secenek.icra`: gün, imza, tek ödeme, hizip desteği ve ilgili ücret eylemi. Önkoşullar zardan ve mutasyondan önce denetlenir. Derleyici çelişen uygulama/ödeme talimatlarını reddeder. **Durum biçimi değişmedi: DURUM_SURUMU=10**; mevcut takvim, Hazine, bayrak, hizip ve takip alanları kullanılır.
- Yazılmış anlatı dosyalarında otomatik uzun gösterge listesi kapalıdır; bilerek alınan ikinci görüş tahmini açabilir. Karar öncesi gerçek gün/imza/tutar ve engel gösterilir. Karakter tepkileri talimatı izler. Belgeler durum paragrafını tekrarlamak yerine somut kayıt taşır. Küçük tutarlar sıfır milyar yerine milyon/bin TL olarak yazılır.
- Kontroller: başarısız işlemde durum/zar korunması, gerçek gider ve tek dönem kapanışı, şehir hedefi, hizip/oy desteği, aynı ay devam, eski aile kararı, kayıt sonrası sürdürme; telefon ve masaüstü tarayıcı akışı. Botlar kaynak yetmeyen tercihi zorlamak yerine yapılabilir seçeneğe geçer; özellik testleri kilitleri ayrıca kesin olarak doğrular. Teslim öncesi `npm run denetle` geçmelidir.

## 0.6.0 — Bölüm 1: İlk Gece ve Ertesi Sabah (4 Kasım 2026)

Kullanıcı, küçük dosya düzenlemelerinin oyunun hissini değiştirmediğini belirtti. 40 bölümlük başlangıç planı onaylandı; `GELISTIRME_PLANI.md` kapsamı ve bitiş ölçütlerini tutar. Bu teslim yalnız ilk gece ve ertesi sabahı tamamlar; bütün Akköprü soruşturma yayı veya oyun bitmiş sayılmaz.

- İlk geceki üç talimat üç ayrı aynı-ay dosyasına gider: `akkopru_sabah_kisit`, `akkopru_sabah_olcum`, `akkopru_sabah_guvence`. Birinde çevre yolundaki tanker, birinde gece ekibinin ara ölçümü, birinde bakanın güvencesiyle çelişen fotoğraflar ve mühendisin ölçümden çekilmesi ele alınır. Hastane başhekimi Sema Yalçın ve nakliyeciler sözcüsü Okan Eren bu bölümün yerel yüzleridir.
- Her sabah üç müdahale ve ayrı gün sonu üretir. Trafik, hastane teslimi ve Deniz'in konumu kayda geçer. Sonuç, olay tutanağında ve haberlerde görünür. Geceki bilgi eksikliği kesin hüküm gibi sunulmaz; seçim tek başına otomatik çökme/ölüm üretmez.
- `acilisUygula` güncel ağır yük sınırını `akkopru_yuk_kisiti` bayrağıyla sonraki mevcut olay yoluna bağlar. İlk talimat `acilis.gece` ve karar arşivinde korunur. Tanığın ölçümden çekilmesi ilişkiyi azaltır; görev işlemlerini takip sözü verilmişse kırılan söz sicili oluşur. Önceden teslim alınan ham kopya silinmez.
- Giderler mevcut `icra` → Hazine → tek seferlik ödeme yolunu kullanır. Geceki eski doğrudan bütçe etkileri artık sürekli gider bırakmaz. Sabah koordinasyonu bir gün kullanır; aylık tek sinematik sahne hakkını ikinci kez tüketmez. Üç seçenek, dört gün, üç imza ve 18 ay korunur.
- **DURUM_SURUMU=11.** Yeni `acilis` kaydı gece/sabah tercihleri, trafik, sevkiyat, tanık, delil kopyası, gerçekleşmiş TL harcaması ve saatli tutanağı saklar. `10→11` göçü `null` ekler; daha önce tamamlanmış ilk geceye geriye dönük olay/ödeme uydurmaz. Devam eden eski soruşturma kendi yolunda sürer. Açık sabahın bağlı kartı olmayan veya henüz kararı verilmeden sonucu yazılmış kayıt reddedilir.
- Gece sonucundan “Sabah bağlantısını aç” ile doğrudan devam edilir. Sabah kartı yenilemede yeniden açılır; bitince ilk günün sonucu masada kalır. Karar sonrası odak ve kaydırma, alt düğme yerine sonucun başına alınır. Belge ve tutanak ayrıntıları isteğe bağlı açılır. Sonraki aylarda panel açıkça ilk günün arşivi olarak etiketlenir.
- Derleyici gece–sabah eşleşmesini, her seçeneğin sonucunu, zincir bağlantısını ve sonuç metni sınırlarını denetler. Kontroller dokuz birleşim, tekrar ödeme engeli, kaynak kilidi, eski kayıt, tanık/delil sürekliliği, sonraki olay yolu, masaüstü/telefon, tek pencere, ekran taşması ve sonuç odağını kapsar. Eski saha testlerinde dolu ay için yasal erteleme ile dönüşe yer ayrılır; altı karar sınırı gevşetilmez.

## 0.7.0 — Bölüm 2: Bağımsız İnceleme ve Tanık Baskısı (4 Kasım 2026)

- `akkopru_inceleme` metni `kartlar/inceleme.yaml` içine taşındı. Bağımsız heyet, bakanlık ve onarım hazırlığı üç ayrı rapora gider. Bunlar izleyen ay gelir; görevlendirme gününde hazır rapor oluşmaz. `incelemeAyBasi` raporu bir kez teslim eder. Nihai teknik güvenlik onayı, onarım veya suçluluk kararı verilmiş sayılmaz.
- Aylin Işık bağımsız teknik heyetin yüzüdür. İsteğe bağlı üç adımlı görüşmede avukat, kayıt türü ve beyan teslimi konuşulur. Aylık tek sahne ve gün bütçesi aynıdır. Ham kopya yalnız gerçekten alınmışsa incelenebilir. İlk gecenin kopyasıyla sonradan imzalanan beyan farklı belgelerdir.
- `inceleme_kanit_var` gerçek ham kopya veya teslim edilmiş beyana göre hesaplanır. Teslim edilen beyan sonradan söylenen sözle silinmez. Rapor tesliminden sonra alınmış beyan ayrı ek olarak gösterilir; ilk raporun metni ve eksikleri yeniden yazılmaz.
- Rapor kararları: eldeki doğrulanmış kayıtla başvuru/yayın; gerçek geçici ücret ödeneği ve protokol; raporu kapalı tutma. Bakanlık raporu veya hazırlık dosyası dış heyete devredilebilir. Eski rapor, teslim ayıyla `oncekiRaporlar` arşivinde korunur; yeni süre ve gider kaydedilir. Bağımsız rapor kendi kendine sonsuz devredilemez.
- Görevlendirme, dış inceleme ve hazırlık giderleri mevcut `icra` / Hazine tek seferlik ödeme yolunu kullanır. Ücret desteği personel kaleminde gerçek giderdir; yalnız Akköprü işçi eylemini azaltır. İlk incelemedeki eski büyük sürekli bütçe etkileri kaldırıldı. Ödeme veya açıklama yapınca teknik/adli dosya bitmez.
- Sonuçlar haber ve olay kaydına girer. Eski devam dosyalarıyla bağlantı korunur: belge, tazminat, gece bakımı veya onarım. Önceki ilk gün arşivi ikinci aydan itibaren açılır ayrıntıdadır; yeni bölüm ön plandadır. Sonuç odağı yine ekranın başındadır. Mevcut sahne açıkken yenileme onu bırakıp rapora atlamaz.
- **DURUM_SURUMU=12.** Yeni `inceleme` kaydı yol, aşama, teslim ayı, eldeki kayıt/beyan, tarihî TL gideri, raporlar, yayım kararı ve işlem izlerini tutar. `11→12` göçü yalnız `inceleme:null` ekler; eski inceleme kararından yeni heyet, rapor veya harcama çıkarmaz. Kayıpsa bekleyen/teslim edilmiş bağlı rapor yüklemede reddedilir.
- Derleyici inceleme aşaması/işlemi, rapor kimliği, ay bağlantısı, metin sınırları ve çelişen uygulamaları denetler. Dokuz karar birleşimi, iki dış heyet dönüşü, kanıt kilidi, arşiv ve beyan sürekliliği, başarısız işlemin atomikliği, ücretin şehir hedefi, göç, tekrar işlem engeli ve masaüstü/telefon testleri eklenmiştir. Teslim öncesi `npm run denetle` zorunludur.
- Sonraki bölüm şantiye, ücret alacakları ve protokolün uygulamasıdır. Bu paket bütün onarımı veya bütün soruşturma yayını bitmiş saymaz.

## 0.8.0 — Bölüm 3: Şantiye, İşçi Alacağı ve Teknik Kabul (4 Kasım 2026)

- `akkopru_tazminat` artık sonuç kartı değil, ayrı protokol kararıdır: şarttan ayrılmış teminat teklifi, gerçek geçici işçi avansı veya dava. Teminat tahsilat değildir; esnaf zararına otomatik ödeme yazılmaz. İşçi avansı `icra`/personel kalemiyle yalnız ilgili şehirde eylemi etkiler. Önceki bağımsız rapor ücreti ödenmişse yeni avans kilitlenir.
- `akkopru_onarim` yeni yüklenici ve korunan numune, eski şirketin denetimli işi veya numuneyi önce korumak arasında seçimdir. İlk iki iş yatırım kaleminden tek seferlik gerçek ödeme ve gelecek ay fiziksel teslim üretir. Üçüncüsü yalnız hazırlık yapar; işi bitmiş göstermez.
- Yeni `akkopru_teslim` fiziksel teslimi bağımsız yük deneyinden ayırır. Eksik teslimi yeniden yaptırmak ayrı ödenek ve süre kullanır. Şirketin tek taraflı tutanağı teknik kabul değildir; yol kapalı kalır. Yeni `akkopru_kabul` yalnız numunesi korunan yeni yüklenici işi ve uygun bağımsız deneyle açılış dosyasını aynı ay masaya getirir. Eski şirketin eksik deneyi kabulü kilitler; yeniden yapım veya ikinci deney seçilebilir.
- Eski belge ve gece bakımı yolları artık teknik kabul olmadan doğrudan açılışa yönlendirilmez; uygun yolda onarım dosyasına girer. Önceden kaydedilmiş bitiş kararları yeniden yorumlanmaz. Eski bir kayıtta zaten bekleyen açılış kartı varsa geçmişte olmayan şantiye oluşturulmaz.
- **DURUM_SURUMU=13.** Yeni `santiye` kaydı gerçek ücret, protokol, yüklenici, numune, yapım/deney takvimi, teknik sonuç, tarihî TL gideri ve işlem izlerini saklar. `12→13` göçü `santiye:null` ekler; yalnız karar arşivinde gerçekten verilmiş bağımsız rapor ücretini mükerrer avansı engellemek için işaretler. Bekleyen işlem kartı veya uygun teknik sonuç uyuşmazsa kayıt reddedilir.
- Şantiye kaydı dosyada ve karar sonucunun başında görülür; ayrıntılı işlem geçmişi açılır. Masaüstü/telefon ve kayıttan sürdürme denetlendi. Kapsam şantiye ve teknik teslim zinciridir; kaza/duruşma ve diğer oyun sistemleri sonraki bölümlerde işlenecek. `npm run denetle` teslim kapısıdır.
