import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { icerikDerle } from "../../derleyici/icerik-derle.ts";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "../..");

function klasor(kartlar: unknown[]): string {
  const k = mkdtempSync(join(tmpdir(), "akkopru-icerik-"));
  mkdirSync(join(k, "kartlar"));
  writeFileSync(join(k, "karakterler.yaml"), stringify([{ id: "ozel_kalem", ad: "Deneme Kişi", rol: "Özel Kalem" }]));
  writeFileSync(join(k, "sehirler.yaml"), stringify([{ ad: "Akköprü", bolge: "orta", belediye: "iktidar", baskent: true }]));
  writeFileSync(join(k, "kartlar/deneme.yaml"), stringify(kartlar));
  return k;
}

const secenek = (metin: string, etki: Record<string, number> = { "grup.kentli": -1 }) => ({ metin, etki });
const kart = (ek: Record<string, unknown> = {}) => ({
  id: "deneme",
  kategori: "ekonomi",
  getiren: "ozel_kalem",
  metin: { baslik: "Deneme kartı", durum: "Bu bir deneme durumudur ve on sözcükten uzundur sanırım." },
  secenekler: [secenek("Birinci seçenek"), secenek("İkinci seçenek"), secenek("Üçüncü seçenek")],
  ...ek,
});

test("projedeki gerçek içerik hatasız derlenir", () => {
  const s = icerikDerle(join(KOK, "icerik"));
  assert.deepEqual(s.hatalar, []);
  assert.ok(s.paket && Object.keys(s.paket.kartlar).length >= 20);
});

test("geçerli bir kart derlenir; varsayılanlar doldurulur", () => {
  const s = icerikDerle(klasor([kart()]));
  assert.deepEqual(s.hatalar, []);
  assert.equal(s.paket?.kartlar.deneme?.tur, "masa");
  assert.equal(s.paket?.kartlar.deneme?.agirlik, 1);
});

test("bilinmeyen gösterge, eksik hedef kart ve tanımsız değişken yakalanır", () => {
  const s = icerikDerle(klasor([
    kart({
      metin: { baslik: "{il} deneme", durum: "Bu bir deneme durumudur ve on sözcükten uzundur sanırım." },
      secenekler: [
        { metin: "Birinci seçenek", etki: { yok_boyle_gosterge: 1 } },
        { metin: "İkinci seçenek", etki: { enflasyon: 1 }, sonraki: [{ kart: "olmayan_kart" }] },
        secenek("Üçüncü seçenek"),
      ],
    }),
  ]));
  assert.equal(s.paket, null);
  const hepsi = s.hatalar.join("\n");
  assert.match(hepsi, /bilinmeyen gösterge "yok_boyle_gosterge"/);
  assert.match(hepsi, /"olmayan_kart" adlı kart yok/);
  assert.match(hepsi, /\{il\} değişkeni/);
});

test("seçenek sayısı, metin uzunluğu, aynı kimlik ve getiren denetlenir", () => {
  const uzun = Array.from({ length: 70 }, () => "sözcük").join(" ");
  const s = icerikDerle(klasor([
    kart({ secenekler: [secenek("Tek seçenek"), secenek("İki seçenek")] }),
    kart({ id: "uzun", metin: { baslik: "Uzun kart", durum: uzun } }),
    kart({ id: "uzun" }),
    kart({ id: "yabanci", getiren: "kimse" }),
  ]));
  const hepsi = s.hatalar.join("\n");
  assert.match(hepsi, /tam 3 seçenek/);
  assert.match(hepsi, /70 sözcük; sınır 60/);
  assert.match(hepsi, /aynı kimlik/);
  assert.match(hepsi, /"kimse" karakterler.yaml içinde yok/);
});

test("zincir kuralları: tohum zorunlu, ara aşamalar zincir türünde", () => {
  const s = icerikDerle(klasor([kart({ id: "ara", zincir: "z", asama: "gelisme" })]));
  const hepsi = s.hatalar.join("\n");
  assert.match(hepsi, /zincir "z": tohum kartı yok/);
  assert.match(hepsi, /"zincir" türünde olmalı/);
});

test("kaybedeni olmayan kart uyarı üretir ama derlemeyi durdurmaz", () => {
  const s = icerikDerle(klasor([kart({ secenekler: [secenek("Seçenek A", { "grup.isci": 1 }), secenek("Seçenek B", { "grup.isci": 2 }), secenek("Seçenek C", { "grup.isci": 3 })] })]));
  assert.deepEqual(s.hatalar, []);
  assert.ok(s.uyarilar.some((u) => u.includes("kaybedeni yok")));
});
