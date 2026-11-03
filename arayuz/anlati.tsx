import type { OyunDurumu, MasaKarti } from "../cekirdek/durum.ts";
import type { Oyun } from "./useOyun.ts";
import { kosulSaglaniyor } from "../cekirdek/kosul.ts";
import { ICERIK } from "./icerik.ts";
import { KisiRozeti, Muhur, Pencere } from "./bilesenler.tsx";

function Replik({ kim, metin, d }: { kim: string; metin: string; d: OyunDurumu }) {
  const k = ICERIK.karakterler[kim], iliski = d.anlati.iliskiler[kim] ?? 50;
  return <div className="anlati-replik">
    <KisiRozeti kisi={k} boy={52} ton={iliski < 45 ? "ofkeli" : iliski > 60 ? "memnun" : "notr"} />
    <div><p className="ust-etiket">{k?.ad} · {k?.rol}</p>{d.anlati.iliskiler[kim] !== undefined && <p className="kucuk soluk">{iliski >= 60 ? "Sana güveniyor" : iliski < 40 ? "Sana karşı kapanmış" : iliski < 50 ? "Sana mesafeli" : "Sözünü tartıyor"}</p>}<blockquote>{metin}</blockquote></div>
  </div>;
}

export function DosyaAnlatisi({ d, m, oyun }: { d: OyunDurumu; m: MasaKarti; oyun: Oyun }) {
  const a = ICERIK.kartlar[m.kart]?.anlati;
  if (!a) return null;
  const notlar = d.anlati.notlar.filter(n => n.ornek === m.ornek);
  return <section className="dosya-anlatisi" aria-label="Dosyanın içindeki insanlar">
    <p className="anlati-amac"><b>Önündeki mesele</b>{a.amac}</p>
    <div className="anlati-sesler">{[...a.hatirlatmalar, ...a.sesler].filter(s => !s.kosul || kosulSaglaniyor(d, s.kosul, ICERIK)).map((s, i) => <Replik key={i} d={d} kim={s.kim} metin={s.metin} />)}</div>
    <details className="anlati-belgeler"><summary>Masadaki belgeleri incele · {a.belgeler.length} parça</summary><dl>{a.belgeler.map(b => <div key={b.ad}><dt>{b.ad}</dt><dd>{b.metin}</dd></div>)}</dl></details>
    {a.sahne && !notlar.length && <div className="anlati-davet"><p><b>{a.sahne.baslik}</b><br /><span className="kucuk">Karardan önce konuşabilirsin. Görüşme bir gün ve ayın tek sahne hakkını kullanır; kulis ve basın toplantısıyla ortaktır.</span></p><button className="dugme ikincil" disabled={d.bosGun < 1 || d.meclis.sahneAy === d.ay} onClick={() => oyun.anlatiAc(m.ornek)}>Görüşmeye git · 1 gün</button>{d.meclis.sahneAy === d.ay && <p className="kucuk soluk">Bu ay sahne hakkı kullanıldı. Eldeki belgelerle karar verebilirsin.</p>}</div>}
    {!!notlar.length && <details className="anlati-belgeler"><summary>Görüşmede öğrendiklerin · {notlar.length} not</summary>{notlar.map((n, i) => <Replik key={i} d={d} kim={n.kim} metin={n.metin} />)}</details>}
  </section>;
}

export function AnlatiSahnesi({ d, oyun }: { d: OyunDurumu; oyun: Oyun }) {
  const s = d.anlati.sahne!;
  const m = d.masa.find(m => m.ornek === s.ornek)!;
  const a = ICERIK.kartlar[m.kart]!.anlati!;
  const sahne = a.sahne!, adim = sahne.adimlar[s.adim]!;
  const yanit = d.anlati.notlar.filter(n => n.ornek === s.ornek).at(-1);
  return <Pencere baslik={sahne.baslik} genis>
    <article className="anlati-sahnesi">
      <header><Muhur ton="mavi">Akköprü dosyası · Görüşme</Muhur><p className="ust-etiket">{a.mekan}</p><h3>{sahne.baslik}</h3><p className="anlati-adim" aria-label={`Görüşme ${s.adim + 1} / 3`}>{[0, 1, 2].map(i => <span key={i} className={i === s.adim ? "simdi" : i < s.adim ? "gecildi" : ""}>{["I", "II", "III"][i]}</span>)}</p></header>
      <Replik d={d} kim={adim.kim} metin={adim.metin} />
      {s.cevap === null ? <ol className="secenekler">{adim.secenekler.map((c, i) => {
        const uygun = !c.kosul || kosulSaglaniyor(d, c.kosul, ICERIK);
        return <li key={i}><button className="secenek" disabled={!uygun} onClick={() => oyun.anlatiCevap(i)}><span className="secenek-metin">{c.metin}</span>{!uygun && <span className="kucuk soluk">{c.kilitNedeni}</span>}</button></li>;
      })}</ol> : <section className="anlati-yanit"><p className="ust-etiket">Söylediğin</p><p className="oyuncu-repligi">“{adim.secenekler[s.cevap]!.metin}”</p>{yanit && <Replik d={d} kim={yanit.kim} metin={yanit.metin} />}<button className="dugme birincil" onClick={oyun.anlatiDevam}>{s.adim === 2 ? "Dosyaya dön" : "Konuşmayı sürdür"}</button></section>}
      {oyun.mesaj && <p className="uyari" role="status">{oyun.mesaj}</p>}
    </article>
  </Pencere>;
}

export function KararTepkileri({ d, tepkiler }: { d: OyunDurumu; tepkiler: { kim: string; metin: string }[] }) {
  return <div className="karar-tepkileri">{tepkiler.map((t, i) => <Replik key={i} d={d} kim={t.kim} metin={t.metin} />)}</div>;
}
