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
- Planlanan sarmalayıcılar: Tauri (masaüstü), Capacitor (mobil). Henüz kurulmadı.
- Kurulum: `npm install` ve `npx playwright install chromium`.
- Komutlar: `npm run derle`, `npm test`, `npm run test:arayuz`, `npm run tipler`, `npm run icerik`, `npm run denetle` (hepsi sırayla; her değişiklikten önce çalışmalı).
- `tipler/react-shim.d.ts`: @types/react kurulamadığı için yazılmış küçük tip dosyası. `npm install -D @types/react @types/react-dom` sonrası silinebilir.
- `araclar/yerel-paketler.sh` yalnız Claude'un bulut ortamı içindir; normal ortamda gerekmez.
- Yazı tipleri sistem yazı tipleridir. Tasarımdaki IBM Plex gömülmedi.
- GitHub Actions: `.github/workflows/denetle.yml` her push'ta `npm run denetle` çalıştırır.

## Kurallar
- Oyun durumu tek bir düz veri nesnesidir (`cekirdek/durum.ts`, `OyunDurumu`) ve kayda olduğu gibi yazılır.
- Bütün rastgelelik tohumlu zardan gelir (`cekirdek/zar.ts`). `Math.random` yalnız yeni oyunun tohumunu üretir. Aynı tohum ve aynı kararlar aynı oyunu üretir.
- Durum biçimi değişirse `DURUM_SURUMU` artırılır ve `cekirdek/kayit.ts` içine göç yazılır. Şu anki sürüm: 5 (1→2, 2→3, 3→4, 4→5 göçleri var).
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

18. ayda `ayiBitir` "seçim henüz oyuna eklenmedi" der ve durur.

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
- Kararname hemen yürürlüğe girer. Kanun teklifi ay sonunda Meclis'te oylanır; geçme olasılığı `meclisDestegi()` ile hesaplanır (parti içi huzursuzluk ve kutuplaşmaya bağlı geçici formül). Reddedilen teklif parti içi huzursuzluğu artırır.
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
- 111 kart: takvime bağlı ana kararlar, prototipten taşınan olaylar, zincirler.
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
68 çekirdek testi ve 2 tarayıcı testi geçiyor.

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
10. **Meclis, oylama ve kulis sahnesi (Sistem 2).** Kilitli sandalye dağılımı: Yükseliş Partisi (iktidar) 278, Bayrak Partisi (ittifak ortağı) 46, Demokrat Birlik Partisi 153, Kalan Halkların Partisi 56, Ulusal Yol Partisi 59, boş 8. Kararsız vekiller (her kritik oylamada 8–12), 3 parti içi hizip, kulis görüşmesi ve ihanet olacak. `politika.ts` içindeki `meclisDestegi()` geçici formülü bu sistemle değiştirilecek. Ekim'deki yıllık bütçe Meclis'te oylanacak; bütçe geçmezse geçici bütçe uygulanır.
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
- **Seçim (Sistem 6):** kampanya evresi, seçim gecesi, sonuç ve sonsöz. 18. ay şu an kilitli.
- **Ajanda ekranı ve sahneler:** miting, kulis, münazara.
- **Acil kararlarda süre:** tasarımda 45 saniye.
- **Ekonominin diğer 4 krizi:**
  - Hayat pahalılığı: enflasyon %38'in üstünde başlar, %33'ün altında kapanır
  - Banka paniği: kur şoku iki ay sürerse
  - Not indirimi: açık %5'in üstünde iki ay; %4'ün altında kapanır
  - Grev dalgası: asgari ücret artışı enflasyonun altında kalırsa
- **Kabine:** prototipteki bakan yetkinliği ve sadakati ekranı.
- **Kayıt:** tasarımda 3 kayıt yuvası ile dosyaya indirme ve yükleme var; şu an yalnız tarayıcıda otomatik kayıt var.
- **Erişilebilirlik:** yazı boyutu ayarı (3 kademe).

## Çalışma biçimi
- Her oturum iş listesindeki tek bir maddeyi bitirir; madde bitince oynanabilir bir sürüm çıkar.
- Değişiklik GitHub'daki depoya kaydedilir. `npm run denetle` geçmeden commit yapılmaz.
- Durum biçimi değişirse `DURUM_SURUMU` artırılır, göç yazılır ve göç için test eklenir.
