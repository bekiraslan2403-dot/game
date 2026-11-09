import { IncelemeGiris, IncelemeIzleme } from "./inceleme.tsx";
import { SantiyeIzleme } from "./santiye.tsx";
import { santiyeEngeli } from "../cekirdek/santiye.ts";
import { HesaplasmaIzleme } from "./hesaplasma.tsx";
import { HafizaIzleme } from "./hafiza.tsx";
import { BelediyeIzleme } from "./belediye.tsx";
import { IsinmaIzleme } from "./isinma.tsx";
import { isinmaKarti, isinmaEngeli } from "../cekirdek/isinma.ts";
import { hafizaEngeli } from "../cekirdek/hafiza.ts";
import { hesaplasmaEngeli } from "../cekirdek/hesaplasma.ts";
import { AcilisIzleme } from "./acilis.tsx";
import { icraEngeli } from "../cekirdek/icra.ts";
import { kosulSaglaniyor } from "../cekirdek/kosul.ts";
import { sahaKararBilgisi } from "../cekirdek/saha.ts";
import { SahaIzleme } from "./saha.tsx";
// Ekranlar: açılış, masa, karar dosyası ve ay sonu raporu (Ekranlar ve görsel dil belgesi).

import { GundemEkrani, AjandaEkrani, BasinSahnesi, KampanyaEkrani, KampanyaSahnesi, SecimGecesi, SonsOz } from "./yonetim.tsx";
import { AyRaporu } from "./rapor.tsx";
import { AnlatiSahnesi, DosyaAnlatisi, KararTepkileri } from "./anlati.tsx";
import { GorevNotu } from "./ilk-ay.tsx";
import { Ikon } from "./ikon.tsx";
import { useState, useRef, useLayoutEffect, useCallback } from "react";
import type { OyunDurumu, MasaKarti } from "../cekirdek/durum.ts";
import { tarihAdi, secimeKalanAy, DONEM_AY_SAYISI } from "../cekirdek/takvim.ts";
import { GOSTERGELER, gostergeYaz } from "../cekirdek/gostergeler.ts";
import { trilyonTL } from "../cekirdek/ekonomi.ts";
import { tutarYaz } from "./bicim.ts";
import { talimatAciklamasi, gorusmeDestegi, ziyaretSonucu } from "../cekirdek/ziyaret.ts";
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
      <p>Göreve gelişinizin ilk gecesi telefon çalıyor. Bir mühendis, sabah binlerce kişinin geçeceği köprüden şüphe ediyor. Bakanınız beklemenizi istiyor. İkiniz de aynı ölçüm kâğıdına bakıyorsunuz.</p>
      <p className="kucuk soluk">Doruk Cumhuriyeti'nin cumhurbaşkanısınız. Seçime 18 ay var. Bu gece verdiğiniz kararın dosyası dönem boyunca kapanmayacak.</p>
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
  const [acik, setAcik] = useState<MasaKarti | null>(() => d.masa.find(m => m.ornek === d.anlati.sahne?.ornek) ?? (d.acilis?.sabah === null && !d.yonetim.medya.basin && !d.meclis.kulis && !d.yonetim.secim.sahne ? d.masa.find(m => m.kart === d.acilis?.sabahKarti) : undefined) ?? null);
  const dosyaKapat = useCallback(() => setAcik(null), []);
  const [ekran, setEkran] = useState<null | "hazine" | "ulke" | "dosyalar" | "meclis" | "gundem" | "ajanda" | "kampanya">(null);
  const hazineAc = () => setEkran("hazine");
  const kapat = () => setEkran(null);
  const acikKart = acik ? (d.masa.find((m) => m.ornek === acik.ornek) ?? acik) : null;
  const [sayim, setSayim] = useState(0);
  const buAyOylari = oyun.rapor ? d.meclis.sonuclar.filter(s => s.ay === oyun.rapor!.ay) : [];
  const ayBitir = () => { setSayim(0); oyun.ayiBitir(); };
  const kalan = d.masa.length;
  const sonHaberler = d.haberler.slice(0, 5);
  const oyku = d.masa.find(m => m.kart.startsWith("akkopru_") && ICERIK.kartlar[m.kart]?.anlati);
  if(d.anlati.sahne) return <AnlatiSahnesi d={d} oyun={oyun}/>;
  if(d.yonetim.medya.basin) return <BasinSahnesi d={d} oyun={oyun}/>;
  if(d.yonetim.secim.sahne) return <KampanyaSahnesi d={d} oyun={oyun}/>;
  if(!oyun.rapor && d.bitis) return <SonsOz d={d}/>;
  if(!oyun.rapor && d.yonetim.secim.gece) return <SecimGecesi key={d.yonetim.secim.gece.tur} d={d} oyun={oyun}/>;
  return (
    <div className="uygulama">
      <UstSerit d={d} onHazine={hazineAc} />
      <main className="masa">
        <section aria-labelledby="masa-baslik" className="kararlar">
          {oyku && <section className="anlati-kapi"><p className="ust-etiket">Akköprü · {oyku.kart === "akkopru_telefon" ? "Bölüm I · İlk gece" : ICERIK.kartlar[oyku.kart]?.acilis ? "Bölüm I · Ertesi sabah" : ICERIK.kartlar[oyku.kart]?.inceleme ? "Bölüm II · Rapor ve tanık" : ICERIK.kartlar[oyku.kart]?.secenekler.some(s => s.santiye) ? "Bölüm III · Şantiye" : ICERIK.kartlar[oyku.kart]?.hesaplasma ? "Bölüm IV · İnsanlar ve hesap" : oyku.kart.startsWith("akkopru_gecim") || oyku.kart.startsWith("akkopru_kampanya") ? "Bölüm V · Geçim ve hafıza" : "Devam eden hikâye"}</p><h2>{ICERIK.kartlar[oyku.kart]!.metin.baslik}</h2><p>{ICERIK.kartlar[oyku.kart]!.metin.durum}</p><button className="dugme birincil" onClick={() => setAcik(oyku)}>{oyku.kart === "akkopru_telefon" ? "Telefonu al" : ICERIK.kartlar[oyku.kart]?.acilis ? "Sabah bağlantısına dön" : ICERIK.kartlar[oyku.kart]?.inceleme?.asama === "rapor" ? "Raporu aç" : ICERIK.kartlar[oyku.kart]?.inceleme ? "İnceleme dosyasını aç" : "Hikâyeye dön"}</button></section>}
          <IncelemeIzleme d={d}/><AcilisIzleme d={d}/><GorevNotu d={d} oyun={oyun}/><SabahGazeteleri d={d} />
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
          <KapidaBekleyenler oyun={oyun} d={d} onAc={setAcik} />
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
      {acikKart && <KararDosyasi key={acikKart.ornek} oyun={oyun} d={d} m={acikKart} onAc={setAcik} onKapat={dosyaKapat} />}
      {ekran === "hazine" && !acikKart && !oyun.rapor && <HazineMasasi oyun={oyun} d={d} onKapat={kapat} />}
      {ekran === "ulke" && !acikKart && !oyun.rapor && <UlkeEkrani d={d} onKapat={kapat} />}
      {ekran === "dosyalar" && !acikKart && !oyun.rapor && !d.meclis.kulis && <PolitikaDosyasi oyun={oyun} d={d} onKapat={kapat} onMeclis={() => setEkran("meclis")} />}
      {ekran === "meclis" && !acikKart && !oyun.rapor && !d.meclis.kulis && <MeclisEkrani oyun={oyun} d={d} onKapat={kapat} onDosyalar={() => setEkran("dosyalar")} />}
      {ekran === "gundem" && !acikKart && !oyun.rapor && <GundemEkrani d={d} oyun={oyun} onKapat={kapat}/>}
      {ekran === "ajanda" && !acikKart && !oyun.rapor && <AjandaEkrani d={d} oyun={oyun} onKapat={kapat} onAc={setAcik}/>}
      {ekran === "kampanya" && !acikKart && !oyun.rapor && <KampanyaEkrani d={d} oyun={oyun} onKapat={kapat}/>}
      {d.meclis.kulis && <KulisSahnesi oyun={oyun} d={d} />}
      {oyun.rapor && sayim < buAyOylari.length && <OylamaSahnesi key={buAyOylari[sayim]!.id} sonuc={buAyOylari[sayim]!} onKapat={() => setSayim(n => n + 1)} />}
      {oyun.rapor && sayim >= buAyOylari.length && <AyRaporu rapor={oyun.rapor} d={d} onKapat={oyun.raporKapat} />}
    </div>
  );
}

