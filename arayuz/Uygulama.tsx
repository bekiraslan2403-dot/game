import { useOyun } from "./useOyun.ts";
import { Acilis, Masa } from "./ekranlar.tsx";
import { useEffect, useState } from "react";

export function Uygulama() {
  const oyun = useOyun();
  const [kayitHatasi, setKayitHatasi] = useState<string | null>(null);
  useEffect(() => {
    const kayit = (e: Event) => setKayitHatasi((e as CustomEvent<string | null>).detail);
    window.addEventListener("akkopru:kayit", kayit);
    return () => window.removeEventListener("akkopru:kayit", kayit);
  }, []);
  if (!oyun.durum) return <Acilis onYeni={oyun.yeni} />;
  return <>{kayitHatasi && <p className="kayit-uyarisi" role="alert">{kayitHatasi}</p>}<Masa oyun={oyun} d={oyun.durum} /></>;
}
