// Derleme: arayüzü ve çekirdeği esbuild ile paketler, CSS ve JS'i tek bir HTML dosyasına gömer.
// Çıktı: dist/index.html (tarayıcıda, Claude'da ve masaüstü sarmalayıcıda açılır, internet gerektirmez).
// Kullanım: node araclar/derle.mjs [--izle] [--gelistirme]

import * as esbuild from "esbuild";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "..");
const izle = process.argv.includes("--izle");
const gelistirme = process.argv.includes("--gelistirme") || izle;
const paket = JSON.parse(await readFile(join(KOK, "package.json"), "utf8"));
const { icerikDerle } = await import("../derleyici/icerik-derle.ts");

/** İçeriği derler ve uretilen/icerik.json dosyasına yazar; hata varsa derleme durur. */
async function icerikYaz() {
  const s = icerikDerle(join(KOK, "icerik"));
  for (const u of s.uyarilar) console.warn(`uyarı: ${u}`);
  if (!s.paket) {
    for (const h of s.hatalar) console.error(`hata: ${h}`);
    throw new Error(`İçerik derlenemedi: ${s.hatalar.length} hata`);
  }
  await mkdir(join(KOK, "uretilen"), { recursive: true });
  await writeFile(join(KOK, "uretilen/icerik.json"), JSON.stringify(s.paket));
  console.log(`içerik: ${Object.keys(s.paket.kartlar).length} kart · ${s.uyarilar.length} uyarı`);
}

const ayar = {
  entryPoints: [join(KOK, "arayuz/giris.tsx")],
  bundle: true,
  write: false,
  outdir: join(KOK, "dist"),
  format: "iife",
  target: ["es2022", "safari16"],
  jsx: "automatic",
  minify: !gelistirme,
  sourcemap: gelistirme ? "inline" : false,
  legalComments: "none",
  define: { "process.env.NODE_ENV": JSON.stringify(gelistirme ? "development" : "production"), __SURUM__: JSON.stringify(paket.version) },
  logLevel: "warning",
};

function sayfa(js, css) {
  const guvenliJs = js.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f6f3ec" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#10182a" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">
<title>Akköprü 2026</title>
<style>${css}</style>
</head>
<body>
<div id="kok"></div>
<script>${guvenliJs}</script>
</body>
</html>
`;
}

async function derle(sonuc) {
  const js = sonuc.outputFiles.find((f) => f.path.endsWith(".js"))?.text ?? "";
  const css = sonuc.outputFiles.find((f) => f.path.endsWith(".css"))?.text ?? "";
  await mkdir(join(KOK, "dist"), { recursive: true });
  const html = sayfa(js, css);
  await writeFile(join(KOK, "dist/index.html"), html);
  console.log(`dist/index.html · ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB · sürüm ${paket.version}${gelistirme ? " (geliştirme)" : ""}`);
}

await icerikYaz();
if (izle) {
  const ctx = await esbuild.context({ ...ayar, plugins: [{ name: "yaz", setup(b) { b.onEnd((s) => s.errors.length || derle(s)); } }] });
  await ctx.watch();
  console.log("Değişiklikler izleniyor…");
} else {
  await derle(await esbuild.build(ayar));
}