function KararDosyasi({ oyun, d, m, onKapat, onAc }: { oyun: Oyun; d: OyunDurumu; m: MasaKarti; onKapat: () => void; onAc: (m: MasaKarti) => void }) {
  const ilkGece = m.kart === "akkopru_telefon";
  const ziyaret = ICERIK.kartlar[m.kart]?.ziyaret;
  const saha = ICERIK.kartlar[m.kart]?.saha;
  const sahaDosyasi = saha && ICERIK.saha?.find(t => t.id === saha.id);
  const sade = ilkGece || !!ziyaret || !!saha || !!ICERIK.kartlar[m.kart]?.anlati;
  const [hata, setHata] = useState<string | null>(null);
  const takip = ziyaret?.asama === "takip" ? ziyaretSonucu(d, ICERIK, ziyaret.id) : null;
  const [sonuc, setSonuc] = useState<{ secenek: string; haber?: string; tepkiler?: { kim: string; metin: string }[] } | null>(null);
  const t = kartMetni(ICERIK, m);
  const kisi = ICERIK.karakterler[t.kart.getiren];
  const sabahDosyasi = ilkGece && d.acilis?.sabah === null ? d.masa.find(x => x.kart === d.acilis?.sabahKarti) : undefined;
  const acilisSonucu = !!d.acilis && (ilkGece || !!t.kart.acilis);
  const incelemeSonucu = !!d.inceleme && !!t.kart.inceleme;
  const santiyeSonucu = !!t.kart.secenekler[0]?.santiye;
  const hesapSonucu = !!t.kart.hesaplasma;
  const hafizaSonucu = m.kart.startsWith("akkopru_gecim") || m.kart.startsWith("akkopru_kampanya");
  const belediyeSonucu = m.kart.startsWith("belediye_maas_");
  const isinmaSonucu = isinmaKarti(m.kart);
  const bolumSonucu = acilisSonucu || incelemeSonucu || santiyeSonucu || hesapSonucu || hafizaSonucu || belediyeSonucu || isinmaSonucu;
  const sonucRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!sonuc || !bolumSonucu) return;
    const el = sonucRef.current;
    el?.closest(".pencere")?.scrollTo({ top: 0 });
    el?.focus({ preventScroll: true });
  }, [sonuc, bolumSonucu]);
  const ertelenebilir = t.kart.tur === "masa" && !m.agir && !d.ertelemeKullanildi;

  if (sonuc) {
    return (
      <Pencere baslik={t.baslik} onKapat={onKapat}>
        <div className="sonuc" ref={sonucRef} tabIndex={bolumSonucu ? -1 : undefined} aria-label={bolumSonucu ? "Kararın sonucu" : undefined}>
          <Muhur ton={bolumSonucu ? "mavi" : "yesil"}>{isinmaSonucu ? "Kış kararı kaydedildi" : belediyeSonucu ? "Garaj kaydı güncellendi" : hafizaSonucu ? "Hafıza kaydedildi" : hesapSonucu ? "Hesap dosyası güncellendi" : santiyeSonucu ? "Şantiye işlemi kaydedildi" : incelemeSonucu ? (d.inceleme!.asama === "tamam" ? "Rapor kararı kaydedildi" : "İnceleme takvime alındı") : acilisSonucu ? (ilkGece ? "Gece talimatı uygulandı" : "İlk gün tamamlandı") : ziyaret || saha ? "Yanıt verildi" : "Onaylandı"}</Muhur>
          <p className="ust-etiket">Kararınız</p>
          <p className="sonuc-secim">{sonuc.secenek}</p>
          {acilisSonucu && sonuc.tepkiler && <KararTepkileri d={d} tepkiler={sonuc.tepkiler}/>}
          {acilisSonucu && <AcilisIzleme d={d} sahne/>}{incelemeSonucu && <IncelemeIzleme d={d}/>}{santiyeSonucu && <SantiyeIzleme d={d}/>}{hesapSonucu && <HesaplasmaIzleme d={d}/>}{hafizaSonucu && <HafizaIzleme d={d}/>}{belediyeSonucu && <BelediyeIzleme d={d} il={m.degisken.il ?? String(d.bayraklar.belediye_il ?? "Belediye")}/>}{isinmaSonucu && <IsinmaIzleme d={d} m={m}/>}
          {acilisSonucu
            ? sonuc.haber && <details className="anlati-belgeler"><summary>Yazılı bildirim</summary><p>{sonuc.haber}</p></details>
            : bolumSonucu
              ? <details className="anlati-belgeler"><summary>Gelen yanıtlar</summary>{sonuc.haber && <p>{sonuc.haber}</p>}{sonuc.tepkiler && <KararTepkileri d={d} tepkiler={sonuc.tepkiler}/>}</details>
              : <>{sonuc.haber && <blockquote className="haber-alinti">{sonuc.haber}</blockquote>}{sonuc.tepkiler && <KararTepkileri d={d} tepkiler={sonuc.tepkiler}/>}</>}
          {sabahDosyasi && <button type="button" className="dugme birincil" onClick={() => onAc(sabahDosyasi)} >Sabah bağlantısını aç</button>}
          <button type="button" className={`dugme ${sabahDosyasi ? "ikincil" : "birincil"}`} onClick={onKapat} autoFocus={!bolumSonucu && !sabahDosyasi}>Masaya dön</button>
        </div>
      </Pencere>
    );
  }

  return (
    <Pencere baslik={t.baslik} onKapat={onKapat}>
      <article className={`karar-dosyasi${t.kart.anlati ? " anlati-dosyasi" : ""}`}>
        {m.kart==="ifsa_yanit"&&d.yonetim.ifsa&&<aside className="ihanet"><Muhur>Sızan belge</Muhur><p>{d.yonetim.ifsa.kaynak}</p></aside>}
        <header className="dosya-ust">
          <span className="etiketler">
            <TurEtiketi tur={t.kart.tur} kategori={t.kart.kategori} />
            {m.agir && <Muhur ton="mavi">Ertelendi · etkileri ağır</Muhur>}
          </span>
          <button type="button" className="kapat" onClick={onKapat} aria-label="Dosyayı kapat">×</button>
        </header>
        {!ziyaret && !saha && <p className="getiren"><KisiRozeti kisi={kisi} boy={36} /> <span><b>{kisi?.ad}</b><br /><span className="soluk">{kisi?.rol}</span></span></p>}
        <h3 className="dosya-baslik">{t.baslik}</h3>
        <p className="dosya-durum">{t.durum}</p>
        {t.kart.anlati && <p className="anlati-mekan">{t.kart.anlati.mekan}</p>}
        {t.kulis && <aside className="kulis"><span className="ust-etiket">Kulis notu</span><p>{t.kulis}</p></aside>}
        {sahaDosyasi && <SahaIzleme d={d} t={sahaDosyasi}/>}
        {takip && <aside className="ziyaret-sonuc" aria-label="Önceki görüşmenin sonucu"><p className="ust-etiket">Önceki yanıtın</p><p>{takip.yanit}</p><p>{takip.durum}</p></aside>}
        {t.kart.inceleme && (d.inceleme ? <IncelemeIzleme d={d}/> : <IncelemeGiris d={d}/>)}
        {santiyeSonucu && <SantiyeIzleme d={d}/>}
        {hesapSonucu && <HesaplasmaIzleme d={d}/>}
        {hafizaSonucu && <HafizaIzleme d={d}/>}
        {belediyeSonucu && <BelediyeIzleme d={d} il={m.degisken.il ?? String(d.bayraklar.belediye_il ?? "Belediye")}/>}{isinmaSonucu && <IsinmaIzleme d={d} m={m}/>}
        {t.kart.acilis && <AcilisIzleme d={d}/> }
        <DosyaAnlatisi d={d} m={m} oyun={oyun} />
        <p className="ust-etiket secenek-baslik">
          {sade ? (ziyaret ? "Yanıtın" : "Talimatınız") : <>Seçenekler · {m.ikinciGorus ? "iki danışmanın ortak tahmini" : "danışman tahmini, yanılabilir"}</>}
        </p>
        <ol className="secenekler">
          {t.secenekler.map((metin, i) => {
            const ifadeler: Ifade[] = tahminEt(d, ICERIK, m.ornek, i)
              .sort((a, b) => Math.abs(b.deger) - Math.abs(a.deger))
              .map((x) => etkiIfadesi(x.id, x.deger));
            const secim = t.kart.secenekler[i]!;
            const talimat = secim.politika && talimatAciklamasi(d, ICERIK, secim.politika);
            const destek = secim.destek && gorusmeDestegi(d, ICERIK, secim.destek.kaynak);
            const destekSozu = secim.ekonomi?.soz ?? (secim.destek ? ICERIK.kartlar[secim.destek.kaynak]?.secenekler.find(s => s.ekonomi?.soz)?.ekonomi?.soz : undefined);
            const sahaBilgi = saha && sahaKararBilgisi(d, ICERIK, t.kart, secim);
            const kilit = (secim.kosul && !kosulSaglaniyor(d, secim.kosul, ICERIK) ? secim.kilitNedeni ?? "Önce gerekli kaydı edinmelisin." : null) || santiyeEngeli(d, t.kart, secim) || hesaplasmaEngeli(d, t.kart, secim) || hafizaEngeli(d, t.kart, secim) || isinmaEngeli(d, m, i) || icraEngeli(d, secim) || sahaBilgi?.kilit || talimat?.kilit || (destek && !destek.ok ? destek.neden : undefined);
            return (
              <li key={i}>
                <button
                  type="button"
                  className="secenek"
                  disabled={!!kilit}
                  onClick={() => {
                    const s = oyun.karar(m.ornek, i);
                    if (s.ok) setSonuc({ secenek: metin, haber: s.haber, tepkiler: s.tepkiler });
                    else setHata(s.neden);
                  }}
                >
                  <span className="secenek-metin">{metin}</span>
                  {t.kart.anlati && <div className="secenek-hikaye">{!sade && <span>{t.kart.anlati.secenekNotlari[i]!.gerekce}</span>}<span className="secenek-bedel">{!sade && <b>Göze aldığın: </b>}{t.kart.anlati.secenekNotlari[i]!.bedel}</span></div>}
                  {secim.icra && (secim.icra.gun || secim.icra.imza || secim.icra.odeme) && <span className="kucuk talimat">{[secim.icra.gun ? `${secim.icra.gun} gün` : "", secim.icra.imza ? "1 imza" : "", secim.icra.odeme ? `Tek seferlik ${tutarYaz(trilyonTL(d, secim.icra.odeme.maliyet) / 12)}` : ""].filter(Boolean).join(" · ")}</span>}
                  {sahaBilgi && <span className="kucuk talimat">{sahaBilgi.metin}{sahaBilgi.maliyet > 0 && <> Tek seferlik {tutarYaz(trilyonTL(d, sahaBilgi.maliyet) / 12)}.</>}</span>}
                  {destekSozu && <span className="kucuk talimat">Tek seferlik {tutarYaz(trilyonTL(d, destekSozu.maliyet) / 12)} ödenek.{secim.ekonomi?.soz ? " Şimdi söz verilir; ödeme daha sonra yapılır." : " Bekleyen söz varsa yerine getirilir."}</span>}
                  {talimat && <span className="kucuk talimat">{talimat.metin}</span>}
                  {kilit && <span className="kucuk uyari">{kilit}</span>}
                  {(!sade || m.ikinciGorus) && <IfadeListesi ifadeler={ifadeler} bos="Danışman belirgin bir etki öngörmüyor." />}
                </button>
              </li>
            );
          })}
        </ol>
        {hata && <p role="alert" className="uyari">{hata}</p>}
        <footer className="dosya-alt">
          {saha ? <p className="kucuk soluk">Ziyaret günü ve sahne hakkı kullanıldı. Yapılacak işin ödeneğini bu kararla belirlersin.</p> : ziyaret ? <p className="kucuk soluk">{ziyaret.asama === "gorusme" ? "Bu görüşme için gün ayırdın. Yanıtın gelecek ayın takip dosyasına geçer." : "Önceki taahhütlerin yeni yanıtla silinmez."}</p> : ilkGece ? <details className="anlati-belgeler"><summary>Danışmana sor</summary><p className="kucuk soluk">Ek değerlendirme istemek takvimden bir gün ayırır. Telefon görüşmesi ayrıca gün tüketmez; bu ayın görüşme hakkını kullanır.</p><button type="button" className="dugme ikincil" disabled={m.ikinciGorus || d.bosGun <= 0} onClick={() => oyun.ikinciGorus(m.ornek)}>{m.ikinciGorus ? "Ek değerlendirme alındı" : "Ek değerlendirme iste · 1 gün"}</button>{m.ikinciGorus && <section aria-label="Danışman değerlendirmesi">{t.secenekler.map((metin, i) => <div key={i}><p className="kucuk"><b>{metin}</b></p><IfadeListesi ifadeler={tahminEt(d, ICERIK, m.ornek, i).filter(x => x.id !== "butce_acigi").map(x => etkiIfadesi(x.id, x.deger))} /></div>)}</section>}</details> : <>
          <button type="button" className="dugme ikincil" disabled={m.ikinciGorus || d.bosGun <= 0} onClick={() => oyun.ikinciGorus(m.ornek)}>
            {m.ikinciGorus ? "İkinci görüş alındı" : `İkinci görüş al (1 gün · ${d.bosGun} boş)`}
          </button>
          {t.kart.tur === "masa" && !ziyaret && !saha && (
            <button type="button" className="dugme ikincil" disabled={!ertelenebilir} onClick={() => { if (oyun.ertele(m.ornek).ok) onKapat(); }}>
              {d.ertelemeKullanildi ? "Bu ay erteleme hakkı kullanıldı" : m.agir ? "Bir kez ertelendi" : "Ertesi aya ertele"}
            </button>
          )}
          </>}
        </footer>
      </article>
    </Pencere>
  );
}
