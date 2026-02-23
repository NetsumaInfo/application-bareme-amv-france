use std::fs;

use super::json_io;
use super::paths;

fn bareme_file_path(bareme_id: &str) -> Result<std::path::PathBuf, String> {
    let folder = paths::baremes_folder()?;
    let name = paths::sanitize_bareme_file_name(bareme_id);
    Ok(folder.join(format!("{}.json", name)))
}

pub fn default_baremes_folder() -> Result<String, String> {
    let folder = paths::baremes_folder()?;
    Ok(folder.to_string_lossy().to_string())
}

pub fn save_bareme_file(data: serde_json::Value, bareme_id: String) -> Result<(), String> {
    let path = bareme_file_path(&bareme_id)?;
    json_io::write_pretty_json(&path, &data, "save bareme")
}

pub fn delete_bareme_file(bareme_id: String) -> Result<(), String> {
    let path = bareme_file_path(&bareme_id)?;
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("Failed to delete bareme: {}", e))?;
    }
    Ok(())
}

pub fn load_baremes_files() -> Result<Vec<serde_json::Value>, String> {
    let folder = paths::baremes_folder()?;
    let mut baremes = Vec::new();

    let entries = fs::read_dir(folder).map_err(|e| format!("Failed to read baremes folder: {}", e))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }

        let content = match fs::read_to_string(&path) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let parsed = match serde_json::from_str::<serde_json::Value>(&content) {
            Ok(v) => v,
            Err(_) => continue,
        };
        baremes.push(parsed);
    }

    Ok(baremes)
}
