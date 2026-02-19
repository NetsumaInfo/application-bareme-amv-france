// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod player;
mod project;
mod state;
mod video;

use state::AppState;

#[tauri::command]
async fn open_notes_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;

    if let Some(existing) = app_handle.get_window("notes-window") {
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }

    let handle = app_handle.clone();
    tauri::async_runtime::spawn_blocking(move || {
        use tauri::Manager;

        if let Some(existing) = handle.get_window("notes-window") {
            let _ = existing.show();
            let _ = existing.set_focus();
            return Ok(());
        }

        tauri::WindowBuilder::new(
            &handle,
            "notes-window",
            tauri::WindowUrl::App("notes.html".into()),
        )
        .title("AMV Notation - Notes")
        .inner_size(380.0, 700.0)
        .min_inner_size(320.0, 400.0)
        .resizable(true)
        .decorations(true)
        .visible(true)
        .focused(true)
        .initialization_script(
            "window.__AMV_NOTES_WINDOW__ = true; window.__AMV_FULLSCREEN_OVERLAY__ = false;",
        )
        .build()
        .map_err(|e| e.to_string())?;

        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("notes-window task error: {}", e))??;

    Ok(())
}

#[tauri::command]
fn close_notes_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    if let Some(window) = app_handle.get_window("notes-window") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

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
                .initialization_script(
                    "window.__AMV_FULLSCREEN_OVERLAY__ = true; window.__AMV_NOTES_WINDOW__ = false;",
                )
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

            if app.get_window("notes-window").is_none() {
                match tauri::WindowBuilder::new(
                    app,
                    "notes-window",
                    tauri::WindowUrl::App("notes.html".into()),
                )
                .title("AMV Notation - Notes")
                .inner_size(380.0, 700.0)
                .min_inner_size(320.0, 400.0)
                .resizable(true)
                .decorations(true)
                .visible(false)
                .focused(false)
                .initialization_script(
                    "window.__AMV_NOTES_WINDOW__ = true; window.__AMV_FULLSCREEN_OVERLAY__ = false;",
                )
                .build()
                {
                    Ok(notes) => {
                        let _ = notes.hide();
                    }
                    Err(e) => {
                        eprintln!("[AMV] Failed to precreate notes window: {}", e);
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
            let label = event.window().label().to_string();
            use tauri::Manager;
            match event.event() {
                tauri::WindowEvent::CloseRequested { .. } => {
                    if label == "main" {
                        if let Some(overlay) =
                            event.window().app_handle().get_window("fullscreen-overlay")
                        {
                            let _ = overlay.close();
                        }
                        if let Some(notes) = event.window().app_handle().get_window("notes-window")
                        {
                            let _ = notes.close();
                        }
                    } else if label == "notes-window" {
                        let _ = event.window().app_handle().emit_all("notes:close", ());
                    }
                }
                tauri::WindowEvent::Destroyed => {
                    if label == "notes-window" {
                        let _ = event.window().app_handle().emit_all("notes:close", ());
                    }
                }
                _ => {}
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
            player::commands::player_frame_step,
            player::commands::player_frame_back_step,
            player::commands::player_screenshot,
            player::commands::player_get_media_info,
            player::commands::player_get_frame_preview,
            player::commands::player_get_audio_levels,
            // Project commands
            project::manager::save_project,
            project::manager::load_project,
            project::manager::export_json,
            project::manager::get_default_projects_folder,
            project::manager::get_default_baremes_folder,
            project::manager::list_projects_in_folder,
            project::manager::ensure_directory_exists,
            project::manager::save_bareme,
            project::manager::delete_bareme,
            project::manager::load_baremes,
            project::manager::save_user_settings,
            project::manager::load_user_settings,
            // Window commands
            open_notes_window,
            close_notes_window,
            // Video commands
            video::import::scan_video_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
