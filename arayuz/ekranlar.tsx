// Ekranlar: açılış, masa, karar dosyası ve ay sonu raporu (Ekranlar ve görsel dil belgesi).

import { useState } from "react";
import type { OyunDurumu, AyKaydi, MasaKarti } from "../cekirdek/durum.ts";
import { tarihAdi, secimeKalanAy, DONEM_AY_SAYISI } from "../cekirdek/takvim.ts";
import { GOSTERGELER, gostergeYaz, GOSTERGE } from "../cekirdek/gostergeler.ts";
import { kartMetni, tahminEt } from "../cekirdek/karar.ts";
import { etkiIfadesi, degisimIfadesi, type Ifade } from "./bicim.ts";
import { Muhur, KisiRozeti, IfadeListesi, Pencere } from "./bilesenler.tsx";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

const KATEGORI_AD: Record<string, string> = {
  ekonomi: "Ekonomi", yerel: "Yerel yönetim", toplum: "Toplum", guvenlik: "Güvenlik", dis: "Dış politika", hukuk: "Hukuk",
  medya: "Medya", parti: "Parti", aile: "Aile", afet: "Afet", saglik: "Sağlık", egitim: "Eğitim",
};

const TUTUM_SINIF: Record<string, string> = { öfkeli: "ofkeli", kırgın: "kirgin", kararsız: "kararsiz", memnun: "memnun", coşkulu: "coskulu" };

export function Acilis({ onYeni }: { onYeni: () => void }) {
  return (
    <main className="acilis">
      <Muhur>Gizli · Yalnız Cumhurbaşkanı okuyacak</Muhur>
      <h1>Akköprü 2026</h1>
      <p>Doruk Cumhuriyeti'nin cumhurbaşkanısınız. Seçime 18 ay var; ekonomi sıkıntıda, sokak gergin, partiniz huzursuz.</p>
      <button type="button" className="dugme birincil buyuk" onClick={onYeni}>Göreve başla</button>
      <p className="dipnot">Ülke, kişiler, partiler ve kurumlar kurgusaldır.</p>
    </main>
  );
}

function UstSerit({ d }: { d: OyunDurumu }) {
  const ekonomi = ["enflasyon", "kur", "issizlik"];
  return (
    <header className="ust">
      <div className="marka">
        <h1>Akköprü 2026</h1>
        <Muhur>Cumhurbaşkanlığı masası</Muhur>
      </div>
      <dl className="serit">
        <div><dt>Tarih</dt><dd>{tarihAdi(d.ay)}</dd></div>
        <div><dt>Seçime</dt><dd>{secimeKalanAy(d.ay)} ay</dd></div>
        <div><dt>Takvim</dt><dd>{d.bosGun} boş gün</dd></div>
        {ekonomi.map((id) => (
          <div key={id}><dt>{GOSTERGE[id]?.ad}</dt><dd>{gostergeYaz(id, d.gostergeler[id] ?? 0)}</dd></div>
        ))}
      </dl>
    </header>
  );
}

function KartSatiri({ m, onAc }: { m: MasaKarti; onAc: () => void }) {
  const t = kartMetni(ICERIK, m);
  const kisi = ICERIK.karakterler[t.kart.getiren];
  return (
    <li>
      <button type="button" className={`dosya-satir${t.kart.tur === "ana" ? " ana" : ""}`} onClick={onAc}>
        <span className="etiketler">
          {t.kart.tur === "ana" ? <Muhur>Ayın ana kararı</Muhur> : <span className="kategori">{KATEGORI_AD[t.kart.kategori]}</span>}
          {m.agir && <Muhur ton="mavi">Ertelendi · ağırlaştı</Muhur>}
        </span>
        <strong>{t.baslik}</strong>
        <span className="getiren"><KisiRozeti kisi={kisi} boy={28} /> {kisi?.ad} · {kisi?.rol}</span>
      </button>
    </li>
  );
}

