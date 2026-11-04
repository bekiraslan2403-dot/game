import assert from "node:assert/strict";
import type { OyunDurumu } from "../../cekirdek/durum.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";
import { kararVer } from "../../cekirdek/karar.ts";
/** Bot, kaynak yetmeyen tercihten sonra yapılabilir bir yanıt arar. */
export function botKarari(d: OyunDurumu, I: IcerikPaketi, ornek: string, tercih: number) {
  const nedenler: string[] = [];
  for (const i of [tercih, ...[0, 1, 2].filter(i => i !== tercih)]) {
    const r = kararVer(d, I, ornek, i);
    if (r.ok) return r;
    nedenler.push(r.neden);
  }
  assert.fail(`Bot yanıt veremedi: ${ornek}: ${nedenler.join("; ")}`);
}
