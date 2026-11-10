# Akköprü 2026 — 40 bölümlük geliştirme planı

Kullanıcının 4 Kasım 2026 kararı: her çalışma aşamasında bir oynanabilir bölüm tamamlanır. Ölçüt metin veya kart sayısı değil; verilen kararın farklı olay, insan tepkisi ve sonraki müdahale üretmesidir. Bir bölümün dili, davranışı, kaydı ve denetimleri birlikte ele alınır. Açık sorun varsa sonraki bölüme geçilmez.

40 bölüm başlangıç üretim planıdır. Tam dönem denetimleri ek iş çıkarırsa plan genişler. Tarayıcı önceliklidir. Mac/mağaza, İngilizce ve dış oyuncu beta çalışması bu plana eklenmez.

| Alan | Bölüm sayısı |
| --- | ---: |
| Ana hikâye, krizler, dönüm noktaları ve hesaplaşmalar | 10 |
| Kararların uygulanması: ekonomi, Meclis, bakanlıklar ve şehirler | 10 |
| Karakterler, ilişkiler ve önceki tercihlere bağlı olaylar | 8 |
| Oynanış, tempo, arayüz ve sonuçların görünürlüğü | 6 |
| Tam dönem dengeleme, farklı bitişler ve bütünlük kontrolleri | 6 |
| **Toplam** | **40** |

## Bölüm 1 — Akköprü: İlk Gece ve Ertesi Sabah

Sürüm 0.6.0. Kapsam ilk geceki telefon, seçime göre üç farklı sabah, sabah müdahalesinden sonra dokuz ayrı gün sonu ve ertesi ayın mevcut incelemesine bağlantıdır. Bu bölüm, bütün Akköprü soruşturma yayının tamamlanması değildir.

Bitiş ölçütleri:

- Geceki üç talimat aynı devam kartına gitmez. Trafik ve hastane teslimi sabaha farklı durumlarda ulaşır.
- Sabah kararları gerçek ödenek/gün kullanır; trafik kısıtı ve mühendisin konumu değişir. Bir tanığın uzaklaştırılması önceden teslim edilmiş delili silmez. Verilmiş görev takip sözüyle çelişki sicile geçer.
- Karar sonrası değişim ekranın başında görünür. Tutanak kapanıp yeniden açıldığında aynı sonucu gösterir. İlk günün kaydı ileriki aylarda güncel trafik gibi sunulmaz.
- Geçici ödenek bir ayın ardından kapanır. Tarihî harcama TL olarak saklanır; sonraki büyümeyle yeniden hesaplanmaz.
- Sabah kısıtını kaldırmak veya sonradan koymak mevcut Akköprü yayının sonraki olay yoluna etki eder.
- 10→11 göçü eski ilk geceye yeni sabah, ödeme veya sonuç eklemez.
- Dokuz karar yolu çekirdekte; üç ana yol telefon ve masaüstü tarayıcıda denenir. `npm run denetle` geçmeden teslim/commit yapılmaz.

Sonraki bölüm: bağımsız inceleme, tanık üzerindeki baskı ve raporun yayımlanması. Ayrıntılı iş paketi Bölüm 1'in tesliminden sonra mevcut sonuç kayıtlarına dayanarak hazırlanır.

## Bölüm 2 — Akköprü: Bağımsız İnceleme ve Tanık Baskısı

Sürüm 0.7.0. İkinci ayın ilk inceleme kararı, izleyen ay üç ayrı rapor yoluna bağlanır: bağımsız heyet, bakanlık veya onarım hazırlığı. Bakanlık ve hazırlık raporundan bağımsız incelemeye dönülebilir; ek süre ve ödeme ayrı kayıttır. Tam yapım, nihai teknik kabul ve soruşturma kapanışı sonraki bölümün kapsamıdır.

Bitiş ölçütleri:

