// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod player;
mod project;
mod state;
mod video;

use state::AppState;

fn main() {
    let app_state = AppState::new();

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            use tauri::Manager;
            let window = app.get_window("main").unwrap();
            let state = app.state::<AppState>();

            // Get the main window HWND and create embedded mpv player
            #[cfg(target_os = "windows")]
            {
                let hwnd = window.hwnd().map_err(|e| {
                    eprintln!("[AMV] Failed to get window HWND: {}", e);
                    e
                })?;
                let parent_hwnd = hwnd.0 as isize;
                eprintln!("[AMV] Main window HWND: {}", parent_hwnd);

                // Create child window for mpv rendering
                if let Some(child) = player::mpv_window::MpvChildWindow::new(parent_hwnd) {
                    let child_hwnd = child.hwnd();
                    eprintln!("[AMV] Child window HWND: {}", child_hwnd);

                    // Initialize mpv with wid pointing to child window
                    match player::mpv_wrapper::MpvPlayer::new(Some(child_hwnd as i64)) {
                        Ok(p) => {
                            *state.player.lock().unwrap() = Some(p);
                            *state.child_window.lock().unwrap() = Some(child);
                            eprintln!("[AMV] mpv player initialized with embedded window");
                        }
                        Err(e) => {
                            eprintln!("[AMV] Warning: mpv not available: {}", e);
                            eprintln!("[AMV] Video playback will be disabled.");
                        }
                    }
                } else {
                    eprintln!("[AMV] Failed to create child window");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Player commands
            player::commands::player_load,
            player::commands::player_play,
            player::commands::player_pause,
            player::commands::player_toggle_pause,
            player::commands::player_seek,
            player::commands::player_seek_relative,
            player::commands::player_set_volume,
            player::commands::player_set_speed,
            player::commands::player_get_status,
            player::commands::player_get_tracks,
            player::commands::player_set_subtitle_track,
            player::commands::player_set_audio_track,
            player::commands::player_is_available,
            player::commands::player_set_geometry,
            player::commands::player_show,
            player::commands::player_hide,
            // Project commands
            project::manager::save_project,
            project::manager::load_project,
            project::manager::export_json,
            // Video commands
            video::import::scan_video_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
