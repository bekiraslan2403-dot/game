import type { OyunDurumu } from "../cekirdek/durum.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { tutarYaz } from "./bicim.ts";

export function SantiyeIzleme({ d }: { d: OyunDurumu }) {
  const p = d.santiye;
  if (!p) return <aside className="inceleme-giris" aria-label="Şantiye başlangıcı"><p className="ust-etiket">Bölüm III · Şantiye</p><p>Ücret, protokol, yapım ve teknik kabul henüz ayrı kararlara bağlı. Rapor tek başına köprüyü açmaz.</p></aside>;
  const asama = { protokol: "Protokol kararlaştırıldı", hazirlik: "İş hazırlığı", yapim: "Yapım sürüyor", fiziksel_teslim: "Fiziksel teslim alındı", kabul_bekliyor: "Bağımsız deney", kabul: "Teknik kabul verildi", durduruldu: "Şantiye durduruldu" }[p.asama];
  return <section className="inceleme-izleme santiye-izleme" aria-label="Akköprü şantiye kaydı">
    <p className="ust-etiket">Bölüm III · Şantiye ve sorumluluk</p>
    <h3>{asama}</h3><p>{p.izler.at(-1)?.metin}</p>
    <dl className="inceleme-durumlar"><div><dt>İşçi alacağı</dt><dd>{p.ucret === "odendi" ? "Doğrulanan tutar ödendi" : "Ödeme bekliyor"}</dd></div><div><dt>Yüklenici</dt><dd>{p.yuklenici === "yeni" ? "Yeni ekip" : p.yuklenici === "eski" ? "Eski şirket" : "Seçilmedi"}</dd></div><div><dt>Güvenlik</dt><dd>{p.asama === "kabul" ? "Bağımsız kabul" : p.teknik === "eksik" ? "Deney eksik buldu" : p.teknik === "uygun" ? "Deney uygun; kabul bekliyor" : "Teknik kabul yok; yol kapalı"}</dd></div></dl>
    {p.isAy !== null && <p className="inceleme-ek">Sonraki teslim veya deney: {tarihAdi(p.isAy)}. Takvimdeki tarih kabul anlamına gelmez.</p>}
    <details className="anlati-belgeler"><summary>Protokol ve işlem geçmişi</summary><p>Protokol: {{ yok: "Yok", ayri_teminat: "Teminat ayrıldı; tahsilat bekliyor", kosullu: "Şartlı", dava: "Alacak davası" }[p.protokol]}. Eski şirketin sorumluluğu {p.sorumluluk === "sakli" ? "saklı" : "protokolde zayıflatıldı"}.</p><p>Korunan numune: {p.numune ? "var" : "yok"}. Fiilî geçici kamu gideri: {tutarYaz(p.harcamaTL / 1e12)}.</p><ol className="inceleme-tutanak">{p.izler.map((x, i) => <li key={i}><span className="veri">{tarihAdi(x.ay)}</span><p>{x.metin}</p></li>)}</ol></details>
  </section>;
}
