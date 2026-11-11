import type { AyKaydi, KararUygulamasi, OyunDurumu } from "../cekirdek/durum.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { GOSTERGE } from "../cekirdek/gostergeler.ts";
import { sepetAylik } from "../cekirdek/ekonomi.ts";
import { degisimIfadesi, yuzdeYaz, type Ifade } from "./bicim.ts";
import { IfadeListesi, Pencere } from "./bilesenler.tsx";

export function KararTakvimi({ takip, arsiv = false }: { takip: KararUygulamasi["takip"]; arsiv?: boolean }) {
  if (!takip.length) return null;
  const baslik = arsiv
    ? takip.length === 1 ? "Bu kararla açılan dosya" : "Bu kararla açılan dosyalar"
    : takip.length === 1 ? "Sıradaki dosya" : "Sıradaki dosyalar";
  return <section className="karar-takvimi" aria-label={baslik}>
    <b>{baslik}</b>
    <ul>{takip.map((dosya, i) => <li key={i}>{tarihAdi(dosya.ay)} · {dosya.baslik}</li>)}</ul>
  </section>;
}

export function RaporKararlari({ kararlar }: { kararlar: AyKaydi["kararlar"] }) {
  if (!kararlar.length) return <p>Bu ay henüz karar verilmedi.</p>;
  return <ul className="kararlar-listesi rapor-kararlari">
    {kararlar.map((karar, i) => <li key={i}>
      <b>{karar.baslik}</b>
      <span>{karar.secenekMetni}</span>
      {karar.uygulama?.bildirim && <p>{karar.uygulama.bildirim}</p>}
      {!!karar.uygulama?.etkiler.length && <details className="ikincil-ayrinti">
        <summary>Etki ve kaynak ayrıntıları</summary>
        <ul>{karar.uygulama.etkiler.map((etki, n) => <li key={n}>{etki}</li>)}</ul>
      </details>}
      {karar.uygulama && <KararTakvimi takip={karar.uygulama.takip} arsiv />}
    </li>)}
  </ul>;
}

/** Tarihî rapor yalnız kayıtlı ayı gösterir; bugünkü durumla yeniden hesaplanmaz. */
export function RaporIcerigi({ rapor, sepet }: { rapor: AyKaydi; sepet?: number }) {
  const ifade = (alan: string) => rapor.degisim
    .filter(x => GOSTERGE[x.id]?.alan === alan)
    .map(x => degisimIfadesi(x.id, x.once, x.sonra))
    .filter((x): x is Ifade => x !== null);
  const eskiNotlar = rapor.olaylar.filter(o => o.startsWith("Karar izi:"));
  const kisSonucu = rapor.olaylar.filter(o => o.startsWith("Kış dosyası — ")).at(-1);
  const oneCikan = (olay: string) => olay === kisSonucu
    || /^Meclis (kabul etti|reddetti|halkoylamasına sundu):/.test(olay)
    || olay.startsWith("Yıllık bütçe ");
  const sonuclar = rapor.olaylar.filter(oneCikan);
  const olaylar = rapor.olaylar.filter(o => !o.startsWith("Karar izi:") && !oneCikan(o));
  const ekonomi = ifade("ekonomi");
  const kamuoyu = [...ifade("secmen"), ...ifade("siyaset"), ...ifade("toplum")];
  const sepetDegisti = sepet !== undefined && Math.abs(sepet) >= 0.05;
  return <>
    <p className="ust-etiket">Ay sonu raporu · Özel Kalem</p>
    <h3 className="dosya-baslik">{tarihAdi(rapor.ay)}</h3>
    <div className="rapor-izgara">
      <section>
        <h4>Kararlar ve sonuçları</h4>
        <RaporKararlari kararlar={rapor.kararlar} />
        {rapor.ertelenen.length > 0 && <p className="soluk kucuk">Ertelenen dosyalar · {rapor.ertelenen.join(", ")}</p>}
        {sonuclar.length > 0 && <section>
          <h4>Ayın sonuçları</h4>
          <ul className="kararlar-listesi">{sonuclar.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </section>}
        {eskiNotlar.length > 0 && <details className="ikincil-ayrinti">
          <summary>Önceki sonuç notları</summary>
          <ul className="kararlar-listesi">{eskiNotlar.map((o, i) => <li key={i}>{o.slice("Karar izi:".length).trim()}</li>)}</ul>
        </details>}
        {rapor.hayatlar.length > 0 && <details className="ikincil-ayrinti">
          <summary>Beş hayattan</summary>
          <ul className="kararlar-listesi">{rapor.hayatlar.map((h, i) => <li key={i}><b>{h.kim}</b><span>{h.metin}</span></li>)}</ul>
        </details>}
        {olaylar.length > 0 && <details className="ikincil-ayrinti">
          <summary>Ayın diğer gelişmeleri · {olaylar.length}</summary>
          <ul className="kararlar-listesi">{olaylar.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </details>}
      </section>
      {(ekonomi.length > 0 || sepetDegisti || kamuoyu.length > 0) && <section>
        {(ekonomi.length > 0 || sepetDegisti) && <>
          <h4>Ekonomi</h4>
          <IfadeListesi ifadeler={ekonomi} />
          {sepetDegisti && <p className="kucuk">Market sepeti bu ay {yuzdeYaz(Math.abs(sepet))} {sepet > 0 ? "pahalandı" : "ucuzladı"}.</p>}
        </>}
        {kamuoyu.length > 0 && <details className="ikincil-ayrinti">
          <summary>Kamuoyundaki değişimler · {kamuoyu.length}</summary>
          <IfadeListesi ifadeler={kamuoyu} />
        </details>}
      </section>}
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
