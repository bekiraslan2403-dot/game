import type { OyunDurumu } from "../cekirdek/durum.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { tutarYaz } from "./bicim.ts";

export function IncelemeGiris({ d }: { d: OyunDurumu }) {
  if (d.inceleme) return null;
  const ham = d.bayraklar.akkopru_ham_veri === true;
  const deniz = d.acilis?.deniz;
  return <aside className="inceleme-giris" aria-label="İlk günden devralınanlar">
    <p className="ust-etiket">İlk günden devralınanlar</p>
    <p><b>Ölçüm:</b> {ham ? "Teslim tutanaklı ham kopya arşivde. Yeni heyet aynı kaydı inceleyebilir." : "Ham kayıt kopyası teslim alınmadı. Bir tanığın anlatımı eski ölçüm serisini yeniden oluşturmaz."}</p>
    <p><b>Deniz:</b> {deniz === "gorevden_cekildi" ? "Ölçümden çekildi. Yeni beyanı için avukatı üzerinden görüşme talep edebiliriz." : deniz === "baski_altinda" ? "Ölçümde baskı altında. İtirazı ile bakanın değerlendirmesi aynı görüş değil." : deniz === "gorevde" ? "Ölçüm görevinde kaldı. Bu inceleme için ayrıca imzalı beyanı istenebilir." : "Eski karar kaydı korunuyor. Bu dosya için yeni ifade verilmiş sayılmıyor."}</p>
  </aside>;
}
export function IncelemeIzleme({ d }: { d: OyunDurumu }) {
  const p = d.inceleme;
  if (!p) return null;
  const yol = { bagimsiz: "Bağımsız heyet", bakanlik: "Bakanlık incelemesi", onarim: "Onarım hazırlığı" }[p.yol];
  const yayin = { bekliyor: "Henüz yayımlanmadı", acik: "Ara rapor kamuya açık", sinirli: "Sınırlı açıklama ve ayrı işlem", kapali: "Kamuya açıklanmadı" }[p.yayin];
  return <section className="inceleme-izleme" aria-label="Akköprü inceleme kaydı">
    <p className="ust-etiket">Akköprü · Bölüm II · {p.asama === "bekliyor" ? "Rapor bekleniyor" : p.asama === "rapor" ? "Rapor masada" : "Verilmiş kararın kaydı"}</p>
    <h3>{p.sonuc?.baslik ?? (p.asama === "bekliyor" ? `${yol}: ${tarihAdi(p.raporAy)} teslimi` : p.rapor!.baslik)}</h3>
    {p.sonuc ? <p>{p.sonuc.metin}</p> : p.asama === "bekliyor" ? <p>Görevlendirme kayda geçti. Rapor teslim edilmeden bulgu veya güvenli geçiş onayı verilmiş sayılmaz.</p> : <>
      <ul className="inceleme-bulgular">{p.rapor!.bulgular.map((b, i) => <li key={i}>{b}</li>)}</ul>
      <details className="anlati-belgeler"><summary>Raporun eksikleri ve sınırları</summary><ul className="inceleme-bulgular">{p.rapor!.eksikler.map((e, i) => <li key={i}>{e}</li>)}</ul></details>
      {p.tanikBeyani && !p.rapor!.tanikBeyani && <p className="inceleme-ek">Raporun tesliminden sonra Deniz’in imzalı beyanı ayrı ek olarak alındı. Raporun ilk teslim hâli ve teknik eksikleri değişmedi.</p>}
    </>}
    <dl className="inceleme-durumlar"><div><dt>Teknik arşiv</dt><dd>{p.hamKayit ? "Ham kopya korunuyor" : "İlk gece serisi eksik"}</dd></div><div><dt>Tanık</dt><dd>{p.tanikBeyani ? "İmzalı beyan teslim edildi" : "Yeni beyan alınmadı"}</dd></div><div><dt>Yayın</dt><dd>{yayin}</dd></div></dl>
    {p.asama === "tamam" && p.rapor && <details className="anlati-belgeler"><summary>Teslim edilen rapor</summary><p><b>{p.rapor.baslik}</b></p><ul className="inceleme-bulgular">{[...p.rapor.bulgular, ...p.rapor.eksikler].map((b, i) => <li key={i}>{b}</li>)}</ul></details>}
    {!!p.oncekiRaporlar.length && <details className="anlati-belgeler"><summary>Önceki rapor teslimleri · {p.oncekiRaporlar.length}</summary>{p.oncekiRaporlar.map((r, i) => <section key={i}><p><b>{tarihAdi(r.ay)} · {r.rapor.baslik}</b></p><ul className="inceleme-bulgular">{[...r.rapor.bulgular, ...r.rapor.eksikler].map((b, j) => <li key={j}>{b}</li>)}</ul></section>)}</details>}
    <details className="anlati-belgeler"><summary>İncelemenin işlem kaydı</summary><ol className="inceleme-tutanak">{p.izler.map((x, i) => <li key={i}><span className="veri">{tarihAdi(x.ay)}</span><p>{x.metin}</p></li>)}</ol><p className="kucuk soluk">Bu inceleme için gerçekleşmiş tek seferlik ödeme: {tutarYaz(p.harcamaTL / 1e12)}.</p></details>
  </section>;
}
