import { test } from "node:test";
import assert from "node:assert/strict";
import { zarKur, zarSayi, zarTam, zarSec, zarAgirlikli, zarKaristir, zarOlasilik } from "../../cekirdek/zar.ts";

test("aynı tohum aynı diziyi üretir", () => {
  const a = zarKur(42), b = zarKur(42);
  for (let i = 0; i < 1000; i++) assert.equal(zarSayi(a), zarSayi(b));
});

test("farklı tohumlar farklı diziler üretir", () => {
  const a = zarKur(1), b = zarKur(2);
  const fark = Array.from({ length: 20 }, () => zarSayi(a) !== zarSayi(b)).filter(Boolean).length;
  assert.ok(fark >= 19);
});

test("sayılar [0,1) aralığında ve dağılım düzgün", () => {
  const z = zarKur(7), kova = new Array<number>(10).fill(0);
  const n = 100_000;
  for (let i = 0; i < n; i++) {
    const x = zarSayi(z);
    assert.ok(x >= 0 && x < 1);
    kova[Math.floor(x * 10)]!++;
  }
  for (const k of kova) assert.ok(Math.abs(k - n / 10) < n / 10 * 0.05, `kova sapması büyük: ${k}`);
});

test("zar durumu JSON'a yazılıp okunduğunda dizi aynı yerden devam eder", () => {
  const z = zarKur(99);
  for (let i = 0; i < 50; i++) zarSayi(z);
  const kopya = JSON.parse(JSON.stringify(z));
  for (let i = 0; i < 100; i++) assert.equal(zarSayi(z), zarSayi(kopya));
});

test("zarTam uçları kapsar ve aralık dışına çıkmaz", () => {
  const z = zarKur(3), gorulen = new Set<number>();
  for (let i = 0; i < 5000; i++) {
    const x = zarTam(z, 1, 6);
    assert.ok(x >= 1 && x <= 6);
    gorulen.add(x);
  }
  assert.equal(gorulen.size, 6);
  assert.throws(() => zarTam(z, 5, 1));
});

test("zarSec, zarAgirlikli ve zarKaristir", () => {
  const z = zarKur(11);
  assert.throws(() => zarSec(z, []));
  const sayac: Record<string, number> = { a: 0, b: 0 };
  for (let i = 0; i < 10_000; i++) sayac[zarAgirlikli(z, ["a", "b"], (x) => (x === "a" ? 3 : 1))]!++;
  const oran = sayac.a! / 10_000;
  assert.ok(oran > 0.72 && oran < 0.78, `ağırlıklı oran ${oran}`);
  assert.throws(() => zarAgirlikli(z, ["a"], () => 0));
  const liste = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual([...zarKaristir(z, [...liste])].sort((x, y) => x - y), liste);
  let evet = 0;
  for (let i = 0; i < 10_000; i++) if (zarOlasilik(z, 0.3)) evet++;
  assert.ok(evet > 2800 && evet < 3200);
});
