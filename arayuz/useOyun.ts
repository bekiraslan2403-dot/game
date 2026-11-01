// Arayüzün oyun durumu kancası: çekirdek fonksiyonlarını çağırır, sonucu saklar, her değişiklikte otomatik kaydeder.

import { useCallback, useEffect, useState } from "react";
import { yeniOyun, rastgeleTohum, durumKopya, type OyunDurumu, type AyKaydi } from "../cekirdek/durum.ts";
import { oyunuBaslat, ayiBitir, ayiAc } from "../cekirdek/ay.ts";
import { kararVer, ertele, ikinciGorus, type EylemSonucu } from "../cekirdek/karar.ts";
import { otomatikKaydet, otomatikYukle, otomatikSil } from "./kalici.ts";
import { ICERIK } from "./icerik.ts";

function ilkDurum(): OyunDurumu | null {
  const d = otomatikYukle();
  if (d && !d.masaKuruldu) ayiAc(d, ICERIK);
  return d;
}

export function useOyun() {
  const [durum, setDurum] = useState<OyunDurumu | null>(ilkDurum);
  const [rapor, setRapor] = useState<AyKaydi | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);

  useEffect(() => {
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
    yeni: () => {
      setRapor(null);
      setDurum(oyunuBaslat(yeniOyun(rastgeleTohum()), ICERIK));
    },
    birak: () => {
      otomatikSil();
      setRapor(null);
      setDurum(null);
    },
    karar: (ornek: string, secenek: number) => uygula((d) => kararVer(d, ICERIK, ornek, secenek)),
    ertele: (ornek: string) => uygula((d) => ertele(d, ICERIK, ornek)),
    ikinciGorus: (ornek: string) => uygula((d) => ikinciGorus(d, ornek)),
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
