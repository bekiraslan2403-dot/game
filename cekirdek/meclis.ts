// Sistem 2: sandalye aritmetiği, kişi düzeyinde kulis ve kalıcı oylama tutanakları.
import type { OyunDurumu } from "./durum.ts";
import type { IcerikPaketi, Politika } from "./icerik.ts";
import type { EylemSonucu } from "./karar.ts";
import { PARTILER, HIZIPLER, type PartiId, type HizipId, type Vekil } from "./meclis-icerik.ts";
import { zarKaristir, zarSayi } from "./zar.ts";
import { sozVer } from "./hazine.ts";
import { etkiUygula } from "./ekonomi.ts";
import { takvimAyi } from "./takvim.ts";

export interface KulisVekili { iliski: number; sozler: string[]; ihanet: number }
export interface Oylama {
  id: string; ay: number; baslik: string; tur: "kanun" | "butce" | "anayasa";
  politika: string | null; hedef: number; adaylar: string[];
  bonus: Record<string, number>; sozVeren: string[]; taviz: PartiId | null;
  /** Yıllık bütçenin seçilen etkileri, kabul edilmeden uygulanmaz. */
  butceEtki: Record<string, number>;
}
export interface Oy { kim: string; parti: PartiId; oy: "evet" | "hayir" | "cekimser"; fire: boolean; grup?: "ayrilan" }
export interface OylamaSonucu {
  id: string; ay: number; baslik: string; tur: Oylama["tur"];
  evet: number; hayir: number; cekimser: number; katilan: number; esik: number;
  sonuc: "kabul" | "ret" | "halkoylamasi"; oylar: Oy[];
}
export interface MeclisDurumu {
  hizipler: Record<HizipId, number>;
  vekiller: Record<string, KulisVekili>;
  oylamalar: Oylama[];
  sonuclar: OylamaSonucu[];
  sahneAy: number;
  kulis: { oylama: string; vekil: string; sonuc: string | null } | null;
  butce: { gecici: boolean; sonOylama: number; gider: Record<string, number>; gelir: Record<string, number>; taslak: Record<string, number> };
}
export type KulisAraci = "soz" | "ikna" | "baski" | "algi" | "pazarlik";
const sinir = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));

export function meclisBaslangic(): MeclisDurumu {
  return { hizipler: { eski: 62, teknokrat: 58, muhafazakar: 65 }, vekiller: {}, oylamalar: [], sonuclar: [], sahneAy: 0, kulis: null,
    butce: { gecici: false, sonOylama: 0, gider: {}, gelir: {}, taslak: {} } };
}
export function vekilDurumu(d: OyunDurumu, id: string): KulisVekili {
  return d.meclis.vekiller[id] ?? { iliski: 50, sozler: [], ihanet: 0 };
}
export function iliskiSozu(n: number): string { return n >= 65 ? "yakın" : n >= 40 ? "mesafeli" : "soğuk"; }
export function hizipSozu(n: number): string { return n >= 65 ? "memnun" : n >= 40 ? "temkinli" : n >= 20 ? "kırgın" : "kopuşun eşiğinde"; }
export function oyEsigi(tur: Oylama["tur"], katilan: number): number { return tur === "anayasa" ? 360 : Math.floor(katilan / 2) + 1; }
export function oySonucu(tur: Oylama["tur"], evet: number, katilan: number): OylamaSonucu["sonuc"] {
  if (evet < oyEsigi(tur, katilan)) return "ret";
  return tur === "anayasa" && evet < 400 ? "halkoylamasi" : "kabul";
}

/** Eski kaydın bekleyen tekliflerini de tamamlar; hazır oylamayı yeniden kurmaz. */
export function meclisHazirla(d: OyunDurumu, I: IcerikPaketi): void {
  for (const t of d.meclisGundemi) {
    const p = I.politikalar[t.politika];
    if (p) oylamaEkle(d, I, { id: `${t.politika}@${t.ay}`, ay: t.ay, baslik: `${p.ad} — ${p.kademeler[t.hedef]}`, tur: "kanun", politika: p.id, hedef: t.hedef });
  }
}

