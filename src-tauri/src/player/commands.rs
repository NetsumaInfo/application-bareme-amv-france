use crate::state::AppState;
use base64::engine::general_purpose::STANDARD as BASE64_STD;
use base64::Engine;
use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::{Duration, Instant};
use tauri::State;

/// Resolve an external tool (ffmpeg, ffprobe, mediainfo) by checking
/// exe-relative paths first (for Tauri bundled apps), then fallback to PATH.
pub fn resolve_tool(name: &str) -> PathBuf {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            // Tauri bundles resources next to the exe under resources/
            let candidates = [
                exe_dir.join("resources").join("windows").join(name),
                exe_dir.join("resources").join(name),
                exe_dir.join(name),
            ];
            for candidate in &candidates {
                if candidate.exists() {
                    return candidate.clone();
                }
            }
        }
    }
    // Fallback: rely on system PATH
    PathBuf::from(name)
}

#[derive(Debug, Serialize)]
pub struct PlayerStatus {
    pub is_playing: bool,
    pub current_time: f64,
    pub duration: f64,
    pub volume: f64,
    pub speed: f64,
}

#[derive(Debug, Serialize)]
pub struct TrackListResult {
    pub audio_tracks: Vec<TrackItem>,
    pub subtitle_tracks: Vec<TrackItem>,
}

#[derive(Debug, Serialize)]
pub struct TrackItem {
    pub id: i64,
    pub title: Option<String>,
    pub lang: Option<String>,
    pub codec: Option<String>,
    pub external: bool,
}

fn normalize_path(value: &str) -> String {
    value.replace('\\', "/")
}

fn parse_json_i64(value: Option<&Value>) -> i64 {
    fn parse_from_str(text: &str) -> Option<i64> {
        let cleaned: String = text
            .trim()
            .chars()
            .filter(|c| c.is_ascii_digit() || *c == '.' || *c == '-' || *c == '+')
            .collect();
        if cleaned.is_empty() {
            return None;
        }
        if let Ok(v) = cleaned.parse::<i64>() {
            return Some(v);
        }
        cleaned.parse::<f64>().ok().map(|v| v.round() as i64)
    }

    value
        .and_then(|v| {
            v.as_i64()
                .or_else(|| v.as_u64().and_then(|u| i64::try_from(u).ok()))
                .or_else(|| v.as_f64().map(|f| f.round() as i64))
                .or_else(|| v.as_str().and_then(parse_from_str))
        })
        .unwrap_or(0)
}

fn parse_json_f64(value: Option<&Value>) -> f64 {
    fn parse_from_str(text: &str) -> Option<f64> {
        let cleaned: String = text
            .trim()
            .chars()
            .filter(|c| c.is_ascii_digit() || *c == '.' || *c == '-' || *c == '+')
            .collect();
        if cleaned.is_empty() {
            return None;
        }
        cleaned.parse::<f64>().ok()
    }

    value
        .and_then(|v| {
            v.as_f64()
                .or_else(|| v.as_i64().map(|n| n as f64))
                .or_else(|| v.as_u64().map(|n| n as f64))
                .or_else(|| v.as_str().and_then(parse_from_str))
        })
        .unwrap_or(0.0)
}

fn parse_json_string(value: Option<&Value>) -> String {
    value
        .and_then(|v| {
            v.as_str()
                .map(|s| s.trim().to_string())
                .or_else(|| v.as_i64().map(|n| n.to_string()))
                .or_else(|| v.as_u64().map(|n| n.to_string()))
                .or_else(|| v.as_f64().map(|n| n.to_string()))
        })
        .unwrap_or_default()
}

fn build_minimal_media_info(path: &str) -> super::mpv_wrapper::MediaInfo {
    let mut info = super::mpv_wrapper::MediaInfo::empty();
    if let Ok(metadata) = std::fs::metadata(path) {
        info.file_size = i64::try_from(metadata.len()).unwrap_or(0);
    }
    if let Some(ext) = std::path::Path::new(path).extension().and_then(|e| e.to_str()) {
        info.format_name = ext.to_ascii_lowercase();
    }
    info
}

