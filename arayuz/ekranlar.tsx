// Ekranlar: açılış, masa, karar dosyası ve ay sonu raporu (Ekranlar ve görsel dil belgesi).

import { GundemEkrani, AjandaEkrani, BasinSahnesi, KampanyaEkrani, KampanyaSahnesi, SecimGecesi, SonsOz } from "./yonetim.tsx";
import { AyRaporu } from "./rapor.tsx";
import { GorevNotu } from "./ilk-ay.tsx";
import { Ikon } from "./ikon.tsx";
import { useState } from "react";
import type { OyunDurumu, MasaKarti } from "../cekirdek/durum.ts";
import { tarihAdi, secimeKalanAy, DONEM_AY_SAYISI } from "../cekirdek/takvim.ts";
import { GOSTERGELER, gostergeYaz } from "../cekirdek/gostergeler.ts";
import { kartMetni, tahminEt } from "../cekirdek/karar.ts";
import { etkiIfadesi, type Ifade } from "./bicim.ts";
import { Muhur, KisiRozeti, IfadeListesi, Pencere } from "./bilesenler.tsx";
import { GostergeSeridi, HazineMasasi } from "./hazine.tsx";
import { UlkeEkrani } from "./ulke.tsx";
import { SabahGazeteleri, BesHayatNotu, KapidaBekleyenler, Sokak } from "./toplum.tsx";
import { MeclisEkrani, KulisSahnesi, OylamaSahnesi } from "./meclis.tsx";
import { PolitikaDosyasi } from "./dosyalar.tsx";
import { anketOrtalamasi } from "../cekirdek/kamuoyu.ts";
import { IMZA_HAKKI } from "../cekirdek/politika.ts";
import { yuzdeYaz } from "./bicim.ts";
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
      <div className="baslangic-dosyasi"><p className="ust-etiket">Nermin Aksoy · Görev teslim notu</p><p>“Çoğunluk için ortağınıza, program için Hazineye, uygulama için kurumlara ihtiyacınız var. Herkes önce kendi dosyasını imzalatmak istiyor.”</p><dl className="baslangic-veri"><div><dt>Takvim</dt><dd>18 ay</dd></div><div><dt>Enflasyon</dt><dd>%29</dd></div><div><dt>İktidar</dt><dd>278 / 600</dd></div></dl></div><p className="dipnot">Ülke, kişiler, partiler ve kurumlar kurgusaldır.</p>
    </main>
  );
}

function UstSerit({ d, onHazine }: { d: OyunDurumu; onHazine: () => void }) {
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
        <div><dt>Anket</dt><dd>{(() => { const a = anketOrtalamasi(d); return a === null ? "–" : yuzdeYaz(a); })()}</dd></div>
      </dl>
      <GostergeSeridi d={d} onAc={onHazine} />
    </header>
  );
}

function TurEtiketi({ tur, kategori }: { tur: string; kategori: string }) {
  if (tur === "ana") return <Muhur>Ayın ana kararı</Muhur>;
  if (tur === "acil") return <Muhur>Acil</Muhur>;
  return <span className="kategori">{KATEGORI_AD[kategori]}</span>;
}

function KartSatiri({ m, onAc }: { m: MasaKarti; onAc: () => void }) {
  const t = kartMetni(ICERIK, m);
  const kisi = ICERIK.karakterler[t.kart.getiren];
  return (
    <li>
      <button type="button" className={`dosya-satir${t.kart.tur === "ana" || t.kart.tur === "acil" ? " ana" : ""}`} onClick={onAc}>
        <span className="etiketler">
          <TurEtiketi tur={t.kart.tur} kategori={t.kart.kategori} />
          {m.agir && <Muhur ton="mavi">Ertelendi · ağırlaştı</Muhur>}
        </span>
        <strong>{t.baslik}</strong>
        <span className="getiren"><KisiRozeti kisi={kisi} boy={28} /> {kisi?.ad} · {kisi?.rol}</span>
      </button>
    </li>
  );
}

