#![allow(dead_code)]
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectData {
    pub version: String,
    pub project: ProjectInfo,
    pub bareme_id: String,
    pub clips: Vec<ClipInfo>,
    pub notes: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectInfo {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub bareme_id: String,
    pub clips_folder_path: String,
    pub settings: ProjectSettings,
    pub file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectSettings {
    pub auto_save: bool,
    pub auto_save_interval: u32,
    pub default_playback_speed: f64,
    pub default_volume: f64,
    pub hide_final_score_until_end: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClipInfo {
    pub id: String,
    pub file_name: String,
    pub file_path: String,
    pub duration: f64,
    pub has_internal_subtitles: bool,
    pub audio_track_count: u32,
    pub scored: bool,
    pub order: u32,
}

#[tauri::command]
pub fn save_project(data: serde_json::Value, file_path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to save project: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn load_project(file_path: String) -> Result<serde_json::Value, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Project file not found: {}", file_path));
    }
    let json = fs::read_to_string(path).map_err(|e| format!("Failed to read project: {}", e))?;
    let data: serde_json::Value =
        serde_json::from_str(&json).map_err(|e| format!("Failed to parse project: {}", e))?;
    Ok(data)
}

#[tauri::command]
pub fn export_json(data: serde_json::Value, file_path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&file_path, json).map_err(|e| format!("Failed to export: {}", e))?;
    Ok(())
}
