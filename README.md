# Akköprü 2026

Geliştirme sürümü 0.12.1: Akköprü’nün ilk gecesi ve sabahı güncellendi. Karara verilen insan yanıtı doğrudan görünür. Sabah teslim alınan ikinci cihaz serisi bağımsız raporda yer alır ve ara raporu yayımlamanın bir yolunu açar. İlk yedi bölüm tamamlandı. Kış tarifesi zam, ortak sayaç itirazı ve dağıtım bakımı yollarına ayrılır. Füsun Ergin ve işletme şefi kararların ardından geri döner; yardımın faturaya ulaşması, kesme işlemi, parça değişimi ve güvenli hizmete dönüş ayrı sonuçlar üretir. İkinci kış ilk kışın kaydını korur. Mac paketleri oynanış değerlendirmesinden sonra güncellenir.

Kurgusal Doruk Cumhuriyeti'nde geçen, anlatı ağırlıklı bir siyaset simülasyonu. Oyuncu, seçime 18 ay kala göreve gelen cumhurbaşkanıdır; kara mizahlı bir dram tonunda kararlar verir, Meclis'le, ekonomiyle, sokakla ve medyayla uğraşır.

Tasarım belgesi (sistemlerin kuralları, ekranlar, uygulama planı) claude.ai'deki "Akköprü 2026 · Oyun Tasarım Belgesi" dokümanındadır. Kod, o belgedeki kilitli kararlara göre yazılır; bir karar değişecekse önce belge güncellenir.

Yeni oyunda ilk ay **Telefonu al** ile Akköprü hikâyesi açılır. Dosyadaki belgeleri inceleyebilir, ilk telefonda gün harcamadan ayın sahne hakkını kullanarak mühendisi dinleyebilirsin. Tanığın güveni ve önceki kararlar sonraki yolu değiştirir. Eski oyunun korunur; ilk geceyi oynamak için Menüden bilinçli olarak yeni dönem başlatabilirsin.

Menüdeki **Karar ve rapor arşivi**, tamamlanan ay raporlarını ve aramayla bulunabilen tüm kararları saklar. Güncel geliştirme dalı `feat/masaustu-macos` (tarayıcı öncelikli); `main` henüz bu çalışmayı içermez.

**Kabul salonu:** görüşme bir gün ayırır, ücretsiz destek puanı vermez. Heyetin dosyasında üç yanıttan biri seçilir. Politika talimatı mevcut imza, Meclis ve kurum süreçlerini çalıştırır. Dar destek sözü Hazine defterine geçer; takip dosyasında veya Hazine’den ödenebilir. Ödenmeyen söz vadesinde sicile yansır. Takip dosyası gerçek oylamayı, yürürlük durumunu ve bekleyen uygulamayı okur. Kayıt sürümü 14; eski kayıtlar göçle korunur.

**Saha ziyaretleri — ilk paket:** Ajandada Taşhan konut bağlantısı, Karaburç okul atölyesi ve Serhatkent su hizmeti dosyaları açılır. Ziyaret bir gün ve ortak sahne hakkını kullanır. Yerinde doğrulama, uygulama ödeneği, kurum kapasitesi ve sonraki dönüş ziyareti ayrı aşamalardır. Tamamlanmayan iş tamamlandı sayılmaz; kesin tarih sözü tutulmazsa sicile yansır. Sonuç şehir kaydında, raporda ve sonsözde kalır. Taşhan sonucu Ayşe'nin hayatına bağlanır. Diğer dokuz şehir için saha dosyaları ve özel anketin derinleştirilmesi sonraki işlerdir.

## Kurulum

```
npm install
npx playwright install chromium
```

Claude'un bulut ortamında npm deposuna erişim kapalıdır; orada `./araclar/yerel-paketler.sh` önceden kurulu paketleri bağlar.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run derle` | Oyunu `dist/index.html` tek dosyasına derler (internet gerektirmez) |
| `npm run izle` | Değişiklikleri izleyip yeniden derler |
| `npm test` | Çekirdek testleri |
| `npm run test:arayuz` | Tarayıcıda duman testleri (masaüstü ve iPhone 17 Pro Max boyutu) |
| `npm run tipler` | TypeScript tip denetimi |
| `npm run denetle` | Hepsi, sırayla; her değişiklikten sonra geçmeli |

## Klasörler

| Klasör | İçerik |
| --- | --- |
| `cekirdek/` | Oyun kuralları; DOM'a erişmez, saf TypeScript |
| `icerik/` | Kartlar, zincirler, karakterler ve metinler (YAML) |
| `derleyici/` | İçerik denetimi ve Türkçe ek motoru |
| `arayuz/` | React bileşenleri, ekranlar ve stil |
| `testler/` | Çekirdek birim testleri ve tarayıcı testleri |
| `araclar/` | Derleme ve ortam betikleri |
| `platform/` | Masaüstü (Tauri) ve mobil (Capacitor) sarmalayıcılar |

## İçerik yazmak

