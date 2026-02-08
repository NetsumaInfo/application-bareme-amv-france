use crate::player::mpv_wrapper::MpvPlayer;
use std::sync::Mutex;

pub struct AppState {
    pub player: Mutex<Option<MpvPlayer>>,
}

impl AppState {
    pub fn new() -> Self {
        // Try to initialize the mpv player
        let player = match MpvPlayer::new() {
            Ok(p) => {
                println!("[AMV Notation] mpv player initialized successfully");
                Some(p)
            }
            Err(e) => {
                eprintln!("[AMV Notation] Warning: mpv not available: {}", e);
                eprintln!("[AMV Notation] Video playback will be disabled. Install mpv or place mpv-2.dll in the app directory.");
                None
            }
        };

        Self {
            player: Mutex::new(player),
        }
    }
}
