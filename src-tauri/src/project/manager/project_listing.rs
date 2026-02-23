use std::fs;
use std::path::{Path, PathBuf};

use super::paths;
use super::types::ProjectSummary;

fn parse_project_summary(data: &serde_json::Value, file_path: &Path) -> ProjectSummary {
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

    ProjectSummary {
        name,
        judge_name,
        updated_at,
        file_path: file_path.to_string_lossy().to_string(),
    }
}

fn is_json_file(path: &PathBuf) -> bool {
    path.extension().and_then(|e| e.to_str()) == Some("json")
}

pub fn default_projects_folder() -> Result<String, String> {
    Ok(paths::projects_folder()?.to_string_lossy().to_string())
}

pub fn list_projects(folder_path: String) -> Result<Vec<ProjectSummary>, String> {
    let path = Path::new(&folder_path);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let file_path = entry.path();
        if !is_json_file(&file_path) {
            continue;
        }

        if let Ok(content) = fs::read_to_string(&file_path) {
            if let Ok(data) = serde_json::from_str::<serde_json::Value>(&content) {
                projects.push(parse_project_summary(&data, &file_path));
            }
        }
    }

    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(projects)
}
