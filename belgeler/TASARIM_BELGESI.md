# Akköprü 2026 · Oyun Tasarım Belgesi (tam metin)

Bu dosya claude.ai'deki tasarım belgesinin 1 Kasım 2026 tarihli dışa aktarımıdır. Belgedeki dokuz sekme sırayla birleştirildi.

Notlar:
- "Onaylanan kararlar" başlıklı bölümler kilitlidir; kod bunlara göre yazılır. Kilitli bir karar değişecekse önce bu belge güncellenir.
- Belgedeki çizimler dışa aktarılamadı; yerlerine kısa açıklamalar kondu.
- "Uygulama planı" bölümündeki klasör ağacında arayüz için Svelte yazıyor; uygulamada React 19 seçildi (aynı bölümdeki "Teknik seçimler" tablosu doğrudur).
- Sistem 2'deki Meclis sandalye dağılımı kilitlidir: Yükseliş Partisi (iktidar) 278, Bayrak Partisi (ittifak ortağı) 46, Demokrat Birlik Partisi 153, Kalan Halkların Partisi 56, Ulusal Yol Partisi 59, boş 8 (toplam 600).


---

## Akköprü 2026 · Oyun Tasarım Belgesi

Nov 1, 2026 · @Bekir

### Özet

Akköprü 2026, kurgusal Doruk Cumhuriyeti'nde bir cumhurbaşkanının seçime kadar kalan 18 ayını oynatan, anlatı ağırlıklı bir siyaset simülasyonudur. Bu belge, 25 sürümlük prototipten çıkarılan dersleri temel alır ve oyunun baştan, planlı kurulması için kapsamı sabitler.

| Başlık | Hedef |
| --- | --- |
| Tür | Anlatı odaklı siyaset ve yönetim simülasyonu |
| Platform | Önce PC (Steam), sonra iOS ve Android |
| Bir dönemin süresi | 3–4,5 saat (18 ay × 10–15 dakika) |
| Bitişler | 4 ana bitiş (yeniden seçilme, yenilgi, devrilme, istifa) ve ülkenin sonraki 5 yılını anlatan kısa bir sonsöz |
| Diller | Türkçe ve İngilizce, çıkışta birlikte |
| Hedef oyuncu | Siyaset ve strateji oyunu oynayan, okumayı seven 20–45 yaş |
| Belge durumu | İlk taslak; prototip sürüm 25 bu belgenin kaynağıdır |

### Temel kararlar

Bu dört karar tüm sistemlerin, metinlerin ve ekranların çerçevesidir; değişmeleri bütün belgeyi değiştirir.

| Konu | Karar | Sonucu |
| --- | --- | --- |
| Ton | Kara mizahlı dram | Konular ciddi, bedeller gerçek; gazete dili, kulis konuşmaları ve bazı olaylar iğneleyici ve absürt |
| Görünürlük | Karma | Resmî ekonomi rakamları sayıyla (enflasyon, kur, işsizlik, bütçe); kamuoyu, kurumlar ve ilişkiler sözlü ve yanılma payıyla |
| Tempo | Bir ay 10–15 dakika | Ayda 4–6 karar ve bir sahne; bir dönem 3–4,5 saat |
| Bitiş | Tek dönem ve sonsöz | Oyun seçim gecesinde biter; ardından oyuncunun kararlarına göre yazılmış 5 yıllık bir sonsöz gelir |

### Tasarım aşamasının durumu

Altı sistemin kural belgeleri, ekranlar ve uygulama planı 1 Kasım 2026'da tamamlandı ve kilitlendi; sıradaki aşama altyapıdır.

- Sistem 1: Sistem 1 · Kararlar
- Sistem 2: Sistem 2 · Meclis
- Sistem 3: Sistem 3 · Ekonomi
- Sistem 4: Sistem 4 · Toplum
- Sistem 5: Sistem 5 · Medya
- Sistem 6: Sistem 6 · Seçim
- Ekranlar: Ekranlar ve görsel dil
- Plan: Uygulama planı

### Oyuncu deneyimi ve tasarım ilkeleri

Oyuncunun hissetmesi gereken tek şey: "Güç elimde, ama her karar birilerini kaybettiriyor; dönemin sonunda hem ülkeyi hem kendimi değiştirdim."

1. **Her kararın bir yüzü var.** Bir kararın etkisi önce bir kişide, bir manşette ya da bir sahnede görünür; sayı ikinci planda kalır. Prototipte en çok işleyen anlar (beş hayat, gazeteler, seçim gecesi) bu ilkeye uyanlardı.
2. **Az ama derin.** Bir sistem en az iki başka sistemi etkilemiyorsa oyuna girmez. Yeni bir özellik ancak mevcut bir sistemin yerine ya da içine girerek eklenir.
3. **Belirsizlik bilinçli.** Oyuncu sonucu tahmin eder ama kesin bilemez: danışmanlar yanılır, anketler sapar, müttefikler ihanet eder. Hiçbir seçenek her durumda doğru cevap değildir.

Oyun ne değildir: bir kontrol paneli değildir, gerçek hayattaki her politikanın listesi değildir, bir siyasi görüşü ödüllendiren bir propaganda aracı değildir.

### Temel döngü

Oyunun ritmi aydır: bir ay 10–15 dakika sürer, 15 ay yönetimle ve 3 ay kampanyayla geçer, dönem seçim gecesinde biter.

*(Çizim dışa aktarımda yer almıyor: bir ayın döngüsü — sabah gazeteleri, masa, kararlar, sahne, ay sonu raporu; dönem — 15 ay yönetim, 3 ay kampanya, seçim gecesi.)*

Ay sonundaki tepkiler ve rapor ertesi ayın gündemini üretir; kazanma ve kaybetme seçim gecesinde ya da daha önce devrilme veya istifayla belirlenir.

### Tutulacak ana sistemler

Oyun altı sistemle kurulur; prototipteki diğer her şey bunlardan birinin içine girer ya da çıkarılır.

| Sistem | Prototipteki hali | Derinleştirme hedefi | Etkilediği sistemler |
| --- | --- | --- | --- |
| Kararlar ve anlatı | 3 seçenekli kartlar, dağınık olaylar | Ay boyunca süren, birbirine bağlı olay zincirleri; her seçeneğin gizli ve gecikmeli bedeli; 3 ana anlatı yayı (Akköprü, rakip aday, aile) | Hepsi |
| Meclis, parti ve kurumlar | Oylama, kulis, ihanet, kurum başkanları | Milletvekili düzeyinde kulis; parti içi hizipler; yargı ve bürokrasinin direnci tek bir "güç ağı" ekranında | Kararlar, Ekonomi, Seçim |
| Ekonomi ve Hazine | 13 gösterge, bütçe kalemleri, kur | Gösterge sayısı 6'ya iner; Hazine masası tek ekonomi ekranı olur; her sözün maliyeti görünür | Toplum, Medya, Seçim |
| Toplum ve sokak | 17 seçmen grubu, eylemler, beş hayat, topluluklar | Grup sayısı 10–12'ye iner; beş hayat oyunun duygusal omurgası olur; eylemler bir haritada büyür ve söner | Kararlar, Medya, Seçim |
| Medya ve kamuoyu | Gazeteler, kanallar, basın toplantısı, sosyal medya | Basın toplantısı tam bir sahne olur (yalan, iftira, ifşa); her kanalın kendi muhabiri ve hikâyesi | Toplum, Seçim, Meclis |
| Seçim | Kampanya, miting, seçim günü, seçim gecesi | Kampanya son 3 ayın ayrı bir oyun evresi olur; seçim gecesi oyunun doruk sahnesi olur | Hepsinin sonucu |

### Prototipten çıkan dersler

Prototip 25 sürümde 20'den fazla sisteme ve 87 düzenlemeye ulaştı; genişlik arttıkça her sistemin etkisi küçüldü ve oyun bir kontrol paneline döndü.

- **İşleyenler:** kulis ve ihanet, basın toplantısında yalan ve ifşa, beş hayat, aynı olayın üç gazetede farklı manşeti, seçim gecesi, Akköprü hikâyesi.
- **İşlemeyenler:** tek tek etkisi küçük düzenleme kartları; ekranda sayı ve gösterge kalabalığı; birbirine dokunmayan yan sistemler.
- **Teknik ders:** tek dosyada birleştirilen 35 parça ve üst üste sarılan fonksiyonlar her yeni özellikte eski bir şeyi bozdu.

| Prototip sistemi | Karar | Yeni yeri |
| --- | --- | --- |
| Politikalar (19 kanun ve karar) | Birleştir | Düzenlemelerle tek "Program" listesi, toplam 25–30 kalem |
| Yönetmelikler (87) | Azalt | En etkili 15–20'si kalır; diğerleri olay kartı olur |
| Halk hattı, kapıda bekleyenler | Birleştir | Beş hayat ve "Halk" sahneleri |
| Kulis, pazarlık, ihanet | Tut | Meclis, parti ve kurumlar |
| Devlet aygıtı (6 kurum başkanı) | Sadeleştir | Güç ağı ekranı |
| Medya kuruluşları ve holdingler | Birleştir | Medya ve kamuoyu |
| Akköprü, rakip aday, aile hikâyeleri | Tut | Ana anlatı yayları |
| Topluluklar (5 temsilci) | Birleştir | Toplum: talep sahneleri |
| Gizli eylemler ve dosyalar | Tut | Kararların gizli bedeli |
| Dış politika (elçiler, ticaret, ambargo, komşular) | Azalt | Olay zincirleri ve tek ticaret ekranı |
| Yaşam göstergeleri (16) | Azalt | 8 gösterge, dönem sonu karnesinde |
| Başarımlar, lider imajı, pusula | Ertele | Çıkıştan sonra |
| Kodla üretilmiş sesler | At | Gerçek müzik ve ses efektleri |