fn probe_media_info_via_mediainfo(path: &str) -> Result<super::mpv_wrapper::MediaInfo, String> {
    let mut child = Command::new(resolve_tool("mediainfo.exe"))
        .args(["--Output=JSON", path])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("mediainfo indisponible: {}", e))?;

    let timeout = Duration::from_millis(2500);
    let start = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(_)) => break,
            Ok(None) => {
                if start.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err("mediainfo timeout (2.5s)".to_string());
                }
                std::thread::sleep(Duration::from_millis(20));
            }
            Err(e) => {
                return Err(format!("mediainfo wait failed: {}", e));
            }
        }
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("mediainfo output failed: {}", e))?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let root: Value =
        serde_json::from_slice(&output.stdout).map_err(|e| format!("mediainfo JSON invalide: {}", e))?;
    let tracks = root
        .get("media")
        .and_then(|m| m.get("track"))
        .and_then(|t| t.as_array())
        .cloned()
        .unwrap_or_default();

    let get_type = |track: &Value| {
        track
            .get("@type")
            .or_else(|| track.get("Type"))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_ascii_lowercase()
    };

    let general = tracks.iter().find(|t| get_type(t) == "general");
    let video = tracks.iter().find(|t| get_type(t) == "video");
    let audio = tracks.iter().find(|t| get_type(t) == "audio");

    let audio_track_count = tracks.iter().filter(|t| get_type(t) == "audio").count() as i64;
    let video_track_count = tracks.iter().filter(|t| get_type(t) == "video").count() as i64;
    let subtitle_track_count = tracks
        .iter()
        .filter(|t| {
            let kind = get_type(t);
            kind == "text" || kind == "subtitle" || kind == "subtitles"
        })
        .count() as i64;

    let mut duration = parse_json_f64(general.and_then(|g| g.get("Duration")));
    if duration > 10_000.0 {
        duration /= 1000.0;
    }

    Ok(super::mpv_wrapper::MediaInfo {
        width: parse_json_i64(video.and_then(|v| v.get("Width"))),
        height: parse_json_i64(video.and_then(|v| v.get("Height"))),
        video_codec: {
            let codec = parse_json_string(video.and_then(|v| v.get("Format")));
            if codec.is_empty() {
                parse_json_string(video.and_then(|v| v.get("CodecID")))
            } else {
                codec
            }
        },
        audio_codec: {
            let codec = parse_json_string(audio.and_then(|a| a.get("Format")));
            if codec.is_empty() {
                parse_json_string(audio.and_then(|a| a.get("CodecID")))
            } else {
                codec
            }
        },
        file_size: parse_json_i64(general.and_then(|g| g.get("FileSize"))),
        video_bitrate: parse_json_i64(video.and_then(|v| v.get("BitRate"))),
        audio_bitrate: parse_json_i64(audio.and_then(|a| a.get("BitRate"))),
        fps: parse_json_f64(video.and_then(|v| v.get("FrameRate"))),
        sample_rate: parse_json_i64(audio.and_then(|a| a.get("SamplingRate"))),
        channels: parse_json_i64(audio.and_then(|a| a.get("Channels"))),
        format_name: parse_json_string(general.and_then(|g| g.get("Format"))),
        duration,
        format_long_name: {
            let name = parse_json_string(general.and_then(|g| g.get("Format_Commercial_IfAny")));
            if name.is_empty() {
                parse_json_string(general.and_then(|g| g.get("Format_String")))
            } else {
                name
            }
        },
        overall_bitrate: parse_json_i64(general.and_then(|g| g.get("OverallBitRate"))),
        video_profile: parse_json_string(video.and_then(|v| v.get("Format_Profile"))),
        pixel_format: parse_json_string(video.and_then(|v| v.get("ChromaSubsampling"))),
        color_space: parse_json_string(video.and_then(|v| v.get("ColorSpace"))),
        color_primaries: {
            let v = parse_json_string(video.and_then(|s| s.get("colour_primaries")));
            if v.is_empty() {
                parse_json_string(video.and_then(|s| s.get("ColorPrimaries")))
            } else {
                v
            }
        },
        color_transfer: {
            let v = parse_json_string(video.and_then(|s| s.get("transfer_characteristics")));
            if v.is_empty() {
                parse_json_string(video.and_then(|s| s.get("TransferCharacteristics")))
            } else {
                v
            }
        },
        video_bit_depth: parse_json_i64(video.and_then(|v| v.get("BitDepth"))),
        audio_channel_layout: parse_json_string(audio.and_then(|a| a.get("ChannelLayout"))),
        audio_language: parse_json_string(audio.and_then(|a| a.get("Language"))),
        audio_track_count,
        video_track_count,
        subtitle_track_count,
        video_frame_count: parse_json_i64(video.and_then(|v| v.get("FrameCount"))),
        sample_aspect_ratio: parse_json_string(video.and_then(|v| v.get("PixelAspectRatio"))),
        display_aspect_ratio: parse_json_string(video.and_then(|v| v.get("DisplayAspectRatio"))),
    })
}

