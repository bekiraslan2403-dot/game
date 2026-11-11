// Ücret, sefer ve müdahale birbirinden ayrı kayıtlardır. Eski oyuna yeni ödeme eklenmez.
import type { OyunDurumu, MasaKarti } from "./durum.ts";
import { notEkle } from "./yonetim.ts";
import { tarihAdi } from "./takvim.ts";

const DEVAM = new Set(["belediye_maas_2a", "belediye_maas_2b", "belediye_maas_2c"]);
const SON = new Set(["belediye_maas_hizmet", "belediye_maas_hesap", "belediye_maas_3"]);
export function belediyeDurumu(d: OyunDurumu, il: string): { ucret: string; hizmet: string; hesap: string } {
  const odemeler = d.ekonomi.sozler.filter(s => s.durum === "tutuldu" && s.metin.startsWith(`${il} belediyesi `) && s.kalem === "personel");
  const ucret = odemeler.length === 0 ? "Bu dosyada ücret ödemesi yok" : odemeler.length === 1 ? "Bir dönem için ücret ödeneği ödendi" : "İki ayrı dönem için ücret ödeneği ödendi";
  const durum = d.bayraklar.belediye_hizmet;
  const sonAy = d.bayraklar.belediye_hizmet_ay;
  const hizmet = typeof sonAy === "number" && d.ay - sonAy >= 2 ? `${tarihAdi(sonAy)} son teyit; güncel sefer doğrulanmadı` : durum === "calisiyor" ? "Seferler yürütülüyor; gelecek dönem ayrıca finanse edilmeli" : durum === "sinirli" ? "Sınırlı sefer; tam çizelge güvence altında değil" : durum === "gecici" ? "Hastane hattında geçici taşıma; ücret alacağı ayrı" : durum === "durdu" ? "Hastane hattında sefer açığı sürüyor" : "Hizmet yanıtı henüz gelmedi";
  const hesap = d.bayraklar.belediye_acik_hesap ? "Bordro ile diğer faturalar ayrı yayımlandı" : d.bayraklar.belediye_inceleme ? "Ortak inceleme ücret listesini ayırdı" : "Personel dışı faturalar ücret dosyasından ayrı";
  return { ucret, hizmet, hesap };
}

export function belediyeKarar(d: OyunDurumu, m: MasaKarti, sec: number): void {
  if (m.kart !== "belediye_maas_1" && !DEVAM.has(m.kart) && !SON.has(m.kart)) return;
  const il = m.degisken.il;
  if (!il) return;
  d.bayraklar.belediye_il = il;
  d.bayraklar.belediye_hizmet_ay = d.ay;
  if (m.kart === "belediye_maas_1") {
    d.bayraklar.belediye_ilk_yol = ["odeme", "plan", "inceleme"][sec]!;
    d.bayraklar.belediye_hizmet = sec === 0 ? "sinirli" : "durdu";
    return;
  }
  if (DEVAM.has(m.kart)) {
    d.bayraklar.belediye_ikinci_yol = ["odeme", "hesap", "muda"][sec]!;
    d.bayraklar.belediye_hizmet = sec === 0 ? "sinirli" : sec === 1 && m.kart === "belediye_maas_2a" ? "sinirli" : "durdu";
    return;
  }
  const ilkOdendi = d.bayraklar.belediye_ucret_odendi === true;
  const durum = m.kart === "belediye_maas_hizmet" ? sec === 0 && ilkOdendi ? "calisiyor" : "sinirli" : m.kart === "belediye_maas_hesap" ? sec === 0 ? "gecici" : ilkOdendi ? "sinirli" : "durdu" : sec === 1 ? "gecici" : sec === 0 && ilkOdendi ? "sinirli" : "durdu";
  d.bayraklar.belediye_hizmet = durum;
  const kayit = belediyeDurumu(d, il);
  notEkle(d, `${il} garajının son tutanağı: ${kayit.ucret}. ${kayit.hizmet}. ${kayit.hesap}.`, "yerel");
}