### Anlatı, yazı dili ve içerik hassasiyeti

Metin oyunun ana malzemesidir; her metin bir editörden geçer ve tek bir yazı rehberine uyar.

- **Ses tonu:** kuru, gazeteci gözüyle, kısa cümleler. Abartı, slogan ve kalıp ifadeler yok.
- **Yazı rehberi:** cümle uzunluğu, kurgusal ad listesi (kişi, şehir, parti, kurum), adların tekrar etmemesi, iyelik ve hal eklerinin içerik derleyicisinde otomatik üretilmesi.
- **Kurgusallık:** gerçek kişi, parti, örgüt ve marka adı kullanılmaz. Gerçek kurum adlarının (Diyanet, RTÜK, YÖK, MİT) kurgusal karşılıklarla değiştirilip değiştirilmeyeceği açık sorudur.
- **Hassas konular:** din toplulukları, cemaat ve tarikat ilişkileri, azınlık hakları, darbe, kayyum, seçim usulsüzlüğü. Hepsi iki yönlü yazılır: hiçbir siyasi tutum oyun mekaniğiyle sürekli ödüllendirilmez ya da cezalandırılmaz.
- **Hukuki inceleme:** çıkıştan önce Türkiye hukuku açısından bir avukat metinleri inceler; Steam ve mobil mağazalar için yaş sınıflandırması alınır.
- **İngilizce sürüm:** Türkiye'ye özgü kavramlar için oyun içi kısa bir sözlük ekranı olur.

### Görsel ve ses kimliği

Görsel yön, prototipteki "Cumhurbaşkanlığı masası" fikrinin büyütülmesidir: devlet evrakı ile haber ekranının buluştuğu bir masa.

| Alan | İçerik | Dikey kesitte |
| --- | --- | --- |
| Sanat yönü | Kâğıt dokusu, mühür, daktilo harfleri, gazete sütunları; sınırlı renk paleti | Stil rehberi ve 3 ekran taslağı |
| Ekranlar | Masa (ana ekran), Meclis salonu, basın odası, seçim gecesi stüdyosu | Masa ve basın odası |
| Portreler | Bakanlar, beş hayat, rakip aday, gazeteciler, temsilciler; her biri 3 ifadeyle (yaklaşık 40 karakter) | 15 portre |
| Arayüz | Renk, tipografi ve bileşenlerden oluşan bir tasarım sistemi (Figma) | Tam tasarım sistemi |
| Müzik | 5–6 parça: masa, kriz, kampanya, seçim gecesi, bitiş | 2 parça |
| Ses efektleri | 30–40 efekt: kâğıt, mühür, telefon, kalabalık, alkış, flash | 15 efekt |

### Teknik mimari

Yeni kod prototipten taşınmaz, baştan yazılır: içerik veri dosyalarında, oyun kuralları arayüzden bağımsız bir çekirdekte durur.

*(Çizim dışa aktarımda yer almıyor: 5 katman — içerik (YAML), derleyici, çekirdek (saf TypeScript), arayüz, platform sarmalayıcıları.)*

Bir yazar kod bilmeden kart ve olay ekleyebilir; çekirdek aynı kalarak web, masaüstü ve mobilde çalışır.

- **Depo ve sürüm:** tek git deposu, her değişiklik bir dal ve inceleme üzerinden; Claude Code bu depoda çalışır.
- **Test:** çekirdek birim testleri ve 1.000 bot oyunu her commit'te otomatik çalışır; arayüz için ekran görüntüsü karşılaştırması (Playwright).
- **Yerelleştirme:** ekranda görünen her metin bir anahtarla çekilir; Türkçe ekler kurala göre üretilir.
- **Test verisi:** oyun testlerinde, oyuncu onayıyla, anonim karar ve bitiş verisi toplanır; denge bu veriyle kurulur.

### Dikey kesit

Dikey kesit, oyunun ilk 6 ayını çıkış kalitesinde oynatır; amacı temel döngünün gerçek oyunculara zevk verip vermediğini ölçmektir.

**Kapsam**

- Altı ana sistemin hepsi, seçim hariç (seçim yalnız anket olarak görünür)
- 40 karar kartı, 3 olay zinciri, Akköprü yayının ilk iki bölümü
- 15 düzenleme, kulisli 2 kritik Meclis oylaması, 1 tam basın toplantısı
- Beş hayat, üç gazete, iki televizyon kanalı
- Masa ve basın odası ekranları, 15 portre, 2 müzik parçası, 15 ses efekti
- Türkçe ve İngilizce metin

**Kabul ölçütleri**

- [ ] 10 testten en az 8'inde oyuncu 6 ayı bitirip devam etmek istediğini söylüyor
- [ ] Bir ay ortalama 10–15 dakika sürüyor
- [ ] Test oyuncuları ay sonunda "bu neden oldu" sorusunu ay raporundan cevaplayabiliyor
- [ ] Hiçbir karar seçeneği testlerin %70'inden fazlasında seçilmiyor
- [ ] Simülasyon çekirdeği 1.000 bot oyununda hatasız bitiyor
- [ ] iPhone ve masaüstünde ilk açılış 3 saniyenin altında, geçişler akıcı

### Yol haritası ve ekip

Proje altı aşamada ilerler; üç kapıdan biri geçilmeden sonraki aşamaya geçilmez.

*(Çizim dışa aktarımda yer almıyor: 6 aşamalı yol haritası ve 3 karar kapısı.)*

En kritik kapı dikey kesitin kabul ölçütleridir: ölçütler tutmazsa üretime geçilmez, temel döngü yeniden tasarlanır.

| Rol | İş | Nasıl karşılanır |
| --- | --- | --- |
| Oyun tasarımcısı ve yapımcı | Kapsam, kararlar, test oturumları | Sen |
| Programcı | Çekirdek, arayüz, platformlar | Sen ve Claude Code; gerekirse bir serbest geliştirici |
| Yazar ve editör | Kartlar, olaylar, yazı rehberi | Yarı zamanlı, dikey kesitten itibaren |
| İllüstratör | Portreler, ekranlar | Dış kaynak |
| Arayüz tasarımcısı | Tasarım sistemi | Dış kaynak, dikey kesitte |
| Müzik ve ses tasarımcısı | Parçalar ve efektler | Dış kaynak |
| Çevirmen | İngilizce metin | Dış kaynak, üretim sonunda |
| Avukat | Hukuki inceleme | Çıkıştan önce |

### Riskler ve açık sorular

En büyük risk kapsamın yeniden şişmesidir; ikinci risk oyunun Türkiye'deki gerçek tartışmalara yakınlığıdır.

| Risk | Etki | Önlem |
| --- | --- | --- |
| Kapsam yeniden şişer | Yüksek | Altı sistem listesi dışında özellik eklenmez; eklenecek her şey bir şeyin yerini alır |
| Hukuki ve siyasi tepki | Yüksek | Tam kurgusallık, iki yönlü yazım, çıkış öncesi avukat incelemesi |
| Yazı yükü çok büyük | Yüksek | İçerik veri dosyalarında; yazı rehberi; yarı zamanlı editör |
| İngilizce pazarda konular anlaşılmaz | Orta | Evrensel çerçeve (iktidar, medya, para), oyun içi sözlük |
| Denge yalnız botla kurulur | Orta | Her aşamada gerçek oyuncu testi ve anonim test verisi |
| Mobil performans | Düşük | Çekirdek ile arayüz ayrı; düzenli cihaz testi |

**Açık sorular**

- [x] Oyunun adı "Akköprü 2026" olarak kalacak mı?
- [x] Gerçek kurum adları (Diyanet, RTÜK, YÖK, MİT) kurgusal adlarla değiştirilecek mi?
- [x] Oyun tek dönemle mi biter, ikinci dönem oynanabilir mi?
- [x] Dış kaynak (çizer, müzisyen, editör) için ayrılacak bütçe ne kadar?
- [x] Çıkış sırası: önce PC mi, PC ve mobil birlikte mi?

---

## Sistem 1 · Kararlar ve anlatı

Nov 1, 2026 · @Bekir

Kararlar oyunun omurgasıdır: oyuncu her ay 4–6 karar verir ve her kararın bir görünen, bir de gizli ya da gecikmeli bedeli vardır.

### Ayın karar bütçesi

Bir ay 5 karar ve 1 sahneden oluşur; bu, 10–15 dakikalık tempoya karşılık gelir (karar başına 1,5–2 dakika, sahne 3–4 dakika).

| Tür | Ayda | Ne zaman | Örnek |
| --- | --- | --- | --- |
| Ayın ana kararı | 1 (zorunlu) | Ayın başında, masada ilk sırada | Asgari ücret, bütçe, faiz, büyük bir kriz |
| Masa kararları | 2–3 | Ay boyunca, oyuncunun seçtiği sırayla | Bakan talebi, belediye krizi, holding isteği |
| Zincir kararı | 0–1 | Bir olay zinciri o ay ilerliyorsa | Akköprü'de kaza, rakibin dosyası |
| Acil karar | En fazla 1 | Aynı ay içinde, süreli (örneğin 45 saniye) | Deprem, darbe söylentisi, rehine krizi |
| Sahne | 1 | Ayın ortası ya da sonu | Basın toplantısı, kulis görüşmesi, miting, saha ziyareti |

Oyuncu masa kararlarının birini ertesi aya erteleyebilir; ertelenen karar bir sonraki ay daha ağır bir sürümle geri gelir. Ana karar ve acil karar ertelenemez.

### Karar kartının anatomisi

Her kartı bir kişi getirir ve her kartta 3 seçenek vardır; oyuncu seçmeden önce yalnız görünen etkiyi, o da bir danışmanın tahmini olarak görür.

