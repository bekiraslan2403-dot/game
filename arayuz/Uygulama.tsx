import { useOyun } from "./useOyun.ts";
import { Acilis, Masa } from "./ekranlar.tsx";

export function Uygulama() {
  const oyun = useOyun();
  if (!oyun.durum) return <Acilis onYeni={oyun.yeni} />;
  return <Masa oyun={oyun} d={oyun.durum} />;
}