- Görevlendirme rapor veya bulgu üretmez. Rapor gerçek ay akışında, bir kez teslim edilir; teslim ve yayım ayrı durumlardır.
- İlk gece alınan ham kopya korunur. Yeni tanık beyanı bağımsız bir ektir; geçmiş ölçüm serisi uydurmaz. Tanığın ölçümden çekilmiş olması yeni beyan verilmiş gibi anlatılmaz.
- Görüşme mevcut gün ve ortak sahne bütçesini kullanır. Kayıt yenilemede aynı sorudan sürer. Teslim edilmiş beyan sonraki sözle silinmez; sonradan alınan beyan teslim edilmiş raporu yeniden yazmaz.
- Kanıt isteyen seçenek doğru koşulla açılır. Ücret desteği gerçek ödeme ve yalnız ilgili şehirde işçi eylemi etkisi üretir. Teknik rapor bu ödemeyle kapanmaz.
- İlk raporu dış heyete devretmek önceki belgeyi silmez. İlk teslim arşivde kalır, yeni takvim/gider görünür olur.
- Her raporun üç kararı farklı iz, yayım durumu veya devam dosyası üretir. İmza/gün yetersizliği başarısız işlemi tümüyle durdurur.
- 11→12 göçü önceki ilk günü ve eski soruşturma yolunu korur; yaşanmamış inceleme veya ödeme eklemez.
- Bütün yollar, kayıt devamlılığı, kaynak sınırları ve masaüstü/telefon akışı denetlenir. Teslim öncesi `npm run denetle` geçmelidir.

Sonraki bölüm: şantiye, işçi alacakları ve yüklenici protokolü. Hazırlık, gerçek yapım, ödeme, fiziksel teslim ve sorumluluk ayrı işlemler olarak ele alınacak.

## Bölüm 3 — Akköprü: Şantiye, İşçi Alacağı ve Teknik Kabul

Sürüm 0.8.0. Protokoldeki teminat tahsil edilmiş para sayılmaz. Önceden doğrulanmış ve ödenmiş işçi alacağı yeniden ödenemez. Şantiye yüklenici ve ödenek kararından sonra çalışır; fiziksel teslim gelecek ay, bağımsız deney ondan sonraki ay gelir. Köprü ancak uygun deney ve teknik kabulden sonra açılış kararına gider. Eski şirketin işi ve korumasız numune eksik deney üretir; yeni iş ve delil zinciri ayrı müdahale gerektirir.

Bitiş ölçütleri:

- Üç protokol cevabı ücret, sorumluluk, dava ve sonraki yapımı farklı etkiler; banka teklifine otomatik tahsilat yazılmaz.
- Ücret yalnız gerçek tek seferlik personel ödemesiyle kapanır; önceki rapor ödemesi mükerrer avansı kilitler. Esnaf tazminatı ödenmiş gösterilmez.
- Üç yüklenici kararı fiziksel teslim, kapalı yol ve gerçek iş takvimine bağlanır. Yapımı durdurmak teknik teslim yaratmaz.
- Fiziksel teslim güvenlik izni değildir; bağımsız deney ve teknik kabul farklı aylarda ilerler. Eksik deneyde kabul engellenir. İkinci deney veya yeniden yapım önceki olayı silmez.
- `12→13` göçü eski karara iş, teslim veya ödeme uydurmaz. Gerçekten verilmiş eski rapor ücreti yalnız mükerrer ödeme kilidi için işaretlenir.
- İşlem, kaynak sınırı, kayıt yenileme, tamamlanmış/eksik deney ve telefon/masaüstü akışı doğrulanır. `npm run denetle` geçer.

Sonraki bölüm: kaza, duruşma ve tanığın hayatına dönüş; ilk gece ve inceleme kararlarının ceza/sorumluluk zincirine ayrı etkileri. Diğer genel oyun sistemlerinin tamamlanması sonraki bölümlerde sürer.

## Bölüm 4 — Akköprü: Kaza, Suna ve Deniz’in Sonraki Kararı

