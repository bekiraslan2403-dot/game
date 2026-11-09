import { ButceIzleme } from "./butce.tsx";
import { useEffect, useRef, useState } from "react";
import type { OyunDurumu } from "../cekirdek/durum.ts";
import { PARTILER, HIZIPLER } from "../cekirdek/meclis-icerik.ts";
import { vekilTalebi, hizipSozu, hizipMemnuniyeti, vekilIliskisi, iliskiSozu, partiTutumu, partiSandalyesi, transferSandalyesi, vekilDurumu, vekilEgilimi, oySonucu, type OylamaSonucu, type KulisAraci } from "../cekirdek/meclis.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { KALEM, trilyonTL } from "../cekirdek/ekonomi.ts";
import { GOSTERGE } from "../cekirdek/gostergeler.ts";
import { tutarYaz } from "./bicim.ts";
import { Pencere, Muhur, KisiRozeti } from "./bilesenler.tsx";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

export function MeclisEkrani({ oyun, d, onKapat, onDosyalar }: { oyun: Oyun; d: OyunDurumu; onKapat: () => void; onDosyalar: () => void }) {
  const [secili, setSecili] = useState(d.meclis.oylamalar[0]?.id ?? "");
  const [tutanak, setTutanak] = useState<OylamaSonucu | null>(null);
  const o = d.meclis.oylamalar.find(o => o.id === secili) ?? d.meclis.oylamalar[0];
  const transfer = transferSandalyesi(d);
  if (tutanak) return <OylamaSahnesi sonuc={tutanak} arsiv onKapat={() => setTutanak(null)} />;
  return <Pencere baslik="Meclis" onKapat={onKapat} genis>
    <article className="meclis">
      <header className="meclis-ust"><div><p className="ust-etiket">Doruk Cumhuriyeti · {tarihAdi(d.ay)}</p><h3 className="dosya-baslik">Meclis</h3></div><Muhur ton="mavi">600 sandalye</Muhur></header>
      <p className="soluk">İktidarın tek başına çoğunluğu yok. Grup başkanvekili: “Salonda herkes var. Oyları henüz saymadık.”</p>
      <ul className="sandalye-listesi" aria-label="Sandalye dağılımı">
        {PARTILER.map(p => <li key={p.id}><b>{p.ad}</b><span className="veri">{partiSandalyesi(d, p.id)}</span></li>)}
        {d.yonetim.parti.vekil>0&&<li><b>Yeni Kanat Partisi</b><span className="veri">{d.yonetim.parti.vekil}</span></li>}
        <li><span>Boş</span><span className="veri">8</span></li>
      </ul>
      {transfer > 0 && <p className="kucuk">Demokrat Birlik Partisi’nden Yükseliş grubuna geçen {transfer} vekil bu dağılıma dahil.</p>}
      <section aria-label="Parti içi hizipler"><h4>Partinin üç sesi</h4><div className="hizipler">{HIZIPLER.map(h => <div className="kutu" key={h.id}><b>{h.ad}</b><p>{h.sandalye} vekil · {hizipSozu(hizipMemnuniyeti(d, h.id))}</p><span className="soluk kucuk">{h.id === "eski" ? "Örgüt ve kadro" : h.id === "teknokrat" ? "Liyakat ve piyasa güveni" : "Aile, din ve eğitim"}</span></div>)}</div></section>
      {d.meclis.butce.gecici && <p className="uyari">Geçici bütçe uygulanıyor. Yeni paket Meclis'ten geçene kadar mevcut ödeneklerle devam ediliyor.</p>}
      <ButceIzleme d={d}/>
      <section><h4>Sıradaki oylama</h4>
        {o ? <>
          <label className="meclis-secim">Gündem<select value={o.id} onChange={(e: { target: { value: string } }) => setSecili(e.target.value)}>{d.meclis.oylamalar.map(t => <option key={t.id} value={t.id}>{t.baslik}</option>)}</select></label>
          <p className="teklif">{o.baslik}</p><p className="kucuk soluk">Ay sonunda oylanacak. {o.tur === "anayasa" ? "Halkoylaması için 360, doğrudan kabul için 400 evet gerekir." : "Dolu 592 sandalyenin tamamı katılırsa 297 evet gerekir. Çekimser oylar da katılıma dahildir."}</p>
          <ul className="parti-tutumlari">{PARTILER.map(p => <li key={p.id}><b>{p.kisa}</b> · {partiTutumu(d, o, p.id, ICERIK)}</li>)}</ul>
          <h4>Kararsız vekiller</h4><p className="kucuk soluk">Eğilimler grup başkanvekilinin tahminidir; yanılabilir. Bir kulis görüşmesi bu ayın sahnesini kullanır. İkna ayrıca takvimden bir gün alır.</p>
          <div className="vekil-listesi">{o.adaylar.map(id => {
            const v = ICERIK.meclis.vekiller.find(v => v.id === id);
            if (!v) return null;
            const vd = vekilDurumu(d, id);
            const gecmis = vd.sozler.map(s => d.ekonomi.sozler.find(x => x.id === s)).filter(x => x !== undefined);
            return <article className="vekil kutu" key={id}>
              <div className="vekil-kim"><KisiRozeti kisi={{ id: v.id, ad: v.ad, rol: "Milletvekili", yetkinlik: 0.6 }} ton={vekilIliskisi(d,id)>=65?"memnun":vekilIliskisi(d,id)<40?"ofkeli":"notr"} /><div><h5>{v.ad}</h5><p className="kucuk soluk">{PARTILER.find(p => p.id === v.parti)?.kisa} · {v.il}</p></div></div>
              <p>{vekilTalebi(d,ICERIK,o,v)}</p><p className="vekil-egilim">{vekilEgilimi(d, o, v, ICERIK)} · ilişkiniz {iliskiSozu(vekilIliskisi(d, id))}</p>
              {gecmis.length > 0 && <ul className="kucuk">{gecmis.map(s => <li key={s.id}>{s.durum === "bekliyor" ? `Söz bekliyor · ${tarihAdi(s.vade)}` : s.durum === "tutuldu" ? "Söz tutuldu" : "Söz kırıldı"}</li>)}</ul>}
              {vd.ihanet > 0 && <p className="kucuk">Daha önce verdiği evet sözünden döndü.</p>}
              <button className="dugme ikincil" type="button" disabled={d.meclis.sahneAy === d.ay} onClick={() => oyun.kulisAc(o.id, id)}>Görüş · {v.ad}</button>
            </article>;
          })}</div>
          {d.meclis.sahneAy === d.ay && <p className="uyari">Bu ayın sahnesi kullanıldı. Oylama ay sonunda yapılacak.</p>}
        </> : <><p className="soluk">Meclis gündeminde bekleyen teklif yok. Dosyalar'dan kanun teklifi sunabilirsiniz. Aralık'ta emekli aylığı, Şubat'ta yargı düzenlemesi için kritik oylamalar var.</p><button type="button" className="dugme ikincil" onClick={onDosyalar}>Politika dosyasını aç</button></>}
      </section>
      {d.meclis.sonuclar.length > 0 && <section><h4>Oylama tutanakları</h4><ul className="tutanak-listesi">{[...d.meclis.sonuclar].reverse().map(r => <li key={r.id}><button type="button" className="dugme ikincil" onClick={() => setTutanak(r)}>{tarihAdi(r.ay)} · {r.baslik}<span>{r.sonuc === "kabul" ? "Kabul" : r.sonuc === "ret" ? "Ret" : "Halkoylaması"} · {r.evet} evet / {r.hayir} ret</span></button></li>)}</ul></section>}
      {oyun.mesaj && <p className="uyari" role="status">{oyun.mesaj}</p>}
      <button type="button" className="dugme birincil" onClick={onKapat}>Masaya dön</button>
    </article>
  </Pencere>;
}

const ARACLAR: { id: KulisAraci; ad: string; bedel: string }[] = [
  { id: "soz", ad: "Talebine söz ver", bedel: "İki ay vadeli bütçe yükü. Kadro ve dava pazarlığı sicile yazılır." },
  { id: "ikna", ad: "Kişisel görüşmeyle ikna et", bedel: "1 boş gün. Vicdani itirazı olan vekiller daha açık; sonuç belirsiz." },
  { id: "baski", ad: "Elindeki dosyayı hatırlat", bedel: "Sicile baskı kaydı. İlişki soğur; evet sözü verse de dönebilir." },
  { id: "algi", ad: "Yakın medyayı devreye sok", bedel: "Basın özgürlüğü ve ilişkiniz zarar görür. Kampanya ters tepebilir." },
  { id: "pazarlik", ad: "Parti lideriyle taviz konuş", bedel: "Politika tavizi gruptan destek getirebilir. Kendi tabanınız tepki verir." },
];

export function KulisSahnesi({ oyun, d }: { oyun: Oyun; d: OyunDurumu }) {
  const k = d.meclis.kulis;
  const v = ICERIK.meclis.vekiller.find(v => v.id === k?.vekil);
  const o = d.meclis.oylamalar.find(o => o.id === k?.oylama);
  if (!k || !v || !o) return null;
  const maliyet = v.dert === "yatirim" ? 0.08 : 0.03;
  return <Pencere baslik={`${v.ad} ile kulis`}>
    <article className="kulis-sahnesi">
      <p className="ust-etiket">Ayın sahnesi · Kapalı kapılar ardında</p><Muhur>Gizli görüşme</Muhur>
      <h3 className="dosya-baslik">{v.ad}</h3><p className="soluk">{PARTILER.find(p => p.id === v.parti)?.ad} · {v.il}</p>
      <p className="kucuk soluk">{o.baslik}</p><blockquote className="haber-alinti">“{v.giris}”</blockquote><p>“{vekilTalebi(d,ICERIK,o,v)}”</p>
      <details className="anlati-belgeler"><summary>Taahhüdün bütçeye etkisi</summary><p className="kucuk">Yıllık {tutarYaz(trilyonTL(d, maliyet))} kaynak gerektirir. Son ödeme zamanı: {tarihAdi(d.ay + 2)}. Söz vermek ödeneği çıkarmaz; ödeme Hazine masasından yapılır.</p></details>
      {k.sonuc ? <div className="sonuc"><p role="status">{k.sonuc}</p><p className="soluk">Grup başkanvekili: “Sözünü aldık. Oyu henüz almadık.”</p></div> : <div className="kulis-araclari">{ARACLAR.map(a => <button key={a.id} type="button" className="secenek" disabled={(a.id === "ikna" && d.bosGun < 1) || (a.id === "pazarlik" && v.parti === "yukselis")} onClick={() => oyun.kulisSec(a.id)}><b>{a.ad}</b><span className="kucuk soluk">{a.bedel}</span></button>)}</div>}
      {oyun.mesaj && <p className="uyari" role="status">{oyun.mesaj}</p>}
      <button type="button" className="dugme birincil" onClick={oyun.kulisKapat}>{k.sonuc ? "Meclis'e dön" : "Anlaşmadan görüşmeyi bitir"}</button>
    </article>
  </Pencere>;
}

const OY_ADLARI = { evet: "Evet", hayir: "Ret", cekimser: "Çekimser" } as const;
const UYGULAMA_ADLARI = {
  yururluk: "Düzenleme yürürlüğe girdi.",
  degismedi: "Mevcut düzenleme yürürlükte kaldı.",
  bekliyor: "Yeni bütçe ilk uygun ayın başında yürürlüğe girecek.",
  gecici: "Mevcut ödenekler geçici bütçeyle sürüyor. Teklif gelecek ay yeniden oylanacak.",
  halkoylamasi: "Uygulama için halkoylamasının sonucu bekleniyor.",
} as const;

function OylamaEtkileri({ r }: { r: OylamaSonucu }) {
  const u = r.uygulama;
  if (!u) return <p className="soluk kucuk">Bu tutanak oy dağılımının kaydedildiği eski sürümden.</p>;
  const etkiler = Object.entries(u.etkiler);
  return <section className="oylama-etkileri" aria-label="Oylamanın oyundaki etkisi">
    <h4>Şimdi ne değişti?</h4>
    <p>{UYGULAMA_ADLARI[u.tur]}</p>
    {u.kademe && <p className="oylama-kademe">{u.kademe.once === u.kademe.sonra
      ? u.kademe.sonra
      : <>{u.kademe.once} <span aria-hidden="true">→</span> <b>{u.kademe.sonra}</b></>}</p>}
    {(u.butce || etkiler.length > 0) && <dl className="oylama-etki-listesi">
      {u.butce && <div><dt>{KALEM[u.butce.kalem]?.ad ?? "Hazine kalemi"} · yıllık {KALEM[u.butce.kalem]?.tur ?? "bütçe"}</dt><dd>{u.butce.farkTL > 0 ? "+" : "−"}{tutarYaz(Math.abs(u.butce.farkTL))}</dd></div>}
      {etkiler.map(([id, fark]) => <div key={id}><dt>{GOSTERGE[id]?.ad ?? id}{id.startsWith("grup.") ? " · seçmen desteği" : ""}</dt>
        <dd>{fark.toLocaleString("tr-TR", { signDisplay: "always", maximumFractionDigits: 2 })} {GOSTERGE[id]?.birim === "TL" ? "TL" : "puan"}</dd></div>)}
    </dl>}
    {u.takip && <p className="oylama-takip"><span className="ust-etiket">{tarihAdi(u.takip.ay)} · sıradaki karar</span><b>{u.takip.baslik}</b></p>}
  </section>;
}

function GrupTutanagi({ r }: { r: OylamaSonucu }) {
  const gruplar = [...PARTILER.map(p => ({ id: String(p.id), ad: p.ad })), { id: "ayrilan", ad: "Yeni Kanat Partisi" }];
  const dagilim = gruplar.map(g => {
    const oylar = r.oylar.filter(v => (v.grup === "transfer" ? "yukselis" : v.grup ?? v.parti) === g.id);
    return { ...g, oylar };
  }).filter(g => g.oylar.length);
  const transfer = r.oylar.filter(v => v.grup === "transfer");
  const transferEvet = transfer.filter(v => v.oy === "evet").length;
  const belirleyici = oySonucu(r.tur, r.evet - transferEvet, r.katilan) !== r.sonuc;
  return <section className="grup-tutanagi">
    <table>
      <caption>Grup grup oylar</caption>
      <thead><tr><th scope="col">Grup</th><th scope="col">Evet</th><th scope="col">Ret</th><th scope="col"><abbr title="Çekimser">Çek.</abbr></th></tr></thead>
      <tbody>{dagilim.map(g => <tr key={g.id}><th scope="row">{g.ad}</th>
        {Object.keys(OY_ADLARI).map(oy => <td key={oy}>{g.oylar.filter(v => v.oy === oy).length}</td>)}
      </tr>)}</tbody>
    </table>
    {transfer.length > 0 && <p className="oylama-transfer"><b>Yükseliş’e geçen {transfer.length} vekil.</b>{" "}
      {transferEvet} evet oyu. {transferEvet > 0 && `Bu ${transferEvet} evet oyu çekimser kalsaydı sonuç ${belirleyici ? "değişirdi" : "değişmezdi"}.`}</p>}
  </section>;
}

/** Tutanak yeniden açıldığında sayım tekrarlanmaz ve oyun durumu değişmez. */
export function OylamaSahnesi({ sonuc: r, arsiv = false, onKapat }: { sonuc: OylamaSonucu; arsiv?: boolean; onKapat: () => void }) {
  const [sayilan, setSayilan] = useState(() => arsiv || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? r.katilan : 0);
  const sonucRef = useRef<HTMLDivElement | null>(null);
  const bitti = sayilan >= r.katilan;
  useEffect(() => {
    if (bitti) return;
    const timer = window.setInterval(() => setSayilan(n => Math.min(r.katilan, n + 8)), 45);
    return () => window.clearInterval(timer);
  }, [bitti, r.katilan]);
  const oylar = r.oylar.slice(0, sayilan);
  const evet = oylar.filter(v => v.oy === "evet").length;
  const hayir = oylar.filter(v => v.oy === "hayir").length;
  const sayilar = [evet, hayir, sayilan - evet - hayir];
  const fireler = oylar.filter(v => v.fire && !v.kim.includes(" sıra "));
  const sonOy = oylar.at(-1);
  const esik = r.tur === "anayasa" && r.sonuc === "kabul" ? 400 : r.esik;
  const fark = r.evet - esik;
  const farkMetni = fark < 0 ? `Eşiğin ${-fark} oy altında` : fark === 0 ? "Tam eşikte" : `Eşiğin ${fark} oy üzerinde`;
  const sonuc = r.sonuc === "kabul" ? "Kabul edildi" : r.sonuc === "ret" ? "Reddedildi" : "Halkoylamasına gidiyor";

  function sayimiTamamla() {
    setSayilan(r.katilan);
    requestAnimationFrame(() => sonucRef.current?.focus({ preventScroll: true }));
  }

  return <Pencere baslik="Meclis oylaması" onKapat={arsiv ? onKapat : undefined} genis>
    <article className="oylama-sahnesi">
      <header className="oylama-basligi">
        <p className="ust-etiket">{arsiv ? "Meclis arşivi" : "Genel Kurul"} · {tarihAdi(r.ay)}</p>
        <h3 className="dosya-baslik">{r.baslik}</h3>
        <p className="soluk">{r.katilan} katılan · {r.tur === "anayasa" ? "360 halkoylaması / 400 doğrudan kabul" : `${r.esik} evet gerekiyor`} · 8 sandalye boş</p>
      </header>
      <div className="oy-sayilari" aria-label="Oy sayımı">{Object.entries(OY_ADLARI).map(([oy, ad], i) =>
        <div key={oy} className={`oy-${oy}`}><b className="veri">{sayilar[i]}</b><span>{ad}</span></div>)}</div>
      <div className="oy-dagilimi" aria-hidden="true">{Object.keys(OY_ADLARI).map((oy, i) =>
        <span key={oy} className={`oy-${oy}`} style={{ width: `${sayilar[i]! / r.katilan * 100}%` }}/>)}
        <i style={{ left: `${esik / r.katilan * 100}%` }}/>
      </div>
      {!bitti && <>
        <progress value={sayilan} max={r.katilan} aria-label="Sayılan oylar"/>
        <p className="oy-akisi kucuk soluk">{sayilan} / {r.katilan} oy sayıldı{sonOy && ` · ${sonOy.grup === "transfer" ? "Yükseliş’e katılan vekil" : sonOy.grup === "ayrilan" ? "Yeni Kanat Partisi" : sonOy.kim} · ${OY_ADLARI[sonOy.oy]}`}</p>
      </>}
      {bitti && <>
        <div className={`oylama-sonuc oylama-${r.sonuc}`} role="status" tabIndex={-1} ref={sonucRef}>
          <Muhur ton={r.sonuc === "ret" ? "kirmizi" : r.sonuc === "kabul" ? "yesil" : "mavi"}>{sonuc}</Muhur>
          <p>{farkMetni} <span className="soluk">· {r.evet} evet / {esik} eşik</span></p>
        </div>
        <OylamaEtkileri r={r}/>
        <GrupTutanagi r={r}/>
      </>}
      {fireler.map(v => <aside className="ihanet" key={v.kim}><Muhur>Son dakika firesi</Muhur><p><b>{v.kim}</b>, evet sözüne rağmen ret oyu verdi.</p></aside>)}
      <div className="dosya-alt oylama-alt">
        {!bitti && <button type="button" className="dugme ikincil" onClick={sayimiTamamla}>Sayımı tamamla</button>}
        <button type="button" className="dugme birincil" onClick={onKapat}>{arsiv ? "Tutanaklara dön" : bitti ? "Devam et" : "Sayımı atla"}</button>
      </div>
    </article>
  </Pencere>;
}