fn probe_media_info_open_source(path: &str) -> Result<super::mpv_wrapper::MediaInfo, String> {
    match super::mpv_wrapper::MpvPlayer::probe_media_info(path) {
        Ok(info) => Ok(info),
        Err(ffprobe_err) => probe_media_info_via_mediainfo(path)
            .map_err(|mediainfo_err| format!("ffprobe: {}; mediainfo: {}", ffprobe_err, mediainfo_err)),
    }
}

fn probe_frame_preview_with_ffmpeg(path: &str, seconds: f64, width: u32) -> Result<String, String> {
    let safe_seconds = if seconds.is_finite() && seconds >= 0.0 {
        seconds
    } else {
        0.0
    };
    let safe_width = width.clamp(120, 640);
    let seek = format!("{:.3}", safe_seconds);
    let scale = format!("scale={}:-1:flags=lanczos", safe_width);

    let ffmpeg_bin = resolve_tool("ffmpeg.exe");
    let output = Command::new(&ffmpeg_bin)
        .args([
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            &seek,
            "-i",
            path,
            "-frames:v",
            "1",
            "-vf",
            &scale,
            "-f",
            "image2pipe",
            "-vcodec",
            "mjpeg",
            "-",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("ffmpeg indisponible ({}): {}", ffmpeg_bin.display(), e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if err.is_empty() {
            "ffmpeg a échoué à extraire le frame".to_string()
        } else {
            err
        });
    }

    if output.stdout.is_empty() {
        return Err("Aucune image extraite".to_string());
    }

    let b64 = BASE64_STD.encode(output.stdout);
    Ok(format!("data:image/jpeg;base64,{}", b64))
}

fn probe_frame_preview_with_mpv(path: &str, seconds: f64) -> Result<String, String> {
    let safe_seconds = if seconds.is_finite() && seconds >= 0.0 {
        seconds
    } else {
        0.0
    };

    let preview_player = super::mpv_wrapper::MpvPlayer::new(None)
        .map_err(|e| format!("mpv preview init impossible: {}", e))?;

    preview_player
        .load_file(path)
        .map_err(|e| format!("mpv preview load impossible: {}", e))?;
    let _ = preview_player.pause();

    let start_load = Instant::now();
    while start_load.elapsed() < Duration::from_millis(2200) {
        let loaded_path = normalize_path(&preview_player.get_current_path());
        let duration = preview_player.get_duration();
        if !loaded_path.is_empty() && duration.is_finite() && duration > 0.0 {
            break;
        }
        std::thread::sleep(Duration::from_millis(30));
    }

    preview_player
        .seek(safe_seconds)
        .map_err(|e| format!("mpv preview seek impossible: {}", e))?;
    let _ = preview_player.pause();
    std::thread::sleep(Duration::from_millis(120));

    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let tmp_path = std::env::temp_dir().join(format!("amv-preview-{}.png", nonce));
    let tmp_path_str = tmp_path.to_string_lossy().to_string();

    preview_player
        .screenshot(&tmp_path_str)
        .map_err(|e| format!("mpv preview screenshot impossible: {}", e))?;

    let start_wait = Instant::now();
    while start_wait.elapsed() < Duration::from_millis(1200) {
        if let Ok(meta) = fs::metadata(&tmp_path) {
            if meta.len() > 0 {
                break;
            }
        }
        std::thread::sleep(Duration::from_millis(25));
    }

    let bytes = fs::read(&tmp_path).map_err(|e| {
        let _ = fs::remove_file(&tmp_path);
        format!("lecture preview impossible: {}", e)
    })?;
    let _ = fs::remove_file(&tmp_path);

    if bytes.is_empty() {
        return Err("preview vide".to_string());
    }

    let mime = if is_jpeg(&bytes) {
        "image/jpeg"
    } else {
        "image/png"
    };
    Ok(format!("data:{};base64,{}", mime, BASE64_STD.encode(bytes)))
}

fn is_jpeg(data: &[u8]) -> bool {
    data.len() > 3
        && data[0] == 0xFF
        && data[1] == 0xD8
        && data[data.len() - 2] == 0xFF
        && data[data.len() - 1] == 0xD9
}

fn sync_overlay_with_child(
    app_handle: &tauri::AppHandle,
    cw: &crate::player::mpv_window::MpvChildWindow,
    focus_overlay: bool,
) {
    use tauri::Manager;

    let Some(overlay) = app_handle.get_window("fullscreen-overlay") else {
        return;
    };

    let should_show = (cw.is_detached() || cw.is_fullscreen()) && cw.is_visible();
    if !should_show {
        let _ = overlay.set_fullscreen(false);
        let _ = overlay.hide();
        return;
    }

    let _ = overlay.set_always_on_top(false);
    let _ = overlay.set_ignore_cursor_events(false);
    let _ = overlay.set_fullscreen(false);
    let _ = overlay.show();

    let target_rect = if cw.is_detached() && !cw.is_fullscreen() {
        cw.get_client_rect_screen().or_else(|| cw.get_window_rect())
    } else {
        cw.get_window_rect().or_else(|| cw.get_fullscreen_monitor_rect())
    };

    if let Some((mx, my, mw, mh)) = target_rect {
        #[cfg(target_os = "windows")]
        {
            if let Ok(hwnd) = overlay.hwnd() {
                let overlay_hwnd = hwnd.0 as isize;
                let video_hwnd = cw.hwnd();
                unsafe {
                    crate::player::mpv_window::set_window_owner_raw(overlay_hwnd, video_hwnd);
                }
                // Place directly above the video window (app-local z-order only).
                let positioned_above_video = unsafe {
                    crate::player::mpv_window::set_window_pos_raw(
                        overlay_hwnd,
                        0, // HWND_TOP (within owner group)
                        mx,
                        my,
                        mw,
                        mh,
                        0x0010, // SWP_NOACTIVATE
                    )
                };
                if !positioned_above_video {
                    // Ensure video window is explicitly non-topmost, then retry above-video ordering.
                    let _ = unsafe {
                        crate::player::mpv_window::set_window_pos_raw(
                            video_hwnd,
                            -2, // HWND_NOTOPMOST
                            0,
                            0,
                            0,
                            0,
                            0x0013, // SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
                        )
                    };
                    let retry_above_video = unsafe {
                        crate::player::mpv_window::set_window_pos_raw(
                            overlay_hwnd,
                            0, // HWND_TOP
                            mx,
                            my,
                            mw,
                            mh,
                            0x0010, // SWP_NOACTIVATE
                        )
                    };
                    if !retry_above_video {
                        let positioned_top = unsafe {
                            crate::player::mpv_window::set_window_pos_raw(
                                overlay_hwnd,
                                0, // HWND_TOP
                                mx,
                                my,
                                mw,
                                mh,
                                0x0010, // SWP_NOACTIVATE
                            )
                        };
                        if !positioned_top && cw.is_fullscreen() {
                            let _ = overlay.set_fullscreen(true);
                        }
                    }
                }
            } else {
                if cw.is_fullscreen() {
                    let _ = overlay.set_fullscreen(true);
                }
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = overlay.set_fullscreen(true);
        }
    } else {
        if cw.is_fullscreen() {
            let _ = overlay.set_fullscreen(true);
        }
    }

    if focus_overlay {
        let _ = overlay.set_focus();
    }
}

#[tauri::command]
pub fn player_load(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.load_file(&path),
        None => Err("Player not initialized. Make sure mpv-2.dll is available.".to_string()),
    }
}

#[tauri::command]
pub fn player_play(state: State<'_, AppState>) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.play(),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_pause(state: State<'_, AppState>) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.pause(),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_toggle_pause(state: State<'_, AppState>) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.toggle_pause(),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_seek(state: State<'_, AppState>, position: f64) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.seek(position),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_seek_relative(state: State<'_, AppState>, offset: f64) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.seek_relative(offset),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_set_volume(state: State<'_, AppState>, volume: f64) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.set_volume(volume),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_set_speed(state: State<'_, AppState>, speed: f64) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.set_speed(speed),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_get_status(state: State<'_, AppState>) -> Result<PlayerStatus, String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => Ok(PlayerStatus {
            is_playing: !p.get_paused(),
            current_time: p.get_time_pos(),
            duration: p.get_duration(),
            volume: p.get_volume(),
            speed: p.get_speed(),
        }),
        None => Ok(PlayerStatus {
            is_playing: false,
            current_time: 0.0,
            duration: 0.0,
            volume: 80.0,
            speed: 1.0,
        }),
    }
}