Sürüm 0.9.0. Eski güvenlik tercihlerinden doğan kaza ve tanık yolları, aynı kartta bitmek yerine sonraki ayların somut yanıtlarına bağlanır. Kaza sonrasında ilk talimatlar, eldeki ham kopya ve beyan ayrılır; mahkeme kararı oyuncunun tek seçimiyle verilmez. Suna’nın avukatının yanıtı ve Deniz’in gönüllü ifade veya süreli iş kararı, önceki ilişkinin ve ilk müdahalenin sonucudur.

Bitiş ölçütleri:

- Kazada üç ilk yanıt bağımsız belge açma, bakanın yanıtını bekleme veya gizlilik talebini farklı kaydeder. İki ölümün nedeni hükme bağlanmaz; aileye gönderilen teklif ödeme sayılmaz.
- İlk oturumda gerçek bakan uzaklaştırma ve Meclis hizip etkisi, mevcut belgelerin verilmesi veya kapalı oturum talebi ayrıdır. Bunlar mahkeme hükmü üretmez.
- Sonraki ay Suna’nın yazılı başvurusu yoksa acil yardım kilitlidir. Uygun başvuruda ödeme gerçek tek seferlik sosyal giderdir; dava sürer. Adli takip fonu da ayrı kaynak kullanır.
- Deniz’in koruması, iş başvurusu ve taşınması ayrı gerçek sonuçlara gider. Yeni tarihli imzalı ifade eski ham ölçümü üretmez, teslim edilmiş raporu yeniden yazmaz. Süreli iş yalnız kabul edilen başvuru ve ödenekle açılır.
- `13→14` göçü eski bitmiş kaza/tanık kararına yeni duruşma, ifade veya ödeme eklemez. Önceden bekleyen duruşma bugünkü dosyaya bağlanabilir; eski ay yeniden yazılmaz.
- Karar, kaynak kilitleri, eski kayıt, dokuz kaza/oturum birleşimi, aile reddi, tanığın üç yolu ve telefon/masaüstü akışı denetlenir. `npm run denetle` geçer.

Sonraki bölüm: geçmiş kararların kampanya, yerel ekonomi ve kamusal hafızada tutarlı geri dönüşü. Oyun genelinin diğer sistemleri daha sonraki bölümlerde sürecek.

## Bölüm 5 — Akköprü: Geçim ve Kamusal Hafıza

Sürüm 0.10.0. Şantiyenin ilk gerçek işleminden sonraki ay Necdet'in yerel teslimat dosyası gelir. Alternatif sevkiyat için tek seferlik ödenek, belgeli başvuru ve yeni gider açmama üç farklı takip kartı üretir. İkinci karar ilk gideri otomatik tekrarlamaz; fişli başvuru ödeme değildir. Köprü teknik kabul ve açılış kararı olmadan kampanya görüntüsüyle açılmış sayılmaz. İlk kampanya yanıtına bir ay sonra geçmiş ödeme, delil ve eksik kayıt sorusu gelir.

Bitiş ölçütleri:

- Yerel geçim dosyası şantiyenin ilk işleminde bir kez takvime girer. Üç ilk kararın her biri ayrı gelecek ay dosyası ve en az üç yeni yanıt taşır; önceki ödeme, yüklenici ret yanıtı veya başvuru geriye dönük değiştirilmez.
- Kapanan yol için ikinci sevkiyat ödeneği yol gerçekten açılmışsa kilitlidir. Belgeli nakliye farkı için yeni ödeme ancak ayrı kararla ve tek seferlik gerçek Hazine gideriyle yapılır. Sözlü kayıp tüm esnaf tazminatı diye sunulmaz.
- Kampanya kartı ve izleyen yanıtı mevcut teknik kabulü, ilk talimatı, ham ölçümü, işçi alacağını, kazayı ve yerel gideri ayrı ayrı okur. Aileye veya Deniz'e davet katılım ya da destek beyanı sayılmaz.
- Açık ve kapalı yol aynı görüntü seçimine farklı siyasi sonuç verir. İkinci kampanya yanıtı gerçek yerel ödemeye göre esnaf desteğini değiştirir. Münazara kapalı yolu açılmış gibi savunmaz.
- Yeni kalıcı alan eklenmediği için kayıt biçimi 14 olarak kalır. Eski kayıtların geçmişine yeni geçim kararı veya ödeme yazılmaz; yalnız bundan sonraki kararlar yeni dosyayı açar.
- Üç yerel yol, kaynak kilidi, kampanya dalları, kayıt yenileme, telefon/masaüstü yatay taşma ve 1.000 botluk tam dönem akışı denetlenir. `npm run denetle` geçer.