| Parça | İçerik | Oyuncu görür mü |
| --- | --- | --- |
| Getiren kişi | Bakan, danışman, parti yöneticisi, vatandaş; portresi ve ilişki durumu | Evet |
| Durum | 2–4 cümle: ne oldu, kim ne istiyor | Evet |
| Kulis notu | Getiren kişinin ya da Özel Kalem'in tek cümlelik, çoğu zaman iğneleyici yorumu (kara mizah buradan girer) | Evet |
| Seçenek | 3 seçenek; her biri bir eylem cümlesi | Evet |
| Görünen etki | Ekonomide sayıyla ("enflasyon +0,4 puan"), kamuoyunda sözlü ("emekliler kızar"); danışmanın tahmini, yanılabilir | Tahmin olarak |
| Gerçek etki | Tahminden sapabilir; sapma danışmanın yetkinliğine bağlı | Ay sonu raporunda |
| Gizli bedel | Sicile düşen bir kayıt: usulsüzlük, yalan, kırılan söz | Hayır, ifşa olursa |
| Gecikmeli olay | 1–6 ay sonra gelen bir kart ya da haber | Hayır |
| Bağ | Seçeneğin başlattığı ya da kapattığı olay zinciri | Hayır |

Kurallar:

- Hiçbir seçenek her açıdan iyi değildir; her seçeneğin en az bir kaybeden kesimi vardır.
- "Hiçbir şey yapma" seçeneği yalnız hikaye gerektiriyorsa vardır ve onun da bedeli vardır.
- Kart metni en fazla 60 kelime, seçenek en fazla 12 kelime.

### Olay zincirleri

Bir olay zinciri 2–4 ay süren, 3–5 karttan oluşan bir mini hikâyedir; her kartın hangi sürümün geleceğini önceki seçimler belirler.

1. **Tohum:** küçük görünen bir karar ya da haber. Örnek: bir belediye başkanı maaş ödeyemediğini açıklar.
2. **Gelişme:** seçime göre iki ya da üç farklı kart. Örnek: kaynak verildiyse başka belediyeler de ister; verilmediyse çöpler toplanmaz, grev başlar.
3. **Doruk:** zincirin en ağır kararı ya da bir sahne. Örnek: grevde bir işçi ölür, başkan televizyonda size seslenir.
4. **Sonuç:** kalıcı bir iz. Örnek: belediye başkanı rakip partiye geçer ya da sizin adaya dönüşür; bir gazete manşeti ve sicilde bir kayıt kalır.

Kurallar:

- Aynı anda en fazla 3 zincir açık olur.
- Her zincirin en az iki farklı sonu vardır; sonların biri oyuncuya beklenmedik gelir.
- Dikey kesit 3 zincirle başlar: belediye borcu, bir bakanın skandalı, sokaktan gelen bir protesto. Tam oyun hedefi 20 zincirdir.

### Ana anlatı yayları

Üç ana yay dönem boyunca süren uzun olay zincirleridir; bölümleri aynı aya denk gelmeyecek şekilde dağıtılır.

*(Çizim dışa aktarımda yer almıyor: Akköprü, rakip aday ve aile yaylarının bölümleri 18 aya, aynı aya denk gelmeyecek şekilde dağıtılır.)*

Her bölüm aynı ayın zincir kararı ya da sahnesidir; dikey kesit ilk 6 ayı kapsadığı için her yayın ilk bir ya da iki bölümünü içerir.

### Gizli bedel, sicil ve ifşa

Her gizli bedel "sicil" adı verilen bir listeye düşer; sicildeki her kayıt her ay belli bir olasılıkla ifşa olabilir ve ifşa bir olay zinciri başlatır.

| Kayıt türü | Örnek | Ifşa olasılığını artıran |
| --- | --- | --- |
| Usulsüzlük | Yakın holdinge ihale | Basın özgürlüğü, kırılan bir müttefik |
| Yalan | Basın toplantısında gerçek dışı rakam | Muhalif kanal sayısı, bağımsız istatistik kurumu |
| Kırılan söz | Kulis'te verilip tutulmayan söz | Söz verilen kişinin kırgınlığı |
| Baskı | Gazeteciye dava, kayyum | Yargı bağımsızlığı, dış basın |

- Ifşa anında oyuncuya üç yol sunulur: kabul et ve sorumluyu feda et, inkar et (yeni bir yalan kaydı), karşı saldırı (kutuplaşma artar).
- Sicil dönem sonunda sonsözün malzemesidir: ifşa olmayan kayıtlar sonsözde "yıllar sonra ortaya çıkanlar" olarak anlatılır.

### Kartların seçilme kuralı

Ay başında masa bir "deste" adı verilen havuzdan doldurulur; sıra sırasıyla önce zorunlu kartlar, sonra ağırlıklı rastgele seçim gelir.

1. **Zorunlu kartlar:** takvim kartları (bütçe Ekim'de, asgari ücret Aralık'ta), ilerleyen zincirlerin kartları, ifşalar.
2. **Uygun kartlar:** koşulu tutan kartlar. Koşul örnekleri: enflasyon %30'un üstünde, Sağlık Bakanı zayıf, kutuplaşma yüksek, belirli bir bayrak açık.
3. **Ağırlık:** gündemle ilgili kartların ağırlığı artar; örneğin kur baskısı yüksekken ekonomi kartları 2 kat sık gelir.
4. **Çeşitlilik:** aynı kategoriden ayda en fazla 2 kart; aynı kişiden ayda en fazla 1 kart; görülen bir kart 12 ay boyunca tekrar gelmez.
5. **Tohum:** her oyunun bir rastgele tohumu vardır; aynı tohum ve aynı seçimler her zaman aynı oyunu üretir. Bu, hata ayıklama ve denge testi için zorunludur.

Hacim hedefi: dikey kesit için 40 kart (6 ay × 5 karar + yedek), tam oyun için 250–300 kart.

### Veri şeması

Her kart bir YAML dosyasıdır; derleyici dosyayı şemaya göre denetler, eksik ya da hatalı alan varsa oyun derlenmez. Aşağıdaki örnek belediye borcu zincirinin tohum kartıdır.

```yaml
id: belediye_maas_1
kategori: yerel
zincir: belediye_borcu
asama: tohum
getiren: ozel_kalem
kosul:
  belediye_muhalif: true
agirlik: 1.0
metin:
  baslik: "{il} Belediyesi maaş ödeyemiyor"
  durum: >
    {il} Büyükşehir Belediyesi işçi maaşlarını ödeyemeyeceğini açıkladı.
    Çöpler toplanmıyor, toplu taşımada grev kapıda.
  kulis: "Başkan bu sabah televizyona çıktı; arkasındaki çöp dağı ondan daha çok konuşuldu."
secenekler:
  - metin: Hazine'den acil kaynak aktar
    etki: { butce_acigi: +0.05, grup.kentli: +0.4 }
    bayrak: belediyeye_kaynak
    sonraki: belediye_maas_2a
  - metin: "Kötü yönetimin bedelini halk ödüyor" de
    etki: { grup.kentli: -0.6, rakip: +0.3 }
    sonraki: belediye_maas_2b
  - metin: Belediyeye mali denetim başlat
    etki: { kutuplasma: +4 }
    sicil: { tur: baski, kaynak: "Belediyeye denetim" }
    sonraki: belediye_maas_2c
```

Metindeki `{il}` gibi yer tutucular derleme sırasında doldurulur; Türkçe ekler ("{il:de}" → "Yalıkent'te") ek motoruyla üretilir.

### Onaylanan kararlar

Sistem 1, 1 Kasım 2026'da önerilerle onaylandı ve kilitlendi.

- [x] Seçenek sayısı: her kartta sabit 3
- [x] Acil kararlar: kalır, ayda en fazla 1
- [x] Erteleme: ayda bir masa kararı ertelenebilir, ağırlaşarak geri gelir
- [x] İkinci görüş: alınabilir, takvimden bir gün karşılığında
- [x] Ay sonu raporu: ekonomi sayıyla, kamuoyu sözlü
- [x] Mizah dozu: kulis notu yaklaşık her üç kartta bir

---

## Sistem 2 · Meclis, parti ve kurumlar

Nov 1, 2026 · @Bekir

Cumhurbaşkanı karar verir ama kararı uygulatmak başkalarına bağlıdır: Meclis çoğunluğu, partinin hizipleri, ittifak ortağı ve devlet kurumları. Bu sistem, oyuncunun her kararının bir "uygulatma" bedeli olmasını sağlar.

### Güç ağının aktörleri

Meclis 600 sandalyedir; iktidar partisi tek başına çoğunlukta değildir ve kanun geçirmek için ittifak ortağına ya da muhalefetten oylara muhtaçtır. İlişkiler karma kurala uygun olarak sözlü gösterilir ("soğuk", "mesafeli", "yakın"); sandalye sayıları sayıyla görünür.

| Aktör | Sandalye | Ne ister | Ne zaman karşı çıkar |
| --- | --- | --- | --- |
| Yükseliş Partisi (iktidar) | 278 | Seçim kazanmak, kadro, bölgelerine yatırım | Anketler düşünce, hizbi dışlanınca |
| Bayrak Partisi (ittifak ortağı) | 46 | Milliyetçi tutum, güvenlik, bakanlık | Barış süreci, azınlık hakları, AB'ye yakınlaşma |
| Demokrat Birlik Partisi (ana muhalefet) | 153 | Yargı bağımsızlığı, basın özgürlüğü, erken seçim | Neredeyse her zaman; ortak kaygıda (deprem) destek verebilir |
| Kalan Halkların Partisi | 56 | Anadil, yerel yönetim, barış süreci | Kayyum, güvenlik operasyonları |
| Ulusal Yol Partisi | 59 | Ekonomide sıkı politika, muhafazakâr değerler; vekilleriyle tek tek pazarlık | Harcama paketleri, laik reformlar |
| Bağımsız ve boş | 8 | — | — |