#[tauri::command]
pub fn player_get_tracks(state: State<'_, AppState>) -> Result<TrackListResult, String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => {
            let tracks = p.get_track_list();
            let audio_tracks: Vec<TrackItem> = tracks
                .iter()
                .filter(|t| t.track_type == "audio")
                .map(|t| TrackItem {
                    id: t.id,
                    title: t.title.clone(),
                    lang: t.lang.clone(),
                    codec: t.codec.clone(),
                    external: t.external,
                })
                .collect();
            let subtitle_tracks: Vec<TrackItem> = tracks
                .iter()
                .filter(|t| t.track_type == "sub")
                .map(|t| TrackItem {
                    id: t.id,
                    title: t.title.clone(),
                    lang: t.lang.clone(),
                    codec: t.codec.clone(),
                    external: t.external,
                })
                .collect();
            Ok(TrackListResult {
                audio_tracks,
                subtitle_tracks,
            })
        }
        None => Ok(TrackListResult {
            audio_tracks: vec![],
            subtitle_tracks: vec![],
        }),
    }
}

#[tauri::command]
pub fn player_set_subtitle_track(
    state: State<'_, AppState>,
    id: Option<i64>,
) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.set_subtitle_track(id),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_set_audio_track(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.set_audio_track(id),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_frame_step(state: State<'_, AppState>) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.frame_step(),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_frame_back_step(state: State<'_, AppState>) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.frame_back_step(),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_screenshot(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => p.screenshot(&path),
        None => Err("Player not initialized".to_string()),
    }
}