Sonraki bölüm: Akköprü dışındaki ana kararların yüzeysel gösterge sonuçlarını benzer düzeyde bir uygulama ve insan yanıtına bağlamak. Seçilecek dosya, bütün oyun akışındaki en çok tekrar eden etkisiz karardan belirlenecek.

## Bölüm 6 — Belediye Garajı: Ücret, Sefer ve Müdahale

Sürüm 0.11.0. Akköprü dışındaki belediye borcu zinciri ele alındı. İlk karardaki ödenek, ödeme planı ve ortak inceleme farklı ikinci dosyalara gelir. Üçünün de ödeme, hesabı yayımlama ve güvenlik müdahalesi yanıtı artık ayrı son dosyaya bağlanır. Eski son karttaki ilgisiz başkan adaylığı, yalnız müdahale yolundan açılan garaj hesaplaşması olarak düzenlendi. Hastane hattına geçici hizmet satın almak işçi alacağını ödemez.

Bitiş ölçütleri:

- İlk üç karar ile izleyen üç yanıtın dokuz birleşimi, kararın şehrini koruyarak ücret, açık hesap veya müdahale son dosyasına ulaşır. Her son dosyada üç gerçek karar bulunur.
- İlk iki aylık bordro ve yeni ay bordrosu iki ayrı imza/ödenektir; yalnız seçilmişse ödenir. Hesap yayımlamak, belediye incelemesi ve hastane hattına bir dönemlik geçici taşıma almak ücret ödemesi sayılmaz.
- Müdahale ilk sicili bırakır; sürdürme tercihi yeni sicile girer. Arabuluculuk, geçici sefer ve baskı farklı hizmet ve insan yanıtları üretir. Eski tamamlanmış karar metni yeniden yazılmaz.
- Ücret ve sefer sonucu karar ekranının başında, şehir adıyla görünür. Bir dönemlik hizmet sonraki aylarda kalıcı çalışan otobüs diye sunulmaz. Dönem sonunda ücret ve hizmetin son teyidi birlikte anılır.
- Yeni oyun bu zinciri en geç 16. ayda başlatır. Eski kayıttan 18. aya kalan devam dosyası aynı ay çözülebilir. Kayıt biçimi değişmediği için `DURUM_SURUMU=14` kalır.
- Kaynak kilitleri, dokuz birleşim, eski kayıt, geçici hizmetin süresi, telefon/masaüstü akışı ve 1.000 botluk tam dönem denetlenir. `npm run denetle` geçer.

Sonraki bölüm: Belediye dışındaki tek bir yüzeysel ekonomi veya kurum kararının gerçek uygulama zinciri. Seçim, bot oyunlarında en sık görülen etkisiz karara göre yapılacak.

## Bölüm 7 — Kış Tarifesi: Füsun'un Binası

Sürüm 0.12.0. Seçim öncesi 300 örnek tam dönem akışında doğal gaz kararı 600 kez görüldü; üç tercihte de devam dosyası yoktu. Mevcut kart, zam sonrası tahsilat, ortak sayaçta yanlış kademe ve dondurulan fiyatın yanında dağıtım bakımı olarak üç ayrı yola açılır. Füsun Ergin ile işletme şefi Baran Tunca dosyanın insan yüzüdür. İki kışın kayıtları ayrı saklanır.

Bitiş ölçütleri:

- Üç ilk karar, dokuz ikinci karar birleşimi ve son dosyalardaki seçenekler ayrı ödeme, fatura, kesme veya bakım sonucu verir. Yeni kaynak olmadan montaj yapılmış sayılmaz; hazırlanmamış hatta güvenlik testi kilitlidir.
- Hedefli yardım gerçek tek seferlik sosyal giderdir. İlk ödenek sonraki ay abone faturasıyla eşleşir; ikinci döneme yardım ayrı imza ve ödeme ister. Kapsam dışındaki veya eski borçların tümü ödenmiş gösterilmez.
- Ortak sayaç incelemesi borcu ödemez. Dairelerin ayrılması kademeli tarifede yanlış yüksek kademe farkını düzeltir; tahsilata dönmek kesintiyle sonuçlanır. Bir dönemlik yeniden bağlantı borcu kapatmaz.
- Fiyat desteği, bakımın Hazine ödeneği ve tarifeden finansmanı ayrı tutulur. Parça değişimi sonraki ay iş emrinde gelir; güvenlik kabulü ay kapanışındaki tutanakla doğrulanır. Geçici ısınma eksik bakımın yerini tutmaz.
- Örnek hanenin toplam faturasında gaz payı %55 oyun varsayımıdır; gaz zammı elektrik ve suya aynı oranda yazılmaz. Hedefli yardım bütün hanelerin tarifesinden düşülmez. Tarihî ödemeler TL olarak sabit kalır.
- `14→15` göçü eski tarife, hane faturası ve geçmiş kararları korur; geçmiş kışa kesinti veya yardım uydurmaz. Son ayda bekleyen eski kararın devamı aynı ay gelir ve kapanış yanıtı seçimden önce kaydedilir.
- Gün/imza engeli başarısız işlemde hiçbir durumu değiştirmez. İkinci kış, eski dosyanın ödemesini ve teyidini korur; eski hizmet yeni ayın açık gazı diye sunulmaz. Telefon ve masaüstünde üç ana yol oynanır; tam `npm run denetle` geçer.

Sonraki bölüm: kurum kararlarında güvenin ve uygulama direncinin insan yanıtına dönmesi. Seçilecek tek dosyanın kapsamı mevcut akıştaki eksik sonuca göre belirlenecek.

## Bölüm 8 — İki Zarf, Bir Bülten

Sürüm 0.13.0. İstatistik Kurumu başkanlık dosyası üç ayrı takip açar. Fiyat derleyicisi Meral Kurt, pazar örneklemini, imza itirazını ve dış denetimde kimin hangi veriyi göreceğini oyuncunun karşısına getirir.

- Ek saha vardiyası ve kişisel bilgilerin ayıklanması gün ve tek seferlik ödenek kullanır. Toplu tablo vermek, denetçinin fişleri doğrulamasıyla aynı sonucu üretmez.
- İki zarf yolunda teknik seriyi bir kez yayımlamak, mevcut başkanın yetkisini koruyarak yalnız bu ayın resmî oranını düzeltir. Yetkiyi teknik kurula devretmek sonraki ayları da etkiler. İtirazı kapatma talimatı sicile geçer.
- Ay kapanışında gerçek ve resmî enflasyon ayrı hesaplanır. Emekli ve personel giderleri yayımlanan orana göre endekslenir. Hazine ekranı bekleyen tek seferlik düzeltmeyi gösterir.
- Kayıt biçimi 15 kalır. Eski kayıtlar geriye dönük bülten veya harcama kazanmaz. Seçim ayına ertelenmiş başlangıç aynı ayda yanıtını alır.

## Bölüm 9 — Bir Ekran Görüntüsü, Bütün Arşiv

Sürüm 0.14.0. Üçüncü aydaki mahkeme uyarısı tek bir tahliye haberine bağlanır. Görüntü ve altyazı ayrı dosyalardır. Yayın editörü Ekin Soylu, geniş erişim engelinin aileye ve arşive etkisini geri getirir.

