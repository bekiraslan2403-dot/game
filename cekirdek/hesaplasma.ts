import type { OyunDurumu } from "./durum.ts";
import type { Kart, Secenek } from "./icerik.ts";
import type { HesaplasmaKaydi } from "./hesaplasma-durum.ts";
import { incelemeKanit } from "./inceleme.ts";

function iz(d: OyunDurumu, metin: string) {
  d.hesaplasma!.izler.push({ ay: d.ay, metin });
  d.buAy.olaylar.push(`Akköprü hesabı — ${metin}`);
}
function eskiDava(d: OyunDurumu): HesaplasmaKaydi {
  const yol = d.bayraklar.akkopru_kaza_yaniti;
  return {
    tur: "kaza", baslangicAy: d.ay, asama: "dosya", hedef: "akkopru_durusma", hedefAy: d.ay,
    yol: yol === "sirket" || yol === "gizlilik" ? yol : "acik",
    hamKayit: d.inceleme?.hamKayit === true || d.bayraklar.akkopru_ham_veri === true,
    beyan: d.inceleme?.tanikBeyani === true || d.bayraklar.inceleme_beyan_teslim === true,
    aile: "mesafeli", deniz: "bekliyor", bakan: "gorevde", yayin: "bekliyor", harcamaTL: 0,
    sonuc: null, izler: [{ ay: d.ay, metin: "Önceki kaza kararının bekleyen duruşması açıldı. Eski ay için yeni ödeme veya belge eklenmedi." }],
  };
}
export function hesaplasmaEngeli(d: OyunDurumu, k: Kart, s: Secenek): string | null {
  if (!k.hesaplasma) return null;
  if (!s.hesaplasma) return "Hesaplaşma işlemi tanımlı değil.";
  const p = d.hesaplasma;
  if (k.hesaplasma.asama === "ilk") return p ? "Bu dosyada karar zaten verildi." : null;
  // Önceki sürümde kazadan sonra bekleyen duruşma, geçmişe yeni olay yazılmadan açılır.
  if (!p && k.id === "akkopru_durusma") return null;
  if (!p || p.hedef !== k.id || p.asama !== "dosya" || d.ay < p.hedefAy!) return "Bu dosyanın sırası henüz gelmedi veya karar verildi.";
  if (s.hesaplasma.kosul === "aile" && p.aile !== "gorusur") return "Aile yazılı yardım başvurusu yapmadı; ödeme onlar adına kararlaştırılamaz.";
  if (s.hesaplasma.kosul === "beyan" && (p.beyan || p.deniz !== "ifade_istegi")) return "Yeni gönüllü ifade yok veya imzalı beyan zaten teslim edildi.";
  if (s.hesaplasma.kosul === "gorev" && p.deniz !== "is_basvurusu") return "Deniz bağımsız görev başvurusunu kabul etmedi.";
  return null;
}
export function hesaplasmaAyBasi(d: OyunDurumu) {
  const p = d.hesaplasma;
  if (!p || p.asama !== "bekleyen" || p.hedefAy === null || d.ay < p.hedefAy) return;
  p.hamKayit ||= d.bayraklar.akkopru_ham_veri === true || d.inceleme?.hamKayit === true;
  p.beyan ||= d.bayraklar.inceleme_beyan_teslim === true || d.inceleme?.tanikBeyani === true;
  p.asama = "dosya";
  if (p.tur === "kaza") {
    p.aile = p.yayin === "gizlilik_istendi" ? "reddetti" : (p.yayin === "acik" && p.bakan === "uzaklastirildi") || (p.yol === "acik" && ((d.anlati.iliskiler.suna_ekin ?? 50) >= 55 || d.bayraklar.akkopru_talimat_acik === true)) ? "gorusur" : "mesafeli";
    iz(d, p.aile === "gorusur" ? "Suna'nın avukatı, belgelerin açık tutulması koşuluyla görüşme isteğini iletti; ödeme kabulü verilmedi." : p.aile === "reddetti" ? "Suna kapalı görüşme teklifini geri çevirdi; aile adına uzlaşma onayı yok." : "Suna'nın avukatı mesafeli. Eski talimatları görmeden yardım sözleşmesi imzalamıyor.");
  } else {
    const guven = d.anlati.iliskiler.deniz_alaz ?? 50;
    p.deniz = p.yol === "koruma" && guven >= 40 ? "ifade_istegi" : p.yol === "gorev" && guven >= 45 ? "is_basvurusu" : "ayrildi";
    iz(d, p.deniz === "ifade_istegi" ? "Deniz avukatıyla gönüllü ifade randevusu istedi; henüz imzalı beyan verilmedi." : p.deniz === "is_basvurusu" ? "Deniz bağımsız laboratuvarın süreli işine başvurdu; kabul ve ödenek ayrı karar gerektiriyor." : "Deniz taşınma kararını bildirdi; önceki belgeler arşivden çıkarılmadı.");
  }
}
export function hesaplasmaUygula(d: OyunDurumu, k: Kart, s: Secenek) {
  const a = s.hesaplasma;
  if (!k.hesaplasma || !a) return;
  if (!d.hesaplasma && k.id === "akkopru_durusma") d.hesaplasma = eskiDava(d);
  if (a.islem === "baslat") {
    d.hesaplasma = {
      tur: k.hesaplasma.tur, baslangicAy: d.ay, asama: "bekleyen",
      hedef: k.hesaplasma.tur === "kaza" ? "akkopru_durusma" : "akkopru_tanik_takip", hedefAy: d.ay + 1,
      yol: a.yol!, hamKayit: d.inceleme?.hamKayit === true || d.bayraklar.akkopru_ham_veri === true,
      beyan: d.inceleme?.tanikBeyani === true || d.bayraklar.inceleme_beyan_teslim === true,
      aile: "bekliyor", deniz: "bekliyor", bakan: "gorevde", yayin: "bekliyor", harcamaTL: 0, sonuc: null, izler: [],
    };
  }
  const p = d.hesaplasma!;
  p.harcamaTL += d.ekonomi.gsyh * (s.icra?.odeme?.maliyet ?? 0) / 100 / 12 * 1e12;
  if (a.islem === "oturum") { p.asama = "bekleyen"; p.hedef = "akkopru_durusma_takip"; p.hedefAy = d.ay + 1; }
  if (a.islem === "bitir") { p.asama = "tamam"; p.hedef = null; p.hedefAy = null; p.sonuc = { baslik: a.baslik!, metin: a.metin }; }
  if (a.islem === "bitir" && a.kosul === "aile") p.aile = "yardim_aldi";
  if (a.islem === "bitir" && a.kosul === "gorev") p.deniz = "ise_basladi";
  if (a.islem === "bitir" && a.kosul === "beyan") p.deniz = "ifade_verdi";
  if (a.bakan) p.bakan = "uzaklastirildi";
  if (a.yayin) p.yayin = a.yayin;
  if (a.beyan && !p.beyan) {
    p.beyan = true; d.bayraklar.inceleme_beyan_teslim = true;
    if (d.inceleme && !d.inceleme.tanikBeyani) {
      d.inceleme.tanikBeyani = true;
      d.inceleme.izler.push({ ay: d.ay, metin: "Deniz'in imzalı ifadesi sonraki adli dosyaya eklendi; teslim edilmiş teknik rapor değiştirilmedi." });
    }
    incelemeKanit(d);
  }
  iz(d, a.metin);
}
