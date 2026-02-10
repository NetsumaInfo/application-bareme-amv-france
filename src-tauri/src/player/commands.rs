use crate::state::AppState;
use serde::Serialize;
use tauri::State;

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
pub fn player_show(state: State<'_, AppState>) -> Result<(), String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => {
            cw.show();
            Ok(())
        }
        None => Err("Child window not available".to_string()),
    }
}

#[tauri::command]
pub fn player_hide(state: State<'_, AppState>) -> Result<(), String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    match &*child {
        Some(cw) => {
            cw.hide();
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
                // 1. Ensure mpv is visible then go fullscreen
                cw.show();
                cw.set_fullscreen(true);

                // 2. Position overlay on the SAME monitor as mpv (not primary)
                if let Some(overlay) = app_handle.get_window("fullscreen-overlay") {
                    let _ = overlay.set_always_on_top(true);
                    let _ = overlay.set_ignore_cursor_events(false);
                    let _ = overlay.show();

                    // Get the monitor rect from the child window and position overlay there
                    if let Some((mx, my, mw, mh)) = cw.get_fullscreen_monitor_rect() {
                        // Use Win32 SetWindowPos to place overlay on the correct monitor
                        #[cfg(target_os = "windows")]
                        {
                            if let Ok(hwnd) = overlay.hwnd() {
                                let overlay_hwnd = hwnd.0 as isize;
                                // HWND_TOPMOST = -1, SWP_SHOWWINDOW = 0x0040
                                unsafe {
                                    crate::player::mpv_window::set_window_pos_raw(
                                        overlay_hwnd,
                                        -1,
                                        mx,
                                        my,
                                        mw,
                                        mh,
                                        0x0040,
                                    );
                                }
                            } else {
                                let _ = overlay.set_fullscreen(true);
                            }
                        }
                    } else {
                        // Fallback: use Tauri's fullscreen (goes to primary)
                        let _ = overlay.set_fullscreen(true);
                    }

                    let _ = overlay.set_focus();
                } else {
                    eprintln!("[AMV] Overlay window not found (fullscreen controls unavailable)");
                }
            } else {
                // 1. Hide overlay first
                if let Some(overlay) = app_handle.get_window("fullscreen-overlay") {
                    let _ = overlay.set_fullscreen(false);
                    let _ = overlay.hide();
                }

                // 2. Restore mpv
                cw.set_fullscreen(false);

                // 3. Restore focus to main window for keyboard shortcuts
                if let Some(main) = app_handle.get_window("main") {
                    let _ = main.set_focus();
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
