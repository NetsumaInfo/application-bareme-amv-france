use super::json_io;
use super::paths;

pub fn save_settings(data: serde_json::Value) -> Result<(), String> {
    let path = paths::settings_file_path()?;
    json_io::write_pretty_json(&path, &data, "save settings")
}

pub fn load_settings() -> Result<serde_json::Value, String> {
    let path = paths::settings_file_path()?;
    if !path.exists() {
        return Ok(serde_json::Value::Null);
    }
    json_io::read_json(&path, "read settings", "parse settings")
}
