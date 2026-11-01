// Hazine masası ve gösterge şeridi (Sistem 3 · Ekranlar ve dikey kesit kapsamı).
// Şerit masada 6 resmî rakamı ve yön oklarını gösterir; dokununca Hazine masası açılır.

import { useState } from "react";
import type { OyunDurumu } from "../cekirdek/durum.ts";
import { GOSTERGE, gostergeYaz } from "../cekirdek/gostergeler.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import {
  GIDER_KALEMLERI, GELIR_KALEMLERI, KALEM, SEPET, trilyonTL, toplamGider, toplamGelir, hissedilenEnflasyon, haneButcesi, ekonomiUyarilari,
  type KalemTanimi, type Soz,
} from "../cekirdek/ekonomi.ts";
import { ARACLAR, aracDenetle, aracTahmini, type AracTanimi } from "../cekirdek/hazine.ts";
import { etkiIfadesi, tutarYaz, tlYaz, yuzdeYaz, type Ifade } from "./bicim.ts";
import { Muhur, KisiRozeti, IfadeListesi, Pencere } from "./bilesenler.tsx";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

const SERIT: [string, string][] = [
  ["enflasyon", "Enflasyon"],
  ["buyume", "Büyüme"],
  ["issizlik", "İşsizlik"],
  ["butce_acigi", "Bütçe açığı"],
  ["kur", "Dolar"],
  ["faiz", "Faiz"],
];

/** Göstergenin geçen ayki değişim yönü ve bunun iyi mi kötü mü olduğu. */
function yon(d: OyunDurumu, id: string): { ok: string; ton: "iyi" | "kotu" | "notr"; soz: string } {
  const x = d.gecmis.at(-1)?.degisim.find((v) => v.id === id);
  const fark = x ? x.sonra - x.once : 0;
  const esik = id === "kur" ? 0.005 : 0.05;
  if (Math.abs(fark) < esik) return { ok: "–", ton: "notr", soz: "değişmedi" };
  const iyi = GOSTERGE[id]?.iyi;
  const ton = !iyi ? "notr" : (iyi === "yuksek") === fark > 0 ? "iyi" : "kotu";
  return { ok: fark > 0 ? "▲" : "▼", ton, soz: fark > 0 ? "geçen ay yükseldi" : "geçen ay düştü" };
}

export function GostergeSeridi({ d, onAc }: { d: OyunDurumu; onAc: () => void }) {
  const uyari = ekonomiUyarilari(d).length > 0;
  return (
    <button type="button" className={`gosterge-seridi${uyari ? " uyarili" : ""}`} onClick={onAc}>
      {SERIT.map(([id, ad]) => {
        const y = yon(d, id);
        const deger = id === "butce_acigi" ? yuzdeYaz(d.gostergeler[id] ?? 0) : gostergeYaz(id, d.gostergeler[id] ?? 0);
        return (
          <span className="g-oge" key={id}>
            <span className="g-ad">{ad}</span>
            <span className="g-deger">
              {deger} <span className={`ok ok-${y.ton}`} aria-hidden="true">{y.ok}</span>
              <span className="gizli-baslik">{y.soz}</span>
            </span>
          </span>
        );
      })}
      <span className="g-ac">{uyari && <span className="g-uyari" aria-hidden="true">!</span>}Hazine masası ›</span>
    </button>
  );
}

