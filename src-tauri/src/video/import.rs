use serde::Serialize;
use std::path::Path;
use walkdir::WalkDir;

const VIDEO_EXTENSIONS: &[&str] = &[
    "mp4", "mkv", "avi", "mov", "webm", "flv", "m4v", "wmv", "mpg", "mpeg", "ts", "vob", "ogv",
    "amv",
];

#[derive(Debug, Serialize, Clone)]
pub struct VideoMetadata {
    pub file_name: String,
    pub file_path: String,
    pub extension: String,
    pub size_bytes: u64,
}

fn is_video_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| VIDEO_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

#[tauri::command]
pub fn scan_video_folder(folder_path: String) -> Result<Vec<VideoMetadata>, String> {
    let path = Path::new(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Err(format!("Folder not found: {}", folder_path));
    }

    let mut videos = Vec::new();

    for entry in WalkDir::new(path).max_depth(1).into_iter().filter_map(|e| e.ok()) {
        let file_path = entry.path();
        if file_path.is_file() && is_video_file(file_path) {
            let file_name = file_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let extension = file_path
                .extension()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let size_bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);

            videos.push(VideoMetadata {
                file_name,
                file_path: file_path.to_string_lossy().to_string(),
                extension,
                size_bytes,
            });
        }
    }

    // Sort by file name
    videos.sort_by(|a, b| a.file_name.to_lowercase().cmp(&b.file_name.to_lowercase()));

    Ok(videos)
}
