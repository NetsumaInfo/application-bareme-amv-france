use std::fs;
use std::path::Path;

pub fn write_pretty_json(path: &Path, data: &serde_json::Value, context: &str) -> Result<(), String> {
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| format!("Failed to {}: {}", context, e))
}

pub fn read_json(path: &Path, read_context: &str, parse_context: &str) -> Result<serde_json::Value, String> {
    let json = fs::read_to_string(path).map_err(|e| format!("Failed to {}: {}", read_context, e))?;
    serde_json::from_str(&json).map_err(|e| format!("Failed to {}: {}", parse_context, e))
}