#[tauri::command]
pub fn player_get_media_info(
    state: State<'_, AppState>,
    path: Option<String>,
) -> Result<super::mpv_wrapper::MediaInfo, String> {
    use std::panic::{catch_unwind, AssertUnwindSafe};

    if let Some(target_path) = path {
        let trimmed = target_path.trim().to_string();
        if !trimmed.is_empty() {
            let normalized_target = normalize_path(&trimmed);
            let (tx, rx) = mpsc::channel();
            std::thread::spawn({
                let probe_path = normalized_target.clone();
                move || {
                    let _ = tx.send(probe_media_info_open_source(&probe_path));
                }
            });

            if let Ok(Ok(info)) = rx.recv_timeout(Duration::from_millis(2500)) {
                return Ok(info);
            }

            if let Ok(player) = state.player.try_lock() {
                if let Some(p) = &*player {
                    let current_path = normalize_path(&p.get_current_path());
                    if !current_path.is_empty()
                        && current_path.eq_ignore_ascii_case(&normalized_target)
                    {
                        let info = catch_unwind(AssertUnwindSafe(|| p.get_media_info()))
                            .unwrap_or_else(|_| super::mpv_wrapper::MediaInfo::empty());
                        return Ok(info);
                    }
                }
            }

            return Ok(build_minimal_media_info(&trimmed));
        }
    }

    if let Ok(player) = state.player.try_lock() {
        if let Some(p) = &*player {
            let info = catch_unwind(AssertUnwindSafe(|| p.get_media_info()))
                .unwrap_or_else(|_| super::mpv_wrapper::MediaInfo::empty());
            return Ok(info);
        }
        return Err("Player not initialized".to_string());
    }

    Ok(super::mpv_wrapper::MediaInfo::empty())
}

