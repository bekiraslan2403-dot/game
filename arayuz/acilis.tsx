import type { OyunDurumu } from "../cekirdek/durum.ts";
import { tutarYaz } from "./bicim.ts";

export function AcilisIzleme({ d, ayrinti = false }: { d: OyunDurumu; ayrinti?: boolean }) {
  const a = d.acilis;
  if (!a) return null;
  const trafik = { agir_yuk_kapali: "Ağır yük geçişi kapalı", hafif_tek_serit: "Hafif trafik tek şeritte", acik: "Ağır araçlar dahil açık" }[a.trafik];
  const sevkiyat = { alternatif_yolda: "Tanker çevre yolunda bekliyor", hastanede: "Hastane teslim aldı", gecikti: "Teslim gecikti; işlemler ertelendi" }[a.sevkiyat];
  const deniz = { gorevde: "Ölçüm görevinde", baski_altinda: "İtirazı var; baskı altında", gorevden_cekildi: "Ölçümden çekildi" }[a.deniz];
  return <section className="acilis-izleme" aria-label="Akköprü ilk gün kaydı">
    <p className="ust-etiket">Akköprü · {d.ay > 1 ? "İlk günün arşivi" : a.sonuc ? "İlk günün sonucu" : "Geceki emrin ardından"}</p>
    <h3>{a.sonuc?.baslik ?? "Sabah hatları yeniden çalıyor"}</h3>
    {a.sonuc && <p className="acilis-sonuc-metni">{a.sonuc.metin}</p>}
    <dl className="acilis-durumlar">
      <div><dt>Köprü</dt><dd>{trafik}</dd></div>
      <div><dt>Hastane</dt><dd>{sevkiyat}</dd></div>
      <div><dt>Deniz Alaz</dt><dd>{deniz}</dd></div>
    </dl>
    <details className="anlati-belgeler" open={ayrinti || undefined}>
      <summary>İlk günün tutanağı</summary>
      <ol className="acilis-tutanak">{a.olaylar.map((o, i) => <li key={i}><span className="veri">{o.saat}</span><p>{o.metin}</p></li>)}</ol>
      <p className="kucuk soluk">{a.hamKayit ? "Gece teslim alınan ham kayıt kopyası korunuyor." : "İlk gece ham kayıt kopyası teslim alınmadı."}</p>
      <p className="kucuk soluk">İlk gün çıkarılan tek seferlik ödenek: {tutarYaz(a.harcamaTL / 1e12)}.</p>
    </details>
  </section>;
}