Kartlar `icerik/kartlar/*.yaml` dosyalarındadır. Her kartta tam 3 seçenek olur; durum metni en fazla 60, seçenek metni en fazla 12 sözcüktür.
Metinde `{il}` gibi yer tutucular ve `{il:de}` gibi ekli biçimler kullanılabilir ("Yalıkent'te"). `npm run icerik` içeriği denetler; hata iletileri hangi dosyanın hangi alanında sorun olduğunu söyler.

## Kurallar

- Oyun durumu tek bir düz veri nesnesidir (`cekirdek/durum.ts`); kayıt dosyasına olduğu gibi yazılır.
- Bütün rastgelelik tohumlu zardan (`cekirdek/zar.ts`) gelir; `Math.random` yalnız yeni oyunun tohumunu üretir.
- Durum biçimi değişirse `DURUM_SURUMU` artırılır ve `cekirdek/kayit.ts` içine bir göç yazılır.
- Testler geçmeden bir iş maddesi bitmiş sayılmaz.

## Ekonomi (Sistem 3)

- Model `cekirdek/ekonomi.ts`, Hazine masası araçları ve söz defteri `cekirdek/hazine.ts` içindedir.
- Enflasyon, büyüme ve işsizlik kararlarla anında değişmez; kararın etkisi hedefi kaydırır, gösterge aylar içinde ona yaklaşır. Güven ve rezerv anında değişir; kur ve faiz anında değişir, sonra kendi kurallarıyla ilerler.
- Bütçe açığı 8 gider ve 5 gelir kaleminin farkıdır. Karttaki `butce_acigi` etkisi kartın `kalem` alanındaki kaleme (yoksa kategoriye göre seçilen kaleme) yazılır.
- Seçeneklerde `ekonomi:` alanı: `kalem`, `asgari_artis`, `fatura_artis`, `istatistik` (liyakatli/sadik), `soz` (söz defteri).
- Dikey kesitte tek kriz kur şokudur (`icerik/kartlar/ekonomi.yaml`). Hissedilen ekonominin anketlere yansıması 8. maddede, yıllık bütçe oylaması Sistem 2 ile eklendi.

## İçerik dosyaları

| Dosya | İçerik |
| --- | --- |
| `icerik/kartlar/*.yaml` | Karar kartları, zincirler, kriz masaları (aynı ay içinde `gecikme: 0`) |
| `icerik/politikalar.yaml` | Politika dosyasındaki kademeli ayarlar; `yol: kanun` olanlar Meclis'te oylanır |
| `icerik/hayatlar.yaml` | Beş hayatın sahneleri ve koşulları |
| `icerik/toplum.yaml` | Gazeteler, kapıda bekleyen ziyaretçiler, grup başına eylem tanımları |

Koşullarda `gosterge`, `politika` (kademe), `takvim_ayi`, `ay_en_az`, `bayrak` kullanılabilir.

## İlerleme

| Madde | Durum |
| --- | --- |
| 1. Proje iskeleti | Tamam |
| 2. Oyun durumu, tohumlu zar, kayıt | Tamam |
| 3. İçerik derleyici ve Türkçe ek motoru | Tamam |
| 4. Ayın akışı: masa, kararlar, ay sonu | Tamam |
| 5. Görsel dil (sistem yazı tipleri; IBM Plex bu ortamda indirilemedi) | Tamam |
| 6. Masa ekranı ve karar dosyası | Tamam |
| 7. Ekonomi modeli ve Hazine masası | Tamam |
| Kapsam genişlemesi: politika dosyası (38 ayar), 113 kart, 6 kriz masası | Tamam |
| 8. Seçmen grupları, anketler, ülke ekranı | Tamam |
| 9. Sokak ve eylemler | Tamam (Ülke haritası sonra) |
| 11. Gazeteler (sabah manşetleri) | Kısmen: kanallar ve sosyal medya sırada |
| 14. Beş hayat | Kısmen: ay sonu raporu ve seçim gecesi oyları sırada |
| 10. Meclis, oylama ve kulis sahnesi | Tamam (dikey kesit) |

## Meclis ve kulis (Sistem 2)

Masadaki **Meclis ve kulis** düğmesi veya Dosyalar içindeki aynı düğme Meclis'i açar. Kilitli dağılım: YP 278, BP 46, DBP 153, KHP 56, UYP 59; 8 sandalye boş. Kanun oylamasında katılanların salt çoğunluğu gerekir; çekimserler katılıma dahildir. Anayasa için 360/400 eşikleri çekirdekte hazırdır; anayasa teklifi ve halkoylaması akışı bu dikey kesitin kapsamında değildir.