- Taslağı daraltma, genel engel ve bekleme ayrı takip kartları açar. Üç yolun her biri somut üç yanıt sunar. Düzeltilen yayın, mühürlü kopya, açık kalan altyazı ve kapalı arşiv ayrı sonuçlardır.
- Genel engelde Gündem yalnız Halk TV arşivinin bültenini gizler. Açılışta bülten geri gelir; öteki kanallar aynı kapsamda kalır.
- Arşivi açıp düzeltilmiş kaydı yayımlama yolundaki tedbir, yalnız o ay Halk TV’ye yeni erişim engelini arayüzde ve çekirdekte kilitler. İlk baskı sicili arşiv açıldığında korunur.
- Kayıt biçimi 15 kalır. Daha önce sonuçlanmış mahkeme uyarılarına geriye dönük dosya açılmaz.

Aynı sürümde vekil transferi düzeltildi. 3/1/0 tercihi Yükseliş ve Demokrat Birlik gruplarının gerçek sandalye dağılımına, oylamaya ve destek tahminine yansır. Kentli ve genç seçmen tepkisi, parti içi huzursuzluktan ayrı işler. Sonuç ekranı sandalye değişimini ve gerçekleşen gösterge farklarını gösterir. Standart kararlar için en belirgin üç anlık gösterge değişimi gösterilir. Eski kararlarda kabul edilen vekiller bugünkü gruba katılır; eski tutanaklar ilk seçildikleri listeyle korunur.

## Bölüm 10 — Komisyonun Önündeki Servis Anahtarı

Sürüm 0.15.0. Ekim’de yatırım, tasarruf veya uzlaşma taslağı hazırlanır. Kasım’da komisyon, yatırımları ikinci dilime bırakma, ek ulaşım ödeneğiyle Bayrak grubuyla uzlaşma veya ilk taslağı koruma kararını verir.

- Komisyonun yatırım farkı doğrudan taslağa yazılır. Uzlaşma mevcut Meclis oy modelindeki grup desteğini etkiler; kabulü garanti etmez.
- Aralık oylaması gerçek tutanakla sonuçlanır. Kabul edilen fark ilk uygun ayın başında Hazine gider cetveline yalnız bir kez işler. Ret halinde mevcut cetvel korunur, taslak takip eden ay yeniden oylanır.
- Hazine ve Meclis, taslak ödeneği ile yürürlüğü ayrı gösterir. Eski sürümde açılmış bütçe oylamaları eski takviminde tamamlanır. Kayıt biçimi 15, bütçe planı alanı isteğe bağlıdır.

## Bölüm 11 — Son Oy, İlk Bordro

Sürüm 0.16.0. Genel Kurul ekranında çoğunluk farkı, grup bazında oylar ve yeni katılan vekillerin sonucu değiştirip değiştirmediği görünür. Arşiv sayımı tekrar oynatmadan aynı tutanağı açar.

- Sonuç yalnız o oylamada uygulanan kademe, gösterge ve yıllık Hazine kalemi farkını gösterir. Bekleyen bütçe ile yürürlükteki bütçe ayrılır. Eski tutanaklar mevcut oylarıyla açılır ve geriye dönük uygulama kaydı üretilmez.
- Aralık’taki emekli aylığı artışı kabul edilirse Ocak bordro itirazı, reddedilirse reçete borcu dosyası açılır. Belgeli reçetelere tek seferlik ödenek vermek kalıcı aylık kademesini değiştirmez. İnceleme ve açık hesap seçenekleri gün kullanır.
- Kararların gerçek uygulaması, oylama kaydı ve telefon/masaüstü arayüzü denetlenir. Kayıt biçimi 15 kalır.

## Bölüm 12 — Kura Listesinde İki İsim Eksik

Sürüm 0.17.0. Şubat’taki güçlendirilmiş yargı kurulu oylaması Karaburç adliyesinde bekleyen tahliye itirazına bağlanır. Karar anındaki Meclis tutanağı sıradaki dosyayı gösterir.

