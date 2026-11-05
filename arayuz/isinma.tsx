import type { OyunDurumu, MasaKarti } from "../cekirdek/durum.ts";
import { isinmaDosyasi, isinmaDurumu } from "../cekirdek/isinma.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { tutarYaz } from "./bicim.ts";

export function IsinmaIzleme({ d, m }: { d: OyunDurumu; m: MasaKarti }) {
  const p = isinmaDosyasi(d, m); if (!p) return null;
  const yardim = p.odemeler.filter(o => o.amac === "fatura");
  return <section className="inceleme-izleme santiye-izleme" aria-label="Kış dosyasının sonucu">
    <p className="ust-etiket">Son haber · {tarihAdi(p.sonAy)}</p>
    <h3>Binadan gelen son haber</h3>
    <p>{p.sonHaber}</p>
    <dl className="inceleme-durumlar">
      <div><dt>Isınma</dt><dd>{isinmaDurumu(d, p)}</dd></div>
      <div><dt>Fatura yardımı</dt><dd>{!yardim.length ? "Bu dosyada yardım ödenmedi" : yardim.some(o => !o.uygulandi) ? "Ödenek aktarıldı; faturayla eşleşme bekleniyor" : `${yardim.length} dönem faturaya işlendi; sonraki ay otomatik ödeme yok`}</dd></div>
    </dl>
    <details className="anlati-belgeler"><summary>Tarife ve ödeme kaydı</summary>
      <p>İlk karar ayının fiyatlarıyla örnek hane faturası: {Math.round(p.faturaOnce).toLocaleString("tr-TR")} TL → {Math.round(p.faturaSonra).toLocaleString("tr-TR")} TL. Bu toplamın doğal gaz payı oyun hesabında %55. Hedefli yardım tüm hanelerin faturasından düşülmez.</p>
      {p.odemeler.map(o => <p key={o.soz}>{tarihAdi(o.ay)} · {o.amac === "fatura" ? "Hane yardım programı" : o.amac === "bakim" ? "Yedek parça ve gece ekibi" : "Geçici ısınma"}: {tutarYaz(o.tutarTL)}. {o.uygulandi ? "İşletme teslimi teyit etti." : "Sahadaki teslim bekleniyor."}</p>)}
    </details>
  </section>;
}
