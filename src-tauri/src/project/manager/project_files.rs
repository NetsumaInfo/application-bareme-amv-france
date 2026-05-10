use std::path::Path;

use super::json_io;

pub fn save_project_file(data: serde_json::Value, file_path: String) -> Result<(), String> {
    json_io::write_pretty_json(Path::new(&file_path), &data, "save project")
}

pub fn load_project_file(file_path: String) -> Result<serde_json::Value, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Project file not found: {}", file_path));
    }
    json_io::read_json(path, "read project", "parse project")
}

pub fn export_json_file(data: serde_json::Value, file_path: String) -> Result<(), String> {
    json_io::write_pretty_json(Path::new(&file_path), &data, "export")
}

pub fn delete_project_file(file_path: String) -> Result<(), String> {
    let normalized = file_path.trim();
    if normalized.is_empty() {
        return Err("Project file path is empty".to_string());
    }

    let path = Path::new(normalized);
    if !path.exists() {
        return Ok(());
    }
    if !path.is_file() {
        return Err(format!("Project path is not a file: {}", normalized));
    }

    std::fs::remove_file(path).map_err(|error| format!("Failed to delete project: {}", error))
}
