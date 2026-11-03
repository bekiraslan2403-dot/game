// Masadaki toplum kutuları: sabah gazeteleri, beş hayat, kapıda bekleyenler, sokak eylemleri.

import type { OyunDurumu, MasaKarti } from "../cekirdek/durum.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { GOSTERGE } from "../cekirdek/gostergeler.ts";
import { ruhHali, ruhSozu, eylemTanimi } from "../cekirdek/toplum.ts";
import { ziyaretSonucu, kabulTakvimiDolu } from "../cekirdek/ziyaret.ts";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

const RUH_SINIF: Record<string, string> = { umutlu: "iyi", "idare ediyor": "orta", bunalmış: "kotu", öfkeli: "cokkotu" };

export function SabahGazeteleri({ d }: { d: OyunDurumu }) {
  const g = d.toplum.gazete;
  if (!g) return null;
  return (
    <section className="gazeteler" aria-label="Sabah gazeteleri">
      <p className="ust-etiket">Sabah gazeteleri · {tarihAdi(g.ay)} kararının ardından</p>
      <div className="gz-l">
        {g.mansetler.map((m, i) => (
          <article key={i} className={`gz gz-${i}`}>
            <span className="gz-ad">{m.gazete}</span>
            <b>{m.baslik}</b>
            <span className="gz-alt">{g.olay}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function bas(ad: string) {
  return ad.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2);
}

export function BesHayatNotu({ d }: { d: OyunDurumu }) {
  const son = d.gecmis.at(-1)?.hayatlar ?? [];
  if (!son.length) return null;
  return (
    <section className="kutu" aria-label="Beş hayattan">
      <h2 className="kutu-baslik">Beş hayattan</h2>
      <ul className="hayat-not">
        {son.map((h, i) => (
          <li key={i} className={`ton-${h.ton > 0 ? "iyi" : h.ton < 0 ? "kotu" : "notr"}`}>
            <b>{h.kim}</b>
            <p>{h.metin}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KapidaBekleyenler({ oyun, d, onAc }: { oyun: Oyun; d: OyunDurumu; onAc: (m: MasaKarti) => void }) {
  if (!d.toplum.kapi.length) return null;
  return (
    <section className="kutu" aria-label="Kapıda bekleyenler">
      <h2 className="kutu-baslik">Kabul salonu</h2>
      <p className="kucuk soluk">Görüşme için takviminden bir gün ayırırsın. Heyetin talebine içeride yanıt verirsin.</p>
      <ul className="kapi">
        {d.toplum.kapi.map((k) => {
          const z = ICERIK.toplum.ziyaretciler.find((x) => x.id === k.id);
          if (!z) return null;
          const acik = d.masa.find(m => m.kart === z.gorusme);
          const sonuc = ziyaretSonucu(d, ICERIK, z.id);
          return (
            <li key={k.id}>
              <div>
                <b>{z.kim}</b>
                <p className="kucuk soluk">{z.konu}</p>
                {sonuc && <p className="kucuk kapi-yanit"><b>Yanıtın</b> {sonuc.yanit}</p>}
              </div>
              {k.durum === "kabul" ? (
                acik ? <button type="button" className="dugme ikincil kucuk-dugme" onClick={() => onAc(acik)}>Görüşmeye dön</button> : <span className="kucuk soluk">{sonuc ? "Yanıt verildi · takip dosyası gelecek" : "Önceki sürümde kabul edildi"}</span>
              ) : (
                <button type="button" className="dugme ikincil kucuk-dugme" disabled={d.bosGun <= 0 || kabulTakvimiDolu(d)} onClick={() => { const r = oyun.ziyaretci(k.id); if (r.ok && r.ornek && z.gorusme) onAc({ ornek: r.ornek, kart: z.gorusme, degisken: {}, agir: false, ikinciGorus: false }); }}>Görüşmeyi aç · 1 gün</button>
              )}
            </li>
          );
        })}
      </ul>
      {d.toplum.kapi.some(k => k.durum === "bekliyor") && (kabulTakvimiDolu(d) || d.bosGun <= 0) && <p className="kucuk uyari">{kabulTakvimiDolu(d) ? "Bu ayın karar takvimi dolu; yeni kabul için yer kalmadı." : "Bu ay görüşme için boş gün kalmadı."}</p>}
      <p className="kucuk soluk">Bu ay zaman ayıramadığın heyetler talebini kamuoyuna taşıyabilir.</p>
    </section>
  );
}

export function Sokak({ oyun, d }: { oyun: Oyun; d: OyunDurumu }) {
  if (!d.toplum.eylemler.length) return null;
  return (
    <section className="kutu sokak" aria-label="Sokak">
      <h2 className="kutu-baslik">Sokak · {d.toplum.eylemler.length} eylem sürüyor</h2>
      <ul className="eylemler">
        {d.toplum.eylemler.map((e) => {
          const t = eylemTanimi(ICERIK, e.grup);
          return (
            <li key={e.id} className="eylem">
              <b>{t?.ad ?? "Eylem"} · {e.il}</b>
              <p className="kucuk">Talep: {t?.talep}. {GOSTERGE[e.grup]?.ad} öfkeli.</p>
              <p className="kucuk soluk veri">Emniyete göre {e.emniyet.toLocaleString("tr-TR")} · düzenleyicilere göre {e.duzenleyici.toLocaleString("tr-TR")} kişi</p>
              <div className="eylem-dugmeler">
                <button type="button" className="dugme ikincil kucuk-dugme" disabled={e.dinlendi || d.bosGun <= 0} onClick={() => oyun.eylem(e.id, "dinle")}>
                  {e.dinlendi ? "Temsilciler dinlendi" : "Temsilcileri dinle (1 gün)"}
                </button>
                <button type="button" className="dugme ikincil kucuk-dugme" onClick={() => oyun.eylem(e.id, "karsila")}>Talebi karşıla</button>
                <button type="button" className="dugme ikincil kucuk-dugme tehlike" onClick={() => oyun.eylem(e.id, "polis")}>Polisi gönder</button>
              </div>
              <p className="kucuk soluk">Görmezden gelinirse eylem büyür; polis müdahalesinin bedeli kalıcıdır.</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Ülke ekranındaki beş hayat bölümü. */
export function BesHayat({ d }: { d: OyunDurumu }) {
  return (
    <section className="hazine-bolum genis-bolum">
      <h4>Beş hayat</h4>
      <ul className="hayatlar">
        {ICERIK.hayatlar.map((h) => {
          const s = d.toplum.hayatlar[h.id];
          const r = ruhSozu(ruhHali(d, h));
          return (
            <li key={h.id} className={`hayat${s?.ayrildi ? " gitti" : ""}`}>
              <span className="hayat-rozet" aria-hidden="true">{bas(h.ad)}</span>
              <div>
                <b>{h.ad}, {h.yas}</b> <span className="soluk kucuk">{h.meslek} · {h.sehir}</span>
                <span className={`ruh ruh-${s?.ayrildi ? "notr" : RUH_SINIF[r]}`}>{s?.ayrildi ? "ayrıldı" : r}</span>
                <p className="kucuk">{s?.son[0]?.metin ?? "Henüz anlatacak bir şey yok."}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
