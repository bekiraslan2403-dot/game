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