Kanun için katılanların salt çoğunluğu, anayasa değişikliği için 360 oy (halkoylamasıyla) ya da 400 oy (doğrudan) gerekir. Bu sayılar prototipteki düzenin devamıdır.

### Bir kararın yolu

Kanun gerektiren bir karar iki engelden geçer: Meclis oylaması ve Anayasa Mahkemesi. Kararname Meclis'e uğramaz ama uygulaması kurumlara kalır.

*(Çizim dışa aktarımda yer almıyor: kanun → Meclis oylaması → Anayasa Mahkemesi; kararname → doğrudan yürürlük → kurumların uygulaması ve mahkeme itirazı.)*

Oyuncu her kararda bu iki yol arasında seçim yapar: kanun yavaş ve riskli ama kalıcıdır; kararname hızlıdır ama kurumların direncine ve mahkeme itirazına açıktır.

### Kulis

Kulis parti düzeyinde değil, kişi düzeyinde oynanır: her kritik oylamada 8–12 kararsız vekil vardır ve oyunun sonucu onları ikna etmeye bağlıdır.

**Kararsız vekil kartı**

- Ad, parti, seçim bölgesi, portre
- Derdi: bölgesine yatırım, makam, bir yakınının davası, vicdani itiraz
- Eğilimi: sözlü ("evete yakın", "kararlı ret") ve yanılma payıyla
- Geçmişi: daha önce verilen ve tutulan ya da kırılan sözler

**Pazarlık araçları**

| Araç | Bedeli | Risk |
| --- | --- | --- |
| Söz (bölgeye yatırım, makam) | Bütçe ya da kadro; söz sicile yazılır | Tutulmazsa vekil küser, ifşa olabilir |
| İkna (kişisel görüşme) | Takvimden bir gün | Başarı vekilin derdine ve ilişkiye bağlı |
| Baskı (dosya, soruşturma tehdidi) | Sicile baskı kaydı | Vekil kayıt alabilir, kamuoyuna sızabilir |
| Algı operasyonu (yakın medya) | Medya ilişkisi | Ters tepebilir, vekil küsebilir |
| Pazarlık (parti genel başkanıyla) | Politika tavizi | Kendi tabanın tepki verir |

**İhanet:** oylama gizlidir ya da son dakikada değişebilir. "Evet" sözü veren her vekilin, ilişkisine ve kırılan sözlere göre hesaplanan bir fire olasılığı vardır. Oyuncu bu olasılığı görmez; yalnız grup başkanvekilinin tahminini duyar.

### Parti içi

Partinin 278 vekili tek blok değildir: üç hizip vardır ve her biri ayrı bir memnuniyet düzeyi taşır. Bir hizbin memnuniyeti çökerse o hizbin vekilleri oylamalarda fire verir.

| Hizip | Yaklaşık vekil | Ne ister | Lideri |
| --- | --- | --- | --- |
| Eski kadro | 110 | Parti örgütüne kadro, örgüte danışılması | Partinin kurucu genel sekreteri |
| Teknokratlar | 80 | Piyasa dostu ekonomi, liyakat | Eski bir Hazine bakanı |
| Muhafazakâr kanat | 88 | Aile, din, eğitim politikaları | Taşra kökenli bir grup başkanvekili |

- **Veliaht:** dönemin ortasında bir hizip lideri "veliaht" olarak öne çıkar. Oyuncu onu kabineye alıp kontrol etmeyi, harcamayı ya da tasfiye etmeyi seçer.
- **Kurultay:** üç hizbin ikisinin memnuniyeti çökerse olağanüstü kurultay gündeme gelir; kurultay kaybedilirse oyun "istifa" bitişiyle sona erer.
- **Ayrılma:** hizip lideri dışlanırsa 15–30 vekille yeni parti kurabilir; bu Meclis aritmetiğini kalıcı olarak değiştirir.

### Kurumlar ve direnç

Kanun geçse bile uygulamayı kurumlar yapar; her kurumun başındaki kişinin iki özelliği vardır: size sadakati ve işindeki liyakati. Sadık ama liyakatsiz bir isim kararı uygular ama kötü uygular; liyakatli ama sadık olmayan bir isim iyi uygular ama yeri geldiğinde direnir.

| Kurum | Direnç biçimi | Oyuncunun aracı |
| --- | --- | --- |
| Anayasa Mahkemesi ve yargı kurulu | Kanunu iptal eder, kararnameyi durdurur | Atama, yargı paketi; bedeli itibar ve AB ilişkisi |
| Merkez Bankası | Faiz kararında baskıya uymaz | Başkanı görevden alma; bedeli kur ve yatırımcı güveni |
| İstatistik kurumu | Gerçek enflasyonu açıklar | Sadık atama; resmî rakamların güvenilirliği düşer |
| Genelkurmay ve istihbarat | Operasyonu yavaşlatır, bilgi sızır | Atama; bedeli orduda huzursuzluk |
| Bürokrasi (bakanlıklar) | Kararı geciktirir, uygulamayı sulanmaya bırakır | Bakan değişikliği, genelge, takip toplantısı |

Kurum başkanları ayrı bir yönetim ekranı değildir; Sistem 1'deki kartlar olarak gelir (örneğin "Merkez Bankası Başkanı faiz indirimine karşı çıktı").

### Ekranlar ve dikey kesit kapsamı

Sistem iki ekranda görünür; ikisi de Sistem 1'in karar akışına bağlanır.

- **Meclis ekranı:** sıradaki oylama, partilerin tahmini tutumu (sözlü), kararsız vekillerin listesi. Vekil kartına dokununca kulis görüşmesi açılır; görüşme ayın sahnesi olarak sayılır.
- **Oylama anı:** sayım tek tek oylarla akar; fireler ve sürprizler isimleriyle düşer. Sonuç ertesi sabah gazete manşetine dönüşür.

**Dikey kesitte**

- 2 kritik oylama: biri ekonomi (vergi ya da emekli zammı), biri hukuk (yargı ya da basın düzenlemesi)
- Her oylamada 8 kararsız vekil, toplam 12 farklı vekil karakteri
- 3 hizip ve memnuniyetleri; kurultay dikey kesitte yok
- 2 kurum başkanı kartı: Merkez Bankası ve Anayasa Mahkemesi
- 1 ihanet sahnesi: söz veren bir vekilin son dakika firesi

### Onaylanan kararlar

Sistem 2, 1 Kasım 2026'da önerilerle onaylandı ve kilitlendi.

- [x] Parti sayısı: 5 parti; Ulus ve Yeni Yol, Ulusal Yol Partisi adıyla birleşti (59 sandalye)
- [x] Kulis görüşmesi: ayın sahnesi yerine geçer
- [x] Baskı aracı: kalır; sicile yazılır, ifşa olabilir
- [x] Kurultay yenilgisi: oyunu "istifa" bitişiyle bitirir
- [x] Kurum başkanları: yalnız kart olarak gelir

---

## Sistem 3 · Ekonomi ve Hazine

Nov 1, 2026 · @Bekir

Ekonomi oyunun sayıyla görünen tek alanıdır ve neredeyse her kararın faturası buraya düşer; ama oyuncu ekonomiyi yönetmez, ekonomiyle siyaset yapar.

### Göstergeler

Prototipteki 13 gösterge 8'e iner: 6 resmî rakam sayıyla, 2 durum sözlü görünür. Başlangıç değerleri oyun varsayımıdır.

| Gösterge | Görünüm | Başlangıç | En çok kimi etkiler |
| --- | --- | --- | --- |
| Enflasyon (yıllık) | Sayı, % | %29 | Herkes; en çok emekli, asgari ücretli, kiracı |
| Büyüme | Sayı, % | %2,5 | İş dünyası, işsizler |
| İşsizlik | Sayı, % | %8 | Gençler, kentli orta sınıf |
| Bütçe açığı | Sayı, GSYH'nin %'si | %3,5 | Kredi notu, yatırımcılar |
| Dolar kuru | Sayı, TL | 50 | İthalatçı, ihracatçı, enflasyon |
| Politika faizi | Sayı, % (Merkez Bankası belirler) | %35 | Kredi kullananlar, büyüme |
| Yatırımcı güveni | Sözlü: "çok zayıf"tan "güçlü"ye | orta | Kur, rezerv, büyüme |
| Rezerv durumu | Sözlü: "rahat", "sıkışık", "tehlikede" | rahat | Kur krizine karşı dayanıklılık |

Konut, deprem hazırlığı, sosyal huzur gibi prototip göstergeleri ekonomiden çıkar: konut ve sosyal huzur Sistem 4'e (Toplum), deprem hazırlığı olay kartlarına taşınır.

### Ekonominin işleyişi

Oyuncu ekonomiye iki kapıdan dokunur: harcama ve vergi ile Merkez Bankası'na baskı. Geri kalan her şey bu iki kapıdan yayılan zincirlerle değişir.

*(Çizim metne çevrildi — ekonominin neden-sonuç ağı; + artırır, − azaltır:)* Harcama artışı → (+) bütçe açığı → (−) yatırımcı güveni → (−) dolar kuru → (+) enflasyon. Bütçe açığı → (+) enflasyon. Merkez Bankası'na baskı → (−) politika faizi → (−) enflasyon ve (−) büyüme. Büyüme → (−) işsizlik. Enflasyon ve işsizlik → (+) market fişi, o da anketlere yansır.

Kur ile enflasyon birbirini besleyen bir döngü kurar: güven düşünce kur yükselir, kur enflasyonu artırır, enflasyon market fişiyle seçmene ulaşır.

