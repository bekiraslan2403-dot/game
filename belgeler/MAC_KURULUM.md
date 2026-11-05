# Akköprü 2026 — Mac sürümü

Bu sürüm Mac'inize kurulan bir uygulamadır. Oyunu oynamak için ChatGPT, tarayıcı, Node.js, Rust veya internet gerekmez. Oyun içeriği uygulamanın içindedir.

## Kurulum

1. `Akkopru-2026-macOS-Universal` paketini indirip ZIP'i açın.
2. İçindeki `.dmg` dosyasını çift tıklayın.
3. **Akköprü 2026** uygulamasını **Applications / Uygulamalar** klasörüne sürükleyin.
4. Uygulamalar klasöründen **Akköprü 2026**'yı açın.

macOS 12 ve üzeri içindir. Aynı paket hem Apple Silicon (M serisi) hem Intel Mac'te çalışır.

## İlk açılış

Bu geliştirme sürümü yerel imzalıdır (ad-hoc); Apple Developer ID ile imzalanıp noter onayından geçirilmiş bir mağaza sürümü değildir. macOS uygulamayı tanınmayan geliştirici nedeniyle durdurursa, açmayı denedikten sonra **Sistem Ayarları → Gizlilik ve Güvenlik → Yine de Aç** yolunu kullanabilirsiniz. Sistem güvenliğini kapatmanız gerekmez.

## Oyun ve kayıt

- Pencerenin yeşil düğmesiyle tam ekran kullanabilirsiniz.
- Uygulamadan normal biçimde **⌘Q** ile çıkabilirsiniz; bu işlem yeni oyun başlatmaz ve kaydınızı silmez.
- Her karar otomatik kaydedilir. Uygulamayı yeniden açınca kaldığınız oyun yüklenir.
- Kayıtlar `~/Library/Application Support/com.bekiraslan.akkopru2026/kayitlar/` klasöründedir.
- `otomatik.json` ana kayıt, `otomatik.yedek.json` önceki kayıttır. Yedek alınırken geçici dosyaya yazılır; asıl kayıt en son değiştirilir.
- Finder'da **Git → Klasöre Git…** ile bu klasörü açabilir ve iki dosyayı kendiniz yedekleyebilirsiniz.

## Geliştirme durumu

Bu paket bağımsız bir Mac uygulamasıdır; oyunun mevcut geliştirme sürümünü içerir. Seçim gecesi, ana menü ve üç kayıt yuvası henüz tamamlanmadı. Dönem 18. ayda seçim sistemini bekler. “Profesyonel dağıtım” için Apple Developer ID imzası ve noter onayı ayrıca yapılacaktır.

## Kaynaktan derlemek isteyenler için

Bu bölüm oyunu kurmak için gerekli değildir. Mac üzerinde Node.js 22, Rust ve Xcode Command Line Tools kuruluysa:

```sh
npm ci
rustup target add aarch64-apple-darwin x86_64-apple-darwin
npm run denetle
npm run masaustu:derle
```

DMG: `src-tauri/target/universal-apple-darwin/release/bundle/dmg/`.
