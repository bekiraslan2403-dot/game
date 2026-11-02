import { useEffect, useState } from "react";
import { yuvaOku, yuvaYaz } from "./yuvalar.ts";
import type { Oyun } from "./useOyun.ts";
import { kaydet, yukle } from "../cekirdek/kayit.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { Muhur, Pencere } from "./bilesenler.tsx";
import { sesAyarla, sesAcikMi, muzikAyarla, muzikAcikMi } from "./ses.ts";

function ayarOku(ad: string, varsayilan: string): string {
  try {
    return localStorage.getItem(`akkopru-2026:${ad}`) ?? varsayilan;
  } catch {
    return varsayilan;
  }
}
export function gorunumHazirla(): void {
  document.documentElement.dataset.tema = ayarOku("tema", "sistem");
  document.documentElement.dataset.yazi = ayarOku("yazi", "normal");
}
export function OyunMenusu({
  oyun,
  onKapat,
}: {
  oyun: Oyun;
  onKapat: () => void;
}) {
  const [muzik,setMuzik]=useState(muzikAcikMi());
  const [mesaj, setMesaj] = useState(""),
    [teyit, setTeyit] = useState<string | null>(null),
    [yuvalar, setYuvalar] = useState<(string | null)[]>([null, null, null]),
    [hazir, setHazir] = useState(false);
  useEffect(() => {
    let etkin = true;
    Promise.all([1, 2, 3].map(yuvaOku)).then(
      (v) => {
        if (etkin) {
          setYuvalar(v);
          setHazir(true);
        }
      },
      () => {
        if (etkin)
          setMesaj(
            "Kayıt yuvaları açılamadı. Dosyaya indirme/yükleme kullanılabilir.",
          );
      },
    );
    return () => {
      etkin = false;
    };
  }, []);
  const [tema, setTema] = useState(ayarOku("tema", "sistem")),
    [yazi, setYazi] = useState(ayarOku("yazi", "normal")),
    [ses, setSes] = useState(sesAcikMi());
  const ayarla = (ad: string, deger: string) => {
    document.documentElement.dataset[ad] = deger;
    try {
      localStorage.setItem(`akkopru-2026:${ad}`, deger);
    } catch {
      setMesaj("Görünüm bu oturumda değişti; tarayıcı ayarı kaydedemedi.");
    }
  };
  const yuklemeyiBitir = async (metin: string) => {
    const sonuc = yukle(metin);
    if (!sonuc.ok) {
      setMesaj(sonuc.hata);
      return;
    }
    if (oyun.durum) {
      try {
        await yuvaYaz(0, kaydet(oyun.durum));
      } catch {
        setMesaj("Mevcut oyunun dönüş kopyası saklanamadı; yükleme yapılmadı.");
        return;
      }
    }
    oyun.yukle(sonuc.durum);
    onKapat();
  };
  const disari = () => {
    if (!oyun.durum) return;
    const url = URL.createObjectURL(
      new Blob([kaydet(oyun.durum)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `Akkopru-${oyun.durum.ay}-ay.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMesaj(
      "Kayıt dosyası indirildi. Başka tarayıcıya veya bilgisayara bu dosyayla geçebilirsiniz.",
    );
  };
  return (
    <Pencere baslik="Oyun menüsü" onKapat={onKapat} genis>
      <article className="tam-ekran oyun-menusu">
        <header className="dosya-ust">
          <div>
            <Muhur>Akköprü 2026</Muhur>
            <h3 className="dosya-baslik">Oyun menüsü</h3>
          </div>
          <button
            className="kapat"
            onClick={onKapat}
            aria-label="Oyun menüsünü kapat"
          >
            ×
          </button>
        </header>
        <p className="soluk">
          Otomatik kayıt bu tarayıcıda tutulur. Cihaz değiştirmeden önce dosyaya
          aktarın.
        </p>
        <section>
          <h4>Kayıt yuvaları</h4>
          <div className="uc-sutun">
            {[1, 2, 3].map((id) => {
              const metin = yuvalar[id - 1] ?? null,
                s = metin ? yukle(metin) : null;
              return (
                <article className="kutu" key={id}>
                  <p className="ust-etiket">Yuva 0{id}</p>
                  <h4>
                    {s?.ok
                      ? tarihAdi(s.durum.ay)
                      : metin
                        ? "Kayıt okunamadı"
                        : "Boş yuva"}
                  </h4>
                  {s?.ok && (
                    <p className="kucuk soluk">
                      {s.durum.bitis
                        ? "Dönem tamamlandı"
                        : `${s.durum.gecmis.length} ay tamamlandı`}
                    </p>
                  )}
                  <button
                    className="dugme ikincil"
                    disabled={!oyun.durum || !hazir}
                    onClick={async () => {
                      if (metin && teyit !== `yaz${id}`) {
                        setTeyit(`yaz${id}`);
                        return;
                      }
                      try {
                        const kayit = kaydet(oyun.durum!);
                        await yuvaYaz(id, kayit);
                        setTeyit(null);
                        setYuvalar((v) =>
                          v.map((s, i) => (i === id - 1 ? kayit : s)),
                        );
                        setMesaj(`Oyun ${id}. yuvaya kaydedildi.`);
                      } catch {
                        setMesaj(
                          "Kayıt yazılamadı. Dosyaya aktararak kopya alın.",
                        );
                      }
                    }}
                  >
                    {teyit === `yaz${id}`
                      ? "Üzerine yazmayı onayla"
                      : "Bu yuvaya kaydet"}
                  </button>
                  <button
                    className="dugme ikincil"
                    disabled={!s?.ok}
                    onClick={() => {
                      if (oyun.durum && teyit !== `oku${id}`) {
                        setTeyit(`oku${id}`);
                        return;
                      }
                      yuklemeyiBitir(metin!);
                    }}
                  >
                    {teyit === `oku${id}`
                      ? "Kaydı yüklemeyi onayla"
                      : "Bu yuvayı yükle"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
        <section>
          <h4>Dosyayla taşı</h4>
          <div className="iki-sutun">
            <button
              className="dugme ikincil"
              disabled={!oyun.durum}
              onClick={disari}
            >
              Kaydı dosyaya indir
            </button>
            <label className="dosya-yukle dugme ikincil">
              Kayıt dosyası seç
              <input
                type="file"
                accept=".json,application/json"
                aria-label="Kayıt dosyası seç"
                onChange={async (e: { currentTarget: HTMLInputElement }) => {
                  const f = e.currentTarget.files?.[0];
                  if (!f) return;
                  if (f.size > 20 * 1024 * 1024) {
                    setMesaj("Kayıt dosyası 20 MB'den büyük olamaz.");
                    return;
                  }
                  const metin = await f.text();
                  const s = yukle(metin);
                  if (!s.ok) {
                    setMesaj(s.hata);
                    return;
                  }
                  setTeyit(null);
                  if (
                    oyun.durum &&
                    !window.confirm(
                      "Dosyadaki oyun yüklenecek. Mevcut oyunun dönüş kopyası saklanacak. Devam edilsin mi?",
                    )
                  )
                    return;
                  yuklemeyiBitir(metin);
                }}
              />
            </label>
          </div>
        </section>
        <section>
          <h4>Görünüm ve ses</h4>
          <div className="uc-sutun">
            <label className="alan">
              Tema
              <select
                aria-label="Tema"
                value={tema}
                onChange={(e: { target: { value: string } }) => {
                  setTema(e.target.value);
                  ayarla("tema", e.target.value);
                }}
              >
                <option value="sistem">Sistem ayarı</option>
                <option value="acik">Gündüz masası</option>
                <option value="koyu">Gece masası</option>
              </select>
            </label>
            <label className="alan">
              Yazı boyutu
              <select
                aria-label="Yazı boyutu"
                value={yazi}
                onChange={(e: { target: { value: string } }) => {
                  setYazi(e.target.value);
                  ayarla("yazi", e.target.value);
                }}
              >
                <option value="normal">Normal</option>
                <option value="buyuk">Büyük</option>
                <option value="en-buyuk">Çok büyük</option>
              </select>
            </label>
            <button
              className="dugme ikincil"
              aria-pressed={ses}
              onClick={() => {
                setSes(!ses);
                sesAyarla(!ses);
              }}
            >
              Ses efektleri: {ses ? "Açık" : "Kapalı"}
            </button>
          </div>
        </section>
        <details className="nasil-oynanir">
          <summary>Nasıl oynanır?</summary>
          <p>
            Her ay masadaki kararları sonuçlandırın. Dosyalar'dan üç imza
            kullanabilir, Ajanda'da dört boş günü değerlendirebilirsiniz. Basın,
            kulis veya kampanya aynı ayın tek sahne hakkını paylaşır. Sözleri
            Hazine'den yerine getirin. Rapor, kararların gecikmeli sonuçlarını
            açıklar. Son üç ay kampanya; 18. ay seçim gecesidir.
          </p>
        </details>
        <button className="dugme ikincil" aria-pressed={muzik} onClick={()=>{setMuzik(!muzik);muzikAyarla(!muzik);}}>Müzik: {muzik?"Açık":"Kapalı"}</button><section className="yeni-donem">
          <h4>Yeni dönem</h4>
          <p className="kucuk soluk">
            Yeni oyun mevcut otomatik kaydın yerini alır. Önce bir yuvaya veya
            dosyaya kaydedebilirsiniz.
          </p>
          <button
            className="dugme ikincil"
            onClick={async () => {
              if (oyun.durum && teyit !== "yeni") {
                setTeyit("yeni");
                return;
              }
              if (oyun.durum) {
                try {
                  await yuvaYaz(0, kaydet(oyun.durum));
                } catch {
                  setMesaj(
                    "Mevcut oyunun dönüş kopyası alınamadı; yeni dönem başlatılmadı.",
                  );
                  return;
                }
              }
              oyun.yeni();
              onKapat();
            }}
          >
            {teyit === "yeni"
              ? "Yeni dönem başlatmayı onayla"
              : "Yeni dönem başlat"}
          </button>
          {teyit && (
            <button className="dugme ikincil" onClick={() => setTeyit(null)}>
              Vazgeç
            </button>
          )}
        </section>
        <button
          className="dugme ikincil"
          onClick={async () => {
            let metin = null;
            try {
              metin = await yuvaOku(0);
            } catch {}
            if (!metin) {
              setMesaj("Dönüş kopyası bulunamadı.");
              return;
            }
            if (teyit !== "onceki") {
              setTeyit("onceki");
              return;
            }
            yuklemeyiBitir(metin);
          }}
        >
          {teyit === "onceki"
            ? "Önceki oyunu yüklemeyi onayla"
            : "Son yükleme öncesindeki oyuna dön"}
        </button>
        {mesaj && (
          <p className="uyari" role="status">
            {mesaj}
          </p>
        )}
        <p className="ust-etiket">Geliştirme sürümü 0.4 · Tarayıcı · Türkçe</p>
        <button className="dugme birincil" onClick={onKapat}>
          Oyuna dön
        </button>
      </article>
    </Pencere>
  );
}