#[tauri::command]
pub fn player_get_frame_preview(
    state: State<'_, AppState>,
    path: Option<String>,
    seconds: f64,
    width: Option<u32>,
) -> Result<String, String> {
    let mut target_path = path.unwrap_or_default().trim().to_string();
    if target_path.is_empty() {
        let player = state.player.lock().map_err(|e| e.to_string())?;
        if let Some(p) = &*player {
            target_path = p.get_current_path();
        }
    }

    if target_path.trim().is_empty() {
        return Err("Aucun fichier vidéo disponible pour le preview".to_string());
    }

    let safe_width = width.unwrap_or(320).clamp(120, 640);
    let normalized_path = normalize_path(target_path.trim());
    let (tx, rx) = mpsc::channel();

    std::thread::spawn(move || {
        let result = match probe_frame_preview_with_ffmpeg(&normalized_path, seconds, safe_width) {
            Ok(image) => Ok(image),
            Err(ffmpeg_err) => probe_frame_preview_with_mpv(&normalized_path, seconds)
                .map_err(|mpv_err| format!("ffmpeg: {}; mpv: {}", ffmpeg_err, mpv_err)),
        };
        let _ = tx.send(result);
    });

    match rx.recv_timeout(Duration::from_millis(12000)) {
        Ok(result) => result,
        Err(_) => Err("Preview frame trop lent (timeout 12s)".to_string()),
    }
}

#[tauri::command]
pub fn player_get_audio_levels(
    state: State<'_, AppState>,
) -> Result<super::mpv_wrapper::AudioLevels, String> {
    let player = state.player.lock().map_err(|e| e.to_string())?;
    match &*player {
        Some(p) => Ok(p.get_audio_levels()),
        None => Ok(super::mpv_wrapper::AudioLevels {
            left_db: -90.0,
            right_db: -90.0,
            overall_db: -90.0,
            available: false,
        }),
    }
}

#[tauri::command]
pub fn player_is_available(state: State<'_, AppState>) -> bool {
    let player = state.player.lock().unwrap_or_else(|e| e.into_inner());
    player.is_some()
}

#[tauri::command]
pub fn player_set_geometry(
    state: State<'_, AppState>,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
) -> Result<(), String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => {
            cw.set_geometry(x, y, width, height);
            Ok(())
        }
        None => Err("Child window not available".to_string()),
    }
}

#[tauri::command]
pub fn player_show(state: State<'_, AppState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => {
            cw.show();
            sync_overlay_with_child(&app_handle, cw, false);
            Ok(())
        }
        None => Err("Child window not available".to_string()),
    }
}

#[tauri::command]
pub fn player_hide(state: State<'_, AppState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => {
            cw.hide();
            use tauri::Manager;
            if let Some(overlay) = app_handle.get_window("fullscreen-overlay") {
                let _ = overlay.set_fullscreen(false);
                let _ = overlay.hide();
            }
            Ok(())
        }
        None => Err("Child window not available".to_string()),
    }
}

#[tauri::command]
pub fn player_set_fullscreen(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
    fullscreen: bool,
) -> Result<(), String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => {
            use tauri::Manager;

            if fullscreen {
                cw.show();
                cw.set_fullscreen(true);
                sync_overlay_with_child(&app_handle, cw, true);
            } else {
                cw.set_fullscreen(false);
                sync_overlay_with_child(&app_handle, cw, cw.is_detached());
                if !cw.is_detached() {
                    if let Some(main) = app_handle.get_window("main") {
                        let _ = main.set_focus();
                    }
                }
            }

            Ok(())
        }
        None => Err("Child window not available".to_string()),
    }
}

#[tauri::command]
pub fn player_is_fullscreen(state: State<'_, AppState>) -> Result<bool, String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => Ok(cw.is_fullscreen()),
        None => Ok(false),
    }
}

#[tauri::command]
pub fn player_is_visible(state: State<'_, AppState>) -> Result<bool, String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => Ok(cw.is_visible()),
        None => Ok(false),
    }
}

#[tauri::command]
pub fn player_sync_overlay(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => {
            sync_overlay_with_child(&app_handle, cw, false);
            Ok(())
        }
        None => Err("Child window not available".to_string()),
    }
}
