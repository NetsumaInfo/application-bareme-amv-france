use serde::{Deserialize, Serialize};

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

#[derive(Debug, Serialize, Clone)]
pub struct ProjectSummary {
    pub name: String,
    pub judge_name: String,
    pub updated_at: String,
    pub file_path: String,
}
