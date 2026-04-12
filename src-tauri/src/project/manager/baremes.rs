use std::collections::HashSet;
use std::fs;
use std::path::Path;

use super::json_io;
use super::paths;

fn legacy_bareme_file_path(bareme_id: &str) -> Result<std::path::PathBuf, String> {
    let folder = paths::baremes_folder()?;
    let name = paths::sanitize_bareme_file_name(bareme_id);
    Ok(folder.join(format!("{}.json", name)))
}

fn bareme_file_path(data: &serde_json::Value, bareme_id: &str) -> Result<std::path::PathBuf, String> {
    let folder = paths::baremes_folder()?;
    let id = paths::sanitize_bareme_file_name(bareme_id);
    let name = data
        .get("name")
        .and_then(|value| value.as_str())
        .map(paths::sanitize_bareme_file_name)
        .filter(|value| value != "bareme")
        .unwrap_or_else(|| "bareme".to_string());

    let file_name = if name == id {
        id
    } else {
        format!("{}__{}", name, id)
    };
    Ok(folder.join(format!("{}.json", file_name)))
}

pub fn default_baremes_folder() -> Result<String, String> {
    let folder = paths::baremes_folder()?;
    Ok(folder.to_string_lossy().to_string())
}

pub fn save_bareme_file(data: serde_json::Value, bareme_id: String) -> Result<(), String> {
    let path = bareme_file_path(&data, &bareme_id)?;
    json_io::write_pretty_json(&path, &data, "save bareme")?;
    cleanup_same_id_bareme_files(Some(&path), &bareme_id)?;
    cleanup_duplicate_bareme_files(Some(&path), Some(&data))
}

pub fn delete_bareme_file(bareme_id: String) -> Result<(), String> {
    let legacy_path = legacy_bareme_file_path(&bareme_id)?;
    if legacy_path.exists() {
        fs::remove_file(legacy_path).map_err(|e| format!("Failed to delete bareme: {}", e))?;
    }
    cleanup_same_id_bareme_files(None, &bareme_id)
}

pub fn load_baremes_files() -> Result<Vec<serde_json::Value>, String> {
    let folder = paths::baremes_folder()?;
    let mut baremes = Vec::new();
    let mut seen = HashSet::new();
    let mut duplicates_to_delete = Vec::new();
    let mut entries: Vec<_> = fs::read_dir(&folder)
        .map_err(|e| format!("Failed to read baremes folder: {}", e))?
        .flatten()
        .map(|entry| entry.path())
        .filter(|path| path.extension().and_then(|e| e.to_str()) == Some("json"))
        .collect();

    entries.sort_by(|a, b| {
        let a_modified = fs::metadata(a)
            .and_then(|meta| meta.modified())
            .ok();
        let b_modified = fs::metadata(b)
            .and_then(|meta| meta.modified())
            .ok();
        b_modified.cmp(&a_modified)
    });

    for path in entries {
        let content = match fs::read_to_string(&path) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let parsed = match serde_json::from_str::<serde_json::Value>(&content) {
            Ok(v) => v,
            Err(_) => continue,
        };

        let Some(fingerprint) = bareme_dedup_key(&parsed) else {
            baremes.push(parsed);
            continue;
        };

        if seen.insert(fingerprint) {
            baremes.push(parsed);
        } else {
            duplicates_to_delete.push(path);
        }
    }

    for duplicate in duplicates_to_delete {
        let _ = fs::remove_file(duplicate);
    }

    Ok(baremes)
}

fn cleanup_duplicate_bareme_files(
    kept_path: Option<&Path>,
    kept_value: Option<&serde_json::Value>,
) -> Result<(), String> {
    let folder = paths::baremes_folder()?;
    let Some(reference) = kept_value.and_then(bareme_dedup_key) else {
        return Ok(());
    };

    let entries = fs::read_dir(folder).map_err(|e| format!("Failed to read baremes folder: {}", e))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        if kept_path.is_some_and(|candidate| candidate == path.as_path()) {
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

        if bareme_dedup_key(&parsed).as_deref() == Some(reference.as_str()) {
            let _ = fs::remove_file(path);
        }
    }

    Ok(())
}

fn cleanup_same_id_bareme_files(kept_path: Option<&Path>, bareme_id: &str) -> Result<(), String> {
    let folder = paths::baremes_folder()?;
    let entries = fs::read_dir(folder).map_err(|e| format!("Failed to read baremes folder: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        if kept_path.is_some_and(|candidate| candidate == path.as_path()) {
            continue;
        }

        if read_bareme_id(&path).as_deref() == Some(bareme_id) {
            let _ = fs::remove_file(path);
        }
    }

    Ok(())
}

fn read_bareme_id(path: &Path) -> Option<String> {
    let content = fs::read_to_string(path).ok()?;
    let parsed = serde_json::from_str::<serde_json::Value>(&content).ok()?;
    parsed
        .get("id")
        .and_then(|value| value.as_str())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn bareme_dedup_key(value: &serde_json::Value) -> Option<String> {
    if is_auto_imported_bareme(value) {
        if let Some(fingerprint) = imported_bareme_fingerprint(value) {
            return Some(format!("import:{}", fingerprint));
        }
    }

    bareme_fingerprint(value).map(|fingerprint| format!("strict:{}", fingerprint))
}

fn bareme_fingerprint(value: &serde_json::Value) -> Option<String> {
    let name = normalize_token(value.get("name")?.as_str()?);
    let criteria = value.get("criteria")?.as_array()?;

    let mut parts = Vec::with_capacity(criteria.len());
    for criterion in criteria {
        let criterion_name = normalize_token(criterion.get("name").and_then(|v| v.as_str()).unwrap_or(""));
        let criterion_max = criterion
            .get("max")
            .map(number_to_string)
            .unwrap_or_default();
        let criterion_category =
            normalize_token(criterion.get("category").and_then(|v| v.as_str()).unwrap_or(""));
        parts.push(format!("{}:{}:{}", criterion_name, criterion_max, criterion_category));
    }

    Some(format!("{}|{}", name, parts.join("|")))
}

fn imported_bareme_fingerprint(value: &serde_json::Value) -> Option<String> {
    let name = normalize_token(value.get("name")?.as_str()?);
    let criteria = value.get("criteria")?.as_array()?;

    let mut parts = Vec::with_capacity(criteria.len());
    for criterion in criteria {
        let criterion_name = normalize_token(criterion.get("name").and_then(|v| v.as_str()).unwrap_or(""));
        let criterion_max = criterion
            .get("max")
            .map(number_to_string)
            .unwrap_or_default();
        parts.push(format!("{}:{}", criterion_name, criterion_max));
    }

    Some(format!("{}|{}", name, parts.join("|")))
}

fn is_auto_imported_bareme(value: &serde_json::Value) -> bool {
    let id = value
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or_default();
    let description = normalize_token(
        value
            .get("description")
            .and_then(|v| v.as_str())
            .unwrap_or_default(),
    );

    id.starts_with("imported-")
        || description.contains("bareme detecte automatiquement")
        || description.contains("detected automatically")
        || description.contains("detected from")
}

fn number_to_string(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::Number(number) => number.to_string(),
        serde_json::Value::String(text) => text.trim().to_string(),
        _ => String::new(),
    }
}

fn normalize_token(value: &str) -> String {
    value
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .to_lowercase()
}