- Aralık 2026'da emekli aylığı, Şubat 2027'de yargı düzenlemesi kritik oylamaları gelir. Her birinde sekiz aday, ikisinin toplamında 12 farklı vekil vardır. Dosyalar'dan sunulan diğer kanunlar aynı oy sayımını kullanır.
- Bir kulis görüşmesi ayın sahnesidir. İkna ayrıca bir boş gün alır. Söz Hazine'ye iki ay vadeyle yazılır; tutulması ve kırılması gelecekteki ilişkiyi etkiler. Baskı ve algı sicile yazılır; lider pazarlığı tabanda tepki yaratır.
- Üç hizbin memnuniyeti ve parti içi huzursuzluk fireleri etkiler. Evet sözü veren vekiller de son anda dönebilir; fire adıyla tutanağa, habere ve gazete manşetine yansır.
- Ekim'de yıllık bütçe ana kararı zorunludur. Paket kabul edilene kadar etkileri uygulanmaz. Ret halinde mevcut ödeneklerle geçici bütçe sürer; aynı paket sonraki ay yeniden oylanır.
- Her oylama tam 592 oy olarak saklanır; kararsızlar kendi parti/hizip bloklarından çıkarılır. Tutanak yeniden açılınca zar atılmaz. Sayım atlanabilir; hareket azaltma tercihine uyar.
- Durum sürümü **6**. 5→6 göçü, önceki kayıtların göstergelerini, bütçesini ve bekleyen tekliflerini korur.

Denetim: 85 çekirdek testi (1.000 bot oyunu dahil) ve masaüstü/iPhone tarayıcı testleri. `npm run denetle` temiz kurulumda önce içeriği üretir.

## Mac masaüstü uygulaması (0.2.0)

Oyuncu hedefi: ChatGPT veya tarayıcıya bağlı olmadan, Mac'te Uygulamalar klasöründen çalışan çevrimdışı uygulama. Tauri 2 sarmalayıcısı `src-tauri/` içindedir. Kurulum: [Mac kurulum notu](belgeler/MAC_KURULUM.md).

- `npm run masaustu:gelistir`: Mac'te uygulamayı geliştirme modunda açar.
- `npm run masaustu:derle`: Intel ve Apple Silicon için tek evrensel `.app` ve `.dmg` üretir.
- `.github/workflows/macos.yml`: oyun denetimini, yerel disk kaydı testini, evrensel paket derlemesini ve imza kontrolünü Mac üzerinde yapar. Çıktı Actions altında `Akkopru-2026-macOS-Universal` paketi olarak indirilebilir.
- Uygulama kendi penceresinde çalışır; dosyalar içine gömülüdür. Otomatik kayıt ve önceki kayıt yedeği Application Support altında tutulur. Tarayıcıdaki sürüm yerel depolamayı kullanmaya devam eder.
- Dosyalar ekranındaki “Oyunu bırak, yeni oyun” düğmesi ve bağlı kayıt silme eylemi kaldırıldı. Uygulamadan çıkmak kaydı silmez.
- Oyun durumu biçimi değişmedi; `DURUM_SURUMU = 6` korunur.
- Mac paketi geliştirme amaçlı ad-hoc imzalıdır; Apple Developer ID / noter onayı sonraki dağıtım adımıdır. Oynanabilir geliştirme sürümü, seçim henüz tamamlanmadı.


## Tarayıcı sürümü (0.3.0)

İlk geliştirme hedefi tarayıcıdır. Aynı TypeScript çekirdeği korunur; her sürümde Mac yükleyicisi üretmek gerekmez. Kullanıcı oturum sonunda doğrulanmış toplu sürüm alır.

Yeni oynanış: Gündem (altı kuruluş, üç kanal, sosyal medya, medya müdahaleleri), üç soruluk basın toplantısı, dört günlük ajanda, saha ve anket, atama dosyaları ve kurumların uygulama direnci, parti içi ayrılma/kurultay, ifşa ve Akköprü/rakip/aile hikâyeleri. Kampanya 16–18. aylarda açılır; 18. ay seçim gecesine, gerekirse ikinci tura/itiraza ve sonsöze ulaşır.

Menü üç kayıt yuvası, dosya indirme/yükleme, dönüş kopyası, tema, yazı boyutu ve ses efektlerini içerir. Kayıtlar tarayıcıya aittir; cihaz değiştirmek için JSON dosyası taşınır. Eski kayıtlar göçlerle güncel durum sürümü 15'e yükseltilir; yaşanmamış karar veya ödeme eklenmez.

Bu sürüm gerçek oyuncu denge ve editör değerlendirmesi öncesindedir. İngilizce ve lisanslı müzik hazır değildir. Son yayımlanan Mac yükleyicisi 0.2.0'dır; tarayıcı güncellemesi kendiliğinden yeni bir DMG üretmez.


## 0.4.0 — oynanış ve sunum

İlk ay brifingi ve görev rehberi, ay raporunda karar nedenleri, 188 karar kartı, sekiz yeni dallanan hikâye ve kısa eski zincirlere alternatif kapanışlar. Basın/münazara güncel kararlara, bütçeye ve sicile göre soru sorar; cevapların etkisi konu ve geçmişle değişir. Kulis talepleri oylama bağlamını kullanır. IBM Plex yazı tipleri, 24 çizgi ikon, sahne düzenleri ve özgün beş müzik döngüsü çevrimdışı pakete dahildir; müzik ve ses ayrı açılır.

Oyun durumu biçimi 7 olarak korunur. Kullanıcı gerçek oyuncu beta ve dağıtıma hazırlık paketlerini (İngilizce/Mac/mağaza) bu teslimin dışında bıraktı. Otomatik denetimler geliştirme kuralı olarak devam eder. Strateji incelemesi: belgeler/DENGE_0_4.md.
