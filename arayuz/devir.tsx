import type { OyunDurumu } from "../cekirdek/durum.ts";
import { devirDosyalari, DEVIR_SECENEKLERI, DEVIR_YOLLARI } from "../cekirdek/devir.ts";
import type { Oyun } from "./useOyun.ts";

export function DevirEkrani({ d, oyun }: { d: OyunDurumu; oyun: Oyun }) {
  const yol = d.bitis?.devir;
  if (yol === undefined) return null;
  const dosyalar = devirDosyalari(d);
  const bekleyen = dosyalar.filter(dosya => dosya.bekliyor).length;
  const karar = yol === null ? null : DEVIR_SECENEKLERI[yol];
  return <section className="kutu devir-dosyasi" aria-labelledby="devir-baslik">
    <h2 id="devir-baslik">Dönem sonu devir dosyası</h2>
    <p>{dosyalar.length} dosya · {bekleyen} dosyada bekleyen işlem</p>
    <details open={yol === null || yol === "acik"}>
      <summary>{yol === "acik" ? "Kamuya açılan dosya dökümü" : "Dönem sonu dosya dökümü"}</summary>
      <dl>{dosyalar.map(dosya => <div key={dosya.id}>
        <dt>{dosya.ad}{dosya.bekliyor && <small className="soluk">Bekleyen işlem</small>}</dt>
        <dd>{dosya.durum}</dd>
      </div>)}</dl>
    </details>
    {karar ? <div role="status" className="devir-alindi">
      <h3>{karar.belge}</h3>
      <p>{karar.durum}</p>
    </div> : <>
      <p>Seçim sonucu kesinleşti. Kurumlara hangi teslim kaydını bırakacağını seç.</p>
      <div className="uc-sutun">{DEVIR_YOLLARI.map(id => <button key={id} className="secenek" type="button" onClick={() => oyun.devirSec(id)}>
        <b>{DEVIR_SECENEKLERI[id].baslik}</b>
        <span className="kucuk soluk">{DEVIR_SECENEKLERI[id].bedel}</span>
      </button>)}</div>
    </>}
    {oyun.mesaj && <p role="alert">{oyun.mesaj}</p>}
  </section>;
}
