// Ortak bileşenler: mühür, kişi rozeti, etki satırı, pencere.

import { useEffect, useRef, type ReactNode } from "react";
import type { Karakter } from "../cekirdek/icerik.ts";
import type { Ifade } from "./bicim.ts";

export function Muhur({ children, ton = "kirmizi" }: { children: ReactNode; ton?: "kirmizi" | "mavi" | "yesil" }) {
  return <span className={`muhur muhur-${ton}`}>{children}</span>;
}

const RENKLER = ["#7a4b2a", "#2f5d62", "#5b4a8b", "#8b3a3a", "#3f6b3a", "#6b5a2e", "#2e4f7a"];

/** Kişinin baş harfleri; portre üreticisi (iş listesi 15. madde) gelene kadar yer tutucu. */
export function KisiRozeti({ kisi, boy = 40 }: { kisi: Karakter | undefined; boy?: number }) {
  const ad = kisi?.ad ?? "?";
  const harf = ad.split(/\s+/).map((p) => p[0] ?? "").join("").slice(0, 2).toLocaleUpperCase("tr");
  let h = 0;
  for (const c of ad) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className="rozet" aria-hidden="true" style={{ width: boy, height: boy, background: RENKLER[h % RENKLER.length], fontSize: boy * 0.38 }}>
      {harf}
    </span>
  );
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
  useEffect(() => {
    ref.current?.focus();
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onKapat) onKapat();
    };
    document.addEventListener("keydown", tus);
    const onceki = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tus);
      document.body.style.overflow = onceki;
    };
  }, [onKapat]);
  return (
    <div className="perde" role="presentation" onClick={(e: { target: EventTarget; currentTarget: EventTarget }) => e.target === e.currentTarget && onKapat?.()}>
      <section className={`pencere${genis ? " genis" : ""}`} role="dialog" aria-modal="true" aria-label={baslik}>
        <h2 className="gizli-baslik" tabIndex={-1} ref={ref}>{baslik}</h2>
        {children}
      </section>
    </div>
  );
}
