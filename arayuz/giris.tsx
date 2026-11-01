import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Uygulama } from "./Uygulama.tsx";
import "./stil.css";

const kap = document.getElementById("kok");
if (!kap) throw new Error("Kök öğe bulunamadı");
createRoot(kap).render(
  <StrictMode>
    <Uygulama />
  </StrictMode>,
);
