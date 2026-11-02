// Kısa, yerel efektler. Ses varsayılan kapalıdır; yalnız kullanıcı dokunuşundan sonra başlar.
let acik = false,
  baglam: AudioContext | null = null;
try {
  acik = localStorage.getItem("akkopru-2026:ses") === "acik";
} catch {}
export const sesAcikMi = () => acik;
export function sesAyarla(deger: boolean): void {
  acik = deger;
  try {
    localStorage.setItem("akkopru-2026:ses", deger ? "acik" : "kapali");
  } catch {}
}
export function sesCal(tur: number): void {
  if (!acik) return;
  try {
    baglam ??= new AudioContext();
    void baglam.resume();
    const t = baglam.currentTime,
      o = baglam.createOscillator(),
      g = baglam.createGain();
    o.type = tur % 3 === 0 ? "triangle" : "sine";
    o.frequency.setValueAtTime(100 + tur * 23, t);
    o.frequency.exponentialRampToValueAtTime(65 + tur * 8, t + 0.07);
    g.gain.setValueAtTime(0.035, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g);
    g.connect(baglam.destination);
    o.start(t);
    o.stop(t + 0.1);
  } catch {}
}
export function sesleriHazirla(): void {
  document.addEventListener("click", (e) => {
    const hedef =
      e.target instanceof Element ? e.target.closest("button") : null;
    if (hedef && !hedef.hasAttribute("disabled")) {
      const ad = hedef.textContent ?? "";
      let h = 0;
      for (const c of ad) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      sesCal(h % 20);
    }
  });
}
