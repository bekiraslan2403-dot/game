import { useState } from "react";
import type { OyunDurumu } from "../cekirdek/durum.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { Muhur, Pencere } from "./bilesenler.tsx";
import { RaporIcerigi } from "./rapor.tsx";

export function KararArsivi({ d, onKapat }: { d: OyunDurumu; onKapat: () => void }) {
  const [ay, setAy] = useState(d.gecmis.at(-1)?.ay ?? d.ay);
  const [arama, setArama] = useState("");
  const aylar = [...d.gecmis];
  // Seçim ayı/erken bitişte buAy zaten geçmişe yazılmış olabilir.
  if (!aylar.some(r => r.ay === d.buAy.ay)) aylar.push(d.buAy);
  aylar.sort((a, b) => b.ay - a.ay);
  const rapor = aylar.find(r => r.ay === ay) ?? aylar[0]!;
  const tamamlandi = d.gecmis.some(r => r.ay === rapor.ay);
  const sorgu = arama.trim().toLocaleLowerCase("tr-TR");
  const kararlar = aylar.flatMap(r => r.kararlar.map(k => ({ ...k, ay: r.ay })));
  const bulunan = kararlar.filter(k => `${k.baslik} ${k.secenekMetni}`.toLocaleLowerCase("tr-TR").includes(sorgu));

  return <Pencere baslik="Karar ve rapor arşivi" onKapat={onKapat} genis>
    <article className="tam-ekran arsiv">
      <header className="dosya-ust">
        <div><Muhur ton="mavi">Özel Kalem · Dönem arşivi</Muhur><h3 className="dosya-baslik">Karar ve rapor arşivi</h3></div>
        <button className="kapat" onClick={onKapat} aria-label="Arşivi kapat">×</button>
      </header>
      <p className="soluk">{d.gecmis.length} tamamlanan ay · {kararlar.length} karar. Eski dosyalar ve raporlar burada saklanır.</p>
      <div className="iki-sutun arsiv-araclar">
        <label className="alan">Ay seç<select aria-label="Ay seç" value={ay} onChange={(e: { target: { value: string } }) => { setAy(Number(e.target.value)); setArama(""); }}>
          {aylar.map(r => <option key={r.ay} value={r.ay}>{tarihAdi(r.ay)}{d.gecmis.some(g => g.ay === r.ay) ? " · Ay sonu raporu" : " · Devam eden ay"}</option>)}
        </select></label>
        <label className="alan">Bütün kararlarda ara<input type="search" value={arama} placeholder="Dosya adı veya verdiğiniz karar" onChange={(e: { target: { value: string } }) => setArama(e.target.value)} /></label>
      </div>
      {sorgu ? <section className="arsiv-sonuclar" aria-live="polite">
        <h4>{bulunan.length} karar bulundu</h4>
        <ul className="kararlar-listesi">{bulunan.map((k, i) => <li key={`${k.ay}-${i}`}><span className="ust-etiket">{tarihAdi(k.ay)}</span><b>{k.baslik}</b><span>{k.secenekMetni}</span></li>)}</ul>
        {!bulunan.length && <p className="soluk">Bu ifadeyle eşleşen bir karar yok.</p>}
      </section> : tamamlandi ? <section className="rapor arsiv-rapor"><RaporIcerigi rapor={rapor} /></section> : <section>
        <p className="ust-etiket">{tarihAdi(rapor.ay)} · Devam eden ay</p>
        <p className="soluk">Ay bitince sonuç raporu buraya eklenecek.</p>
        {rapor.kararlar.length ? <ul className="kararlar-listesi">{rapor.kararlar.map((k, i) => <li key={i}><b>{k.baslik}</b><span>{k.secenekMetni}</span></li>)}</ul> : <p>Henüz karar verilmedi.</p>}
      </section>}
      <button className="dugme birincil" onClick={onKapat}>Menüye dön</button>
    </article>
  </Pencere>;
}