export function oylamaEkle(d: OyunDurumu, I: IcerikPaketi,
  t: Pick<Oylama, "id" | "ay" | "baslik" | "tur" | "politika" | "hedef">): Oylama {
  const varolan = d.meclis.oylamalar.find(o => o.id === t.id);
  if (varolan) return varolan;
  // İki dikey kesit oylaması sekizer vekil içerir; iki grubun birleşimi 12 kişidir.
  const havuz = I.meclis.vekiller.map(v => v.id);
  const adaylar = t.politika === "emekli_aylik" && t.ay === 2 ? havuz.slice(0, 8)
    : t.politika === "yargi_reformu" && t.ay === 4 ? [...havuz.slice(0, 4), ...havuz.slice(8, 12)]
    : zarKaristir(d.zar, havuz).slice(0, 8);
  const o: Oylama = { ...t, adaylar, bonus: {}, sozVeren: [], taviz: null, butceEtki: {} };
  d.meclis.oylamalar.push(o);
  return o;
}

/** Ay 2 ve 4: iki kritik oylama; Ekim: yıllık bütçe. İmza hakkı tüketmez. */
export function meclisAyBasi(d: OyunDurumu, I: IcerikPaketi): void {
  meclisHazirla(d, I);
  if (d.ay === 3 && !d.gorulen.anayasa_mahkemesi_uyari && !d.bekleyen.some(k => k.kart === "anayasa_mahkemesi_uyari") && I.kartlar.anayasa_mahkemesi_uyari) {
    d.bekleyen.push({ kart: "anayasa_mahkemesi_uyari", ay: d.ay, degisken: {}, agir: false });
  }
  const id = d.ay === 2 ? "emekli_aylik" : d.ay === 4 ? "yargi_reformu" : null;
  if (id && I.politikalar[id] && !d.meclisGundemi.some(t => t.politika === id)) {
    const p = I.politikalar[id]!;
    const simdi = d.politika[id] ?? p.baslangic;
    const hedef = simdi < p.kademeler.length - 1 ? simdi + 1 : simdi - 1;
    d.meclisGundemi.push({ politika: id, hedef, ay: d.ay });
    meclisHazirla(d, I);
    haberYaz(d, `Kritik oylama: ${p.ad} teklifi Meclis gündeminde. Grup başkanvekili kulis görüşmesi istiyor.`);
  }
  if (takvimAyi(d.ay).ay === 10 || d.meclis.butce.gecici) {
    const yil = takvimAyi(d.ay).yil + (takvimAyi(d.ay).ay === 10 ? 1 : 0);
    const butce = oylamaEkle(d, I, { id: `butce@${d.ay}`, ay: d.ay, baslik: `${yil} yıllık bütçe kanunu`, tur: "butce", politika: null, hedef: 0 });
    butce.butceEtki = { ...d.meclis.butce.taslak };
    // Ekim kartının tercihleri oylanana kadar bütçe cetveli değişmez.
  }
}

