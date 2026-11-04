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