- **Aylık güncelleme:** her gösterge her ay bir hedef değere doğru, aradaki farkın bir kısmı kadar ilerler; ani sıçramalar yalnız kriz anında olur.
- **Gecikme:** harcamanın etkisi 2–4 ayda, faizin etkisi 3–6 ayda tam görülür; oyuncu bugünün faturasını aylar sonra öder.
- **Dış dünya:** petrol fiyatı ve küresel faiz her ay küçük oynar; bunlar olay kartlarıyla da gelir (örnek: küresel faiz artışı).
- **Harcamanın büyümeye etkisi:** yatırım harcaması büyümeyi artırır; çizimde sadelik için gösterilmedi.

### Hazine masası

Hazine masası oyunun tek ekonomi ekranıdır: oyuncu burada paranın nereye gittiğini, hangi sözün kaça mal olduğunu ve hangi aracın ne getireceğini görür. Tutarlar trilyon ve milyar TL olarak yazılır.

- **Giderler (8 kalem):** emekli aylıkları, kamu personeli, faiz ödemeleri, sağlık, eğitim, savunma, sosyal yardım, yatırım.
- **Gelirler (5 kalem):** gelir vergisi, KDV ve ÖTV, kurumlar vergisi, akaryakıt ve tütün vergisi, özelleştirme ve diğer.
- **Söz defteri:** verilen her söz (miting, kulis, halk hattı) maliyetiyle ve vadesiyle burada listelenir; tutulmayan söz sicile geçer.
- **Araçlar:**

| Araç | Getirisi | Bedeli |
| --- | --- | --- |
| Harcama kesintisi | Açık küçülür | Kesilen kalemin kesimi kızar; yatırım kesintisi büyümeyi düşürür |
| Vergi artışı | Gelir artar | Enflasyon ve ilgili kesimin tepkisi |
| Varlık ve servet vergisi | Gelir artar, adalet algısı iyileşir | İş dünyası ve yatırımcı güveni |
| Borçlanma | Bugün para bulunur | Faiz giderleri artar, kredi notu riski |
| Özelleştirme | Tek seferlik gelir | İşçi ve milliyetçi tepki, yolsuzluk riski |
| Merkez Bankası'na baskı | Faiz iner, kısa vadede büyüme | Kur ve enflasyon yükselir, güven düşer |

Yıllık bütçe Ekim ayının ana kararıdır ve Meclis'te (Sistem 2) oylanır; bütçe geçmezse geçici bütçeyle sürdürülür ve hükümet zayıf görünür.

### Hissedilen ekonomi

Seçmen enflasyon oranını değil, market fişini oylar; bu yüzden her ay rakamların yanında "hissedilen" bir tablo gösterilir.

- **Market sepeti:** ekmek, çay, süt, peynir, ayçiçek yağı, dana kıyma; her ay fiyatları güncellenir, geçen yılla karşılaştırılır.
- **Hane bütçesi:** asgari ücretli bir ailenin geliri ile kira, fatura ve mutfak gideri; ay sonunda artan ya da eksik kalan tutar.
- **Beş hayat:** Sistem 4'teki beş karakter ekonomiyi kendi dilinden anlatır (örnek: emekli öğretmen torununa harçlık veremediğini söyler).
- **Gazete:** muhalif gazete "ekmek 20 lira oldu" diye manşet atar, iktidara yakın gazete aynı gün "ihracat rekor kırdı" der.

Anketler resmî enflasyona değil, hissedilen fiyat artışına tepki verir; ikisi arasındaki fark büyüdükçe hükümetin sözlerine güven azalır.

### Krizler

Kriz, bir eşik aşıldığında başlayan ve kendi olay zincirini açan bir durumdur; oyuncu krizi önceden sezebilir çünkü danışmanlar eşiğe yaklaşıldığında uyarır.

| Kriz | Tetik | İlk ay | Kapanış |
| --- | --- | --- | --- |
| Kur şoku | Yatırımcı güveni "çok zayıf" ve rezerv "sıkışık" | Kur bir ayda %6–10 sıçrar, acil karar gelir | Güven toparlanınca |
| Hayat pahalılığı | Enflasyon %38'in üzerinde | Sokak eylemleri ve sendika talepleri | Enflasyon %33'ün altına inince |
| Banka paniği | Kur şoku iki ay sürerse | Mevduat kuyruğu, banka kurtarma kararı | Kurtarma ya da birleşme kararıyla |
| Not indirimi | Bütçe açığı %5'in üzerinde iki ay | Faiz giderleri artar, yatırımcı çıkar | Açık %4'ün altına inince |
| Grev dalgası | Asgari ücret artışı enflasyonun altında kalırsa | Ulaşım ve liman grevleri | Ek zam ya da yasak kararıyla |

Aynı anda en fazla iki kriz açık olur; üçüncü kriz ancak biri kapandığında başlar.

### Resmî rakam ve sokaktaki gerçek

Oyunda iki enflasyon vardır: istatistik kurumunun açıkladığı resmî oran ve ekonominin gerçek oranı. Oyuncu ekranda yalnız resmî oranı görür; gerçek oran market sepetinden, muhalif ekonomistlerden ve beş hayattan sezilir.

- Liyakatli bir kurum başkanıyla iki oran aynıdır.
- Sadık bir başkan atanırsa resmî oran gerçeğin 3–8 puan altında açıklanır. Emekli ve memur zamları resmî orana bağlı olduğu için bütçe rahatlar.
- Bedeli: bağımsız ekonomistler kendi oranlarını açıklar, sicile "yalan" kaydı düşer, fark büyüdükçe yatırımcı güveni ve seçmenin güveni azalır.
- Kara mizah buraya yerleşir: örneğin kurumun "sepetteki domatesin kalitesi arttığı için fiyatı aslında düştü" açıklaması.

### Ekranlar ve dikey kesit kapsamı

Ekonomi iki yerde görünür: masadaki küçük gösterge şeridi ve Hazine masası ekranı.

- **Gösterge şeridi:** 6 resmî rakam ve yön okları; dokununca Hazine masası açılır.
- **Hazine masası:** üstte "bütçe açığı yıllık X trilyon TL" cümlesi; altta gider ve gelir kalemleri, söz defteri, araçlar, hissedilen ekonomi kutusu.

**Dikey kesitte**