function UlkeninDurumu({ d }: { d: OyunDurumu }) {
  const ekonomi = GOSTERGELER.filter((g) => g.alan === "ekonomi");
  const gruplar = GOSTERGELER.filter((g) => g.alan === "secmen").sort((a, b) => (d.gostergeler[a.id] ?? 0) - (d.gostergeler[b.id] ?? 0));
  return (
    <section className="kutu" aria-label="Ülkenin durumu">
      <h2 className="kutu-baslik">Ülkenin durumu</h2>
      <dl className="liste-iki">
        {ekonomi.map((g) => (
          <div key={g.id}><dt>{g.ad}</dt><dd className="veri">{gostergeYaz(g.id, d.gostergeler[g.id] ?? g.baslangic)}</dd></div>
        ))}
      </dl>
      <h3 className="ara-baslik">Seçmen grupları</h3>
      <dl className="liste-iki">
        {gruplar.map((g) => {
          const v = d.gostergeler[g.id] ?? g.baslangic;
          const soz = gostergeYaz(g.id, v);
          return <div key={g.id}><dt>{g.ad}</dt><dd className={`tutum tutum-${TUTUM_SINIF[soz] ?? "kararsiz"}`}>{soz}</dd></div>;
        })}
      </dl>
    </section>
  );
}

export function Masa({ oyun, d }: { oyun: Oyun; d: OyunDurumu }) {
  // Açık dosya, karar verilip masadan kalktıktan sonra da sonuç ekranı için görünür kalır
  const [acik, setAcik] = useState<MasaKarti | null>(null);
  const acikKart = acik ? (d.masa.find((m) => m.ornek === acik.ornek) ?? acik) : null;
  const kalan = d.masa.length;
  const sonHaberler = d.haberler.slice(0, 5);
  return (
    <div className="uygulama">
      <UstSerit d={d} />
      <main className="masa">
        <section aria-labelledby="masa-baslik" className="kararlar">
          <p className="ust-etiket">Masa · {tarihAdi(d.ay)} · {d.ay}. ay / {DONEM_AY_SAYISI}</p>
          <h2 id="masa-baslik">{kalan ? `Masada ${kalan} karar bekliyor` : "Masa temiz"}</h2>
          {kalan ? (
            <ul className="dosyalar">{d.masa.map((m) => <KartSatiri key={m.ornek} m={m} onAc={() => setAcik(m)} />)}</ul>
          ) : (
            <p className="soluk">Bu ayın bütün kararları verildi. Ayı bitirdiğinizde ay sonu raporu gelir.</p>
          )}
          {oyun.mesaj && <p className="uyari" role="status">{oyun.mesaj}</p>}
        </section>
        <aside className="yan">
          <section className="kutu" aria-label="Son haberler">
            <h2 className="kutu-baslik">Son haberler</h2>
            {sonHaberler.length ? (
              <ul className="haberler">{sonHaberler.map((h, i) => <li key={i}><span className="veri soluk">{tarihAdi(h.ay)}</span> {h.metin}</li>)}</ul>
            ) : <p className="soluk kucuk">Henüz bir karar verilmedi.</p>}
          </section>
          <UlkeninDurumu d={d} />
        </aside>
      </main>
      <footer className="alt">
        <button type="button" className="dugme ikincil" onClick={oyun.birak}>Yeni oyun</button>
        <button type="button" className="dugme birincil" onClick={oyun.ayiBitir} disabled={kalan > 0} aria-describedby="masa-baslik">
          {kalan ? `${kalan} karar bekliyor` : `Ayı bitir`}
        </button>
      </footer>
      {acikKart && <KararDosyasi oyun={oyun} d={d} m={acikKart} onKapat={() => setAcik(null)} />}
      {oyun.rapor && <AyRaporu rapor={oyun.rapor} d={d} onKapat={oyun.raporKapat} />}
    </div>
  );
}

