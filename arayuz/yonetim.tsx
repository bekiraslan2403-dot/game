import { SahaProgrami, SahaIzleme } from "./saha.tsx";
import type { MasaKarti } from "../cekirdek/durum.ts";
import { sahneSorusu, sahneCevaplari } from "../cekirdek/sahne-derinlik.ts";
import { Ikon } from "./ikon.tsx";
import { useEffect, useState } from "react";
import type { OyunDurumu } from "../cekirdek/durum.ts";
import type { Oyun } from "./useOyun.ts";
import { ICERIK } from "./icerik.ts";
import { Muhur, Pencere, KisiRozeti } from "./bilesenler.tsx";
import { SabahGazeteleri } from "./toplum.tsx";
import { GOSTERGELER, duzeySozu } from "../cekirdek/gostergeler.ts";
import { HIZIPLER } from "../cekirdek/meclis-icerik.ts";
import {
  BASIN_CEVAPLARI,
  MEDYA_ARACLARI,
  halkTvArsivNotu,
  mahkemeEngeli,
  type MedyaAraci,
} from "../cekirdek/medya.ts";
import {
  kasaSozu,
  SLOGANLAR,
  MITING_SORULARI,
  MUNAZARA_SORULARI,
  SAHNE_CEVAPLARI,
  sonsoz,
} from "../cekirdek/secim.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { HafizaIzleme } from "./hafiza.tsx";

