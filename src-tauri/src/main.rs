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
            let Some(window) = app.get_window("main") else {
                eprintln!("[AMV] Main window not found at setup; continuing without player");
                return Ok(());
            };
            let state = app.state::<AppState>();

            if app.get_window("fullscreen-overlay").is_none() {
                match tauri::WindowBuilder::new(
                    app,
                    "fullscreen-overlay",
                    tauri::WindowUrl::App("index.html?overlay=true".into()),
                )
                .transparent(true)
                .decorations(false)
                .always_on_top(false)
                .fullscreen(false)
                .visible(false)
                .focused(false)
                .skip_taskbar(true)
                .resizable(false)
                .title("AMV Notation Overlay")
                .initialization_script("window.__AMV_FULLSCREEN_OVERLAY__ = true;")
                .build()
                {
                    Ok(overlay) => {
                        let _ = overlay.hide();
                    }
                    Err(e) => {
                        eprintln!("[AMV] Failed to precreate overlay window: {}", e);
                    }
                }
            }

            // Get the main window HWND and create embedded mpv player
            #[cfg(target_os = "windows")]
            {
                let hwnd = match window.hwnd() {
                    Ok(hwnd) => hwnd,
                    Err(e) => {
                        eprintln!("[AMV] Failed to get window HWND: {}", e);
                        return Ok(());
                    }
                };
                let parent_hwnd = hwnd.0 as isize;
                eprintln!("[AMV] Main window HWND: {}", parent_hwnd);

                // Create child window for mpv rendering
                if let Some(child) = player::mpv_window::MpvChildWindow::new(parent_hwnd) {
                    let child_hwnd = child.hwnd();
                    eprintln!("[AMV] Child window HWND: {}", child_hwnd);

                    // Initialize mpv with wid pointing to child window
                    match player::mpv_wrapper::MpvPlayer::new(Some(child_hwnd as i64)) {
                        Ok(p) => {
                            child.detach();
                            let _ = p.set_detached_controls_enabled(false);
                            match state.player.lock() {
                                Ok(mut player_slot) => {
                                    *player_slot = Some(p);
                                }
                                Err(e) => {
                                    eprintln!("[AMV] Failed to store player state: {}", e);
                                }
                            }
                            match state.child_window.lock() {
                                Ok(mut child_slot) => {
                                    *child_slot = Some(child);
                                }
                                Err(e) => {
                                    eprintln!("[AMV] Failed to store child window state: {}", e);
                                }
                            }
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
        .on_window_event(|event| {
            if event.window().label() != "main" {
                return;
            }
            if !matches!(
                event.event(),
                tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed
            ) {
                return;
            }

            use tauri::Manager;
            if let Some(overlay) = event.window().app_handle().get_window("fullscreen-overlay") {
                let _ = overlay.close();
            }
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
            player::commands::player_set_fullscreen,
            player::commands::player_is_fullscreen,
            player::commands::player_is_visible,
            player::commands::player_sync_overlay,
            // Project commands
            project::manager::save_project,
            project::manager::load_project,
            project::manager::export_json,
            project::manager::get_default_projects_folder,
            project::manager::list_projects_in_folder,
            project::manager::ensure_directory_exists,
            // Video commands
            video::import::scan_video_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
