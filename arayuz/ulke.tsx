// Ülke ekranı (Sistem 4): anketler, seçmen grupları, toplum ve siyaset göstergeleri.

import type { OyunDurumu } from "../cekirdek/durum.ts";
import { GOSTERGELER, GOSTERGE, gostergeYaz } from "../cekirdek/gostergeler.ts";
import { tarihAdi, AY_ADLARI, takvimAyi } from "../cekirdek/takvim.ts";
import { ANKET_SIRKETLERI, sonAnketler, anketOrtalamasi, anketSeyri } from "../cekirdek/kamuoyu.ts";
import { hissedilenEnflasyon } from "../cekirdek/ekonomi.ts";
import { yuzdeYaz } from "./bicim.ts";
import { Muhur, Pencere } from "./bilesenler.tsx";
import { BesHayat } from "./toplum.tsx";

const TUTUM_SINIF: Record<string, string> = { öfkeli: "ofkeli", kırgın: "kirgin", kararsız: "kararsiz", memnun: "memnun", coşkulu: "coskulu" };

function ayEtiketi(ay: number): string {
  if (ay <= 0) return "Eki";
  return (AY_ADLARI[takvimAyi(ay).ay - 1] ?? "").slice(0, 3);
}

/** Geçen ayın değişim yönü (ok ve ton). */
export function gecenAyYonu(d: OyunDurumu, id: string, esik = 0.5): { ok: string; ton: string; soz: string } {
  const x = d.gecmis.at(-1)?.degisim.find((v) => v.id === id);
  const fark = x ? x.sonra - x.once : 0;
  if (Math.abs(fark) < esik) return { ok: "–", ton: "notr", soz: "değişmedi" };
  const iyi = GOSTERGE[id]?.iyi;
  const ton = !iyi ? "notr" : (iyi === "yuksek") === fark > 0 ? "iyi" : "kotu";
  return { ok: fark > 0 ? "▲" : "▼", ton, soz: fark > 0 ? "geçen ay yükseldi" : "geçen ay düştü" };
}

