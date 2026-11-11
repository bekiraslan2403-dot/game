import type { OyunDurumu } from "../cekirdek/durum.ts";
import { hafizaSatirlari } from "../cekirdek/hafiza.ts";

export function HafizaIzleme({ d }: { d: OyunDurumu }) {
  const satirlar = hafizaSatirlari(d);
  return <section className="inceleme-izleme santiye-izleme" aria-label="Akköprü geçmiş kararlar">
    <p className="ust-etiket">Bölüm V · Geçim ve hafıza</p>
    <h3>Kayda geçenler</h3>
    <p>{satirlar[0]}</p>
    <p>{satirlar[4]}</p>
    <details className="anlati-belgeler"><summary>Delil, işçi ve aile durumu</summary><ul>{satirlar.slice(1, 4).concat(satirlar[5]!).map(s => <li key={s}>{s}</li>)}</ul></details>
  </section>;
}
