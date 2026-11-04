import type { OyunDurumu } from "../cekirdek/durum.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { tutarYaz } from "./bicim.ts";

export function HesaplasmaIzleme({ d }: { d: OyunDurumu }) {
  const p = d.hesaplasma;
  if (!p) return <aside className="inceleme-giris" aria-label="Kazadan devralınanlar">
    <p className="ust-etiket">Bölüm IV · İnsanlar ve hesap</p>
    <p><b>Ham ölçüm:</b> {d.inceleme?.hamKayit || d.bayraklar.akkopru_ham_veri === true ? "Teslim edilen kopya arşivde." : "İlk gecenin ölçüm serisi teslim alınmadı."} İmzalı beyan varsa ayrı tarihle korunur. Yeni karar bu boşluğu geriye dönük doldurmaz.</p>
  </aside>;
  const baslik = p.sonuc?.baslik ?? (p.tur === "kaza" ? p.asama === "bekleyen" ? "Mahkeme dosyası bekleniyor" : "Aile ve mahkeme yanıtı masada" : p.asama === "bekleyen" ? "Deniz’in yanıtı bekleniyor" : "Deniz’in kararı masada");
  const aile = { bekliyor: "Henüz yanıt yok", gorusur: "Avukatı görüşecek; ödeme kabulü yok", mesafeli: "Belgeleri bekliyor", reddetti: "Kapalı görüşmeyi reddetti", yardim_aldi: "Yazılı başvuruya yardım ödendi" }[p.aile];
  const deniz = { bekliyor: "Henüz yanıt yok", ifade_istegi: "Gönüllü ifade randevusu istedi", is_basvurusu: "Süreli işe başvurdu", ayrildi: "Taşınma kararı verdi", ifade_verdi: "İmzalı ifadeyi teslim etti", ise_basladi: "Süreli bağımsız işe başladı" }[p.deniz];
  return <section className="inceleme-izleme santiye-izleme" aria-label="Akköprü hesaplaşma kaydı">
    <p className="ust-etiket">Bölüm IV · {p.tur === "kaza" ? "Kaza ve aile" : "Tanık ve iş"}</p>
    <h3>{baslik}</h3><p>{p.sonuc?.metin ?? p.izler.at(-1)?.metin}</p>
    <dl className="inceleme-durumlar"><div><dt>Delil</dt><dd>{p.hamKayit ? "Ham kopya var" : "Ham seri eksik"}; {p.beyan ? "imzalı beyan var" : "yeni beyan yok"}</dd></div><div><dt>{p.tur === "kaza" ? "Suna" : "Deniz"}</dt><dd>{p.tur === "kaza" ? aile : deniz}</dd></div><div><dt>{p.tur === "kaza" ? "Bakan" : "Dosya"}</dt><dd>{p.tur === "kaza" ? p.bakan === "gorevde" ? "Görevde" : "Görevden alındı" : p.asama === "tamam" ? "Mevcut kayıt korundu" : "Yanıt bekliyor"}</dd></div></dl>
    {p.hedefAy !== null && <p className="inceleme-ek">Sonraki dosya: {tarihAdi(p.hedefAy)}. Bu tarih yargı hükmü veya otomatik ifade değildir.</p>}
    <details className="anlati-belgeler"><summary>Olay ve ödeme kaydı</summary><p>Bu dosyada gerçekleşmiş kamu ödemesi: {tutarYaz(p.harcamaTL / 1e12)}. Görüşme ve yardım teklifi ödeme değildir.</p><ol className="inceleme-tutanak">{p.izler.map((x, i) => <li key={i}><span className="veri">{tarihAdi(x.ay)}</span><p>{x.metin}</p></li>)}</ol></details>
  </section>;
}
