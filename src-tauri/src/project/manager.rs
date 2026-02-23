#![allow(dead_code)]
use std::path::Path;

mod baremes;
mod json_io;
mod paths;
mod project_files;
mod project_listing;
mod types;
mod user_settings;

pub use types::ProjectSummary;

#[tauri::command]
pub fn save_project(data: serde_json::Value, file_path: String) -> Result<(), String> {
    project_files::save_project_file(data, file_path)
}

#[tauri::command]
pub fn load_project(file_path: String) -> Result<serde_json::Value, String> {
    project_files::load_project_file(file_path)
}

#[tauri::command]
pub fn export_json(data: serde_json::Value, file_path: String) -> Result<(), String> {
    project_files::export_json_file(data, file_path)
}

#[tauri::command]
pub fn get_default_projects_folder() -> Result<String, String> {
    project_listing::default_projects_folder()
}

#[tauri::command]
pub fn list_projects_in_folder(folder_path: String) -> Result<Vec<ProjectSummary>, String> {
    project_listing::list_projects(folder_path)
}

#[tauri::command]
pub fn ensure_directory_exists(path: String) -> Result<(), String> {
    paths::ensure_directory_exists(Path::new(&path))
}

#[tauri::command]
pub fn get_default_baremes_folder() -> Result<String, String> {
    baremes::default_baremes_folder()
}

#[tauri::command]
pub fn save_bareme(data: serde_json::Value, bareme_id: String) -> Result<(), String> {
    baremes::save_bareme_file(data, bareme_id)
}

#[tauri::command]
pub fn delete_bareme(bareme_id: String) -> Result<(), String> {
    baremes::delete_bareme_file(bareme_id)
}

#[tauri::command]
pub fn load_baremes() -> Result<Vec<serde_json::Value>, String> {
    baremes::load_baremes_files()
}

#[tauri::command]
pub fn save_user_settings(data: serde_json::Value) -> Result<(), String> {
    user_settings::save_settings(data)
}

#[tauri::command]
pub fn load_user_settings() -> Result<serde_json::Value, String> {
    user_settings::load_settings()
}
