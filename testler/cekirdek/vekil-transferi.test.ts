import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ayiAc } from "../../cekirdek/ay.ts";
import { kararVer } from "../../cekirdek/karar.ts";
import { oylamaEkle, oylamayiSay, partiSandalyesi } from "../../cekirdek/meclis.ts";
import { meclisDestegi } from "../../cekirdek/politika.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const I = JSON.parse(readFileSync(new URL("../../uretilen/icerik.json", import.meta.url), "utf8")) as IcerikPaketi;

test("vekil transferi sandalye, seçmen ve oylamada ayrı sonuç üretir", () => {
  const ilk = yeniOyun(428);
  ilk.ay = 4;
  ayiAc(ilk, I);
  ilk.masa = [{ kart: "vekil_transferi", ornek: "transfer", degisken: {}, agir: false, ikinciGorus: false }];
  const eski = oylamayiSay(ilk, I, ilk.meclis.oylamalar[0]!);
  const sonuclar = [0, 1, 2].map((secim, i) => {
    const d = structuredClone(ilk);
    assert.ok(kararVer(d, I, "transfer", secim).ok);
    const gecen = [3, 1, 0][i]!;
    assert.equal(partiSandalyesi(d, "yukselis"), 278 + gecen);
    assert.equal(partiSandalyesi(d, "demokrat"), 153 - gecen);
    assert.equal(d.gostergeler.parti_ici, ilk.gostergeler.parti_ici);
    const eskiKayit = structuredClone(d);
    delete eskiKayit.bayraklar.vekil_transfer_sandalye;
    assert.equal(partiSandalyesi(eskiKayit, "yukselis"), 278 + gecen);
    assert.deepEqual(eskiKayit.meclis.sonuclar[0], eski);
    const o = oylamaEkle(d, I, { id: "transfer@4", ay: 4, baslik: "Transfer sonrası yoklama", tur: "kanun", politika: null, hedef: 0 });
    const r = oylamayiSay(d, I, o);
    assert.equal(r.oylar.length, 592);
    assert.equal(r.oylar.filter(oy => oy.grup === "transfer").length, gecen);
    assert.deepEqual(d.meclis.sonuclar[0], eski);
    const y = yukle(kaydet(d));
    assert.ok(y.ok);
    assert.deepEqual(y.durum.meclis.sonuclar, d.meclis.sonuclar);
    return { destek: meclisDestegi(d), kentli: d.gostergeler["grup.kentli"]! };
  });
  const [uc, bir, ret] = sonuclar;
  assert.ok(uc!.destek > bir!.destek && bir!.destek > ret!.destek);
  assert.ok(uc!.kentli < bir!.kentli && bir!.kentli < ret!.kentli);
});