function KararDosyasi({ oyun, d, m, onKapat }: { oyun: Oyun; d: OyunDurumu; m: MasaKarti; onKapat: () => void }) {
  const [sonuc, setSonuc] = useState<{ secenek: string; haber?: string } | null>(null);
  const t = kartMetni(ICERIK, m);
  const kisi = ICERIK.karakterler[t.kart.getiren];
  const ertelenebilir = t.kart.tur === "masa" && !m.agir && !d.ertelemeKullanildi;

  if (sonuc) {
    return (
      <Pencere baslik={t.baslik} onKapat={onKapat}>
        <div className="sonuc">
          <Muhur ton="yesil">Onaylandı</Muhur>
          <p className="ust-etiket">Kararınız</p>
          <p className="sonuc-secim">{sonuc.secenek}</p>
          {sonuc.haber && <blockquote className="haber-alinti">{sonuc.haber}</blockquote>}
          <button type="button" className="dugme birincil" onClick={onKapat} autoFocus>Masaya dön</button>
        </div>
      </Pencere>
    );
  }

  return (
    <Pencere baslik={t.baslik} onKapat={onKapat}>
      <article className="karar-dosyasi">
        <header className="dosya-ust">
          <span className="etiketler">
            {t.kart.tur === "ana" ? <Muhur>Ayın ana kararı</Muhur> : <span className="kategori">{KATEGORI_AD[t.kart.kategori]}</span>}
            {m.agir && <Muhur ton="mavi">Ertelendi · etkileri ağır</Muhur>}
          </span>
          <button type="button" className="kapat" onClick={onKapat} aria-label="Dosyayı kapat">×</button>
        </header>
        <p className="getiren"><KisiRozeti kisi={kisi} boy={36} /> <span><b>{kisi?.ad}</b><br /><span className="soluk">{kisi?.rol}</span></span></p>
        <h3 className="dosya-baslik">{t.baslik}</h3>
        <p className="dosya-durum">{t.durum}</p>
        {t.kulis && <aside className="kulis"><span className="ust-etiket">Kulis notu</span><p>{t.kulis}</p></aside>}
        <p className="ust-etiket secenek-baslik">
          Seçenekler · {m.ikinciGorus ? "iki danışmanın ortak tahmini" : "danışman tahmini, yanılabilir"}
        </p>
        <ol className="secenekler">
          {t.secenekler.map((metin, i) => {
            const ifadeler: Ifade[] = tahminEt(d, ICERIK, m.ornek, i)
              .sort((a, b) => Math.abs(b.deger) - Math.abs(a.deger))
              .map((x) => etkiIfadesi(x.id, x.deger));
            return (
              <li key={i}>
                <button
                  type="button"
                  className="secenek"
                  onClick={() => {
                    const s = oyun.karar(m.ornek, i);
                    if (s.ok) setSonuc(s.haber ? { secenek: metin, haber: s.haber } : { secenek: metin });
                  }}
                >
                  <span className="secenek-metin">{metin}</span>
                  <IfadeListesi ifadeler={ifadeler} bos="Danışman belirgin bir etki öngörmüyor." />
                </button>
              </li>
            );
          })}
        </ol>
        <footer className="dosya-alt">
          <button type="button" className="dugme ikincil" disabled={m.ikinciGorus || d.bosGun <= 0} onClick={() => oyun.ikinciGorus(m.ornek)}>
            {m.ikinciGorus ? "İkinci görüş alındı" : `İkinci görüş al (1 gün · ${d.bosGun} boş)`}
          </button>
          {t.kart.tur === "masa" && (
            <button type="button" className="dugme ikincil" disabled={!ertelenebilir} onClick={() => { if (oyun.ertele(m.ornek).ok) onKapat(); }}>
              {d.ertelemeKullanildi ? "Bu ay erteleme hakkı kullanıldı" : m.agir ? "Bir kez ertelendi" : "Ertesi aya ertele"}
            </button>
          )}
        </footer>
      </article>
    </Pencere>
  );
}

function AyRaporu({ rapor, d, onKapat }: { rapor: AyKaydi; d: OyunDurumu; onKapat: () => void }) {
  const ifade = (alan: string) =>
    rapor.degisim
      .filter((x) => GOSTERGE[x.id]?.alan === alan)
      .map((x) => degisimIfadesi(x.id, x.once, x.sonra))
      .filter((x): x is Ifade => x !== null);
  return (
    <Pencere baslik={`${tarihAdi(rapor.ay)} raporu`} onKapat={onKapat} genis>
      <article className="rapor">
        <p className="ust-etiket">Ay sonu raporu · Özel Kalem</p>
        <h3 className="dosya-baslik">{tarihAdi(rapor.ay)}</h3>
        <div className="rapor-izgara">
          <section>
            <h4>Verdiğiniz kararlar</h4>
            <ul className="kararlar-listesi">
              {rapor.kararlar.map((k, i) => <li key={i}><b>{k.baslik}</b><span>{k.secenekMetni}</span></li>)}
            </ul>
            {rapor.ertelenen.length > 0 && <p className="soluk kucuk">Ertelenen: {rapor.ertelenen.join(", ")}</p>}
          </section>
          <section>
            <h4>Ekonomi</h4>
            <IfadeListesi ifadeler={ifade("ekonomi")} bos="Ekonomide belirgin bir değişim olmadı." />
            <h4>Kamuoyu</h4>
            <IfadeListesi ifadeler={[...ifade("secmen"), ...ifade("siyaset")]} bos="Kamuoyunda belirgin bir değişim olmadı." />
          </section>
        </div>
        <button type="button" className="dugme birincil" onClick={onKapat}>{tarihAdi(d.ay)} masasına geç</button>
      </article>
    </Pencere>
  );
}
