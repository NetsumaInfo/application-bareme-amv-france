#![allow(dead_code)]
use super::mpv_ffi::*;
pub use super::mpv_types::{AudioLevels, MediaInfo, TrackInfo};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[path = "mpv_wrapper_media.rs"]
mod media;
#[path = "mpv_wrapper_properties.rs"]
mod properties;

pub struct MpvPlayer {
    lib: Arc<MpvLib>,
    handle: MpvHandle,
    initialized: AtomicBool,
}

unsafe impl Send for MpvPlayer {}
unsafe impl Sync for MpvPlayer {}

impl MpvPlayer {
    pub fn new(wid: Option<i64>) -> Result<Self, String> {
        let lib = Arc::new(MpvLib::load()?);

        let handle = unsafe { (lib.create)() };
        if handle.is_null() {
            return Err("Failed to create mpv instance".to_string());
        }

        // Configure mpv options before initialization
        let options = vec![
            ("keep-open", "yes"),
            ("idle", "yes"),
            ("osc", "no"),
            ("input-default-bindings", "no"),
            ("terminal", "no"),
            ("msg-level", "all=no"),
            (
                "af",
                "@dbmeter:lavfi=[astats=metadata=1:reset=1]",
            ),
        ];

        for (key, value) in &options {
            let key_c = to_cstring(key);
            let value_c = to_cstring(value);
            unsafe {
                (lib.set_option_string)(handle, key_c.as_ptr(), value_c.as_ptr());
            }
        }

        // Set wid for embedded rendering, or force-window=no for headless
        if let Some(w) = wid {
            let key_c = to_cstring("wid");
            let value_c = to_cstring(&w.to_string());
            unsafe {
                (lib.set_option_string)(handle, key_c.as_ptr(), value_c.as_ptr());
            }
            eprintln!("[mpv] Embedding into window: wid={}", w);
        } else {
            let key_c = to_cstring("force-window");
            let value_c = to_cstring("no");
            unsafe {
                (lib.set_option_string)(handle, key_c.as_ptr(), value_c.as_ptr());
            }
        }

        let result = unsafe { (lib.initialize)(handle) };
        if result < 0 {
            unsafe { (lib.terminate_destroy)(handle) };
            return Err(format!("Failed to initialize mpv: error code {}", result));
        }

        // Observe key properties for updates
        let properties = vec![
            ("time-pos", MPV_FORMAT_DOUBLE),
            ("duration", MPV_FORMAT_DOUBLE),
            ("pause", MPV_FORMAT_FLAG),
            ("volume", MPV_FORMAT_DOUBLE),
            ("speed", MPV_FORMAT_DOUBLE),
            ("eof-reached", MPV_FORMAT_FLAG),
        ];

        for (i, (prop, format)) in properties.iter().enumerate() {
            let prop_c = to_cstring(prop);
            unsafe {
                (lib.observe_property)(handle, i as u64, prop_c.as_ptr(), *format);
            }
        }

        Ok(Self {
            lib,
            handle,
            initialized: AtomicBool::new(true),
        })
    }

    pub fn is_initialized(&self) -> bool {
        self.initialized.load(Ordering::Relaxed)
    }

    pub fn load_file(&self, path: &str) -> Result<(), String> {
        let cmd = format!("loadfile \"{}\"", path.replace('\\', "/"));
        self.execute_command(&cmd)
    }

    pub fn play(&self) -> Result<(), String> {
        self.set_property_flag("pause", false)
    }

    pub fn pause(&self) -> Result<(), String> {
        self.set_property_flag("pause", true)
    }

    pub fn toggle_pause(&self) -> Result<(), String> {
        let paused = self.get_property_flag("pause").unwrap_or(true);
        self.set_property_flag("pause", !paused)
    }

    pub fn stop(&self) -> Result<(), String> {
        self.execute_command("stop")
    }

    pub fn seek(&self, position: f64) -> Result<(), String> {
        let cmd = format!("seek {} absolute", position);
        self.execute_command(&cmd)
    }

    pub fn seek_relative(&self, offset: f64) -> Result<(), String> {
        let cmd = format!("seek {} relative", offset);
        self.execute_command(&cmd)
    }

    pub fn set_volume(&self, volume: f64) -> Result<(), String> {
        self.set_property_double("volume", volume)
    }

    pub fn set_speed(&self, speed: f64) -> Result<(), String> {
        self.set_property_double("speed", speed)
    }

    pub fn get_time_pos(&self) -> f64 {
        self.get_property_double("time-pos").unwrap_or(0.0)
    }

    pub fn get_duration(&self) -> f64 {
        self.get_property_double("duration").unwrap_or(0.0)
    }

    pub fn get_paused(&self) -> bool {
        self.get_property_flag("pause").unwrap_or(true)
    }

    pub fn get_volume(&self) -> f64 {
        self.get_property_double("volume").unwrap_or(100.0)
    }

    pub fn get_speed(&self) -> f64 {
        self.get_property_double("speed").unwrap_or(1.0)
    }

    pub fn set_wid(&self, wid: i64) -> Result<(), String> {
        self.set_property_string("wid", &wid.to_string())
    }
}

impl Drop for MpvPlayer {
    fn drop(&mut self) {
        if self.initialized.load(Ordering::Relaxed) {
            unsafe {
                (self.lib.terminate_destroy)(self.handle);
            }
            self.initialized.store(false, Ordering::Relaxed);
        }
    }
}
