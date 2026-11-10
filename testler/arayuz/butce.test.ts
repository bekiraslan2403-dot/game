import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { ayiAc } from "../../cekirdek/ay.ts";
import { yeniOyun } from "../../cekirdek/durum.ts";
import { kaydet, yukle } from "../../cekirdek/kayit.ts";
import type { IcerikPaketi } from "../../cekirdek/icerik.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const I = JSON.parse(readFileSync(root + "/uretilen/icerik.json", "utf8")) as IcerikPaketi;
const key = "akkopru-2026:otomatik";

test("telefonda bütçe kararı Hazineye taşınır ve komisyon uzlaşması kayıttan görünür", async () => {
  const d = yeniOyun(401);
  d.ay = 12;
  ayiAc(d, I);
  d.masa = d.masa.filter(m => m.kart === "yillik_butce");
  const browser = await chromium.launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await p.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key, save: kaydet(d) });
    await p.goto("file://" + root + "/dist/index.html");
    await p.getByRole("button", { name: /Yıllık bütçe Meclis yolunda/ }).click();
    await p.getByRole("button", { name: /Yatırımları artıran bütçeyi sun/ }).click();
    const asama = p.getByLabel("Yıllık bütçe aşaması", { exact: true });
    await asama.getByRole("heading", { name: /Taslak hazır/ }).waitFor();
    await p.getByRole("button", { name: "Hazine cetvelini gör", exact: true }).click();
    await p.getByRole("dialog", { name: "Hazine masası" }).getByText(/Hazine mevcut cetvelle işlem yapıyor/).waitFor();

    await p.keyboard.press("Escape");
    await p.getByRole("button", { name: "Ayı bitir", exact: true }).click();
    await p.getByRole("button", { name: /masasına geç/ }).click();
    const taslak = yukle(await p.evaluate(k => localStorage.getItem(k)!, key));
    assert.ok(taslak.ok);
    await p.getByRole("button", { name: /Komisyonun önündeki servis anahtarı/ }).click();
    await p.getByRole("button", { name: /Ulaşım ödeneğini ekle/ }).click();
    await asama.getByRole("heading", { name: /Komisyon metni hazır/ }).waitFor();
    await asama.getByText(/Bayrak grubuyla anlaşma/).waitFor();

    await p.reload();
    await p.getByRole("button", { name: "Hazine", exact: true }).click();
    await asama.getByText(/Bayrak grubuyla anlaşma/).waitFor();
    const komisyon = yukle(await p.evaluate(k => localStorage.getItem(k)!, key));
    assert.ok(komisyon.ok);
    assert.equal(komisyon.durum.meclis.butce.taslak.butce_acigi, 0.36);
    assert.equal(komisyon.durum.ekonomi.gider.yatirim, taslak.durum.ekonomi.gider.yatirim);
  } finally {
    await browser.close();
  }
});