export function hizipMemnuniyeti(d: OyunDurumu, h: HizipId): number {
  return sinir(d.meclis.hizipler[h] - ((d.gostergeler.parti_ici ?? 30) - 30) * 0.6);
}
/** Sayısal olasılık yalnız çekirdekte kullanılır; arayüz sözlü tahmin gösterir. */
export function partiOlasiligi(d: OyunDurumu, parti: PartiId, p?: Politika, hedef?: number, hizip?: HizipId): number {
  const yon = p ? (hedef ?? (d.politika[p.id] ?? p.baslangic) + 1) - (d.politika[p.id] ?? p.baslangic) : 1;
  const hak = p && ((p.adim.yargi ?? 0) + (p.adim.basin ?? 0)) * yon;
  const harcama = p ? (p.adim.butce_acigi ?? 0) * yon : 0.15;
  let n = 0;
  switch (parti) {
    case "yukselis": {
      const mem = hizip ? hizipMemnuniyeti(d, hizip) : HIZIPLER.reduce((a, h) => a + hizipMemnuniyeti(d, h.id) * h.sandalye, 0) / 278;
      n = 0.97 - (60 - mem) / 400 - ((d.gostergeler.parti_ici ?? 30) - 30) / 400;
      if (p?.temel_hak && yon > 0) n -= 0.04;
      break;
    }
    case "bayrak": n = 0.78 - Math.max(0, hak || 0) * 0.018; if (p?.id === "kayyum" && yon < 0) n -= 0.5; break;
    case "demokrat": n = hak && hak > 0 ? 0.7 : hak && hak < 0 ? 0.01 : p?.id === "kentsel_donusum" ? 0.7 : 0.025; break;
    case "kalan": n = hak && hak > 0 ? 0.72 : hak && hak < 0 ? 0.01 : 0.07; break;
    case "ulusal": n = harcama > 0 ? 0.05 : harcama < 0 ? 0.55 : 0.12; break;
  }
  return sinir(n, 0.01, 0.995);
}
export function partiTutumu(d: OyunDurumu, o: Oylama, parti: PartiId, I: IcerikPaketi): string {
  const p = o.politika ? I.politikalar[o.politika] : undefined;
  const n = partiOlasiligi(d, parti, p, o.hedef) + (o.taviz === parti ? 0.25 : 0);
  return n > 0.75 ? "destek vermeye yakın" : n > 0.5 ? "destek eğiliminde" : n > 0.25 ? "kararsız" : "ret eğiliminde";
}
export function vekilTalebi(d:OyunDurumu,I:IcerikPaketi,o:Oylama,v:Vekil):string {
 const p=o.politika?I.politikalar[o.politika]:undefined;
 if(v.dert==="vicdan"&&p)return `${v.talep} “${p.ad}” metninde bu güvencenin yazılı olmasını istiyor.`;
 if(v.dert==="yatirim")return `${v.talep} ${d.meclis.butce.gecici?"Geçici bütçe nedeniyle yeni yatırımın kaynağını da soruyor.":"Oylamadan sonra ödeme takvimini takip edecek."}`;
 return `${v.talep} Verdiğiniz sözün “${o.baslik}” oylamasından sonra da geçerli olmasını istiyor.`;
}
export function vekilOlasiligi(d: OyunDurumu, o: Oylama, v: Vekil, I: IcerikPaketi): number {
  const p = o.politika ? I.politikalar[o.politika] : undefined;
  return sinir(0.25 + partiOlasiligi(d, v.parti, p, o.hedef, v.hizip ?? undefined) * 0.35
    + (vekilIliskisi(d, v.id) - 50) / 200 + (o.bonus[v.id] ?? 0) + (o.taviz === v.parti ? 0.2 : 0), 0.02, 0.98);
}
export function vekilEgilimi(d: OyunDurumu, o: Oylama, v: Vekil, I: IcerikPaketi): string {
  // Kişiye ve teklife bağlı sabit danışman hatası; ekrana bakmak zar tüketmez.
  const hata = ((v.id.length * 17 + d.tohum + o.ay * 7) % 11 - 5) / 100;
  const n = vekilOlasiligi(d, o, v, I) + hata;
  return n >= 0.75 ? "evete yakın" : n >= 0.45 ? "kararsız" : n >= 0.25 ? "rete yakın" : "kararlı ret";
}