- 8 göstergenin hepsi ve aylık güncelleme
- Hazine masası: 8 gider, 5 gelir kalemi, 4 araç (kesinti, vergi artışı, borçlanma, Merkez Bankası'na baskı)
- 1 kriz: kur şoku (zincirli)
- Market sepeti ve hane bütçesi
- İstatistik kurumu başkanı kartı

### Onaylanan kararlar

Sistem 3, 1 Kasım 2026'da önerilerle onaylandı ve kilitlendi.

- [x] Faizi Merkez Bankası belirler; oyuncu baskı yapar ya da başkanı değiştirir
- [x] Göstergeler ondalıklı görünür (%29,4)
- [x] Resmî ve gerçek enflasyon ayrımı kalır
- [x] Oyun orta sıkıntılı bir ekonomiyle başlar (enflasyon %29)
- [x] Market sepeti 6 üründür: ekmek, çay, süt, peynir, yağ, kıyma

---

## Sistem 4 · Toplum ve sokak

Nov 1, 2026 · @Bekir

Toplum, kararların kimin hayatına dokunduğunu gösterir: seçmen grupları oy verir, sokak itiraz eder, beş hayat bunu insan yüzüyle anlatır.

### Seçmen grupları

Prototipteki 17 grup 12'ye iner. Gruplar örtüşür (bir emekli aynı zamanda muhafazakâr ve kiracı olabilir); her grubun oy hesabındaki ağırlığı nüfus payına göredir. Tutumlar sözlü görünür: "öfkeli", "kırgın", "kararsız", "memnun", "coşkulu".

| Grup | Nüfus payı | En çok ne ister | Başlangıç tutumu |
| --- | --- | --- | --- |
| Muhafazakârlar | %34 | Aile, din, istikrar | memnun |
| Laikler | %26 | Yaşam tarzı, yargı bağımsızlığı | kırgın |
| Milliyetçiler | %18 | Güvenlik, dış politikada sertlik | memnun |
| Kalan azınlığı | %12 | Anadil, barış, yerel yönetim | kırgın |
| Emekliler | %16 | Aylık artışı, ilaç, ikramiye | kararsız |
| İşçiler ve asgari ücretliler | %28 | Ücret, iş güvencesi | kararsız |
| Memurlar | %7 | Maaş, kadro | memnun |
| Esnaf ve çiftçiler | %14 | Kredi, destek, vergi | kararsız |
| İş dünyası | %3 | İstikrar, düşük faiz, hukuk | kararsız |
| Gençler | %20 | İş, özgürlük, gelecek | kırgın |
| Kentli orta sınıf | %22 | Enflasyon, eğitim, hukuk | kırgın |
| Kiracılar | %27 | Kira artışı sınırı, konut | kırgın |

Nüfus payları örtüşme nedeniyle 100'ü geçer; oyun varsayımıdır.

### Kamuoyunu ölçmek

Oyuncu seçmenin gerçek eğilimini doğrudan görmez; üç anket şirketinin açıkladığı rakamları görür. Her şirketin bir yanlılığı ve yanılma payı vardır.

| Şirket | Eğilimi | Yanılma payı | Ne zaman |
| --- | --- | --- | --- |
| Merkez Araştırma | İktidara 2–3 puan cömert | ±2 | Her ay |
| Panorama | Muhalefete 1–2 puan cömert | ±2 | Her ay |
| Saha Kamuoyu | Yansız ama yavaş | ±3 | İki ayda bir |

- Ekranda üç şirketin ortalaması bir sayı olarak görünür (örnek: %47,3); grup tutumları sözlüdür.
- Seçim gecesi gerçek oy ile anket ortalaması arasındaki fark açıklanır; fark 3 puanı geçerse bu gecenin sürprizi olur.
- Kamuoyu danışmanı bir gruba özel anket yaptırabilir; bu takvimden bir gün alır.

### Sokak

Bir grubun tutumu "öfkeli"ye düştüğünde ya da sert bir karar alındığında eylem başlar; eylem haritada bir şehirde görünür ve 1–3 ay içinde çözülür ya da yayılır.

*(Çizim dışa aktarımda yer almıyor: eylem başlar → müdahale kararı → 1–3 ay içinde söner ya da yayılır.)*

Müdahale anı bir Sistem 1 kararıdır ve dört seçenek sunar: temsilcileri dinle, talebi karşıla, polisi gönder, görmezden gel. Kalabalık sayıları "emniyete göre / düzenleyicilere göre" biçiminde iki rakamla verilir.

### Beş hayat ve topluluklar

Beş hayat oyunun duygusal omurgasıdır: beş sıradan vatandaş dönem boyunca kararların sonuçlarını yaşar, seçim gecesi oy verir, sonsözde akıbetleri anlatılır.

| Karakter | Kim | Hangi kararlara duyarlı |
| --- | --- | --- |
| Sevim Öztürk, 67 | Emekli öğretmen, Zeytinova | Emekli aylığı, ilaç, enflasyon |
| Mert Kaya, 24 | Motokurye, Karaburç | Asgari ücret, akaryakıt, çalışma koşulları |
| Necdet Arslan, 52 | Bakkal, Akköprü | Esnaf kredisi, vergi, zincir marketler |
| Ece Yıldız, 21 | Tıp öğrencisi, Yalıkent | Eğitim, özgürlükler, yurt dışına göç |
| Ayşe Demir, 39 | Depremzede, iki çocuk annesi, Taşhan | Konut, deprem bölgesi, sosyal yardım |

- Her ay en az biri kısa bir sahneyle (2–3 cümle) görünür; dönem boyunca her birinin 4–5 dönüm noktası vardır (Ece'nin yurt dışı kararı, Ayşe'nin konteynerden kalıcı eve geçmesi).
- **Topluluklar:** Alevi dernekleri, gayrimüslim vakıfları, cemaat, tarikat ve yurt dışındaki vatandaşların temsilcileri ayrı bir ekran değil, Sistem 1'de "talep" kartları olarak gelir; ilişkileri ilgili grupların tutumunu etkiler.

### Dikey kesit ve onaylanan kararlar

**Dikey kesitte:** 12 grubun tamamı, 3 anket şirketi, 2 eylem türü (işçi ve öğrenci), beş hayatın ilk 6 ayı (her biri 2 dönüm noktası), 2 topluluk talebi.

**Onaylanan kararlar** (önerilerle, 1 Kasım 2026)

- [x] Grup sayısı 12; tutumlar sözlü, anket ortalaması sayıyla
- [x] Kadınlar ayrı grup değil; kadınları etkileyen kararlar ilgili gruplara ve beş hayata yansır
- [x] Eyleme polis müdahalesi her zaman seçenek olarak vardır ama bedeli kalıcıdır (yaralanma ya da ölüm haberi sicile ve sonsöze düşer)
- [x] Beş hayatın hepsi ölebilir ya da ülkeden ayrılabilir; bu kalıcıdır
- [x] Topluluk temsilcileri ayrı ekran değil, kart olarak gelir

---

## Sistem 5 · Medya ve kamuoyu

Nov 1, 2026 · @Bekir

Medya, kararların seçmene ulaşma biçimini belirler: aynı karar bir gazetede "tarihî adım", diğerinde "göz boyama" olarak okunur. Oyuncu hem hikayeyi anlatır hem de anlatılanı kontrol etmeye çalışır.

### Medya haritası

Oyunda 3 gazete ve 3 televizyon kanalı vardır; her birinin bir sahibi, bir yayın çizgisi ve bir izleyici kitlesi vardır. Prototipteki iki ayrı gazete listesi tek listede birleşir.

| Kuruluş | Tür | Sahibi | Çizgisi | En çok kim izler |
| --- | --- | --- | --- | --- |
| Doruk Sabah | Gazete | Kaya Grubu (inşaat, enerji) | Hükümete yakın | Muhafazakârlar, milliyetçiler |
| Halkın Sesi | Gazete | Vakıf | Muhalif | Laikler, kentli orta sınıf |
| Finans Gündem | Gazete | Atlas Yatırım | Piyasa odaklı, dengeli | İş dünyası |
| Devlet televizyonu | Kanal | Devlet | Hükümete yakın | Emekliler, taşra |
| Merkez TV | Kanal | Doğa Holding (perakende) | Dengeli; sahibinin ihalelerine göre kayar | Herkes, en geniş izleyici |
| Halk TV | Kanal | Bağımsız yayıncı | Muhalif | Laikler, gençler |

- Her sabah üç gazete aynı olayı farklı manşetle verir; akşam üç kanalın bülteni aynı olayı kendi çizgisiyle anlatır.
- Bir kuruluşun çizgisi sahibine yapılan baskı ya da verilen ihaleyle kayabilir; muhalif kuruluşlar kapanırsa izleyicileri sosyal medyaya geçer.

### Basın toplantısı sahnesi

Basın toplantısı ayın sahnelerinden biridir: 3 soru, 3 cevap, süresiz ama geri alınamaz. Sorular aynı ayın gerçek gündeminden üretilir.

**Gazeteciler**

| Gazeteci | Kuruluş | Tarzı |
| --- | --- | --- |
| Selin Ateş | Halk TV | Belgeyle gelir, takip sorusu sorar |
| Hakan Demirel | Doruk Sabah | Kolay soru sorar; bazen fazla över ve gülünç duruma düşürür |
| Deniz Koç | Merkez TV | Dengeli, ekonomi rakamlarını sorar |
| Murat Aksu | Finans Gündem | Piyasa ve Merkez Bankası |
| Laura Bennett | Yabancı ajans | İnsan hakları, dış politika |

**Cevap türleri**

| Cevap | Etkisi | Riski |
| --- | --- | --- |
| Açık ve dürüst | Güven artar | Kötü haber kabul edilmiş olur |
| Kaçamak | Etkisi sürekli azalır | "Cevap vermedi" manşeti |
| Müjde | O an alkış | Hazine'ye söz yazılır |
| Yalan | O an işe yarar | Sicile yalan kaydı; ifşa olabilir |
| İftira ya da saldırı | Taban coşar | Kutuplaşma, tazminat davası |
| Gazeteciyi azarlama | Sert lider imajı | Basın özgürlüğü, yabancı basın |

Sonuç bir puan olarak değil, ertesi günün üç manşeti ve sosyal medya akışı olarak gösterilir. Aynı cevabın tutup tutmaması gündeme, soran gazeteciye ve şansa bağlıdır; her durumda doğru olan tek cevap yoktur.

### Sosyal medya ve gündem

Sosyal medya kararlara ilk ve en sert tepkiyi veren yerdir; her önemli karardan sonra 3–4 paylaşımlık bir akış açılır.

- **Paylaşımlar:** kararın dokunduğu gruplardan sıradan kullanıcılar, bir gazeteci, bir muhalefet vekili; beğeni ve paylaşım sayılarıyla. Kara mizahın ikinci evi burasıdır (caps, alaycı etiketler).
- **Etiketler:** gündemdeki etiket gündem listesinde görünür; gençler ve kentli orta sınıf üzerinde etkisi büyüktür.
- **Gündem listesi:** seçmenin o ay en çok önem verdiği 5 konu (geçim, adalet, güvenlik, göç, dış politika); oyuncu iyi gittiği konuyu gündemde tutmaya, kötü gittiğini düşürmeye çalışır.
- **Algı operasyonu:** yakın hesaplar ve trol ağı bir konuyu öne çıkarabilir ya da bir kişiyi hedef alabilir; ifşa olursa sicile baskı kaydı düşer.

### Medyaya baskı araçları

Oyuncu medyayı kontrol etmek için beş araç kullanabilir; her biri kısa vadede işe yarar, uzun vadede basın özgürlüğünü, dış itibarı ve sicili yer.

| Araç | Etkisi | Bedeli |
| --- | --- | --- |
| Kamu reklamı | Kuruluşun çizgisi yumuşar | Bütçe; "yandaş medya" eleştirisi |
| Sahibine ihale | Çizgi belirgin kayar | Usulsüzlük kaydı |
| İdari para cezası | Bir program kapanır | Basın özgürlüğü düşer |
| Erişim engeli | Bir haber görünmez olur | Haber yurt dışında yayılır; ilgi artabilir |
| Kayyum | Kuruluş bir gecede hükümete geçer | AB ilişkisi, laik ve genç seçmen, sicile baskı kaydı |

Basın özgürlüğü düştükçe yalanların ifşa olasılığı azalır ama dürüst haberlere de daha az inanılır: iyi bir kararın kamuoyuna etkisi de küçülür.

### Dikey kesit ve onaylanan kararlar

**Dikey kesitte:** 3 gazete ve 3 kanal, her sabah manşetler ve her akşam bültenler, 1 tam basın toplantısı (5 gazeteci), sosyal medya akışı, 3 baskı aracı (kamu reklamı, para cezası, erişim engeli).

**Onaylanan kararlar** (önerilerle, 1 Kasım 2026)

- [x] Medya 6 kuruluştur: 3 gazete, 3 kanal
- [x] Basın toplantısı 3 sorudur, süre baskısı yoktur
- [x] Yalan ve iftira cevap olarak vardır, bedeli sicile yazılır
- [x] Sosyal medya paylaşımları kurgusal kullanıcılardandır; gerçek kişi ya da marka adı yoktur
- [x] Kayyum dikey kesitte yoktur, tam oyunda vardır

---

## Sistem 6 · Seçim

Nov 1, 2026 · @Bekir

Seçim, dönem boyunca verilen bütün kararların toplu hesabıdır: son 3 ay kampanya evresidir, 18. ayın sonunda seçim gecesi gelir, ardından bitiş ve sonsöz.

### Kampanya evresi

Son 3 ayda (16., 17. ve 18. ay) oyunun ritmi değişir: masa kararları 2'ye iner, yerine kampanya araçları gelir. Kampanya parti kasasıyla yapılır; kasa sözlü görünür ("boş", "yeterli", "güçlü").

| Araç | Ne yapar | Bedeli |
| --- | --- | --- |
| Karargâh | Slogan ve ana mesaj seçilir; sicille çelişen slogan alaya alınır | Bir kez, kampanya başında |
| Reklam filmi | Bir gruba hitap eder; ters tepebilir | Kasa |
| Miting | Üç bölümlü sahne: açılış, vaat, rakibe cevap | Takvim ve kasa; vaat Hazine'ye söz olarak yazılır |
| Münazara | Rakip adayla canlı yayın sahnesi; 4 soru | Kaybedilirse kararlı olmayan seçmen kayar |
| Kapı kapı çalışma | Kararsız seçmeni az ama güvenli kazanır | Parti örgütü yorulur |
| Seçim yasaklarını esnetme | Kamu kaynağıyla açılış, devlet televizyonu | Sicile usulsüzlük; seçim kurulu uyarısı |

Aynı mesajın tekrarı etkisini kaybeder; aynı araç aynı ay içinde ikinci kez kullanılırsa etkisi yarıya iner.

### Rakip aday

Rakip aday oyunun başından bellidir ve dönem boyunca bir karakter olarak gelişir; seçim gecesi karşınıza çıkan kişi 18 aydır tanıdığınız biridir.

- **Kim:** ana muhalefetin genel başkanı ya da popüler bir büyükşehir belediye başkanı; oyun başında iki adaydan biri rastgele seçilir, diğeri kampanyada destekçisi olur.
- **Hamleleri:** her ay bir hamle yapar (miting, açıklama, ifşa, ittifak); hamleler oyuncunun zayıf noktasına yönelir (enflasyon yüksekse ekonomi, basın baskısı varsa özgürlük).
- **Kişisel yayı:** Sistem 1'deki 4 bölüm: danışmanı kapınıza gelir, hakkında bir dosya çıkar, hastalık ya da aile sınavi geçirir, seçimden önce sizinle son kez yüz yüze görüşür.
- **Gücü:** sözlü görünür ("yükseliyor", "durakladı"); oyuncunun hataları, ekonomi ve medya çizgisiyle değişir. Baskı (dava, dosya) kısa vadede zayıflatır ama mağduriyet etkisiyle ters tepebilir.

### Oy hesabı ve ikinci tur

Oy payı, her grubun size desteğinin o grubun büyüklüğü ve sandığa gitme oranıyla tartılmasından çıkar; üzerine kampanya etkisi ve seçim gününün küçük oynamaları eklenir.

```latex
\text{Oy payı} = \frac{\sum_{g} n_g \, k_g \, d_g}{\sum_{g} n_g \, k_g} + \text{kampanya} + \text{seçim günü}
```

Burada n grubun nüfus payı, k sandığa gitme oranı (öfkeli ve coşkulu gruplarda yüksek), d size desteğidir.

- **Katkı sınırı:** kampanya etkisi en fazla ±4 puandır; dönem boyunca kaybedilen seçmen son 3 ayda tamamen geri alınamaz.
- **İlk tur:** geçerli oyların yarısından fazlasını alan kazanır.
- **İkinci tur:** iki hafta sonra iki aday arasında yapılır; üçüncü adayın seçmeni için tek bir karar verilir (ittifak teklifi, tabana sesleniş ya da rakibe saldırı).
- **Fark 1 puanın altındaysa:** itiraz sahnesi açılır (kabul, yeniden sayım, sonucu tanımama).

### Seçim günü ve seçim gecesi

Seçim gecesi oyunun doruk sahnesidir: sonuç bir ekranda değil, gece boyunca akan bir yayın olarak gelir.

1. **Sabah:** katılım oranı, hava durumu, oyunuzu kullanışınız, rakibin açıklaması.
2. **Sandıklar açılır:** iki ajans farklı sandıkları önce açar; biri sizi önde, diğeri geride gösterir. Açılan sandık yüzdesi arttıkça çizgiler yaklaşır.
3. **Gece boyunca:** sandık başı olayları, yurt dışı oyları, beş hayatın kime oy verdiği, önceki aylarda verilen seçim günü kararlarının sonuçları (sandık görevlisi, seçmen kütüğü).
4. **Sonuç:** kazanma, kaybetme, ikinci tur ya da itiraz.

Seçim gününe ait kararlar (sandık görevlileri, seçim yasakları, hayalet seçmen iddiası, yurt dışı sandıkları) kampanya evresinde Sistem 1 kartları olarak gelir; prototipteki düzen korunur.

### Bitişler ve sonsöz

Oyun dört ana bitişten biriyle kapanır; her bitişin ardından oyuncunun kararlarına göre birleştirilen 5 yıllık bir sonsöz gelir.

| Bitiş | Ne zaman | Ton |
| --- | --- | --- |
| Yeniden seçilme | Seçim kazanılırsa | Zafer, ama sonsözde bedelleri görülür |
| Yenilgi | Seçim kaybedilirse | İktidarı devretme sahnesi; sicil yeni hükümetin elinde |
| Devrilme | Darbe, Meclis soruşturması ya da sonucu tanımama | Anayasal kriz |
| İstifa | Kurultay yenilgisi, sağlık ya da büyük bir skandal | Sessiz bir çıkış |

**Sonsözün parçaları**

- **Ülke:** 5 yıl sonra enflasyon, işsizlik, basın özgürlüğü ve kutuplaşma; dönemin eğiliminden türetilir.
- **Beş hayat:** her birinin akıbeti, bir paragraf.
- **Sicil:** ifşa olmayan kayıtların yıllar sonra nasıl ortaya çıktığı ve sizin başınıza ne geldiği (beraat, dava, yurt dışı).
- **Akköprü:** köprünün akıbeti, ana yayın kapanışı.
- **Tarih sayfası:** dönemin tek cümlelik hükmü ve dönemin üç manşeti; paylaşılabilir bir görüntü olarak kaydedilir.

### Dikey kesit ve onaylanan kararlar

**Dikey kesitte:** seçim yok; ilk 6 ayın sonunda "bugün seçim olsa" anketi ve rakip adayın ilk iki hamlesi. Seçim gecesinin ilk sürümü üretim aşamasında yapılır.

**Onaylanan kararlar** (önerilerle, 1 Kasım 2026)

- [x] Kampanya son 3 aydır, erken seçim yoktur
- [x] Rakip aday oyun başında iki aday arasından rastgele belirlenir
- [x] Kampanya etkisi en fazla ±4 puandır
- [x] İkinci tur ve itiraz sahnesi vardır; sonucu tanımamak "devrilme" bitişine götürür
- [x] Sonsöz 5 parçadır ve paylaşılabilir bir tarih sayfasıyla biter

---

## Ekranlar ve görsel dil

Nov 1, 2026 · @Bekir

Oyun bir "Cumhurbaşkanlığı masası" üzerinde geçer: her ekran masadan açılan bir dosya, bir oda ya da bir yayındır. Görsel dil illustratör gerektirmeyecek şekilde tipografi, evrak dokusu ve vektör çizimlere dayanır.

### Ekran haritası

Masa oyunun merkezidir; altı ekran masadan açılır ve masaya döner, sahneler ajandadan ve Meclis'ten açılır.

*(Çizim dışa aktarımda yer almıyor: masa merkezdedir; karar dosyası, ajanda, Meclis, Hazine masası, Ülke ve Gündem masadan açılır; sahneler ajandadan ve Meclis'ten açılır.)*

Oyuncu hiçbir zaman masadan iki adımdan uzağa düşmez; prototipteki sekmeler ve iç içe pencereler kaldırılır.

### Ekranlar

Oyunda 10 ekran vardır; prototipteki 11 sekme ve 15'ten fazla pencere bunlara iner.

| Ekran | Ne gösterir | Sistem |
| --- | --- | --- |
| Masa | Sabah gazeteleri, sıradaki kararlar, ajanda, gösterge şeridi, beş hayattan bir not | Hepsi |
| Karar dosyası | Getiren kişi, durum, 3 seçenek, danışman tahmini | 1 |
| Ajanda | Ayın takvimi, davetler, sahneler | 1 |
| Meclis | Sıradaki oylama, kararsız vekiller, hizipler | 2 |
| Hazine masası | Bütçe, söz defteri, araçlar, market sepeti | 3 |
| Ülke | Harita, eylemler, grup tutumları, anketler | 4 |
| Gündem | Gazeteler, kanallar, sosyal medya, gündem listesi | 5 |
| Sahne | Basın toplantısı, kulis, miting, münazara (tam ekran) | 1, 2, 5, 6 |
| Ay sonu raporu | Ne değişti ve neden; beş hayatın notları | Hepsi |
| Seçim gecesi ve sonsöz | Yayın akışı, sonuç, sonsöz, tarih sayfası | 6 |

### Görsel dil

Görsel dil 1970'lerin devlet evrakı ile bugünün haber ekranını buluşturur: kâğıt, mühür, daktilo harfi ve keskin bir haber bandı.

| Öğe | Karar |
| --- | --- |
| Renk | Kâğıt beyazı zemin, mürekkep laciverdi yazı, mühür kırmızısı vurgu; durum renkleri (iyi yeşil, kötü kırmızı, uyarı hardal) yalnız değişim oklarında. Koyu tema: gece masası (lacivert zemin, sıcak beyaz yazı). |
| Yazı tipi | Başlıklar IBM Plex Serif, metin IBM Plex Sans, rakam ve etiketler IBM Plex Mono; üçü de açık lisanslı ve dosyaya gömülür (çevrimdışı çalışır). |
| Doku | Hafif kâğıt dokusu, dosya kenarı çizgileri, mavi kalem işaretleri; animasyon yok, kâğıt çevirme geçişleri 150 ms. |
| Mühür | "Gizli", "Acil", "Onaylandı" gibi mühürler karar anında basılır; oyunun imza hareketi. |
| Portre | Vektör, düz renk, 3/4 açı, 3 ifade (nötr, memnun, öfkeli); yüz özellikleri parçalardan üretilir (yüz, saç, gözlük, bıyık), böylece yüzlerce karakter el çizimi olmadan çıkar. |
| İkon | İnce çizgi, tek renk; 24 ikon (dosya, telefon, kalabalık, mikrofon, sandık…) |
| Gazete | Her gazetenin kendi logosu ve manşet yazı tipi ağırlığı; manşetler oyunun en çok paylaşılacak görüntüsüdür. |

### Ses ve müzik

Ses iki katmandan oluşur: kodla üretilen efektler ve satın alınacak telifsiz müzik parçaları.

- **Efektler (kodla, 20 adet):** kâğıt çevirme, mühür, daktilo, telefon, son dakika jingle'ı, kalabalık, alkış, flash, sandık sayımı; Web Audio ile üretilir, dosya gerektirmez.
- **Müzik (telifsiz kütüphaneden, 5 parça):** masa (sakin, piyano ve yaylılar), kriz (gergin, düşük tempolu), kampanya (yürüyüş ritmi), seçim gecesi (haber jeneriği tadında), sonsöz. Parçalar üretim aşamasında seçilir; lisansın ticari oyunda kullanıma izin vermesi gerekir.
- **Kurallar:** ses ve müzik ayrı ayrı açılıp kapanır; telefon sessiz moddayken ses çıkmaz; müzik ilk dokunuştan sonra başlar.

### Telefon, masaüstü ve erişilebilirlik

Ekranlar önce telefon için tasarlanır (iPhone 17 Pro Max, 440 × 956 nokta), sonra masaüstüne genişletilir.

- **Telefon:** alt menüde 4 bölüm (Masa, Ajanda, Ülke, Dosyalar); "Ayı bitir" her zaman alt menüde; sahneler tam ekran; güvenli alanlara uyulur.
- **Masaüstü:** masa ortada, gösterge şeridi solda, ajanda sağda; sahneler ortada büyük bir pencere.
- **Dokunma:** her düğme en az 44 nokta; metin en az 15 nokta.
- **Erişilebilirlik:** renk tek başına anlam taşımaz (oklar ve kelimeler de vardır); ekran okuyucu etiketleri; hareket azaltma ayarına uyulur; yazı boyutu ayarlanabilir (3 kademe).
- **Kayıt:** otomatik kayıt her ay sonunda; 3 yuva; kaydı dosyaya indirme ve yükleme.

---

## Uygulama planı

Nov 1, 2026 · @Bekir

Tasarım aşaması tamamlandı; sıradaki iş yeni kod tabanını kurmak ve dikey kesiti (ilk 6 ay) bu belgelere göre üretmektir.

### Teknik seçimler

| Alan | Seçim | Neden |
| --- | --- | --- |
| Dil | TypeScript | Hataları derleme anında yakalar; büyük kod tabanında zorunlu |
| Arayüz | React 19 | Çalışma ortamında hazır kurulu (npm deposu kapalı); geniş ekosistem |
| Derleme | esbuild | esbuild ile tek dosyalık, internetsiz çalışan web sürümü |
| İçerik | YAML + Zod şeması | Kartlar kod dışında yazılır, derlemede denetlenir |
| Test | Node test aracı (çekirdek), Playwright (arayüz) | Her değişiklikte otomatik çalışır |
| Masaüstü | Tauri | Electron'dan çok daha küçük dosya; Steam için uygun |
| Mobil | Capacitor | Aynı web kodundan iOS ve Android uygulaması |
| Kayıt | Sürümlü JSON | Eski kayıtlar yeni sürümde açılır |
| Depo | GitHub | Değişiklik geçmişi, yedek, otomatik test |

### Proje klasör yapısı

Çekirdek arayüze hiç bağlı değildir; içerik ayrı klasördedir ve kod bilmeden düzenlenebilir.

```text
akkopru/
  icerik/              # YAML: kartlar, zincirler, karakterler, metinler
    kartlar/
    zincirler/
    karakterler/
    metinler/tr.yaml, en.yaml
  cekirdek/            # TypeScript, DOM yok
    durum.ts           # oyun durumu ve kayıt
    ay.ts              # ayın akışı
    kararlar/  meclis/  ekonomi/  toplum/  medya/  secim/
    zar.ts             # tohumlu rastgelelik
  derleyici/           # içerik denetimi ve Türkçe ek motoru
  arayuz/              # React bileşenleri ve ekranlar (belgede Svelte yazıyordu; React seçildi)
  testler/             # birim testleri, bot oyunları, ekran testleri
  platform/            # Tauri (masaüstü), Capacitor (mobil)
  belgeler/            # bu tasarım belgesinin dışa aktarımı
```

### Çalışma biçimi

Her çalışma oturumu iş listesindeki tek bir maddeyi bitirir; madde bitince oynanabilir bir sürüm çıkar.

1. Sen oturumu iş listesindeki maddenin adıyla başlatırsın (örnek: "Çekirdek: ayın akışı").
2. Ben kodu, testleri ve gerekiyorsa içeriği yazarım; testler geçmeden madde bitmiş sayılmaz.
3. Değişiklik GitHub'daki depoya kaydedilir; oynanabilir sürüm bir bağlantı olarak yayımlanır.
4. Sen telefonda oynarsın; beğenmediğin yeri tek cümleyle yazarsın, bir sonraki oturumda düzeltilir.
5. Tasarım belgesinde kilitli bir karar değişecekse önce belge güncellenir, sonra kod.

GitHub bağlantısı olmadan da başlanılabilir; bu durumda kod her oturum sonunda zip dosyası olarak sana gönderilir ve sonraki oturumda geri yüklenir.

### İş listesi

Maddeler sırayla yapılır; her madde bir oturumdur. Dikey kesit 21 oturumdur.

**Altyapı**

- [x] 1\. Proje iskeleti: TypeScript, React, esbuild, testler, GitHub Actions
- [x] 2\. Oyun durumu, tohumlu zar, kayıt ve yükleme
- [x] 3\. İçerik derleyici: YAML şeması, Türkçe ek motoru, hata raporu
- [x] 4\. Ayın akışı: masa, kararlar, ay sonu (Sistem 1 çekirdeği)
- [x] 5\. Görsel dil: renkler, sistem yazı tipleri (IBM Plex bu ortamda indirilemedi), kâğıt dokusu, mühür, temel bileşenler
- [x] 6\. Masa ekranı ve karar dosyası (telefon ve masaüstü)

**Sistemler**

- [x] 7\. Ekonomi modeli ve Hazine masası (Sistem 3)
- [x] 8\. Seçmen grupları, anketler, ülke ekranı (Sistem 4)
- [x] 9\. Sokak ve eylemler (Sistem 4)
- [x] 10\. Meclis, oylama ve kulis sahnesi (Sistem 2) — dikey kesit
- [ ] 11\. Gazeteler, kanallar, sosyal medya (Sistem 5)
- [ ] 12\. Basın toplantısı sahnesi (Sistem 5)
- [ ] 13\. Sicil, ifşa ve olay zincirleri (Sistem 1)
- [ ] 14\. Ay sonu raporu ve beş hayat
- [ ] 15\. Vektör portre üreticisi ve ikonlar
- [ ] 16\. Ses efektleri

**İçerik**

- [ ] 17\. 40 karar kartı ve 3 olay zinciri
- [ ] 18\. Akköprü, rakip aday ve aile yaylarının ilk bölümleri; beş hayatın ilk 6 ayı
- [ ] 19\. İngilizce metin

**Test**

- [ ] 20\. Bot oyunlarıyla denge; iPhone ve masaüstü testi
- [ ] 21\. Oyun testi paketi: 5–10 kişi için bağlantı, geri bildirim formu, test verisi

### Kapsam genişlemesi (1 Kasım 2026)

Oyuncu geri bildirimi: yeni sürümde ayda yalnız 4–5 karar ve 4 Hazine aracı kaldı; prototipteki politika ve yönetmelik seçenekleri yok. Bu yüzden dikey kesite şunlar eklenir:

- **Politika dosyası (yeni ekran, "Dosyalar" bölümü):** prototipteki 19 politika ve 25 yönetmelik kademeli ayar olarak gelir. Cumhurbaşkanı kararnamesiyle değişenler hemen, kanun gerektirenler ay sonunda Meclis oylamasıyla yürürlüğe girer. Ayda en fazla 3 imza.
- **Kart havuzu:** prototipteki 16 olay kartı ve devam kartları karar kartı olarak taşınır; hedef en az 60 kart.
- **Madde 8 öne alınır:** anketler, grup tutumları ve ülke ekranı bu turda yapılır.
- Etkiler: politika ve yönetmeliklerin bütçe etkisi Hazine kalemlerine, grup etkisi seçmen gruplarına, ekonomi etkisi ekonomi modeline yazılır.

**Durum (1 Kasım 2026):** politika dosyası 38 ayarla, kart havuzu 111 kartla (6 kriz masası dahil) tamamlandı. Madde 8 ve 9 bitti. Madde 11'in sabah gazeteleri ve madde 14'ün beş hayat bölümü yapıldı; kanallar, sosyal medya ve seçim gecesi oyları sırada. Kapıda bekleyen ziyaretçiler takvimdeki boş günden harcar.