function UlkeninDurumu({ d, onHazine }: { d: OyunDurumu; onHazine: () => void }) {
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
      <button type="button" className="dugme ikincil tam" onClick={onHazine}>Hazine masasını aç</button>
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
  const [ekran, setEkran] = useState<null | "hazine" | "ulke" | "dosyalar" | "meclis" | "gundem" | "ajanda" | "kampanya">(null);
  const hazineAc = () => setEkran("hazine");
  const kapat = () => setEkran(null);
  const acikKart = acik ? (d.masa.find((m) => m.ornek === acik.ornek) ?? acik) : null;
  const [sayim, setSayim] = useState(0);
  const buAyOylari = oyun.rapor ? d.meclis.sonuclar.filter(s => s.ay === oyun.rapor!.ay) : [];
  const ayBitir = () => { setSayim(0); oyun.ayiBitir(); };
  const kalan = d.masa.length;
  const sonHaberler = d.haberler.slice(0, 5);
  if(d.yonetim.medya.basin) return <BasinSahnesi d={d} oyun={oyun}/>;
  if(d.yonetim.secim.sahne) return <KampanyaSahnesi d={d} oyun={oyun}/>;
  if(!oyun.rapor && d.bitis) return <SonsOz d={d}/>;
  if(!oyun.rapor && d.yonetim.secim.gece) return <SecimGecesi key={d.yonetim.secim.gece.tur} d={d} oyun={oyun}/>;
  return (
    <div className="uygulama">
      <UstSerit d={d} onHazine={hazineAc} />
      <main className="masa">
        <section aria-labelledby="masa-baslik" className="kararlar">
          <GorevNotu d={d} oyun={oyun}/><SabahGazeteleri d={d} />
          <p className="ust-etiket">Masa · {tarihAdi(d.ay)} · {d.ay}. ay / {DONEM_AY_SAYISI}</p>
          <button type="button" className="meclis-kapi dugme ikincil" onClick={() => setEkran("meclis")}><span>Meclis ve kulis</span><span className="kucuk">{d.meclis.oylamalar.length ? `${d.meclis.oylamalar.length} teklif oylama bekliyor` : "Grup başkanvekilinin notları"}</span></button>
          <div className="masa-eylemler"><button className="dugme ikincil" onClick={()=>setEkran("ajanda")}><Ikon ad="takvim"/>Ajandayı aç · {d.bosGun} gün</button><button className="dugme ikincil" onClick={()=>setEkran("gundem")}><Ikon ad="gazete"/>Gündemi takip et</button>{d.ay>=16&&<button className="dugme birincil" onClick={()=>setEkran("kampanya")}>Kampanya karargâhı</button>}</div>
          <h2 id="masa-baslik">{kalan ? `Masada ${kalan} karar bekliyor` : "Masa temiz"}</h2>
          {kalan ? (
            <ul className="dosyalar">{d.masa.map((m) => <KartSatiri key={m.ornek} m={m} onAc={() => setAcik(m)} />)}</ul>
          ) : (
            <p className="soluk">Bu ayın bütün kararları verildi. Ayı bitirdiğinizde ay sonu raporu gelir.</p>
          )}
          {oyun.mesaj && <p className="uyari" role="status">{oyun.mesaj}</p>}
        </section>
        <aside className="yan">
          <Sokak oyun={oyun} d={d} />
          <KapidaBekleyenler oyun={oyun} d={d} />
          <BesHayatNotu d={d} />
          <section className="kutu" aria-label="Son haberler">
            <h2 className="kutu-baslik">Son haberler</h2>
            {sonHaberler.length ? (
              <ul className="haberler">{sonHaberler.map((h, i) => <li key={i}><span className="veri soluk">{tarihAdi(h.ay)}</span> {h.metin}</li>)}</ul>
            ) : <p className="soluk kucuk">Henüz bir karar verilmedi.</p>}
          </section>
          <UlkeninDurumu d={d} onHazine={hazineAc} />
        </aside>
      </main>
      <footer className="alt">
        <nav className="altmenu" aria-label="Bölümler">
          <button type="button" aria-current={ekran === null ? "page" : undefined} onClick={kapat}>Masa{kalan ? <i>{kalan}</i> : null}</button>
          <button type="button" aria-current={ekran === "ulke" ? "page" : undefined} onClick={() => setEkran("ulke")}><Ikon ad="harita"/>Ülke</button>
          <button type="button" aria-current={ekran === "hazine" ? "page" : undefined} onClick={hazineAc}><Ikon ad="hazine"/>Hazine</button>
          <button type="button" aria-current={ekran === "dosyalar" ? "page" : undefined} onClick={() => setEkran("dosyalar")}>
            Dosyalar{IMZA_HAKKI - d.imza > 0 ? <i>{IMZA_HAKKI - d.imza}</i> : null}
          </button>
        </nav>
        <button type="button" className="dugme birincil ayibitir" onClick={ayBitir} disabled={kalan > 0} aria-describedby="masa-baslik">
          {kalan ? `${kalan} karar bekliyor` : `Ayı bitir`}
        </button>
      </footer>
      {acikKart && <KararDosyasi oyun={oyun} d={d} m={acikKart} onKapat={() => setAcik(null)} />}
      {ekran === "hazine" && !acikKart && !oyun.rapor && <HazineMasasi oyun={oyun} d={d} onKapat={kapat} />}
      {ekran === "ulke" && !acikKart && !oyun.rapor && <UlkeEkrani d={d} onKapat={kapat} />}
      {ekran === "dosyalar" && !acikKart && !oyun.rapor && !d.meclis.kulis && <PolitikaDosyasi oyun={oyun} d={d} onKapat={kapat} onMeclis={() => setEkran("meclis")} />}
      {ekran === "meclis" && !acikKart && !oyun.rapor && !d.meclis.kulis && <MeclisEkrani oyun={oyun} d={d} onKapat={kapat} onDosyalar={() => setEkran("dosyalar")} />}
      {ekran === "gundem" && !acikKart && !oyun.rapor && <GundemEkrani d={d} oyun={oyun} onKapat={kapat}/>}
      {ekran === "ajanda" && !acikKart && !oyun.rapor && <AjandaEkrani d={d} oyun={oyun} onKapat={kapat}/>}
      {ekran === "kampanya" && !acikKart && !oyun.rapor && <KampanyaEkrani d={d} oyun={oyun} onKapat={kapat}/>}
      {d.meclis.kulis && <KulisSahnesi oyun={oyun} d={d} />}
      {oyun.rapor && sayim < buAyOylari.length && <OylamaSahnesi key={buAyOylari[sayim]!.id} sonuc={buAyOylari[sayim]!} onKapat={() => setSayim(n => n + 1)} />}
      {oyun.rapor && sayim >= buAyOylari.length && <AyRaporu rapor={oyun.rapor} d={d} onKapat={oyun.raporKapat} />}
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
        {m.kart==="ifsa_yanit"&&d.yonetim.ifsa&&<aside className="ihanet"><Muhur>Sızan belge</Muhur><p>{d.yonetim.ifsa.kaynak}</p></aside>}
        <header className="dosya-ust">
          <span className="etiketler">
            <TurEtiketi tur={t.kart.tur} kategori={t.kart.kategori} />
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
