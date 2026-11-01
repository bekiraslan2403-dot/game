import { test } from "node:test";
import assert from "node:assert/strict";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { ayiBitir } from "../../cekirdek/ay.ts";

test("ayı bitirmek bir sonraki aya geçer, geçmişe kayıt düşer, girdiyi değiştirmez", () => {
  const d = yeniOyun(10);
  const s = ayiBitir(d);
  assert.ok(s.ok);
  if (!s.ok) return;
  assert.equal(d.ay, 1);
  assert.equal(s.durum.ay, 2);
  assert.equal(s.durum.gecmis.length, 1);
  assert.equal(s.durum.gecmis[0]?.ay, 1);
});

test("18. aydan sonra ilerlenmez; bitmiş oyunda ay kapatılamaz", () => {
  let d = yeniOyun(10);
  for (let i = 0; i < 17; i++) {
    const s = ayiBitir(d);
    assert.ok(s.ok);
    if (s.ok) d = s.durum;
  }
  assert.equal(d.ay, 18);
  assert.equal(ayiBitir(d).ok, false);
  d.bitis = { tur: "istifa", ay: 18, aciklama: "deneme" };
  assert.equal(ayiBitir(d).ok, false);
});
