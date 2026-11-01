import { test } from "node:test";
import assert from "node:assert/strict";
import { ek, okunus } from "../../cekirdek/ekler.ts";
import { doldur, yerTutucular, sozcukSayisi } from "../../cekirdek/metin.ts";

test("şehir adlarına doğru ekler gelir", () => {
  assert.equal(ek("Yalıkent", "de"), "Yalıkent'te");
  assert.equal(ek("Kumsal", "e"), "Kumsal'a");
  assert.equal(ek("Kumsal", "de"), "Kumsal'da");
  assert.equal(ek("Zeytinova", "e"), "Zeytinova'ya");
  assert.equal(ek("Zeytinova", "in"), "Zeytinova'nın");
  assert.equal(ek("Akköprü", "in"), "Akköprü'nün");
  assert.equal(ek("Taşhan", "den"), "Taşhan'dan");
  assert.equal(ek("Karaburç", "de"), "Karaburç'ta");
  assert.equal(ek("Turunçlu", "i"), "Turunçlu'yu");
  assert.equal(ek("Serhatkent", "deki"), "Serhatkent'teki");
  assert.equal(ek("Ilıcadağ", "e"), "Ilıcadağ'a");
  assert.equal(ek("Dereboyu", "le"), "Dereboyu'yla");
});

test("kişi adlarına ve çok sözcüklü adlara ekler son sözcüğe göre gelir", () => {
  assert.equal(ek("Erdem", "i"), "Erdem'i");
  assert.equal(ek("Aksoy", "in"), "Aksoy'un");
  assert.equal(ek("Kaya Grubu", "in"), "Kaya Grubu'nun");
  assert.equal(ek("Doğa Holding", "e"), "Doğa Holding'e");
});

test("kısaltmalar harf adlarıyla okunur", () => {
  assert.equal(okunus("TV"), "tve");
  assert.equal(ek("Merkez TV", "e"), "Merkez TV'ye");
  assert.equal(ek("Halk TV", "in"), "Halk TV'nin");
  assert.equal(ek("ABD", "e"), "ABD'ye");
  assert.equal(ek("AB", "de"), "AB'de");
  assert.equal(ek("AYM", "e"), "AYM'ye");
  assert.equal(ek("RTÜK", "e"), "RTÜK'e");
});

test("sayılara okunuşlarına göre ek gelir", () => {
  assert.equal(ek("2026", "de"), "2026'da");
  assert.equal(ek("2028", "e"), "2028'e");
  assert.equal(ek("40", "in"), "40'ın");
  assert.equal(ek("100", "den"), "100'den");
  assert.equal(ek("1000", "e"), "1000'e");
  assert.equal(ek("3", "e"), "3'e");
});

test("şablon doldurma ve yer tutucu denetimi", () => {
  assert.equal(doldur("{il:de} grev başladı; {il} Belediyesi açıklama yaptı.", { il: "Yalıkent" }), "Yalıkent'te grev başladı; Yalıkent Belediyesi açıklama yaptı.");
  assert.throws(() => doldur("{il} sorunu", {}));
  assert.deepEqual(yerTutucular("{il:de} ve {bakan:in}"), [{ ad: "il", ek: "de" }, { ad: "bakan", ek: "in" }]);
  assert.throws(() => yerTutucular("{il:xyz}"));
  assert.equal(sozcukSayisi("  bir  iki üç "), 3);
});