export function kulisAc(d: OyunDurumu, I: IcerikPaketi, oylama: string, vekil: string): EylemSonucu {
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  if (d.anlati.sahne || d.meclis.kulis || d.yonetim.medya.basin || d.yonetim.secim.sahne) return { ok: false, neden: "Önce açık görüşmeyi bitirin." };
  const o = d.meclis.oylamalar.find(o => o.id === oylama);
  if (!o?.adaylar.includes(vekil) || !I.meclis.vekiller.some(v => v.id === vekil)) return { ok: false, neden: "Bu vekil bu oylamanın kulis listesinde değil." };
  if (d.meclis.sahneAy === d.ay) return { ok: false, neden: "Bu ayın sahnesi kullanıldı." };
  d.meclis.sahneAy = d.ay;
  d.meclis.kulis = { oylama, vekil, sonuc: null };
  return { ok: true };
}
function sicilYaz(d: OyunDurumu, kaynak: string, tur: "baski" | "usulsuzluk"): void {
  d.sayac++;
  d.sicil.push({ id: `sicil#${d.sayac}`, tur, kaynak, ay: d.ay, ifsaOldu: false });
}
export function kulisSec(d: OyunDurumu, I: IcerikPaketi, arac: KulisAraci): EylemSonucu {
  if (d.bitis) return { ok: false, neden: "Oyun sona erdi." };
  const k = d.meclis.kulis;
  const o = k && d.meclis.oylamalar.find(o => o.id === k.oylama);
  const v = k && I.meclis.vekiller.find(v => v.id === k.vekil);
  if (!k || !o || !v || k.sonuc) return { ok: false, neden: "Karar bekleyen bir görüşme yok." };
  if (!["soz", "ikna", "baski", "algi", "pazarlik"].includes(arac)) return { ok: false, neden: "Geçersiz kulis aracı." };
  if (arac === "ikna" && d.bosGun < 1) return { ok: false, neden: "Kişisel görüşme için bir boş gün gerekiyor." };
  if (arac === "pazarlik" && v.parti === "yukselis") return { ok: false, neden: "Bu yol muhalefet ve ittifak liderleriyle kullanılır." };
  const teklif=o.politika?I.politikalar[o.politika]:undefined;
  if(arac==="soz"&&v.dert==="vicdan"&&teklif?.temel_hak&&o.hedef>(d.politika[teklif.id]??teklif.baslangic))return{ok:false,neden:`${v.ad}: “Bu metindeki hak kısıtlaması kalkmadan başka bir sözle anlaşamam.”`};
  const vd = d.meclis.vekiller[v.id] ??= vekilDurumu(d, v.id);
  let haber = "";
  let evet = false;
  switch (arac) {
    case "soz": {
      const dava = v.dert === "dava";
      const s = sozVer(d, { metin: `${v.ad}: ${v.talep}`, kalem: v.dert === "yatirim" ? "yatirim" : "personel", maliyet: v.dert === "yatirim" ? 0.08 : 0.03, vade: 2, grup: v.dert === "yatirim" ? "grup.kentli" : "grup.memur" });
      vd.sozler.push(s.id);
      if (dava) { sicilYaz(d, `${v.ad} için yargıya müdahale sözü`, "baski"); etkiUygula(d, "yargi", -2, "sosyal"); }
      if (v.dert === "makam") { sicilYaz(d, `${v.ad} ile kadro pazarlığı`, "usulsuzluk"); etkiUygula(d, "parti_ici", 2, "sosyal"); }
      if (v.dert === "vicdan") { etkiUygula(d, "basin", 1, "sosyal"); etkiUygula(d, "parti_ici", 1, "sosyal"); }
      o.bonus[v.id] = 0.4; vd.iliski = sinir(vd.iliski + 8); evet = true;
      haber = `${v.ad} evet sözü verdi. Talebi iki ay vadeyle Hazine söz defterine yazıldı.`;
      break;
    }
    case "ikna": {
      d.bosGun--;
      evet = zarSayi(d.zar) < sinir(0.2 + vd.iliski / 180 + (v.dert === "vicdan" ? 0.2 : 0), 0.1, 0.9);
      vd.iliski = sinir(vd.iliski + (evet ? 10 : -3));
      o.bonus[v.id] = evet ? 0.35 : -0.08;
      haber = evet ? `${v.ad}: “Bu kez evet diyeceğim.” Kişisel görüşme bir gün sürdü.` : `${v.ad} ikna olmadı. Takvimden bir gün kullanıldı.`;
      break;
    }
    case "baski": {
      sicilYaz(d, `${v.ad} için oylama öncesi dosya tehdidi`, "baski");
      vd.iliski = sinir(vd.iliski - 25);
      evet = zarSayi(d.zar) < 0.6;
      o.bonus[v.id] = evet ? 0.4 : -0.35;
      etkiUygula(d, "yargi", -1, "sosyal");
      haber = evet ? `${v.ad} sessizce evet sözü verdi. Tehdit sicile yazıldı.` : `${v.ad}: “Bu konuşmayı unutmayacağım.” Tehdit geri tepti; sicile yazıldı.`;
      break;
    }
    case "algi": {
      vd.iliski = sinir(vd.iliski - 15);
      etkiUygula(d, "basin", -2, "sosyal"); etkiUygula(d, "kutuplasma", 2, "sosyal");
      sicilYaz(d, `${v.ad} hakkında yakın medyada yönlendirme`, "baski");
      const tuttu = zarSayi(d.zar) < 0.55;
      o.bonus[v.id] = tuttu ? 0.25 : -0.3;
      haber = tuttu ? `${v.ad} üzerindeki medya baskısı arttı; grup başkanvekili destek bekliyor.` : `Medya kampanyası ${v.ad} çevresinde dayanışma yarattı; vekil daha da uzaklaştı.`;
      break;
    }
    case "pazarlik": {
      o.taviz = v.parti; o.bonus[v.id] = 0.3; evet = true;
      const etkiler: Record<string, number> = v.parti === "bayrak" ? { "grup.milliyetci": 2, "grup.kalan": -3 }
        : v.parti === "kalan" ? { "grup.kalan": 2, "grup.milliyetci": -3 }
        : v.parti === "demokrat" ? { basin: 2, "grup.muhafazakar": -2, rakip: 1 }
        : { guven: 1, "grup.isci": -2, butce_acigi: -0.08 };
      for (const [id, deger] of Object.entries(etkiler)) etkiUygula(d, id, deger, "sosyal");
      etkiUygula(d, "parti_ici", 2, "sosyal");
      haber = `${PARTILER.find(p => p.id === v.parti)!.ad} lideriyle politika tavizi karşılığında anlaşıldı. Kendi tabanınızdan tepki geldi.`;
      break;
    }
  }
  if (evet) o.sozVeren.push(v.id);
  k.sonuc = haber;
  haberYaz(d, haber);
  return { ok: true, haber };
}
export function kulisKapat(d: OyunDurumu): EylemSonucu {
  if (!d.meclis.kulis) return { ok: false, neden: "Açık görüşme yok." };
  d.meclis.kulis = null;
  return { ok: true };
}