function AnketGrafigi({ d }: { d: OyunDurumu }) {
  const seri = anketSeyri(d);
  if (seri.length < 2) return <p className="kucuk soluk">Anket seyri ikinci aydan itibaren çizilir.</p>;
  const W = 320, H = 120, P = 26;
  const min = Math.min(35, ...seri.map((s) => Math.floor(s.oran - 1)));
  const max = Math.max(60, ...seri.map((s) => Math.ceil(s.oran + 1)));
  const x = (i: number) => P + (i * (W - P - 8)) / Math.max(1, seri.length - 1);
  const y = (v: number) => 8 + ((max - v) * (H - 28)) / (max - min);
  const nokta = seri.map((s, i) => `${x(i).toFixed(1)},${y(s.oran).toFixed(1)}`).join(" ");
  const son = seri[seri.length - 1]!;
  return (
    <svg className="anket-grafik" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Anket ortalaması ${seri.length} ayda ${yuzdeYaz(seri[0]!.oran)} düzeyinden ${yuzdeYaz(son.oran)} düzeyine geldi`}>
      <line x1={P} x2={W - 8} y1={y(50)} y2={y(50)} className="g-cizgi" />
      <text x={2} y={y(50) + 4} className="g-yazi">%50</text>
      <text x={2} y={y(max) + 8} className="g-yazi">%{max}</text>
      <text x={2} y={y(min)} className="g-yazi">%{min}</text>
      <polyline points={nokta} className="g-seri" />
      {seri.map((s, i) => <circle key={i} cx={x(i)} cy={y(s.oran)} r={i === seri.length - 1 ? 3.5 : 2} className="g-nokta" />)}
      <text x={x(0)} y={H - 4} className="g-yazi" textAnchor="start">{ayEtiketi(seri[0]!.ay)}</text>
      <text x={x(seri.length - 1)} y={H - 4} className="g-yazi" textAnchor="end">{ayEtiketi(son.ay)}</text>
    </svg>
  );
}

export function UlkeEkrani({ d, onKapat }: { d: OyunDurumu; onKapat: () => void }) {
  const ort = anketOrtalamasi(d);
  const son = sonAnketler(d);
  const gruplar = GOSTERGELER.filter((g) => g.alan === "secmen").sort((a, b) => (b.nufus ?? 0) - (a.nufus ?? 0));
  const toplum = GOSTERGELER.filter((g) => g.alan === "toplum");
  const siyaset = GOSTERGELER.filter((g) => g.alan === "siyaset");
  const his = hissedilenEnflasyon(d);
  return (
    <Pencere baslik="Ülke" onKapat={onKapat} genis>
      <article className="hazine ulke">
        <header className="dosya-ust">
          <span className="etiketler"><Muhur>Ülke</Muhur><span className="kategori">{tarihAdi(d.ay)}</span></span>
          <button type="button" className="kapat" onClick={onKapat} aria-label="Ülke ekranını kapat">×</button>
        </header>
        <div className="ulke-ust">
          <div>
            <p className="ust-etiket">Anket ortalaması · üç şirket</p>
            <p className="buyuk-rakam veri">{ort === null ? "–" : yuzdeYaz(ort)}</p>
            <p className="kucuk soluk">Seçmen ekranda resmî enflasyonu değil market fişini görür: sepet bir yılda {yuzdeYaz(his)} pahalandı.</p>
          </div>
          <AnketGrafigi d={d} />
        </div>

        <BesHayat d={d} />

        <section className="hazine-bolum genis-bolum">
          <h4>Anket şirketleri</h4>
          <table className="tablo">
            <thead><tr><th scope="col">Şirket</th><th scope="col">Eğilimi</th><th scope="col">Son anket</th></tr></thead>
            <tbody>
              {ANKET_SIRKETLERI.map((s) => {
                const a = son.find((x) => x.sirket === s.id);
                return (
                  <tr key={s.id}>
                    <th scope="row">{s.ad}</th>
                    <td className="soluk sol">{s.aciklama}</td>
                    <td className="veri">{a ? yuzdeYaz(a.oran) : "–"} <span className="soluk kucuk">{a ? (a.ay === 0 ? "Eki 2026" : ayEtiketi(a.ay)) : ""}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="hazine-bolum genis-bolum">
          <h4>Seçmen grupları <span className="soluk kucuk">· nüfus payları örtüşür</span></h4>
          <ul className="gruplar">
            {gruplar.map((g) => {
              const v = d.gostergeler[g.id] ?? g.baslangic;
              const soz = gostergeYaz(g.id, v);
              const y = gecenAyYonu(d, g.id);
              return (
                <li key={g.id}>
                  <div>
                    <b>{g.ad}</b> <span className="soluk kucuk">%{g.nufus}</span>
                    <p className="kucuk soluk">{g.istek}</p>
                  </div>
                  <span className={`tutum tutum-${TUTUM_SINIF[soz] ?? "kararsiz"}`}>
                    {soz} <span className={`ok ok-${y.ton}`} aria-hidden="true">{y.ok}</span><span className="gizli-baslik">{y.soz}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="hazine-izgara">
          <section className="hazine-bolum">
            <h4>Toplum</h4>
            <dl className="liste-iki">
              {toplum.map((g) => {
                const y = gecenAyYonu(d, g.id);
                return <div key={g.id}><dt>{g.ad}</dt><dd className="veri">{gostergeYaz(g.id, d.gostergeler[g.id] ?? g.baslangic)} <span className={`ok ok-${y.ton}`} aria-hidden="true">{y.ok}</span></dd></div>;
              })}
            </dl>
          </section>
          <section className="hazine-bolum">
            <h4>Siyaset</h4>
            <dl className="liste-iki">
              {siyaset.map((g) => {
                const y = gecenAyYonu(d, g.id);
                return <div key={g.id}><dt>{g.ad}</dt><dd className="veri">{gostergeYaz(g.id, d.gostergeler[g.id] ?? g.baslangic)} <span className={`ok ok-${y.ton}`} aria-hidden="true">{y.ok}</span></dd></div>;
              })}
            </dl>
          </section>
        </div>
        <button type="button" className="dugme birincil" onClick={onKapat}>Masaya dön</button>
      </article>
    </Pencere>
  );
}