type Props = { d: OyunDurumu; oyun: Oyun; onKapat: () => void };
function Mesaj({ oyun }: { oyun: Oyun }) {
  return oyun.mesaj ? (
    <p className="uyari" role="status">
      {oyun.mesaj}
    </p>
  ) : null;
}
function Ust({
  ad,
  d,
  onKapat,
}: {
  ad: string;
  d: OyunDurumu;
  onKapat: () => void;
}) {
  return (
    <header className="dosya-ust">
      <div>
        <p className="ust-etiket">{tarihAdi(d.ay)} · Cumhurbaşkanlığı</p>
        <h3 className="dosya-baslik">{ad}</h3>
      </div>
      <button
        className="kapat"
        onClick={onKapat}
        aria-label={`${ad} ekranını kapat`}
      >
        ×
      </button>
    </header>
  );
}
export function GundemEkrani({ d, oyun, onKapat }: Props) {
  const [arac, setArac] = useState<MedyaAraci>("reklam");
  const m = d.yonetim.medya;
  return (
    <Pencere baslik="Gündem" onKapat={onKapat} genis>
      <article className="tam-ekran gundem">
        <Ust ad="Gündem" d={d} onKapat={onKapat} />
        <p className="soluk">
          Kararlar aynı, anlatanlar farklı. Yayın çizgileri sahiplik ve
          müdahalelerle değişir.
        </p>
        {d.yonetim.ifsa && (
          <aside className="ihanet">
            <Muhur>Belge sızdı</Muhur>
            <p>{d.yonetim.ifsa.kaynak}</p>
            <p className="kucuk">
              Masadaki “Sızan dosyaya yanıt” kararı açıklamanızı bekliyor.
            </p>
          </aside>
        )}
        <section>
          <h4>Seçmenin gündemi</h4>
          <ol className="konu-listesi">
            {m.konular.map((k, i) => (
              <li key={k.id}>
                <span className="veri">0{i + 1}</span>
                <b>{k.ad}</b>
                <span className="soluk kucuk">
                  {i === 0
                    ? "En çok konuşulan"
                    : i < 3
                      ? "Öne çıkıyor"
                      : "Takip ediliyor"}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <SabahGazeteleri d={d} />
        <section>
          <h4>Akşam bültenleri</h4>
          <div className="uc-sutun">
            {ICERIK.medya?.kuruluslar
              .filter((k) => k.tur === "kanal")
              .map((k) => {
                const arsivNotu = k.id === "halk_tv" ? halkTvArsivNotu(d) : undefined;
                const kapali = k.id === "halk_tv" && d.bayraklar.mahkeme_yayin_durumu === "kapali";
                return (
                  <article className="kutu" key={k.id}>
                    <span className="ust-etiket">{kapali ? "Arşiv kapalı" : "Yayında"} · {k.ad}</span>
                    {arsivNotu && <p className="kucuk" role="status">{arsivNotu}</p>}
                    {!kapali && <p>
                      {m.bultenler.find((b) => b.kanal === k.id)?.metin ??
                        "Yeni kararların ardından akşam bülteni hazırlanacak."}
                    </p>}
                  </article>
                );
              })}
          </div>
        </section>
        <div className="iki-sutun">
          <section>
            <h4>Medya kuruluşları</h4>
            <label className="alan">
              Müdahale aracı
              <select
                aria-label="Müdahale aracı"
                value={arac}
                onChange={(e: { target: { value: string } }) =>
                  setArac(e.target.value as MedyaAraci)
                }
              >
                {MEDYA_ARACLARI.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ad}
                  </option>
                ))}
              </select>
            </label>
            <p className="kucuk soluk">
              {MEDYA_ARACLARI.find((a) => a.id === arac)?.bedel}
            </p>
            <ul className="kurulus-listesi">
              {ICERIK.medya?.kuruluslar.map((k) => {
                const c = m.cizgi[k.id] ?? k.cizgi;
                const tedbir = mahkemeEngeli(d, k.id, arac);
                return (
                  <li key={k.id}>
                    <div>
                      <b>{k.ad}</b>
                      <p className="kucuk soluk">
                        {k.sahip} ·{" "}
                        {c > 20
                          ? "Hükümete yakın"
                          : c < -20
                            ? "Muhalif"
                            : "Dengeli"}
                      </p>
                      {tedbir && <p className="kucuk soluk">{tedbir}</p>}
                    </div>
                    <button
                      className="dugme ikincil"
                      disabled={
                        !!tedbir || m.hamleler[`${k.id}:${arac}`] === d.ay ||
                        (k.id === "devlet" &&
                          ["ihale", "kayyum"].includes(arac))
                      }
                      onClick={() => oyun.medya(k.id, arac)}
                    >
                      {m.hamleler[`${k.id}:${arac}`] === d.ay
                        ? "Uygulandı"
                        : "Uygula"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h4>Sosyal medya</h4>
            <p className="ust-etiket">
              #{m.konular[0]?.id ?? "doruk"} · Kurgusal kullanıcılar
            </p>
            <div className="sosyal-akis">
              {m.akis.length ? (
                m.akis.slice(0, 16).map((a, i) => (
                  <article className="paylasim" key={i}>
                    <b>{a.kim}</b>
                    <p>{a.metin}</p>
                    <span className="kucuk soluk">
                      {a.begeni.toLocaleString("tr")} beğeni ·{" "}
                      {a.paylasim.toLocaleString("tr")} paylaşım ·{" "}
                      {tarihAdi(a.ay)}
                    </span>
                  </article>
                ))
              ) : (
                <p className="soluk">
                  İlk kararınızdan sonra yurttaşların tepkileri burada
                  görünecek.
                </p>
              )}
            </div>
          </section>
        </div>
        <section className="sahne-davet">
          <div>
            <h4>Basın toplantısı</h4>
            <p>
              Beş gazeteciden üç soru. Ayın gündemi ve eski açıklamalarınız
              masaya gelir.
            </p>
          </div>
          <button
            className="dugme birincil"
            disabled={d.meclis.sahneAy === d.ay}
            onClick={oyun.basinAc}
          >
            {d.meclis.sahneAy === d.ay
              ? "Ayın sahnesi kullanıldı"
              : "Kürsüye çık"}
          </button>
        </section>
        <Mesaj oyun={oyun} />
        <button className="dugme ikincil" onClick={onKapat}>
          Masaya dön
        </button>
      </article>
    </Pencere>
  );
}
export function AjandaEkrani({ d, oyun, onKapat, onAc }: Props & { onAc: (m: MasaKarti) => void }) {
  const [grup, setGrup] = useState("grup.genc"),
    [kurum, setKurum] = useState("hazine");
  const buAy = d.yonetim.ajanda.filter((a) => a.ay === d.ay),
    yapildi = (tur: string) => buAy.some((a) => a.tur === tur);
  const adlar: Record<string, string> = {
    hazine: "Hazine ve Maliye",
    adalet: "Yargı kurulu",
    merkez_bankasi: "Merkez Bankası",
    istatistik: "İstatistik Kurumu",
    cevre: "Çevre ve Konut",
    icisleri: "İçişleri",
  };
  return (
    <Pencere baslik="Ajanda" onKapat={onKapat} genis>
      <article className="tam-ekran ajanda">
        <Ust ad="Ajanda" d={d} onKapat={onKapat} />
        <div className="gunler" aria-label={`${d.bosGun} boş gün`}>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={n <= 4 - d.bosGun ? "dolu" : ""}>
              {n <= 4 - d.bosGun ? "Kullanıldı" : "Boş gün"}
              <b>0{n}</b>
            </span>
          ))}
        </div>
        <p className="soluk">
          Dört gün ve bir sahne. İkinci görüşler, kabuller ve faaliyetler aynı
          takvimden harcar.
        </p>
        <div className="iki-sutun">
          <SahaProgrami d={d} oyun={oyun} onAc={onAc} onKapat={onKapat}/>
          <section className="kutu">
            <h4>Özel anket</h4>
            <label className="alan">
              Seçmen grubu
              <select
                aria-label="Seçmen grubu"
                value={grup}
                onChange={(e: { target: { value: string } }) =>
                  setGrup(e.target.value)
                }
              >
                {GOSTERGELER.filter((g) => g.alan === "secmen").map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.ad}
                  </option>
                ))}
              </select>
            </label>
            <p className="kucuk soluk">
              1 gün · Sonuç danışman notuna yazılır; örneklemin yanılma payı
              vardır.
            </p>
            <button
              className="dugme ikincil"
              disabled={!d.bosGun || yapildi("anket")}
              onClick={() => oyun.faaliyet("anket", grup)}
            >
              Anket yaptır
            </button>
          </section>
          <section className="kutu">
            <h4>Temsilcilerle görüşme</h4>
            <p className="kucuk soluk">
              Her görüşme 1 gün. İki kesimin öncelikleri aynı değil.
            </p>
            <button
              className="dugme ikincil"
              disabled={!d.bosGun || yapildi("sendika")}
              onClick={() => oyun.faaliyet("sendika", "")}
            >
              İşçi temsilcilerini dinle
            </button>
            <button
              className="dugme ikincil"
              disabled={!d.bosGun || yapildi("is_dunyasi")}
              onClick={() => oyun.faaliyet("is_dunyasi", "")}
            >
              İş dünyasıyla görüş
            </button>
          </section>
          <section className="kutu">
            <h4>Uygulama takibi</h4>
            <p className="kucuk soluk">
              {d.yonetim.uygulamalar.length} iş uygulama bekliyor. Toplantı
              kalan işleri bu ayın sonuna çeker; bakanlar üzerindeki gerilim
              artar.
            </p>
            <button
              className="dugme ikincil"
              disabled={
                !d.bosGun || yapildi("takip") || !d.yonetim.uygulamalar.length
              }
              onClick={() => oyun.faaliyet("takip", "")}
            >
              Takip toplantısı yap
            </button>
          </section>
        </div>
        <section>
          <h4>Partinin üç sesi</h4>
          <div className="uc-sutun">
            {HIZIPLER.map((h) => (
              <article className="kutu" key={h.id}>
                <b>{h.ad}</b>
                <p className="kucuk soluk">
                  Görüşme bu kanadı yakınlaştırır; diğerleri ayrıcalık
                  eleştirir. 1 gün.
                </p>
                <button
                  className="dugme ikincil"
                  disabled={
                    !d.bosGun ||
                    buAy.some((a) => a.tur === "hizip" && a.hedef === h.id)
                  }
                  onClick={() => oyun.hizip(h.id)}
                >
                  Örgütle görüş
                </button>
              </article>
            ))}
          </div>
        </section>
        <section className="kutu">
          <h4>Atama dosyası iste</h4>
          <label className="alan">
            Görev
            <select
              aria-label="Görev"
              value={kurum}
              onChange={(e: { target: { value: string } }) =>
                setKurum(e.target.value)
              }
            >
              {Object.keys(d.yonetim.kurumlar).map((id) => (
                <option key={id} value={id}>
                  {adlar[id]}
                </option>
              ))}
            </select>
          </label>
          <p className="kucuk soluk">
            Bir imza ayrılır; adaylar karar kartıyla masaya gelir. Liyakat,
            uygulama hızını; sadakat, baskıya verilen yanıtı etkiler.
          </p>
          <button
            className="dugme ikincil"
            disabled={d.imza >= 3 || yapildi("atama")}
            onClick={() => {
              if (oyun.atama(kurum).ok) onKapat();
            }}
          >
            Dosyayı masaya getir
          </button>
        </section>
        {buAy.length > 0 && (
          <section>
            <h4>Bu ayın notları</h4>
            <ul className="kararlar-listesi">
              {buAy.map((a, i) => (
                <li key={i}>{a.metin}</li>
              ))}
            </ul>
          </section>
        )}
        <Mesaj oyun={oyun} />
        <button className="dugme birincil" onClick={onKapat}>
          Masaya dön
        </button>
      </article>
    </Pencere>
  );
}
export function UlkeHaritasi({ d }: { d: OyunDurumu }) {
  const [il, setIl] = useState("Akköprü");
  const sehir = ICERIK.sehirler.find((s) => s.ad === il)!;
  const eylemler = d.toplum.eylemler.filter((e) => e.il === il),
    b = d.yonetim.bolgeler[il];
  const konum: Record<string, [number, number]> = {
    Yalıkent: [70, 140],
    Karaburç: [95, 220],
    Zeytinova: [155, 90],
    Kumsal: [145, 175],
    Akköprü: [300, 135],
    Taşhan: [320, 225],
    Yeşilyaka: [330, 65],
    Dereboyu: [435, 70],
    Turunçlu: [215, 250],
    Yanıkkale: [440, 235],
    Serhatkent: [525, 115],
    Ilıcadağ: [535, 205],
  };
  return (
    <section className="harita-bolum">
      <h4>Doruk Cumhuriyeti</h4>
      <p className="kucuk soluk">
        Yerleşim şeması · Bir şehir seçerek yerel notları açın.
      </p>
      <svg viewBox="0 0 620 300" className="ulke-harita" aria-hidden="true">
        <path
          d="M22 140 65 75 170 30 255 55 335 23 460 48 560 65 596 140 565 238 470 270 365 245 285 275 168 260 80 220Z"
          fill="var(--kart-2)"
          stroke="var(--cizgi-koyu)"
          strokeWidth="2"
        />
        {ICERIK.sehirler.map((s, i) => {
          const [x, y] = konum[s.ad] ?? [300, 150];
          const e = d.toplum.eylemler.some((e) => e.il === s.ad);
          return (
            <g key={s.ad}>
              <circle
                cx={x}
                cy={y}
                r={s.ad === il ? 17 : 12}
                fill={
                  e
                    ? "var(--muhur)"
                    : s.ad === il
                      ? "var(--mavi)"
                      : "var(--soluk)"
                }
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill="var(--kart)"
                fontSize="11"
              >
                {i + 1}
              </text>
              <text
                x={x}
                y={y + 32}
                textAnchor="middle"
                fill="var(--murekkep)"
                fontSize="12"
              >
                {s.ad}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="harita-sehirler">
        {ICERIK.sehirler.map((s, i) => (
          <button
            className="dugme ikincil"
            key={s.ad}
            aria-pressed={s.ad === il}
            onClick={() => setIl(s.ad)}
          >
            {i + 1}. {s.ad}
            {d.toplum.eylemler.some((e) => e.il === s.ad) ? " · Eylem" : ""}
          </button>
        ))}
      </div>
      <article className="kutu">
        <h4>{il}</h4>
        <p>
          {sehir.belediye === "iktidar" ? "İktidar" : "Muhalefet"} belediyesi
        </p>
        <p>
          {b?.ziyaret
            ? `Son ziyaret: ${tarihAdi(b.ziyaret)}`
            : ICERIK.saha?.some(t => t.il === il) ? "Bu dönem ziyaret edilmedi. Ajandadan saha ziyareti planlanabilir." : "Bu şehir için ajandada açık bir saha dosyası bulunmuyor."}
        </p>
        {ICERIK.saha?.filter(t => t.il === il && d.saha[t.id]).map(t => <SahaIzleme key={t.id} d={d} t={t}/>)}
        {eylemler.map((e) => (
          <p key={e.id}>
            Eylem: {e.emniyet.toLocaleString("tr")} /{" "}
            {e.duzenleyici.toLocaleString("tr")} kişi (emniyet / düzenleyici).
          </p>
        ))}
      </article>
    </section>
  );
}
export function BasinSahnesi({ d, oyun }: { d: OyunDurumu; oyun: Oyun }) {
  const b = d.yonetim.medya.basin!;
  const soru = b.sorular[b.adim],
    gazeteci = ICERIK.medya?.gazeteciler.find((g) => g.id === soru?.kim);
  return (
    <Pencere baslik="Basın toplantısı" genis>
      <article className="tam-ekran basin-sahnesi">
        <div className="basin-fon">
          <Muhur><Ikon ad="mikrofon" boy={16}/>Canlı yayın</Muhur>
          <p className="ust-etiket">Cumhurbaşkanlığı basın odası</p>
          <h3 className="dosya-baslik">
            {b.adim < 3 ? `${b.adim + 1}. soru` : "Toplantı sona erdi"}
          </h3>
          <div className="mikrofonlar" aria-hidden="true">
            ● │ ● │ ●
          </div>
        </div>
        {soru && gazeteci ? (
          <>
            <div className="vekil-kim">
              <KisiRozeti
                kisi={{ ...gazeteci, rol: gazeteci.kurulus, yetkinlik: 0.8 }}
                boy={64}
              />
              <div>
                <b>{gazeteci.ad}</b>
                <p className="soluk">{gazeteci.kurulus}</p>
              </div>
            </div>
            <blockquote className="haber-alinti">{soru.soru}</blockquote>
            <div className="iki-sutun">
              {BASIN_CEVAPLARI.map((c) => (
                <button
                  key={c.id}
                  className="secenek"
                  onClick={() => oyun.basinCevap(c.id)}
                >
                  <b>{c.ad}</b>
                  <span className="kucuk soluk">{c.not}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>
              Yanıtlarınız kayıt altına alındı. Yayınlar ve sosyal medya
              tepkileri Gündem'de.
            </p>
            <button className="dugme birincil" onClick={oyun.basinKapat}>
              Masaya dön
            </button>
          </>
        )}
        {b.adim > 0 && (
          <section className="kutu" aria-live="polite">
            <h4>Toplantı tutanağı</h4>
            {b.sorular
              .filter((s) => s.sonuc)
              .map((s, i) => (
                <p key={i}>{s.sonuc}</p>
              ))}
          </section>
        )}
        <Mesaj oyun={oyun} />
      </article>
    </Pencere>
  );
}
export function KampanyaEkrani({ d, oyun, onKapat }: Props) {
  const [grup, setGrup] = useState("grup.genc");
  const s = d.yonetim.secim;
  return (
    <Pencere baslik="Kampanya karargâhı" onKapat={onKapat} genis>
      <article className="tam-ekran kampanya">
        <Ust ad="Kampanya karargâhı" d={d} onKapat={onKapat} />
        <Muhur>Son üç ay</Muhur>
        <p>
          Rakip aday: <b>{s.rakip}</b> · Parti kasası <b>{kasaSozu(s.kasa)}</b>{" "}
          · Takvimde {d.bosGun} boş gün
        </p>
        {d.bayraklar.akkopru_oynandi && <HafizaIzleme d={d} />}
        <section>
          <h4>Ana mesaj</h4>
          {s.slogan ? (
            <blockquote className="haber-alinti">{s.slogan}</blockquote>
          ) : (
            <div className="uc-sutun">
              {SLOGANLAR.map((a) => (
                <button
                  className="secenek"
                  key={a}
                  onClick={() => oyun.slogan(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          <p className="soluk kucuk">
            Mesajınız geçmiş kararlarınızla çelişirse alaya alınır.
          </p>
        </section>
        <label className="alan">
          Hedef seçmen
          <select
            aria-label="Hedef seçmen"
            value={grup}
            onChange={(e: { target: { value: string } }) =>
              setGrup(e.target.value)
            }
          >
            {GOSTERGELER.filter((g) => g.alan === "secmen").map((g) => (
              <option key={g.id} value={g.id}>
                {g.ad}
              </option>
            ))}
          </select>
        </label>
        <div className="uc-sutun">
          {[
            {
              id: "reklam",
              ad: "Reklam filmi",
              metin: "1 gün ve yüksek kasa gideri. Mesaj ters tepebilir.",
            },
            {
              id: "kapi",
              ad: "Kapı kapı çalışma",
              metin:
                "1 gün ve sınırlı kasa gideri. Daha küçük, daha güvenli etki.",
            },
            {
              id: "kamu",
              ad: "Kamu açılışı",
              metin:
                "1 gün, kasa gideri ve usulsüzlük kaydı. Kamu kaynağı tartışması.",
            },
          ].map((a) => (
            <button
              className="secenek"
              key={a.id}
              disabled={!d.bosGun || (s.tekrar[`${d.ay}:${a.id}`] ?? 0) >= 2}
              onClick={() =>
                oyun.kampanya(a.id as "reklam" | "kapi" | "kamu", grup)
              }
            >
              <b>{a.ad}</b>
              <span className="kucuk soluk">{a.metin}</span>
            </button>
          ))}
        </div>
        <div className="iki-sutun">
          <button
            className="secenek"
            disabled={d.meclis.sahneAy === d.ay || !d.bosGun}
            onClick={() => oyun.kampanyaAc("miting")}
          >
            <b>Miting düzenle</b>
            <span className="kucuk soluk">
              Üç bölümlü sahne · 1 gün, kasa ve ayın sahnesi.
            </span>
          </button>
          <button
            className="secenek"
            disabled={d.meclis.sahneAy === d.ay || !d.bosGun}
            onClick={() => oyun.kampanyaAc("munazara")}
          >
            <b>Rakiple münazaraya çık</b>
            <span className="kucuk soluk">
              Dört soru · 1 gün, kasa ve ayın sahnesi.
            </span>
          </button>
        </div>
        <p className="soluk kucuk">
          Aynı aracın ay içindeki ikinci kullanımının etkisi yarıya iner.
          Kampanya, bütün dönemin sonuçlarını tamamen silemez.
        </p>
        <Mesaj oyun={oyun} />
        <button className="dugme birincil" onClick={onKapat}>
          Masaya dön
        </button>
      </article>
    </Pencere>
  );
}
export function KampanyaSahnesi({ d, oyun }: { d: OyunDurumu; oyun: Oyun }) {
  const s = d.yonetim.secim.sahne!,
    sorular = s.tur === "miting" ? MITING_SORULARI : MUNAZARA_SORULARI;
  const bitti = s.adim >= sorular.length;
  return (
    <Pencere baslik={s.tur === "miting" ? "Miting" : "Münazara"} genis>
      <article className="tam-ekran kampanya-sahnesi">
        <Muhur><Ikon ad="mikrofon" boy={16}/>Canlı yayın</Muhur>
        <h3 className="dosya-baslik">
          {s.tur === "miting" ? "Meydan sizin" : "İki aday, aynı masa"}
        </h3>
        <p className="soluk">
          {d.yonetim.secim.rakip} ve kampanya ekibi her sözü takip ediyor.
        </p>
        {!bitti ? (
          <>
            <p className="ust-etiket">
              {s.adim + 1} / {sorular.length}
            </p>
            <blockquote className="haber-alinti">{sahneSorusu(d,s.tur,s.adim)}</blockquote>
            <div className="uc-sutun">
              {sahneCevaplari(d,s.tur,s.adim).map((c, i) => (
                <button
                  className="secenek"
                  key={c}
                  onClick={() => oyun.kampanyaSec(i)}
                >
                  {c}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p>
              Yayın sona erdi. Verdiğiniz sözler Hazine'de, sahadaki yankıları
              ayın notlarında.
            </p>
            <button className="dugme birincil" onClick={oyun.kampanyaKapat}>
              Karargâha dön
            </button>
          </>
        )}
        <ul className="kararlar-listesi">
          {d.buAy.olaylar
            .filter((o) =>
              o.startsWith(s.tur === "miting" ? "Miting:" : "Münazara:"),
            )
            .map((m, i) => (
              <li key={i}>{m}</li>
            ))}
        </ul>
        <Mesaj oyun={oyun} />
      </article>
    </Pencere>
  );
}
export function SecimGecesi({ d, oyun }: { d: OyunDurumu; oyun: Oyun }) {
  const g = d.yonetim.secim.gece!;
  const [adim, setAdim] = useState(0),
    son = adim >= g.akis.length - 1,
    a = g.akis[Math.min(adim, g.akis.length - 1)]!;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAdim(g.akis.length - 1);
      return;
    }
    const id = window.setInterval(
      () => setAdim((n) => Math.min(g.akis.length - 1, n + 1)),
      1800,
    );
    return () => window.clearInterval(id);
  }, [g.tur]);
  return (
    <main className="secim-gecesi">
      <div className="secim-baslik">
        <Muhur>Seçim gecesi · {g.tur}. tur</Muhur>
        <h1>Doruk kararını veriyor</h1>
        <p>
          Katılım %
          {g.katilim.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} ·{" "}
          {tarihAdi(d.ay)}
        </p>
      </div>
      <div className="ajanslar" aria-live="polite">
        <section className="kutu">
          <p className="ust-etiket">Doruk Ajansı · Size verilen oy</p>
          <b className="buyuk-rakam veri">
            %
            {a.ajansA.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </b>
        </section>
        <section className="kutu">
          <p className="ust-etiket">Özgür Haber · Size verilen oy</p>
          <b className="buyuk-rakam veri">
            %
            {a.ajansB.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </b>
        </section>
      </div>
      <progress max={100} value={a.acilan} aria-label="Açılan sandıklar" />
      <p>Açılan sandık: %{a.acilan}</p>
      <blockquote className="haber-alinti">{a.not}</blockquote>
      {!son && (
        <button
          className="dugme ikincil"
          onClick={() => setAdim(g.akis.length - 1)}
        >
          Sayımı tamamla
        </button>
      )}
      {son && (
        <section className="secim-sonucu">
          <h2>Sayım tamamlandı</h2>
          <p>
            Siz: %
            {g.oy.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            · {d.yonetim.secim.rakip}: %
            {g.rakipOy.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            {g.diger > 0
              ? ` · Diğer: %${g.diger.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : ""}
          </p>
          {g.ikinciTur ? (
            <>
              <h3>İkinci tur: iki hafta kaldı</h3>
              <p>
                Hiçbir aday geçerli oyların yarısından fazlasını alamadı. Üçüncü
                adayın seçmenine nasıl ulaşacaksınız?
              </p>
              <div className="uc-sutun">
                {[
                  "Politika taviziyle ittifak teklif et",
                  "Kararsız seçmene ortak gelecek çağrısı yap",
                  "Rakibin programına saldır",
                ].map((s, i) => (
                  <button
                    className="secenek"
                    key={i}
                    onClick={() => oyun.ikinciTur(i)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p>
                {g.itiraz
                  ? "Fark bir puanın altında; itiraz sahnesi açıldı."
                  : "Seçim kurulu geçerli oyların sayımını duyurdu."}
              </p>
              <button
                className="dugme birincil"
                onClick={() => oyun.secimiBitir("kabul")}
              >
                Sonucu kabul et
              </button>
              {g.itiraz && (
                <>
                  <button
                    className="dugme ikincil"
                    onClick={() => oyun.secimiBitir("sayim")}
                  >
                    Yeniden sayım iste
                  </button>
                  <button
                    className="dugme ikincil"
                    onClick={() => oyun.secimiBitir("tanima")}
                  >
                    Sonucu tanıma · Anayasal kriz riski
                  </button>
                </>
              )}
            </>
          )}
          <section>
            <h3>Beş hayatın seçim gecesi</h3>
            {g.hayatlar.map((h) => (
              <article className="paylasim" key={h.kim}>
                <b>{h.kim}</b>
                <p>{h.metin}</p>
              </article>
            ))}
          </section>
        </section>
      )}
      <Mesaj oyun={oyun} />
    </main>
  );
}
export function SonsOz({ d }: { d: OyunDurumu }) {
  const adlar = {
    yeniden_secilme: "Bir dönem daha",
    yenilgi: "Devir teslim",
    devrilme: "Anayasal kriz",
    istifa: "Sessiz çıkış",
  };
  return (
    <main className="sonsoz">
      <Muhur>Dönem kapandı</Muhur>
      <h1>{adlar[d.bitis!.tur]}</h1>
      <p className="buyuk-metin">{d.bitis!.aciklama}</p>
      <h2>Beş yıl sonra</h2>
      {sonsoz(d).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <h2>Beş hayattan kalanlar</h2>
      {ICERIK.hayatlar.map((h) => (
        <article className="paylasim" key={h.id}>
          <b>{h.ad}</b>
          <p>
            {d.toplum.hayatlar[h.id]?.son[0]?.metin ??
              "Dönemin kararlarını kendi hayatında taşıdı."}
          </p>
          <p className="kucuk soluk">
            {d.toplum.hayatlar[h.id]?.ayrildi
              ? "Bir daha eski adresinde bulunamadı."
              : (d.gostergeler[h.grup] ?? 48) > 55
                ? "Sonraki yıllara daha umutlu girdi."
                : "Yeni dönemde de güvenceli bir hayat aramaya devam etti."}
          </p>
        </article>
      ))}
      <p className="soluk">
        {d.gecmis.length} aylık rapor,{" "}
        {d.gecmis.reduce((t, a) => t + a.kararlar.length, 0)} karar. Yeni dönem
        başlatmak veya eski kayda dönmek için Menü'yü açabilirsiniz.
      </p>
    </main>
  );
}