function KalemListesi({ d, baslik, kalemler, degerler, enBuyuk }: { d: OyunDurumu; baslik: string; kalemler: readonly KalemTanimi[]; degerler: Record<string, number>; enBuyuk: number }) {
  const toplam = kalemler.reduce((t, k) => t + (degerler[k.id] ?? 0), 0);
  return (
    <section className="hazine-bolum">
      <h4>{baslik} <span className="veri">{tutarYaz(trilyonTL(d, toplam))}</span></h4>
      <ul className="kalemler">
        {kalemler.map((k) => {
          const v = degerler[k.id] ?? 0;
          const fark = v - k.baslangic;
          return (
            <li key={k.id}>
              <span className="k-ad">{k.ad}</span>
              <span className="k-tutar veri">
                {tutarYaz(trilyonTL(d, v))}
                {Math.abs(fark) >= 0.05 && <span className="soluk"> ({fark > 0 ? "+" : "−"}{Math.abs(fark).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} puan)</span>}
              </span>
              <span className="cubuk" aria-hidden="true"><i style={{ width: `${Math.min(100, (v / enBuyuk) * 100)}%` }} /></span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AracKarti({ oyun, d, a }: { oyun: Oyun; d: OyunDurumu; a: AracTanimi }) {
  const [kalem, setKalem] = useState<string>(a.kalemler?.[0] ?? "");
  const [sonuc, setSonuc] = useState<string | null>(null);
  const k = a.kalemler ? kalem : undefined;
  const denetim = aracDenetle(d, a.id, k);
  const tahmin = aracTahmini(d, a.id, k);
  const ifadeler: Ifade[] = tahmin.map((x) => etkiIfadesi(x.id, x.deger, x.gecikmeli ?? false));
  const butce = tahmin.find((x) => x.id === "butce_acigi" && !x.gecikmeli);
  const kullanildi = d.ekonomi.arac[a.id] === d.ay;
  return (
    <article className="arac">
      <header className="arac-ust">
        <h5>{a.ad}</h5>
        {kullanildi && <Muhur ton="mavi">Bu ay kullanıldı</Muhur>}
      </header>
      <p className="kucuk soluk">{a.aciklama}</p>
      {a.kalemler && (
        <label className="secim">
          <span className="ust-etiket">Kalem</span>
          <select value={kalem} onChange={(e: { target: { value: string } }) => setKalem(e.target.value)} disabled={kullanildi}>
            {a.kalemler.map((id) => <option key={id} value={id}>{KALEM[id]?.ad}</option>)}
          </select>
        </label>
      )}
      {sonuc ? (
        <p className="kucuk">{sonuc}</p>
      ) : denetim.ok ? (
        <>
          <IfadeListesi ifadeler={ifadeler} />
          {butce && <p className="kucuk soluk">Yıllık {tutarYaz(trilyonTL(d, Math.abs(butce.deger)))} {butce.deger < 0 ? "kazanç" : "ek yük"}</p>}
        </>
      ) : (
        <p className="kucuk soluk">{denetim.neden}</p>
      )}
      <button
        type="button"
        className="dugme ikincil"
        disabled={!denetim.ok}
        onClick={() => {
          const s = oyun.arac(a.id, k);
          if (s.ok && s.haber) setSonuc(s.haber);
        }}
      >
        Uygula
      </button>
    </article>
  );
}

function SozSatiri({ oyun, d, s }: { oyun: Oyun; d: OyunDurumu; s: Soz }) {
  return (
    <li className="soz">
      <div>
        <b>{s.metin}</b>
        <p className="kucuk soluk">
          {tarihAdi(s.verildi)} · yıllık {tutarYaz(trilyonTL(d, s.maliyet))} · {KALEM[s.kalem]?.ad}
          {s.durum === "bekliyor" && <> · son ay {tarihAdi(s.vade)}</>}
        </p>
      </div>
      {s.durum === "bekliyor" ? (
        <button type="button" className="dugme ikincil" onClick={() => oyun.sozTut(s.id)}>Sözü tut</button>
      ) : s.durum === "tutuldu" ? (
        <Muhur ton="yesil">Tutuldu</Muhur>
      ) : (
        <Muhur>Kırıldı</Muhur>
      )}
    </li>
  );
}

/** Sadık bir kurum başkanının açıklamaları (kara mizah); her ay sıradaki gelir. */
const KURUM_ACIKLAMALARI = [
  "Sepetteki domatesin kalitesi arttığı için fiyatı aslında düştü.",
  "Ekmeğin fiyatı değişmedi; ekmek küçüldü. Gramaj fiyat değildir.",
  "Vatandaşın hissettiği enflasyon, hissetmediği enflasyonla birlikte değerlendirilmelidir.",
  "Kıymadaki artış, kıymanın daha ince çekilmesinden kaynaklanmaktadır.",
  "Kira artışları konut kalitesindeki iyileşmeyi yansıtır; manzara sepete dahil değildir.",
];

function HissedilenEkonomi({ d }: { d: OyunDurumu }) {
  const e = d.ekonomi;
  const once = e.sepetGecmis[0] ?? e.sepet;
  const his = hissedilenEnflasyon(d);
  const h = haneButcesi(d);
  return (
    <section className="hazine-bolum genis-bolum">
      <h4>Hissedilen ekonomi</h4>
      <p className="hissedilen">
        Market sepeti bir yılda <b className="veri">{yuzdeYaz(his)}</b> pahalandı. Resmî enflasyon <b className="veri">{gostergeYaz("enflasyon", d.gostergeler.enflasyon ?? 0)}</b>.
      </p>
      {e.makyaj > 0.05 && (
        <aside className="kulis">
          <span className="ust-etiket">Bağımsız ekonomistlerin hesabı</span>
          <p>Gerçek enflasyon <span className="veri">{yuzdeYaz(e.gercekEnflasyon)}</span>. Kurumun açıklaması: “{KURUM_ACIKLAMALARI[d.ay % KURUM_ACIKLAMALARI.length]}”</p>
        </aside>
      )}
      <div className="hissedilen-izgara">
        <table className="tablo">
          <caption className="ust-etiket">Market sepeti</caption>
          <thead>
            <tr><th scope="col">Ürün</th><th scope="col">Bugün</th><th scope="col">Geçen yıl</th><th scope="col">Değişim</th></tr>
          </thead>
          <tbody>
            {SEPET.map((u) => {
              const b = e.sepet[u.id] ?? u.fiyat, g = once[u.id] ?? u.fiyat;
              return (
                <tr key={u.id}>
                  <th scope="row">{u.ad} <span className="soluk">/ {u.birim}</span></th>
                  <td className="veri">{tlYaz(b)}</td>
                  <td className="veri soluk">{tlYaz(g)}</td>
                  <td className="veri">{yuzdeYaz((b / g - 1) * 100, 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div>
          <p className="ust-etiket">Asgari ücretli bir ailenin ayı</p>
          <dl className="liste-iki hane">
            <div><dt>Asgari ücret</dt><dd className="veri">{tlYaz(h.gelir)}</dd></div>
            <div><dt>Kira</dt><dd className="veri">−{tlYaz(h.kira)}</dd></div>
            <div><dt>Faturalar</dt><dd className="veri">−{tlYaz(h.fatura)}</dd></div>
            <div><dt>Mutfak</dt><dd className="veri">−{tlYaz(h.mutfak)}</dd></div>
            <div className="hane-sonuc">
              <dt>{h.kalan >= 0 ? "Ay sonunda artan" : "Ay sonunda eksik"}</dt>
              <dd className={`veri ${h.kalan >= 0 ? "ifade-iyi" : "ifade-kotu"}`}>{tlYaz(Math.abs(h.kalan))}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export function HazineMasasi({ oyun, d, onKapat }: { oyun: Oyun; d: OyunDurumu; onKapat: () => void }) {
  const e = d.ekonomi;
  const acik = d.gostergeler.butce_acigi ?? 0;
  const bakan = ICERIK.karakterler.hazine;
  const uyarilar = ekonomiUyarilari(d);
  const enBuyuk = Math.max(...Object.values(e.gider), ...Object.values(e.gelir));
  const sozler = [...e.sozler].sort((a, b) => Number(a.durum !== "bekliyor") - Number(b.durum !== "bekliyor") || b.verildi - a.verildi);
  return (
    <Pencere baslik="Hazine masası" onKapat={onKapat} genis>
      <article className="hazine">
        <header className="dosya-ust">
          <span className="etiketler"><Muhur>Hazine masası</Muhur><span className="kategori">{tarihAdi(d.ay)}</span></span>
          <button type="button" className="kapat" onClick={onKapat} aria-label="Hazine masasını kapat">×</button>
        </header>
        <p className="getiren"><KisiRozeti kisi={bakan} boy={36} /> <span><b>{bakan?.ad}</b><br /><span className="soluk">{bakan?.rol}</span></span></p>
        <div>
          <h3 className="dosya-baslik">Bütçe açığı yıllık {tutarYaz(trilyonTL(d, acik))}</h3>
          <p className="soluk">Millî gelire oranı {yuzdeYaz(acik)} · millî gelir yıllık {tutarYaz(e.gsyh)}</p>
        </div>
        {uyarilar.map((u, i) => <p key={i} className="uyari-kutu" role="status">{u}</p>)}

        <dl className="hazine-rakamlar">
          {["enflasyon", "buyume", "issizlik", "kur", "faiz", "guven", "rezerv"].map((id) => (
            <div key={id}><dt>{GOSTERGE[id]?.ad}</dt><dd className="veri">{gostergeYaz(id, d.gostergeler[id] ?? 0)}</dd></div>
          ))}
        </dl>

        <div className="hazine-izgara">
          <KalemListesi d={d} baslik="Giderler" kalemler={GIDER_KALEMLERI} degerler={e.gider} enBuyuk={enBuyuk} />
          <KalemListesi d={d} baslik="Gelirler" kalemler={GELIR_KALEMLERI} degerler={e.gelir} enBuyuk={enBuyuk} />
        </div>
        <p className="kucuk soluk">Giderler {tutarYaz(trilyonTL(d, toplamGider(d)))}, gelirler {tutarYaz(trilyonTL(d, toplamGelir(d)))}. Parantez içindeki fark, kalemin göreve başladığınız günden bu yana millî gelire oranındaki değişimdir.</p>

        <section className="hazine-bolum genis-bolum">
          <h4>Araçlar <span className="soluk kucuk">· her biri ayda bir kez</span></h4>
          <div className="araclar">{ARACLAR.map((a) => <AracKarti key={a.id} oyun={oyun} d={d} a={a} />)}</div>
        </section>

        <section className="hazine-bolum genis-bolum">
          <h4>Söz defteri</h4>
          {sozler.length ? (
            <ul className="sozler">{sozler.map((s) => <SozSatiri key={s.id} oyun={oyun} d={d} s={s} />)}</ul>
          ) : (
            <p className="kucuk soluk">Henüz verilmiş bir söz yok. Kararlarda, mitinglerde ve kuliste verilen sözler maliyetiyle ve son ayıyla burada listelenir; tutulmayan söz sicile geçer.</p>
          )}
        </section>

        <HissedilenEkonomi d={d} />
        <button type="button" className="dugme birincil" onClick={onKapat}>Masaya dön</button>
      </article>
    </Pencere>
  );
}
