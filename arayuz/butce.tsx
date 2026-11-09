import type { OyunDurumu } from "../cekirdek/durum.ts";
import { BUTCE_KOMISYONU } from "../cekirdek/butce.ts";
import { trilyonTL } from "../cekirdek/ekonomi.ts";
import { tarihAdi } from "../cekirdek/takvim.ts";
import { tutarYaz } from "./bicim.ts";

export function ButceIzleme({ d }: { d: OyunDurumu }) {
  const b = d.meclis.butce;
  const p = b.plan;
  if (!p) return null;
  const fark = b.taslak.butce_acigi ?? 0;
  const oylama = d.meclis.oylamalar.find(o => o.tur === "butce");
  const asama = p.uygulamaAy !== null ? "Yürürlükte"
    : p.kabulAy !== null ? "Kabul edildi · yürürlük bekleniyor"
    : b.gecici ? "Geçici bütçe · yeniden oylanacak"
    : oylama ? "Genel Kurul oylaması bekleniyor"
    : p.komisyon ? "Komisyon metni hazır · Aralık’ta oylanacak"
    : d.masa.some(m => m.kart === BUTCE_KOMISYONU) ? "Komisyon kararı bekleniyor"
    : "Taslak hazır · Kasım’da komisyona gidecek";
  return <section className="kutu karar-etkileri" aria-label="Yıllık bütçe aşaması">
    <p className="ust-etiket">{p.maliYil} mali yılı</p>
    <h4>{asama}</h4>
    <p>{p.ad}</p>
    {p.uygulamaAy === null ? <>
      <p>Taslakta yıllık yatırım ödeneği {fark < 0 ? "−" : "+"}{tutarYaz(trilyonTL(d, Math.abs(fark)))}. Hazine mevcut cetvelle işlem yapıyor.</p>
      {p.komisyon === "ek" && <p>Ulaşım ödeneği komisyonda eklendi.{(!oylama || oylama.taviz === "bayrak") && " Bayrak grubuyla anlaşma oylama desteğine yansır."}</p>}
    </> : <p>Onaylı cetvel {tarihAdi(p.uygulamaAy)} başında Hazineye işlendi.</p>}
  </section>;
}
