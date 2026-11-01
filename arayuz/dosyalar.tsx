// Politika dosyası: kademeli politikalar ve yönetmelikler (Uygulama planı · Kapsam genişlemesi).

import { useState } from "react";
import type { OyunDurumu } from "../cekirdek/durum.ts";
import { POLITIKA_BOLUMLERI, BOLUM_AD, type Politika } from "../cekirdek/icerik.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { IMZA_HAKKI, seviye, bekleyenTeklif, meclisDestegi, politikaTahmini, vatandasSesi } from "../cekirdek/politika.ts";
import { trilyonTL } from "../cekirdek/ekonomi.ts";
import { etkiIfadesi, tutarYaz } from "./bicim.ts";
import { Muhur, KisiRozeti, IfadeListesi, Pencere } from "./bilesenler.tsx";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

function destekSozu(p: number): string {
  if (p >= 0.75) return "yüksek";
  if (p >= 0.55) return "orta";
  return "düşük";
}

function AdimDugmesi({ oyun, d, p, hedef, yon }: { oyun: Oyun; d: OyunDurumu; p: Politika; hedef: number; yon: "geri" | "ileri" }) {
  const tahmin = politikaTahmini(d, p, hedef).sort((a, b) => Math.abs(b.deger) - Math.abs(a.deger)).slice(0, 5);
  const butce = tahmin.find((t) => t.id === "butce_acigi");
  const kapali = d.imza >= IMZA_HAKKI || !!bekleyenTeklif(d, p.id);
  return (
    <button type="button" className={`pol-adim ${yon}`} disabled={kapali} onClick={() => oyun.politika(p.id, hedef)}>
      <span className="pol-hedef">{yon === "geri" ? "◀ " : ""}{p.kademeler[hedef]}{yon === "ileri" ? " ▶" : ""}</span>
      <IfadeListesi ifadeler={tahmin.map((t) => etkiIfadesi(t.id, t.deger))} />
      {butce && <span className="kucuk soluk">Yıllık {tutarYaz(trilyonTL(d, Math.abs(butce.deger)))} {butce.deger > 0 ? "ek yük" : "kazanç"}</span>}
    </button>
  );
}

function PolitikaSatiri({ oyun, d, p, ses }: { oyun: Oyun; d: OyunDurumu; p: Politika; ses: string | null }) {
  const sev = seviye(d, p);
  const teklif = bekleyenTeklif(d, p.id);
  const kisi = ICERIK.karakterler[p.getiren];
  return (
    <li className="politika">
      <div className="pol-ust">
        <b>{p.ad}</b>
        <span className={`yol yol-${p.yol}`}>{p.yol === "kanun" ? "Kanun · Meclis" : "Kararname"}</span>
      </div>
      <p className="kucuk soluk">{p.aciklama}</p>
      <div className="kademe-satir">
        <span className="kademe" aria-hidden="true">{p.kademeler.map((_, i) => <i key={i} className={i <= sev ? "dolu" : ""} />)}</span>
        <span><span className="gizli-baslik">Şu anki kademe {sev + 1} / {p.kademeler.length}: </span>{p.kademeler[sev]}</span>
      </div>
      {teklif && (
        <p className="teklif">
          Meclis'te: “{p.kademeler[teklif.hedef]}” · ay sonunda oylanacak
          <button type="button" className="dugme ikincil kucuk-dugme" onClick={() => oyun.teklifiGeriCek(p.id)}>Geri çek</button>
        </p>
      )}
      <div className="pol-dugmeler">
        {sev > 0 && <AdimDugmesi oyun={oyun} d={d} p={p} hedef={sev - 1} yon="geri" />}
        {sev < p.kademeler.length - 1 && <AdimDugmesi oyun={oyun} d={d} p={p} hedef={sev + 1} yon="ileri" />}
      </div>
      {ses && <blockquote className="ses">“{ses}” <span className="soluk kucuk">— bir vatandaş</span></blockquote>}
      <p className="kucuk soluk"><KisiRozeti kisi={kisi} boy={20} /> {kisi?.ad}, {kisi?.rol}</p>
    </li>
  );
}

export function PolitikaDosyasi({ oyun, d, onKapat }: { oyun: Oyun; d: OyunDurumu; onKapat: () => void }) {
  const [sesler, setSesler] = useState<Record<string, string>>({});
  const tumu = Object.values(ICERIK.politikalar);
  const kalan = IMZA_HAKKI - d.imza;
  const destek = meclisDestegi(d);
  const sar: Oyun = {
    ...oyun,
    politika: (id: string, hedef: number) => {
      const p = ICERIK.politikalar[id];
      const once = p ? seviye(d, p) : 0;
      const s = oyun.politika(id, hedef);
      if (s.ok && p) setSesler((x) => ({ ...x, [id]: vatandasSesi(d, p, hedef > once) }));
      return s;
    },
  };
  return (
    <Pencere baslik="Politika dosyası" onKapat={onKapat} genis>
      <article className="hazine pol-dosya">
        <header className="dosya-ust">
          <span className="etiketler"><Muhur>Politika dosyası</Muhur><span className="kategori">{tarihAdi(d.ay)}</span></span>
          <button type="button" className="kapat" onClick={onKapat} aria-label="Politika dosyasını kapat">×</button>
        </header>
        <div>
          <h3 className="dosya-baslik">{kalan > 0 ? `Bu ay ${kalan} imza hakkınız var` : "Bu ayın imzaları kullanıldı"}</h3>
          <p className="soluk">
            Kararname hemen yürürlüğe girer. Kanun teklifi ay sonunda Meclis'te oylanır; bugün geçme olasılığı {destekSozu(destek)} (%{Math.round(destek * 100)}). Temel hakları kısıtlayan tekliflerde olasılık düşer.
          </p>
        </div>
        {d.meclisGundemi.length > 0 && (
          <p className="uyari-kutu">Meclis gündeminde {d.meclisGundemi.length} kanun teklifi var; ay sonunda oylanacak.</p>
        )}
        {POLITIKA_BOLUMLERI.map((b, i) => {
          const liste = tumu.filter((p) => p.bolum === b);
          if (!liste.length) return null;
          const degisen = liste.filter((p) => seviye(d, p) !== p.baslangic).length;
          return (
            <details key={b} className="pol-bolum" open={i === 0}>
              <summary>
                <span>{BOLUM_AD[b]}</span>
                <span className="soluk kucuk">{liste.length} ayar{degisen ? ` · ${degisen} değişti` : ""}</span>
              </summary>
              <ul className="politikalar">{liste.map((p) => <PolitikaSatiri key={p.id} oyun={sar} d={d} p={p} ses={sesler[p.id] ?? null} />)}</ul>
            </details>
          );
        })}
        <div className="dosya-alt">
          <button type="button" className="dugme birincil" onClick={onKapat}>Masaya dön</button>
          <button type="button" className="dugme ikincil" onClick={oyun.birak}>Oyunu bırak, yeni oyun</button>
        </div>
      </article>
    </Pencere>
  );
}
