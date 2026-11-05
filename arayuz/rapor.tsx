import type { AyKaydi, OyunDurumu } from "../cekirdek/durum.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { GOSTERGE } from "../cekirdek/gostergeler.ts";
import { sepetAylik } from "../cekirdek/ekonomi.ts";
import { degisimIfadesi, yuzdeYaz, type Ifade } from "./bicim.ts";
import { IfadeListesi, Pencere } from "./bilesenler.tsx";

/** Tarihî rapor yalnız kayıtlı ayı gösterir; bugünkü durumla yeniden hesaplanmaz. */
export function RaporIcerigi({ rapor, sepet }: { rapor: AyKaydi; sepet?: number }) {
  const ifade = (alan: string) => rapor.degisim
    .filter(x => GOSTERGE[x.id]?.alan === alan)
    .map(x => degisimIfadesi(x.id, x.once, x.sonra))
    .filter((x): x is Ifade => x !== null);
  return <>
        <p className="ust-etiket">Ay sonu raporu · Özel Kalem</p>
        <h3 className="dosya-baslik">{tarihAdi(rapor.ay)}</h3>
        <div className="rapor-izgara">
          <section>
            <h4>Verdiğiniz kararlar</h4>
            <ul className="kararlar-listesi">
              {rapor.kararlar.map((k, i) => <li key={i}><b>{k.baslik}</b><span>{k.secenekMetni}</span></li>)}
            </ul>
            {rapor.ertelenen.length > 0 && <p className="soluk kucuk">Ertelenen: {rapor.ertelenen.join(", ")}</p>}
            {rapor.hayatlar.length > 0 && (
              <>
                <h4>Beş hayattan</h4>
                <ul className="kararlar-listesi">{rapor.hayatlar.map((h, i) => <li key={i}><b>{h.kim}</b><span>{h.metin}</span></li>)}</ul>
              </>
            )}
            {rapor.olaylar.some(o=>o.startsWith("Karar izi:"))&&<section className="karar-izleri"><h4>Bu sonuç neden oldu?</h4><ul className="kararlar-listesi">{rapor.olaylar.filter(o=>o.startsWith("Karar izi:")).map((o,i)=><li key={i}>{o.slice(10)}</li>)}</ul></section>}
            {rapor.olaylar.some(o => !o.startsWith("Karar izi:")) && (
              <>
                <h4>Ay sonunda</h4>
                <ul className="kararlar-listesi">{rapor.olaylar.filter(o=>!o.startsWith("Karar izi:")).map((o, i) => <li key={i}>{o}</li>)}</ul>
              </>
            )}
          </section>
          <section>
            <h4>Ekonomi</h4>
            <IfadeListesi ifadeler={ifade("ekonomi")} bos="Ekonomide belirgin bir değişim olmadı." />
            {sepet !== undefined && <p className="kucuk">Market sepeti bu ay {yuzdeYaz(sepet)} {sepet >= 0 ? "pahalandı" : "ucuzladı"}.</p>}
            <h4>Kamuoyu</h4>
            <IfadeListesi ifadeler={[...ifade("secmen"), ...ifade("siyaset"), ...ifade("toplum")]} bos="Kamuoyunda belirgin bir değişim olmadı." />
          </section>
        </div>
  </>;
}

export function AyRaporu({ rapor, d, onKapat }: { rapor: AyKaydi; d: OyunDurumu; onKapat: () => void }) {
  return <Pencere baslik={`${tarihAdi(rapor.ay)} raporu`} onKapat={onKapat} genis>
    <article className="rapor">
      <RaporIcerigi rapor={rapor} sepet={sepetAylik(d)} />
      <button type="button" className="dugme birincil" onClick={onKapat}>{d.yonetim.secim.gece ? "Seçim gecesine geç" : d.bitis ? "Dönemin sonsözünü oku" : `${tarihAdi(d.ay)} masasına geç`}</button>
    </article>
  </Pencere>;
}
