import { useEffect, useState } from "react";
import { yeniOyun, rastgeleTohum, type OyunDurumu } from "../cekirdek/durum.ts";
import { ayiBitir } from "../cekirdek/ay.ts";
import { tarihAdi, secimeKalanAy, DONEM_AY_SAYISI } from "../cekirdek/takvim.ts";
import { otomatikKaydet, otomatikYukle, otomatikSil } from "./kalici.ts";

export function Uygulama() {
  const [durum, setDurum] = useState<OyunDurumu | null>(() => otomatikYukle());
  const [mesaj, setMesaj] = useState<string | null>(null);

  useEffect(() => {
    if (durum) otomatikKaydet(durum);
  }, [durum]);

  if (!durum) return <Acilis onYeni={() => setDurum(yeniOyun(rastgeleTohum()))} />;

  const bitir = () => {
    const s = ayiBitir(durum);
    if (s.ok) {
      setDurum(s.durum);
      setMesaj(null);
    } else setMesaj(s.neden);
  };

  return (
    <div className="uygulama">
      <header className="ust">
        <div className="marka">
          <h1>Akköprü 2026</h1>
          <span className="muhur">Cumhurbaşkanlığı masası</span>
        </div>
        <dl className="serit">
          <div><dt>Tarih</dt><dd>{tarihAdi(durum.ay)}</dd></div>
          <div><dt>Ay</dt><dd>{durum.ay} / {DONEM_AY_SAYISI}</dd></div>
          <div><dt>Seçime</dt><dd>{secimeKalanAy(durum.ay)} ay</dd></div>
        </dl>
      </header>
      <main className="masa">
        <section className="dosya">
          <span className="ust-etiket">Masa · {tarihAdi(durum.ay)}</span>
          <h2>Masa hazırlanıyor</h2>
          <p>Bu sürüm oyunun altyapısıdır: takvim, otomatik kayıt ve tohumlu zar çalışıyor. Kararlar, ekonomi ve diğer sistemler iş listesindeki sırayla eklenecek.</p>
          {mesaj && <p className="uyari" role="status">{mesaj}</p>}
        </section>
      </main>
      <footer className="alt">
        <button type="button" className="dugme ikincil" onClick={() => { otomatikSil(); setDurum(null); }}>Yeni oyun</button>
        <button type="button" className="dugme birincil" onClick={bitir}>Ayı bitir</button>
      </footer>
    </div>
  );
}

function Acilis({ onYeni }: { onYeni: () => void }) {
  return (
    <div className="acilis">
      <span className="muhur">Gizli · Yalnız Cumhurbaşkanı okuyacak</span>
      <h1>Akköprü 2026</h1>
      <p>Doruk Cumhuriyeti'nin cumhurbaşkanısınız. Seçime 18 ay var.</p>
      <button type="button" className="dugme birincil" onClick={onYeni}>Göreve başla</button>
      <p className="dipnot">Ülke, kişiler, partiler ve kurumlar kurgusaldır.</p>
    </div>
  );
}
