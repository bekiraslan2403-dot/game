import { useEffect, useState } from "react";
import type { OyunDurumu } from "../cekirdek/durum.ts";
import { PARTILER, HIZIPLER } from "../cekirdek/meclis-icerik.ts";
import { vekilTalebi, hizipSozu, hizipMemnuniyeti, vekilIliskisi, iliskiSozu, partiTutumu, vekilDurumu, vekilEgilimi, type OylamaSonucu, type KulisAraci } from "../cekirdek/meclis.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { trilyonTL } from "../cekirdek/ekonomi.ts";
import { tutarYaz } from "./bicim.ts";
import { Pencere, Muhur, KisiRozeti } from "./bilesenler.tsx";
import { ICERIK } from "./icerik.ts";
import type { Oyun } from "./useOyun.ts";

export function MeclisEkrani({ oyun, d, onKapat, onDosyalar }: { oyun: Oyun; d: OyunDurumu; onKapat: () => void; onDosyalar: () => void }) {
  const [secili, setSecili] = useState(d.meclis.oylamalar[0]?.id ?? "");
  const [tutanak, setTutanak] = useState<OylamaSonucu | null>(null);
  const o = d.meclis.oylamalar.find(o => o.id === secili) ?? d.meclis.oylamalar[0];
  if (tutanak) return <OylamaSahnesi sonuc={tutanak} onKapat={() => setTutanak(null)} />;
  return <Pencere baslik="Meclis" onKapat={onKapat} genis>
    <article className="meclis">
      <header className="meclis-ust"><div><p className="ust-etiket">Doruk Cumhuriyeti · {tarihAdi(d.ay)}</p><h3 className="dosya-baslik">Meclis</h3></div><Muhur ton="mavi">600 sandalye</Muhur></header>
      <p className="soluk">İktidarın tek başına çoğunluğu yok. Grup başkanvekili: “Salonda herkes var. Oyları henüz saymadık.”</p>
      <ul className="sandalye-listesi" aria-label="Sandalye dağılımı">
        {PARTILER.map(p => <li key={p.id}><b>{p.ad}</b><span className="veri">{p.sandalye-(p.id==="yukselis"?d.yonetim.parti.vekil:0)}</span></li>)}
        {d.yonetim.parti.vekil>0&&<li><b>Yeni Kanat Partisi</b><span className="veri">{d.yonetim.parti.vekil}</span></li>}
        <li><span>Boş</span><span className="veri">8</span></li>
      </ul>
      <section aria-label="Parti içi hizipler"><h4>Partinin üç sesi</h4><div className="hizipler">{HIZIPLER.map(h => <div className="kutu" key={h.id}><b>{h.ad}</b><p>{h.sandalye} vekil · {hizipSozu(hizipMemnuniyeti(d, h.id))}</p><span className="soluk kucuk">{h.id === "eski" ? "Örgüt ve kadro" : h.id === "teknokrat" ? "Liyakat ve piyasa güveni" : "Aile, din ve eğitim"}</span></div>)}</div></section>
      {d.meclis.butce.gecici && <p className="uyari">Geçici bütçe uygulanıyor. Yeni paket Meclis'ten geçene kadar mevcut ödeneklerle devam ediliyor.</p>}
      <section><h4>Sıradaki oylama</h4>
        {o ? <>
          <label className="meclis-secim">Gündem<select value={o.id} onChange={(e: { target: { value: string } }) => setSecili(e.target.value)}>{d.meclis.oylamalar.map(t => <option key={t.id} value={t.id}>{t.baslik}</option>)}</select></label>
          <p className="teklif">{o.baslik}</p><p className="kucuk soluk">Ay sonunda oylanacak. Dolu 592 sandalyenin tamamı katılırsa 297 evet gerekir. Çekimser oylar da katılıma dahildir.</p>
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
      <p className="kucuk">Hazine notu: sözün yıllık maliyeti {tutarYaz(trilyonTL(d, maliyet))}. Vade: {tarihAdi(d.ay + 2)}. Hazine'den yerine getirilebilir.</p>
      {k.sonuc ? <div className="sonuc"><p role="status">{k.sonuc}</p><p className="soluk">Grup başkanvekili: “Sözünü aldık. Oyu henüz almadık.”</p></div> : <div className="kulis-araclari">{ARACLAR.map(a => <button key={a.id} type="button" className="secenek" disabled={(a.id === "ikna" && d.bosGun < 1) || (a.id === "pazarlik" && v.parti === "yukselis")} onClick={() => oyun.kulisSec(a.id)}><b>{a.ad}</b><span className="kucuk soluk">{a.bedel}</span></button>)}</div>}
      {oyun.mesaj && <p className="uyari" role="status">{oyun.mesaj}</p>}
      <button type="button" className="dugme birincil" onClick={oyun.kulisKapat}>{k.sonuc ? "Meclis'e dön" : "Anlaşmadan görüşmeyi bitir"}</button>
    </article>
  </Pencere>;
}

/** Görsel sayım kayıtlı oyları okur; atlama, kapatma ve yeniden açma zarı etkilemez. */
export function OylamaSahnesi({ sonuc: r, onKapat }: { sonuc: OylamaSonucu; onKapat: () => void }) {
  const [sayilan, setSayilan] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSayilan(r.oylar.length); return; }
    const timer = window.setInterval(() => setSayilan(n => {
      const yeni = Math.min(r.oylar.length, n + 8);
      if (yeni === r.oylar.length) window.clearInterval(timer);
      return yeni;
    }), 45);
    return () => window.clearInterval(timer);
  }, [r.id]);
  const oylar = r.oylar.slice(0, sayilan);
  const bitti = sayilan >= r.oylar.length;
  const evet = oylar.filter(v => v.oy === "evet").length;
  const hayir = oylar.filter(v => v.oy === "hayir").length;
  const fireler = oylar.filter(v => v.fire && !v.kim.includes(" sıra "));
  return <Pencere baslik="Meclis oylaması" genis>
    <article className="oylama-sahnesi"><p className="ust-etiket">Genel Kurul · {tarihAdi(r.ay)}</p><h3 className="dosya-baslik">{r.baslik}</h3>
      <p className="soluk">{r.katilan} katılan · {r.esik} evet gerekiyor · 8 sandalye boş</p>
      <div className="oy-sayilari" aria-label="Oy sayımı"><div><b className="veri">{evet}</b><span>Evet</span></div><div><b className="veri">{hayir}</b><span>Ret</span></div><div><b className="veri">{oylar.length - evet - hayir}</b><span>Çekimser</span></div></div>
      <progress value={sayilan} max={r.oylar.length} aria-label="Sayılan oylar" /><p className="kucuk soluk">{sayilan} / {r.katilan} oy sayıldı</p>
      {!bitti && <p className="oy-akisi">{oylar.at(-1)?.kim ?? "Yoklama tamamlandı"} · {oylar.at(-1)?.oy === "evet" ? "evet" : oylar.at(-1)?.oy === "hayir" ? "ret" : "çekimser"}</p>}
      {fireler.map(v => <aside className="ihanet" key={v.kim}><Muhur>Son dakika firesi</Muhur><p><b>{v.kim}</b>, evet sözüne rağmen ret oyu verdi. Grup başkanvekilinin notunda hâlâ adı evet sütununda.</p></aside>)}
      {bitti && <div className="oylama-sonuc" role="status"><Muhur ton={r.sonuc === "ret" ? "kirmizi" : "yesil"}>{r.sonuc === "ret" ? "Reddedildi" : r.sonuc === "halkoylamasi" ? "Halkoylamasına" : "Kabul edildi"}</Muhur><p>Partiler tutanağı aldı. Sabah gazeteleri aynı sonucu farklı okuyacak.</p></div>}
      <div className="dosya-alt">{!bitti && <button type="button" className="dugme ikincil" onClick={() => setSayilan(r.oylar.length)}>Sayımı tamamla</button>}<button type="button" className="dugme birincil" onClick={onKapat}>{bitti ? "Devam et" : "Sayımı atla"}</button></div>
    </article>
  </Pencere>;
}
