// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_windows;
mod player;
mod project;
mod state;
mod video;

use state::AppState;
use tauri::Manager;

fn main() {
    let app_state = AppState::new();

    tauri::Builder::default()
        .manage(app_state)
        .setup(|app| {
            app_windows::precreate_aux_windows(app);
            let state = app.state::<AppState>();
            player::bootstrap::initialize_embedded_player(app, &state);
            Ok(())
        })
        .on_window_event(|event| {
            app_windows::handle_window_event(&event);
        })
        .invoke_handler(tauri::generate_handler![
            // Player commands
            player::commands::control::player_load,
            player::commands::control::player_play,
            player::commands::control::player_pause,
            player::commands::control::player_toggle_pause,
            player::commands::control::player_stop,
            player::commands::control::player_seek,
            player::commands::control::player_seek_relative,
            player::commands::control::player_set_volume,
            player::commands::control::player_set_speed,
            player::commands::control::player_get_status,
            player::commands::control::player_get_tracks,
            player::commands::control::player_set_subtitle_track,
            player::commands::control::player_set_audio_track,
            player::commands::control::player_is_available,
            player::commands::window::player_set_geometry,
            player::commands::window::player_show,
            player::commands::window::player_hide,
            player::commands::window::player_hide_surface,
            player::commands::window::player_set_fullscreen,
            player::commands::window::player_is_fullscreen,
            player::commands::window::player_is_visible,
            player::commands::window::player_sync_overlay,
            player::commands::control::player_frame_step,
            player::commands::control::player_frame_back_step,
            player::commands::control::player_screenshot,
            player::commands::media::player_get_media_info,
            player::commands::media::player_get_frame_preview,
            player::commands::control::player_get_audio_levels,
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
            app_windows::open_notes_window,
            app_windows::close_notes_window,
            // Video commands
            video::import::scan_video_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