export function vekilIliskisi(d: OyunDurumu, id: string): number {
  return sinir(vekilDurumu(d, id).iliski + sozEtkisi(d, id));
}
function sozEtkisi(d: OyunDurumu, id: string): number {
  const v = vekilDurumu(d, id);
  return v.sozler.reduce((a, s) => {
    const soz = d.ekonomi.sozler.find(x => x.id === s);
    return a + (soz?.durum === "tutuldu" ? 8 : soz?.durum === "kirildi" ? -25 : 0);
  }, 0);
}
/** Her dolu sandalye tam bir oy verir. İsmi bilinen adaylar bloktan çıkarılır. */
export function oylamayiSay(d: OyunDurumu, I: IcerikPaketi, o: Oylama): OylamaSonucu {
  const once = d.meclis.sonuclar.find(r => r.id === o.id);
  if (once) return once;
  const p = o.politika ? I.politikalar[o.politika] : undefined;
  const adaylar = I.meclis.vekiller.filter(v => o.adaylar.includes(v.id));
  const oylar: Oy[] = [];
  const ortakSapma = (zarSayi(d.zar) - 0.5) * 0.12;
  for (const parti of PARTILER) {
    const sapma = ortakSapma + (zarSayi(d.zar) - 0.5) * 0.1;
    const bloklar = parti.id === "yukselis" ? HIZIPLER.map(h => ({ adet: h.sandalye, hizip: h.id })) : [{ adet: parti.sandalye, hizip: undefined }];
    let sira = 0;
    for (const blok of bloklar) {
      const ayrilan = adaylar.filter(v => v.parti === parti.id && (parti.id !== "yukselis" || v.hizip === blok.hizip)).length;
      const n = sinir(partiOlasiligi(d, parti.id, p, o.hedef, blok.hizip) + sapma + (o.taviz === parti.id ? 0.25 : 0), 0.01, 0.995);
      for (let i = 0; i < blok.adet - ayrilan; i++) {
        const z = zarSayi(d.zar);
        const oy = z < n ? "evet" : z > 0.985 ? "cekimser" : "hayir";
        oylar.push({ kim: `${parti.kisa} sıra ${++sira}`, parti: parti.id, oy, fire: parti.id === "yukselis" && oy !== "evet" });
      }
    }
  }
  for (const v of adaylar) {
    const vd = d.meclis.vekiller[v.id] ??= vekilDurumu(d, v.id);
    const iliski = sinir(vd.iliski + sozEtkisi(d, v.id));
    const ihanet = sinir(0.04 + (65 - iliski) / 150 + vd.ihanet * 0.04, 0.03, 0.75);
    const soz = o.sozVeren.includes(v.id);
    const evet = zarSayi(d.zar) < (soz ? 1 - ihanet : vekilOlasiligi(d, o, v, I));
    const fire = soz && !evet;
    if (fire) { vd.ihanet++; vd.iliski = sinir(vd.iliski - 8); }
    oylar.push({ kim: v.ad, parti: v.parti, oy: evet ? "evet" : "hayir", fire });
  }
  // Parti bilgisi seçildiği listedir; ayrılanların bugünkü grubu ayrıca saklanır.
  let kopan = 0;
  for (const oy of oylar) if (d.yonetim.parti.ayrilan && oy.parti === "yukselis" && oy.kim.includes(" sıra ") && kopan < d.yonetim.parti.vekil) {
    oy.grup = "ayrilan"; oy.oy = zarSayi(d.zar) < 0.12 ? "evet" : "hayir"; oy.fire = oy.oy !== "evet"; kopan++;
  }
  const evet = oylar.filter(v => v.oy === "evet").length;
  const hayir = oylar.filter(v => v.oy === "hayir").length;
  const katilan = oylar.length;
  const r: OylamaSonucu = { id: o.id, ay: d.ay, baslik: o.baslik, tur: o.tur, evet, hayir, cekimser: katilan - evet - hayir, katilan, esik: oyEsigi(o.tur, katilan), sonuc: oySonucu(o.tur, evet, katilan), oylar };
  d.meclis.sonuclar.push(r);
  if (d.meclis.sonuclar.length > 60) d.meclis.sonuclar.shift();
  return r;
}

export function hizipleriGuncelle(d: OyunDurumu): void {
  const fark = (id: string) => (d.gostergeler[id] ?? 50) - (d.ayBasi[id] ?? 50);
  const etkiler: Record<HizipId, number> = { eski: -fark("parti_ici") * 0.5,
    teknokrat: fark("guven") * 0.15 + fark("yargi") * 0.25,
    muhafazakar: fark("grup.muhafazakar") * 0.5 };
  for (const h of HIZIPLER) d.meclis.hizipler[h.id] = sinir(d.meclis.hizipler[h.id] + etkiler[h.id]);
}
export function haberYaz(d: OyunDurumu, metin: string): void {
  d.haberler.unshift({ ay: d.ay, metin, kategori: "meclis" });
  d.haberler.length = Math.min(120, d.haberler.length);
  d.buAy.haberler.push(metin);
}
