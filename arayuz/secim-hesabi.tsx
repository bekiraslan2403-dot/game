import type { OyunDurumu } from "../cekirdek/durum.ts";
import { GOSTERGE } from "../cekirdek/gostergeler.ts";
import { IKINCI_TUR_YOLLARI } from "../cekirdek/secim.ts";

const sayi = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const puan = (n: number) => `${n.toLocaleString("tr-TR", { signDisplay: "exceptZero", maximumFractionDigits: 2 })} puan`;

export function SecimHesabi({ gece }: { gece: NonNullable<OyunDurumu["yonetim"]["secim"]["gece"]> }) {
  const ilk = gece.ilkHesap;
  const ikinci = gece.ikinciHesap;
  if (gece.tur === 2) {
    if (!ikinci) return null;
    const satirlar = [
      ["İlk turda size verilen oy", `%${sayi(ikinci.ilkOy)}`],
      ["Diğer adaylara verilen ilk tur oyu", `%${sayi(ikinci.havuz)}`],
      ["Bu havuzdan size gelen", puan(ikinci.aktarilan)],
      ["Bu havuzdan rakibe giden", puan(ikinci.havuz - ikinci.aktarilan)],
      ["Sandık belirsizliği", puan(ikinci.belirsizlik)],
      ...(gece.yenidenSayim === undefined ? [] : [["Yeniden sayım düzeltmesi", puan(gece.yenidenSayim)]]),
    ];
    return <section className="kutu secim-hesap" aria-labelledby="secim-aktarim-baslik">
      <h3 id="secim-aktarim-baslik">İkinci turda oylar nasıl dağıldı?</h3>
      <p>{IKINCI_TUR_YOLLARI[ikinci.tercih]?.ad}</p>
      <dl>{satirlar.map(([ad, deger]) => <div key={ad}><dt>{ad}</dt><dd>{deger}</dd></div>)}</dl>
      {(ikinci.kutuplasma !== 0 || ikinci.partiIci !== 0) && <p>
        {ikinci.kutuplasma !== 0 && `Kutuplaşma ${puan(ikinci.kutuplasma)}. `}
        {ikinci.partiIci !== 0 && `Parti içi huzursuzluk ${puan(ikinci.partiIci)}.`}
      </p>}
    </section>;
  }
  if (!ilk) return null;
  const taban = 50 + ilk.gruplar.reduce((toplam, g) => toplam + g.katki, 0);
  const satirlar = [
    ["Seçmen gruplarının ağırlıklı desteği", `%${sayi(taban)}`],
    ["Kampanyanın net katkısı", puan(ilk.kampanya)],
    ["Rakibin gücünün etkisi", puan(ilk.rakip)],
    ["Sandık belirsizliği", puan(ilk.belirsizlik)],
    ...(ilk.sinir ? [["Modelin alt veya üst sınırı", puan(ilk.sinir)]] : []),
    ...(gece.yenidenSayim === undefined ? [] : [["Yeniden sayım düzeltmesi", puan(gece.yenidenSayim)]]),
  ];
  const gruplar = [...ilk.gruplar].sort((a, b) => b.katki - a.katki);
  return <section className="kutu secim-hesap" aria-labelledby="secim-hesap-baslik">
    <h3 id="secim-hesap-baslik">İlk tur sonucu nasıl oluştu?</h3>
    <dl>{satirlar.map(([ad, deger]) => <div key={ad}><dt>{ad}</dt><dd>{deger}</dd></div>)}</dl>
    <details>
      <summary>Seçmen gruplarını incele</summary>
      <p className="kucuk soluk">Oyun, grup desteğini nüfus ağırlığı ve tahmini katılımla birleştirir. Katkı, yüzde 50 desteğe göre hesaplanır.</p>
      <dl>{gruplar.map(g => <div key={g.id}>
        <dt>{GOSTERGE[g.id]?.ad ?? g.id}<small className="soluk">Destek %{sayi(g.destek)} · Katılım %{sayi(g.katilim)}</small></dt>
        <dd>{puan(g.katki)}</dd>
      </div>)}</dl>
    </details>
  </section>;
}
