// Büyük oyun kayıtları için tarayıcının dosya veritabanı; otomatik kaydın alanını tüketmez.
let acilis: Promise<IDBDatabase> | null = null;
function veritabani(): Promise<IDBDatabase> {
  if (!acilis)
    acilis = new Promise((resolve, reject) => {
      const istek = indexedDB.open("akkopru-2026:kayitlar", 1);
      istek.onupgradeneeded = () => {
        if (!istek.result.objectStoreNames.contains("yuvalar"))
          istek.result.createObjectStore("yuvalar");
      };
      istek.onsuccess = () => {
        const db = istek.result;
        db.onversionchange = () => {
          db.close();
          acilis = null;
        };
        resolve(db);
      };
      istek.onerror = () => {
        acilis = null;
        reject(new Error("Tarayıcı kayıt yuvalarını açamadı."));
      };
      istek.onblocked = () => {
        acilis = null;
        reject(
          new Error(
            "Kayıt veritabanı başka bir pencerede açık. Diğer oyun penceresini kapatın.",
          ),
        );
      };
    });
  return acilis;
}
export async function yuvaOku(id: number): Promise<string | null> {
  if (!Number.isInteger(id) || id < 0 || id > 3)
    throw Error("Geçersiz kayıt yuvası.");
  const db = await veritabani();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("yuvalar", "readonly"),
      r = tx.objectStore("yuvalar").get(id);
    let metin: string | null = null;
    r.onsuccess = () => {
      metin = typeof r.result === "string" ? r.result : null;
    };
    tx.oncomplete = () => resolve(metin);
    tx.onerror = () => reject(Error("Kayıt yuvası okunamadı."));
    tx.onabort = () => reject(Error("Kayıt okuması yarım kaldı."));
  });
}
export async function yuvaYaz(id: number, metin: string): Promise<void> {
  if (!Number.isInteger(id) || id < 0 || id > 3)
    throw Error("Geçersiz kayıt yuvası.");
  const db = await veritabani();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("yuvalar", "readwrite");
    tx.objectStore("yuvalar").put(metin, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(Error("Kayıt yuvası yazılamadı. Dosyaya aktararak kopya alın."));
    tx.onabort = () =>
      reject(Error("Kayıt yazılması tamamlanamadı; önceki yuva korunuyor."));
  });
}
