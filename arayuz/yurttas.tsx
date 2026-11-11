import type { OyunDurumu } from "../cekirdek/durum.ts";
import { YURTTAS_SECENEKLERI, YURTTAS_YOLLARI, yurttasSayilari } from "../cekirdek/yurttas.ts";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

export function YurttasTutanagi({ d }: { d: OyunDurumu }) {
  const kayit = d.yonetim.secim.yurttas;
  if (!kayit) return null;
  const puan = kayit.fark.toLocaleString("tr-TR", { signDisplay: "exceptZero", maximumFractionDigits: 3 });
  return <section className="kutu" aria-label="Yurttaş dosyası tutanağı">
    <h3>Yurttaş dosyası tutanağı</h3>
    <p><b>{YURTTAS_SECENEKLERI[kayit.yol].ad}</b> · {kayit.ay}. ay</p>
    <p>{kayit.tepki}</p>
    <p><b>Kampanya etkisi {puan} puan</b></p>
  </section>;
}

export function YurttasDosyasi({ d, oyun }: { d: OyunDurumu; oyun: Oyun }) {
  const secim = d.yonetim.secim;
  if (secim.yurttas) return <YurttasTutanagi d={d} />;
  const { olumlu, olumsuz, toplam, kayitlar } = yurttasSayilari(d, ICERIK);
  if (!toplam) return null;
  return <section className="kutu" aria-labelledby="yurttas-baslik">
    <h4 id="yurttas-baslik">Beş hayatın hesabı</h4>
    <p>Yerel radyo, son üç ayın yurttaş notlarını kampanya ekibine gönderdi. Seçime kadar bir yanıt verebilirsin.</p>
    <p className="soluk">{olumlu} olumlu kayıt · {olumsuz} güçlük · {toplam - olumlu - olumsuz} diğer not</p>
    <details>
      <summary>Karargâha gelen notları oku</summary>
      <ul>{kayitlar.map(iz => <li key={iz.kim}>{iz.ay}. ay · {iz.metin}</li>)}</ul>
    </details>
    <div className="uc-sutun">
      {YURTTAS_YOLLARI.map(yol => {
        const s = YURTTAS_SECENEKLERI[yol];
        const kayitEksik = yol === "klip" && !olumlu;
        return <button className="secenek" key={yol} type="button"
          disabled={d.bosGun < s.gun || secim.kasa < s.kasa || kayitEksik}
          onClick={() => oyun.yurttasKampanyasi(yol)}>
          <b>{s.ad}</b>
          <span className="kucuk soluk">{kayitEksik ? "Klip için olumlu kayıt gerekiyor." : s.not}</span>
          <span className="kucuk">{s.gun} gün · {s.kasa} kasa puanı</span>
        </button>;
      })}
    </div>
  </section>;
}
