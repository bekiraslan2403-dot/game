# Akköprü 2026 — devir notu (1 Kasım 2026)

Bu not, geliştirmeyi devralacak kişi ya da yapay zekâ içindir. Birlikte gönderilen `TASARIM_BELGESI.md` oyunun tam tasarım belgesidir; kurallar ve kilitli kararlar oradadır. Bu not, şimdiye kadar ne yapıldığını, kodun nasıl düzenlendiğini ve sırada ne olduğunu anlatır.

## Proje
Kurgusal "Doruk Cumhuriyeti"nde geçen, anlatı ağırlıklı, Türkçe bir siyaset simülasyonu. Oyuncu, seçime 18 ay kala göreve gelen cumhurbaşkanıdır. Oyun Kasım 2026'da başlar; 18. ay (Nisan 2028) seçim ayıdır. Ton: kara mizahlı dram. Ülke, kişiler, partiler ve kurumlar kurgusaldır.

- Depo: https://github.com/bekiraslan2403-dot/game (dal: `main`)
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
- Yazı tipleri sistem yazı tipleridir. Tasarımdaki IBM Plex gömülmedi.
- GitHub Actions: `.github/workflows/denetle.yml` her push'ta `npm run denetle` çalıştırır.

## Kurallar
- Oyun durumu tek bir düz veri nesnesidir (`cekirdek/durum.ts`, `OyunDurumu`) ve kayda olduğu gibi yazılır.
- Bütün rastgelelik tohumlu zardan gelir (`cekirdek/zar.ts`). `Math.random` yalnız yeni oyunun tohumunu üretir. Aynı tohum ve aynı kararlar aynı oyunu üretir.
- Durum biçimi değişirse `DURUM_SURUMU` artırılır ve `cekirdek/kayit.ts` içine göç yazılır. Şu anki sürüm: 7 (1→2, 2→3, 3→4, 4→5, 5→6, 6→7 göçleri var).
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
104 çekirdek testi (18 aylık 1.000 bot oyunu dahil) ve 9 tarayıcı testi bulunur; son doğrulama sürüm notunda belirtilir.

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
