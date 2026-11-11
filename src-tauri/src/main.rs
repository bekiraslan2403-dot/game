#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod kayit;
use std::sync::Mutex;
use tauri::Manager;

struct KayitKilidi(Mutex<()>);

#[tauri::command]
fn kayit_oku(app: tauri::AppHandle, kilit: tauri::State<KayitKilidi>) -> Result<kayit::Kayitlar, String> {
    let _koruma = kilit.0.lock().map_err(|e| e.to_string())?;
    let klasor = app.path().app_data_dir().map_err(|e| e.to_string())?.join("kayitlar");
    kayit::oku(&klasor)
}

#[tauri::command]
fn kayit_yaz(app: tauri::AppHandle, kilit: tauri::State<KayitKilidi>, metin: String) -> Result<(), String> {
    let _koruma = kilit.0.lock().map_err(|e| e.to_string())?;
    let klasor = app.path().app_data_dir().map_err(|e| e.to_string())?.join("kayitlar");
    kayit::yaz(&klasor, &metin)
}

fn main() {
    tauri::Builder::default()
        .manage(KayitKilidi(Mutex::new(())))
        .invoke_handler(tauri::generate_handler![kayit_oku, kayit_yaz])
        .run(tauri::generate_context!())
        .expect("Akköprü 2026 başlatılamadı");
}
