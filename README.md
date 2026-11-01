# Akköprü 2026

Kurgusal Doruk Cumhuriyeti'nde geçen, anlatı ağırlıklı bir siyaset simülasyonu. Oyuncu, seçime 18 ay kala göreve gelen cumhurbaşkanıdır; kara mizahlı bir dram tonunda kararlar verir, Meclis'le, ekonomiyle, sokakla ve medyayla uğraşır.

Tasarım belgesi (sistemlerin kuralları, ekranlar, uygulama planı) claude.ai'deki "Akköprü 2026 · Oyun Tasarım Belgesi" dokümanındadır. Kod, o belgedeki kilitli kararlara göre yazılır; bir karar değişecekse önce belge güncellenir.

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
| `npm run denetle` | Hepsi, sırayla; her değişiklikten önce çalışmalı |

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

## İlerleme

| Madde | Durum |
| --- | --- |
| 1. Proje iskeleti | Tamam |
| 2. Oyun durumu, tohumlu zar, kayıt | Tamam |
| 3. İçerik derleyici ve Türkçe ek motoru | Tamam |
| 4. Ayın akışı: masa, kararlar, ay sonu | Tamam |
| 5. Görsel dil (sistem yazı tipleri; IBM Plex bu ortamda indirilemedi) | Tamam |
| 6. Masa ekranı ve karar dosyası | Tamam |
| 7. Ekonomi modeli ve Hazine masası | Sırada |
