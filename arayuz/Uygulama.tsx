import { useOyun } from "./useOyun.ts";
import { Acilis, Masa } from "./ekranlar.tsx";
import { OyunMenusu } from "./menu.tsx";
import { useEffect, useState } from "react";

export function Uygulama() {
  const oyun = useOyun();
  const [menu,setMenu]=useState(false);
  const [kayitHatasi, setKayitHatasi] = useState<string | null>(null);
  useEffect(() => {
    const kayit = (e: Event) => setKayitHatasi((e as CustomEvent<string | null>).detail);
    window.addEventListener("akkopru:kayit", kayit);
    return () => window.removeEventListener("akkopru:kayit", kayit);
  }, []);
  return <><button className="menu-ac dugme ikincil" aria-label="Oyun menüsü" onClick={()=>setMenu(true)}>Menü</button>{kayitHatasi && <p className="kayit-uyarisi" role="alert">{kayitHatasi}</p>}{oyun.durum?<Masa oyun={oyun} d={oyun.durum} />:<Acilis onYeni={oyun.yeni}/>} {menu&&<div className="menu-katmani"><OyunMenusu oyun={oyun} onKapat={()=>setMenu(false)}/></div>}</>;
}
