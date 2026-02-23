use std::fs;
use std::path::{Path, PathBuf};

pub fn ensure_directory_exists(path: &Path) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

fn documents_folder() -> Result<PathBuf, String> {
    dirs::document_dir().ok_or("Cannot find Documents folder".to_string())
}

pub fn app_root_folder() -> Result<PathBuf, String> {
    let folder = documents_folder()?.join("AMV Notation");
    ensure_directory_exists(&folder)?;
    Ok(folder)
}

pub fn projects_folder() -> Result<PathBuf, String> {
    let folder = app_root_folder()?.join("Projets");
    ensure_directory_exists(&folder)?;
    Ok(folder)
}

pub fn baremes_folder() -> Result<PathBuf, String> {
    let folder = projects_folder()?.join("Baremes");
    ensure_directory_exists(&folder)?;
    Ok(folder)
}

pub fn settings_file_path() -> Result<PathBuf, String> {
    Ok(app_root_folder()?.join("settings.json"))
}

pub fn sanitize_bareme_file_name(id: &str) -> String {
    let trimmed = id.trim();
    if trimmed.is_empty() {
        return "bareme".to_string();
    }

    let mut out = String::with_capacity(trimmed.len());
    for ch in trimmed.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    if out.is_empty() {
        "bareme".to_string()
    } else {
        out
    }
}
