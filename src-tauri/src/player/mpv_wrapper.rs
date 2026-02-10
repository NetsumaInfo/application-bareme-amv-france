#![allow(dead_code)]
use super::mpv_ffi::*;
use serde::Serialize;
use std::os::raw::{c_double, c_int, c_void};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(Debug, Serialize, Clone)]
pub struct TrackInfo {
    pub id: i64,
    pub track_type: String,
    pub title: Option<String>,
    pub lang: Option<String>,
    pub codec: Option<String>,
    pub external: bool,
}

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
            ("input-vo-keyboard", "no"),
            ("terminal", "no"),
            ("msg-level", "all=no"),
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
        let cmd_c = to_cstring(&cmd);
        let result = unsafe { (self.lib.command_string)(self.handle, cmd_c.as_ptr()) };
        if result < 0 {
            return Err(format!("Failed to load file: error {}", result));
        }
        Ok(())
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

    pub fn seek(&self, position: f64) -> Result<(), String> {
        let cmd = format!("seek {} absolute", position);
        let cmd_c = to_cstring(&cmd);
        let result = unsafe { (self.lib.command_string)(self.handle, cmd_c.as_ptr()) };
        if result < 0 {
            return Err(format!("Failed to seek: error {}", result));
        }
        Ok(())
    }

    pub fn seek_relative(&self, offset: f64) -> Result<(), String> {
        let cmd = format!("seek {} relative", offset);
        let cmd_c = to_cstring(&cmd);
        let result = unsafe { (self.lib.command_string)(self.handle, cmd_c.as_ptr()) };
        if result < 0 {
            return Err(format!("Failed to seek relative: error {}", result));
        }
        Ok(())
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

    pub fn set_subtitle_track(&self, id: Option<i64>) -> Result<(), String> {
        match id {
            Some(track_id) => self.set_property_string("sid", &track_id.to_string()),
            None => self.set_property_string("sid", "no"),
        }
    }

    pub fn set_audio_track(&self, id: i64) -> Result<(), String> {
        self.set_property_string("aid", &id.to_string())
    }

    pub fn get_track_list(&self) -> Vec<TrackInfo> {
        let count_str = self.get_property_string_safe("track-list/count");
        let count: i64 = count_str.parse().unwrap_or(0);

        let mut tracks = Vec::new();

        for i in 0..count {
            let prefix = format!("track-list/{}", i);

            let id_str = self.get_property_string_safe(&format!("{}/id", prefix));
            let id: i64 = id_str.parse().unwrap_or(0);

            let track_type = self.get_property_string_safe(&format!("{}/type", prefix));
            let title_raw = self.get_property_string_safe(&format!("{}/title", prefix));
            let title = if title_raw.is_empty() {
                None
            } else {
                Some(title_raw)
            };
            let lang_raw = self.get_property_string_safe(&format!("{}/lang", prefix));
            let lang = if lang_raw.is_empty() {
                None
            } else {
                Some(lang_raw)
            };
            let codec_raw = self.get_property_string_safe(&format!("{}/codec", prefix));
            let codec = if codec_raw.is_empty() {
                None
            } else {
                Some(codec_raw)
            };
            let external_str = self.get_property_string_safe(&format!("{}/external", prefix));
            let external = external_str == "yes";

            tracks.push(TrackInfo {
                id,
                track_type,
                title,
                lang,
                codec,
                external,
            });
        }

        tracks
    }

    pub fn set_wid(&self, wid: i64) -> Result<(), String> {
        self.set_property_string("wid", &wid.to_string())
    }

    // Low-level property helpers
    fn set_property_double(&self, name: &str, value: f64) -> Result<(), String> {
        let name_c = to_cstring(name);
        let mut val = value;
        let result = unsafe {
            (self.lib.set_property)(
                self.handle,
                name_c.as_ptr(),
                MPV_FORMAT_DOUBLE,
                &mut val as *mut c_double as *mut c_void,
            )
        };
        if result < 0 {
            return Err(format!("Failed to set property {}: error {}", name, result));
        }
        Ok(())
    }

    fn set_property_flag(&self, name: &str, value: bool) -> Result<(), String> {
        let name_c = to_cstring(name);
        let mut val: c_int = if value { 1 } else { 0 };
        let result = unsafe {
            (self.lib.set_property)(
                self.handle,
                name_c.as_ptr(),
                MPV_FORMAT_FLAG,
                &mut val as *mut c_int as *mut c_void,
            )
        };
        if result < 0 {
            return Err(format!("Failed to set property {}: error {}", name, result));
        }
        Ok(())
    }

    fn set_property_string(&self, name: &str, value: &str) -> Result<(), String> {
        let name_c = to_cstring(name);
        let value_c = to_cstring(value);
        let result = unsafe {
            (self.lib.set_property_string)(self.handle, name_c.as_ptr(), value_c.as_ptr())
        };
        if result < 0 {
            return Err(format!("Failed to set property {}: error {}", name, result));
        }
        Ok(())
    }

    fn get_property_double(&self, name: &str) -> Result<f64, String> {
        let name_c = to_cstring(name);
        let mut value: c_double = 0.0;
        let result = unsafe {
            (self.lib.get_property)(
                self.handle,
                name_c.as_ptr(),
                MPV_FORMAT_DOUBLE,
                &mut value as *mut c_double as *mut c_void,
            )
        };
        if result < 0 {
            return Err(format!("Failed to get property {}: error {}", name, result));
        }
        Ok(value)
    }

    fn get_property_flag(&self, name: &str) -> Result<bool, String> {
        let name_c = to_cstring(name);
        let mut value: c_int = 0;
        let result = unsafe {
            (self.lib.get_property)(
                self.handle,
                name_c.as_ptr(),
                MPV_FORMAT_FLAG,
                &mut value as *mut c_int as *mut c_void,
            )
        };
        if result < 0 {
            return Err(format!("Failed to get property {}: error {}", name, result));
        }
        Ok(value != 0)
    }

    fn get_property_string_safe(&self, name: &str) -> String {
        let name_c = to_cstring(name);
        let ptr = unsafe { (self.lib.get_property_string)(self.handle, name_c.as_ptr()) };
        if ptr.is_null() {
            return String::new();
        }
        let result = from_cstr(ptr);
        unsafe { (self.lib.free)(ptr as *mut c_void) };
        result
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
