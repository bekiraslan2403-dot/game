import type { OyunDurumu } from "../cekirdek/durum.ts";
import { belediyeDurumu } from "../cekirdek/belediye.ts";

export function BelediyeIzleme({ d, il }: { d: OyunDurumu; il: string }) {
  const k = belediyeDurumu(d, il);
  return <section className="inceleme-izleme santiye-izleme" aria-label="Belediye ücret ve hizmet kaydı">
    <p className="ust-etiket">{il} · Garaj ve ücret</p>
    <h3>Ücret ile sefer ayrı hesaplar</h3>
    <dl className="inceleme-durumlar">
      <div><dt>Ücret</dt><dd>{k.ucret}</dd></div>
      <div><dt>Sefer</dt><dd>{k.hizmet}</dd></div>
      <div><dt>Diğer borç</dt><dd>{k.hesap}</dd></div>
    </dl>
    {d.bayraklar.belediye_sonuc && <p className="inceleme-ek">Son karar: {d.buAy.kararlar.filter(x => x.kart.startsWith("belediye_maas_")).at(-1)?.secenekMetni ?? "Eski kayıt arşivde."}</p>}
  </section>;
}
