import { devirSec, type DevirYolu } from "../cekirdek/devir.ts";
// Arayüzün oyun durumu kancası: çekirdek fonksiyonlarını çağırır, sonucu saklar, her değişiklikte otomatik kaydeder.

import { useCallback, useLayoutEffect, useState } from "react";
import { yeniOyun, rastgeleTohum, durumKopya, type OyunDurumu, type AyKaydi } from "../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir, ayiAc } from "../cekirdek/ay.ts";
import { kararVer, ertele, ikinciGorus, type EylemSonucu } from "../cekirdek/karar.ts";
import { aracKullan, sozTut, type AracId } from "../cekirdek/hazine.ts";
import { politikaDegistir, teklifiGeriCek } from "../cekirdek/politika.ts";
import { ziyaretciKabul, eylemeMudahale, type EylemMudahalesi } from "../cekirdek/toplum.ts";
import { otomatikKaydet, otomatikYukle } from "./kalici.ts";
import { ICERIK } from "./icerik.ts";
import { anlatiAc, anlatiCevapla, anlatiDevam } from "../cekirdek/anlati.ts";

import { faaliyetYap, atamaDosyasi, hizipleGorus, type Faaliyet } from "../cekirdek/yonetim.ts";
import { medyaMudahale, basinAc, basinCevapla, basinKapat, type MedyaAraci, type BasinCevabi } from "../cekirdek/medya.ts";
import { sloganSec, kampanyaYap, kampanyaSahneAc, kampanyaSahneSec, kampanyaSahneKapat, ikinciTur, secimiBitir, type KampanyaAraci } from "../cekirdek/secim.ts";
import { gundemKur } from "../cekirdek/medya.ts";
import { meclisHazirla, kulisAc, kulisSec, kulisKapat, type KulisAraci } from "../cekirdek/meclis.ts";

function ilkDurum(): OyunDurumu | null {
  const d = otomatikYukle();
  if (d) { meclisHazirla(d, ICERIK); gundemKur(d); }
  if (d && !d.masaKuruldu) ayiAc(d, ICERIK);
  return d;
}

export function useOyun() {
  const [durum, setDurum] = useState<OyunDurumu | null>(ilkDurum);
  const [rapor, setRapor] = useState<AyKaydi | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (durum) otomatikKaydet(durum);
  }, [durum]);

  /** Çekirdek eylemini durumun kopyası üzerinde çalıştırır; başarılıysa yeni durumu yayımlar. */
  const uygula = useCallback(
    (eylem: (d: OyunDurumu) => EylemSonucu): EylemSonucu => {
      if (!durum) return { ok: false, neden: "Oyun yok." };
      const d = durumKopya(durum);
      const s = eylem(d);
      if (s.ok) {
        setDurum(d);
        setMesaj(null);
      } else setMesaj(s.neden);
      return s;
    },
    [durum],
  );

  return {
    durum,
    rapor,
    mesaj,
    mesajKapat: () => setMesaj(null),
    anlatiAc: (ornek: string) => uygula(d => anlatiAc(d, ICERIK, ornek)),
    anlatiCevap: (secenek: number) => uygula(d => anlatiCevapla(d, ICERIK, secenek)),
    anlatiDevam: () => uygula(d => anlatiDevam(d)),
    yeni: () => {
      setRapor(null);
      setDurum(oyunuBaslat(yeniOyun(rastgeleTohum()), ICERIK));
    },
    yukle: (d: OyunDurumu) => { setRapor(null); setMesaj(null); setDurum(durumKopya(d)); },
    faaliyet: (tur:Faaliyet, hedef:string) => uygula(d=>faaliyetYap(d,ICERIK,tur,hedef)),
    atama: (id:string) => uygula(d=>atamaDosyasi(d,id)),
    hizip: (id:string) => uygula(d=>hizipleGorus(d,id)),
    medya: (id:string, arac:MedyaAraci) => uygula(d=>medyaMudahale(d,ICERIK,id,arac)),
    basinAc: () => uygula(d=>basinAc(d,ICERIK)),
    basinCevap: (cevap:BasinCevabi) => uygula(d=>basinCevapla(d,ICERIK,cevap)),
    basinKapat: () => uygula(d=>basinKapat(d)),
    slogan: (s:string) => uygula(d=>sloganSec(d,s)),
    kampanya: (a:KampanyaAraci,grup:string) => uygula(d=>kampanyaYap(d,a,grup)),
    kampanyaAc: (tur:"miting"|"munazara") => uygula(d=>kampanyaSahneAc(d,tur)),
    kampanyaSec: (sec:number) => uygula(d=>kampanyaSahneSec(d,sec)),
    kampanyaKapat: () => uygula(d=>kampanyaSahneKapat(d)),
    ikinciTur: (sec:number) => uygula(d=>ikinciTur(d,sec)),
    secimiBitir: (sec:"kabul"|"sayim"|"tanima") => uygula(d=>secimiBitir(d,sec)),
    devirSec: (yol: DevirYolu) => uygula(d => devirSec(d, yol)),
    rehberKapat: () => uygula(d=>{d.bayraklar.rehber_kapali=true;return {ok:true};}),
    karar: (ornek: string, secenek: number) => uygula((d) => kararVer(d, ICERIK, ornek, secenek)),
    ertele: (ornek: string) => uygula((d) => ertele(d, ICERIK, ornek)),
    ikinciGorus: (ornek: string) => uygula((d) => ikinciGorus(d, ornek)),
    arac: (arac: AracId, kalem?: string) => uygula((d) => aracKullan(d, arac, kalem)),
    sozTut: (id: string) => uygula((d) => sozTut(d, id)),
    politika: (id: string, hedef: number) => uygula((d) => politikaDegistir(d, ICERIK, id, hedef)),
    teklifiGeriCek: (id: string) => uygula((d) => teklifiGeriCek(d, id)),
    kulisAc: (id: string, vekil: string) => uygula(d => kulisAc(d, ICERIK, id, vekil)),
    kulisSec: (arac: KulisAraci) => uygula(d => kulisSec(d, ICERIK, arac)),
    kulisKapat: () => uygula(d => kulisKapat(d)),
    ziyaretci: (id: string) => uygula((d) => ziyaretciKabul(d, ICERIK, id)),
    eylem: (id: string, nasil: EylemMudahalesi) => uygula((d) => eylemeMudahale(d, ICERIK, id, nasil)),
    ayiBitir: () => {
      if (!durum) return;
      const s = ayiBitir(durum, ICERIK);
      if (!s.ok) return setMesaj(s.neden);
      setDurum(s.durum);
      setRapor(s.rapor);
      setMesaj(null);
    },
    raporKapat: () => setRapor(null),
  };
}

export type Oyun = ReturnType<typeof useOyun>;
