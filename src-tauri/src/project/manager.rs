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

// --- Project folder management ---

#[derive(Debug, Serialize, Clone)]
pub struct ProjectSummary {
    pub name: String,
    pub judge_name: String,
    pub updated_at: String,
    pub file_path: String,
}

#[tauri::command]
pub fn get_default_projects_folder() -> Result<String, String> {
    let docs = dirs::document_dir().ok_or("Cannot find Documents folder")?;
    let folder = docs.join("AMV Notation").join("Projets");
    fs::create_dir_all(&folder).map_err(|e| format!("Failed to create projects folder: {}", e))?;
    Ok(folder.to_string_lossy().to_string())
}

#[tauri::command]
pub fn list_projects_in_folder(folder_path: String) -> Result<Vec<ProjectSummary>, String> {
    let path = Path::new(&folder_path);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let file_path = entry.path();
        if file_path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        // Try to parse project metadata
        if let Ok(content) = fs::read_to_string(&file_path) {
            if let Ok(data) = serde_json::from_str::<serde_json::Value>(&content) {
                let project = &data["project"];
                let name = project["name"].as_str().unwrap_or("Sans nom").to_string();
                let judge_name = project["judgeName"]
                    .as_str()
                    .or_else(|| project["judge_name"].as_str())
                    .unwrap_or("")
                    .to_string();
                let updated_at = project["updatedAt"]
                    .as_str()
                    .or_else(|| project["updated_at"].as_str())
                    .unwrap_or("")
                    .to_string();

                projects.push(ProjectSummary {
                    name,
                    judge_name,
                    updated_at,
                    file_path: file_path.to_string_lossy().to_string(),
                });
            }
        }
    }

    // Sort by updated_at descending
    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(projects)
}

#[tauri::command]
pub fn ensure_directory_exists(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

// --- User settings persistence ---

#[tauri::command]
pub fn save_user_settings(data: serde_json::Value) -> Result<(), String> {
    let docs = dirs::document_dir().ok_or("Cannot find Documents folder")?;
    let folder = docs.join("AMV Notation");
    fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
    let path = folder.join("settings.json");
    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| format!("Failed to save settings: {}", e))
}

#[tauri::command]
pub fn load_user_settings() -> Result<serde_json::Value, String> {
    let docs = dirs::document_dir().ok_or("Cannot find Documents folder")?;
    let path = docs.join("AMV Notation").join("settings.json");
    if !path.exists() {
        return Ok(serde_json::Value::Null);
    }
    let json = fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    serde_json::from_str(&json).map_err(|e| format!("Failed to parse settings: {}", e))
}
