import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Uygulama } from "./Uygulama.tsx";
import { kaliciyiHazirla } from "./kalici.ts";
import "./stil.css";

const kap = document.getElementById("kok");
if (!kap) throw new Error("Kök öğe bulunamadı");
const kok = createRoot(kap);
kaliciyiHazirla().then(() => kok.render(
  <StrictMode><Uygulama /></StrictMode>,
), () => kok.render(
  <main className="acilis"><h1>Kayıt açılamadı</h1><p>Kayıt klasörüne erişilemedi veya kayıt dosyası bozuk. Önceki kayıtlarınız korunuyor. Uygulamayı kapatıp yeniden açın.</p></main>,
));