- Atama yetkisi değişirken iktidar hizipleri aynı yönde oy vermez. Mevcut kulis ve grup tavizi kabul ihtimalini etkiler.
- Kabul sonrası açık kura, bakanlık listesi ve olağan sıra farklı takip dosyaları açar. Ek vardiya bir defalık bütçe işlemi ve imzadır. Kapalı liste sicile girer. Yazıyı geri çekmek ilk sicil kaydını silmez.
- Ret halinde yeni teklif, mevcut usulle personel desteği ve mevcut iş sırası ayrı tercihlerdir. Yeniden teklif bir sonraki gerçek oylamadan geçerse kabul dosyası açılır. Geçici ödenek kanunu veya mahkeme hükmünü değiştirmez.
- Kura tutanağının kapsamı, bakanlık yazısının akıbeti ve başvurunun sevki ayrı kararlarla kayda girer. Eski tutanaklar kendi döneminde kalır. Kayıt biçimi 15.

## Bölüm 13 — Mühürlü Kasa, Açık Bordro

Sürüm 0.18.0. Akköprü’deki tekstil dosyasında ilk ücret desteği, alıcının yeni siparişi ve yükleme teyidi ayrı kararlardır.

- Yeni yazılı teklif, ilk vardiyanın doğrulanmış ücret desteği yolunda gelir. Alıcı ve bordro incelemesi bir gün kullanır. İnceleme sırasında ödeme yapılmaz.
- İkinci ödenek bir imza kullanır ve 480 kişilik bordroyla sınırlıdır. Sevkiyat ve banka kayıtları sonraki ay gelir. Eski dönemde ikinci ödemesi yapılmış dosya yeniden ödenmez.
- Son açıklama, kapsam dışında kalan 240 kişiyi ayrı gösterir veya doğrulanamayan iddia sicile yazılır. İlk dosya seçim ayından önce açılır. Kayıt biçimi 15.

## Bölüm 14 — Sandığın İkinci Nüshası

Sürüm 0.19.0. İl kongresinde listeyi açmak, itirazı kapatmak ve iki ekibi görevden almak farklı devam dosyaları açar. Kongrenin ili takip dosyasına taşınır.

- Yenilenen seçimin tanınması, sızan belgenin akıbeti ve geçici teşkilatın saha hazırlığı ayrı kararlar doğurur. Pazarlık sicili korunur.
- Parti kanatlarına işlenen destek, karar ekranında önceki ve sonraki değeriyle görünür. Destek, oy modelindeki olasılıkları değiştirir.
- Önceden tamamlanmış kongreye geriye dönük kart eklenmez. Kayıt biçimi 15.

## Bölüm 15 — Stüdyodaki İmzalı Nüsha

Sürüm 0.20.0. Tamamlanan il kongresi 17. ayda bir kez kampanya dosyasına gelir. Kongrenin son kararı ve sonucu münazaranın son sorusunda geçmişten okunur.

- Belgeleri ayıklayıp yayımlamak bir gün kullanır. Bu seçim, sonraki münazara yanıtının etkisini değiştirir.
- Belgeli açıklama, konuyu değiştirme ve belgeye aykırı inkâr kampanya puanına ayrı işler. İnkâr sicil kaydı oluşturur.
- Kongre tamamlanmamışsa genel son soru kullanılır. Kayıt biçimi 15.

## Bölüm 16 — Sandığın Hesabı

Sürüm 0.21.0. İlk tur sayımı bitince seçmen gruplarının ağırlıklı desteği, kampanya, rakip ve sandık belirsizliği ayrı görünür. Katkılar o geceye ait değerlerden kaydedilir.

- İkinci turda diğer adayların oy havuzu açılır. Ortak gelecek çağrısı güvene ve kutuplaşmaya, sert kampanya rakibin gücüne bağlıdır. İttifak parti içi huzursuzluğu, sert kampanya kutuplaşmayı artırır.
- İkinci tur tutanağı ilk tur oyunu ve havuzdan gelen payı gösterir. Yeniden sayım son ajans verisini günceller. Açılmış eski seçim kayıtları kendi sonuçlarıyla yüklenir. Kayıt biçimi 15.
