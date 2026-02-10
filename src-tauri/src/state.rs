use crate::player::mpv_window::MpvChildWindow;
use crate::player::mpv_wrapper::MpvPlayer;
use std::sync::Mutex;

pub struct AppState {
    pub player: Mutex<Option<MpvPlayer>>,
    pub child_window: Mutex<Option<MpvChildWindow>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            player: Mutex::new(None),
            child_window: Mutex::new(None),
        }
    }
}
