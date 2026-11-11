use serde::Serialize;
use std::{fs, io::Write, path::Path};

#[derive(Serialize)]
pub struct Kayitlar {
    pub asil: Option<String>,
    pub yedek: Option<String>,
}

fn oku_varsa(yol: &Path) -> Result<Option<String>, String> {
    match fs::read_to_string(yol) {
        Ok(metin) => Ok(Some(metin)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("Kayıt okunamadı: {e}")),
    }
}

pub fn oku(klasor: &Path) -> Result<Kayitlar, String> {
    Ok(Kayitlar {
        asil: oku_varsa(&klasor.join("otomatik.json"))?,
        yedek: oku_varsa(&klasor.join("otomatik.yedek.json"))?,
    })
}

pub fn yaz(klasor: &Path, metin: &str) -> Result<(), String> {
    let veri: serde_json::Value = serde_json::from_str(metin).map_err(|e| e.to_string())?;
    if veri["oyun"] != "akkopru-2026" || !veri["durum"].is_object() {
        return Err("Bu bir Akköprü kaydı değil.".into());
    }
    fs::create_dir_all(klasor).map_err(|e| e.to_string())?;
    let asil = klasor.join("otomatik.json");
    let yedek = klasor.join("otomatik.yedek.json");
    let gecici = klasor.join("otomatik.gecici.json");
    let mut dosya = fs::File::create(&gecici).map_err(|e| e.to_string())?;
    dosya.write_all(metin.as_bytes()).map_err(|e| e.to_string())?;
    dosya.sync_all().map_err(|e| e.to_string())?;
    // Eski geçerli dosya önce yedeklenir. Yeni dosya yazılamazsa asıl kayıt yerinde kalır.
    if asil.exists() {
        if let Ok(eski) = fs::read_to_string(&asil) {
            if serde_json::from_str::<serde_json::Value>(&eski).is_ok() {
                fs::copy(&asil, &yedek).map_err(|e| e.to_string())?;
            }
        }
    }
    fs::rename(&gecici, &asil).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn kayit_yazilir_yedeklenir_ve_bozuk_veri_ezmez() {
        let klasor = std::env::temp_dir().join(format!("akkopru-kayit-{}", std::process::id()));
        let _ = fs::remove_dir_all(&klasor);
        assert!(oku(&klasor).unwrap().asil.is_none());
        let ilk = r#"{"oyun":"akkopru-2026","durum":{"ay":1}}"#;
        let ikinci = r#"{"oyun":"akkopru-2026","durum":{"ay":2}}"#;
        yaz(&klasor, ilk).unwrap();
        yaz(&klasor, ikinci).unwrap();
        let k = oku(&klasor).unwrap();
        assert_eq!(k.asil.as_deref(), Some(ikinci));
        assert_eq!(k.yedek.as_deref(), Some(ilk));
        assert!(yaz(&klasor, "bozuk").is_err());
        assert!(yaz(&klasor, r#"{"oyun":"baska","durum":{}}"#).is_err());
        assert_eq!(oku(&klasor).unwrap().asil.as_deref(), Some(ikinci));
        fs::remove_dir_all(klasor).unwrap();
    }
}
