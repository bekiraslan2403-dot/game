// Türkçe ek motoru: özel adlara ve kısaltmalara ünlü uyumuna göre hal eklerini getirir.
// Örnekler: Yalıkent'te, Kumsal'a, Merkez TV'ye, ABD'nin, 2026'da, Akköprü'nün.

export type EkTuru = "de" | "deki" | "den" | "e" | "i" | "in" | "le";

const UNLULER = "aıoueiöü";
const KALIN = "aıou";
const SERT = "çfhkpsşt";

/** Kısaltmaların okunuşu: tek tek okunan harflerin adları. */
const HARF_ADI: Record<string, string> = {
  a: "a", b: "be", c: "ce", ç: "çe", d: "de", e: "e", f: "fe", g: "ge", ğ: "yumuşak ge", h: "he", ı: "ı", i: "i",
  j: "je", k: "ke", l: "le", m: "me", n: "ne", o: "o", ö: "ö", p: "pe", r: "re", s: "se", ş: "şe", t: "te",
  u: "u", ü: "ü", v: "ve", y: "ye", z: "ze",
};

/** Okunuşu kuraldan farklı olan sözcükler (gerektikçe genişletilir). */
const OKUNUS: Record<string, string> = {};

const BIRLER = ["sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const ONLAR = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];

/** Bir tamsayının okunuşunun son sözcüğü (eki belirleyen kısım). */
function sayiOkunusu(n: number): string {
  if (n === 0) return "sıfır";
  if (n % 1_000_000_000 === 0) return "milyar";
  if (n % 1_000_000 === 0) return "milyon";
  if (n % 1000 === 0) return "bin";
  if (n % 100 === 0) return "yüz";
  if (n % 10 === 0) return ONLAR[(n % 100) / 10] ?? "on";
  return BIRLER[n % 10] ?? "bir";
}

/** Bir adın eki belirleyen okunuşu (küçük harfle). */
export function okunus(ad: string): string {
  const sade = ad.trim();
  if (OKUNUS[sade]) return OKUNUS[sade];
  const sonSozcuk = sade.split(/\s+/).pop() ?? sade;
  if (/^\d+$/.test(sonSozcuk)) return sayiOkunusu(Number(sonSozcuk));
  const harfler = sonSozcuk.replace(/[^\p{L}]/gu, "");
  const kucuk = harfler.toLocaleLowerCase("tr");
  const tumuBuyuk = harfler.length > 1 && harfler === harfler.toLocaleUpperCase("tr") && harfler !== kucuk;
  if (tumuBuyuk && harfler.length <= 3) {
    const son = kucuk[kucuk.length - 1] ?? "e";
    return kucuk.slice(0, -1) + (HARF_ADI[son] ?? son);
  }
  return kucuk;
}

function sonUnlu(s: string): string {
  for (let i = s.length - 1; i >= 0; i--) {
    const c = s[i] as string;
    if (UNLULER.includes(c)) return c;
  }
  return "e";
}

/** Okunuşa göre ekin kendisini üretir (kesme işareti olmadan). */
export function ekUret(okunusu: string, tur: EkTuru): string {
  const son = okunusu[okunusu.length - 1] ?? "e";
  const unluyleBiter = UNLULER.includes(son);
  const sert = SERT.includes(son);
  const u = sonUnlu(okunusu);
  const A = KALIN.includes(u) ? "a" : "e";
  const I = ({ a: "ı", ı: "ı", o: "u", u: "u", e: "i", i: "i", ö: "ü", ü: "ü" } as Record<string, string>)[u] ?? "i";
  const D = sert ? "t" : "d";
  switch (tur) {
    case "de": return D + A;
    case "deki": return D + A + "ki";
    case "den": return D + A + "n";
    case "e": return (unluyleBiter ? "y" : "") + A;
    case "i": return (unluyleBiter ? "y" : "") + I;
    case "in": return (unluyleBiter ? "n" : "") + I + "n";
    case "le": return (unluyleBiter ? "y" : "") + "l" + A;
  }
}

/**
 * Bir ada hal eki getirir. Özel adlarda (varsayılan) kesme işareti konur: "Yalıkent'te".
 * Cins adlarda (ozel: false) ek doğrudan eklenir: "gazetesinde" için "gazetesi" + "de" değil, bu ünsüz
 * yumuşamasını ve kaynaştırmayı içermez; cins adlar için metinde hazır biçim kullanılmalıdır.
 */
export function ek(ad: string, tur: EkTuru, ozel = true): string {
  const e = ekUret(okunus(ad), tur);
  return ozel ? `${ad}'${e}` : ad + e;
}

/** Okunuşu özel olan bir sözcüğü kaydeder (ör. yabancı bir ad). */
export function okunusEkle(ad: string, okunusu: string): void {
  OKUNUS[ad] = okunusu.toLocaleLowerCase("tr");
}
