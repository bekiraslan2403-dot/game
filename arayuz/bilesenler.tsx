// Ortak bileşenler: mühür, kişi rozeti, etki satırı, pencere.

import { useEffect, useRef, type ReactNode } from "react";
import type { Karakter } from "../cekirdek/icerik.ts";
import type { Ifade } from "./bicim.ts";

export function Muhur({ children, ton = "kirmizi" }: { children: ReactNode; ton?: "kirmizi" | "mavi" | "yesil" }) {
  return <span className={`muhur muhur-${ton}`}>{children}</span>;
}

const RENKLER = ["#7a4b2a", "#2f5d62", "#5b4a8b", "#8b3a3a", "#3f6b3a", "#6b5a2e", "#2e4f7a"];

/** Aynı ad aynı yüzü üretir; ifade yalnız görsel durumdur, zar tüketmez. */
export function KisiRozeti({ kisi, boy = 40, ton = "notr" }: { kisi: Karakter | undefined; boy?: number; ton?: "notr"|"memnun"|"ofkeli" }) {
  const ad=kisi?.ad??"?";let h=0;for(const c of ad)h=(h*31+c.charCodeAt(0))>>>0;
  const ten=["#e4bb95","#c89670","#a76f50","#edc8a8"][h%4],sac=["#302c2c","#68605b","#c1b3a2","#614236"][h%4];
  return <svg className="rozet portre" width={boy} height={boy} viewBox="0 0 80 90" aria-hidden="true" style={{width:boy,height:boy,background:RENKLER[h%RENKLER.length]}}>
    <path d="M9 90 Q10 65 40 65 Q70 65 71 90" fill="#25364d"/><path d="M29 67 L40 84 51 67" fill="#f6f0e4"/><path d="M35 64V74L40 80 45 74V64" fill={ten}/>
    <ellipse cx="40" cy="40" rx={20+h%3} ry="27" fill={ten}/>
    <path d={h%3===0?"M18 38 Q12 5 40 9 Q66 7 63 38 L57 25 28 23Z":h%3===1?"M18 38 Q15 11 37 11 Q68 7 64 36 L54 20 Q44 30 23 24Z":"M18 38 Q14 12 29 14 L25 34Z M58 15 Q67 24 62 42L57 33Z"} fill={sac}/>
    <path d={ton==="ofkeli"?"M26 34L34 37 M46 37L54 34":"M26 35L34 34 M46 34L54 35"} stroke={sac} strokeWidth="2"/><circle cx="30" cy="40" r="2" fill="#302c2c"/><circle cx="50" cy="40" r="2" fill="#302c2c"/>
    {h%2===0&&<g fill="none" stroke="#333" strokeWidth="1.3"><rect x="22" y="35" width="16" height="11" rx="3"/><rect x="42" y="35" width="16" height="11" rx="3"/><path d="M38 39H42"/></g>}
    <path d="M40 42L37 51H42" fill="none" stroke="#865c47" strokeWidth="1"/>
    {h%5===0&&<path d="M30 54 Q40 48 50 54L47 58 40 56 33 58Z" fill={sac}/>}
    <path d={ton==="memnun"?"M32 58Q40 64 48 58":ton==="ofkeli"?"M33 61Q40 56 47 61":"M34 60H46"} fill="none" stroke="#704536" strokeWidth="1.8"/>
  </svg>;
}

export function IfadeListesi({ ifadeler, bos }: { ifadeler: Ifade[]; bos?: string }) {
  if (!ifadeler.length) return bos ? <p className="soluk kucuk">{bos}</p> : null;
  return (
    <ul className="ifadeler">
      {ifadeler.map((f, i) => (
        <li key={i} className={`ifade ifade-${f.ton}`}>
          <span aria-hidden="true">{f.ton === "iyi" ? "▲" : f.ton === "kotu" ? "▼" : "•"}</span> {f.metin}
        </li>
      ))}
    </ul>
  );
}

/** Erişilebilir pencere: açılınca başlığa odaklanır, Escape ile kapanır, arkadaki sayfa kaymaz. */
export function Pencere({ baslik, onKapat, children, genis = false }: { baslik: string; onKapat?: () => void; children: ReactNode; genis?: boolean }) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const kapRef=useRef<HTMLElement|null>(null);
  useEffect(() => {
    const oncekiOdak=document.activeElement instanceof HTMLElement?document.activeElement:null;
    ref.current?.focus();
    const tus = (e: KeyboardEvent) => {
      const ust=document.querySelectorAll('[role="dialog"]');
      if(ust[ust.length-1]!==kapRef.current)return;
      if (e.key === "Escape" && onKapat) { e.preventDefault(); onKapat(); }
      if(e.key==="Tab") {
        const liste=[...(kapRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')??[])].filter(el=>el.getClientRects().length>0);
        const ilk=liste[0],son=liste.at(-1);if(!ilk||!son){e.preventDefault();return;}
        if(e.shiftKey&&(document.activeElement===ilk||document.activeElement===ref.current)){e.preventDefault();son.focus();}
        else if(!e.shiftKey&&document.activeElement===son){e.preventDefault();ilk.focus();}
      }
    };
    document.addEventListener("keydown", tus);
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tus);
      document.body.style.overflow = onceki;
      if(oncekiOdak?.isConnected)oncekiOdak.focus();
    };
  }, [onKapat]);
  return (
    <div className="perde" role="presentation" onClick={(e: { target: EventTarget; currentTarget: EventTarget }) => e.target === e.currentTarget && onKapat?.()}>
      <section className={`pencere${genis ? " genis" : ""}`} ref={kapRef} role="dialog" aria-modal="true" aria-label={baslik}>
        <h2 className="gizli-baslik" tabIndex={-1} ref={ref}>{baslik}</h2>
        {children}
      </section>
    </div>
  );
}
