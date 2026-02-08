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
