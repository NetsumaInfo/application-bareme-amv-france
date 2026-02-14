#![allow(dead_code)]
use super::mpv_ffi::*;
use serde::Serialize;
use serde_json::Value;
use std::os::raw::{c_double, c_int, c_void};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug, Serialize, Clone)]
pub struct MediaInfo {
    pub width: i64,
    pub height: i64,
    pub video_codec: String,
    pub audio_codec: String,
    pub file_size: i64,
    pub video_bitrate: i64,
    pub audio_bitrate: i64,
    pub fps: f64,
    pub sample_rate: i64,
    pub channels: i64,
    pub format_name: String,
    pub duration: f64,
    pub format_long_name: String,
    pub overall_bitrate: i64,
    pub video_profile: String,
    pub pixel_format: String,
    pub color_space: String,
    pub color_primaries: String,
    pub color_transfer: String,
    pub video_bit_depth: i64,
    pub audio_channel_layout: String,
    pub audio_language: String,
    pub audio_track_count: i64,
    pub video_track_count: i64,
    pub subtitle_track_count: i64,
    pub video_frame_count: i64,
    pub sample_aspect_ratio: String,
    pub display_aspect_ratio: String,
}

impl MediaInfo {
    pub fn empty() -> Self {
        Self {
            width: 0,
            height: 0,
            video_codec: String::new(),
            audio_codec: String::new(),
            file_size: 0,
            video_bitrate: 0,
            audio_bitrate: 0,
            fps: 0.0,
            sample_rate: 0,
            channels: 0,
            format_name: String::new(),
            duration: 0.0,
            format_long_name: String::new(),
            overall_bitrate: 0,
            video_profile: String::new(),
            pixel_format: String::new(),
            color_space: String::new(),
            color_primaries: String::new(),
            color_transfer: String::new(),
            video_bit_depth: 0,
            audio_channel_layout: String::new(),
            audio_language: String::new(),
            audio_track_count: 0,
            video_track_count: 0,
            subtitle_track_count: 0,
            video_frame_count: 0,
            sample_aspect_ratio: String::new(),
            display_aspect_ratio: String::new(),
        }
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct TrackInfo {
    pub id: i64,
    pub track_type: String,
    pub title: Option<String>,
    pub lang: Option<String>,
    pub codec: Option<String>,
    pub external: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct AudioLevels {
    pub left_db: f64,
    pub right_db: f64,
    pub overall_db: f64,
    pub available: bool,
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
            ("terminal", "no"),
            ("msg-level", "all=no"),
            (
                "af",
                "@dbmeter:lavfi=astats=metadata=1:reset=1:measure_perchannel=RMS_level|Peak_level:measure_overall=RMS_level|Peak_level",
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

    pub fn frame_step(&self) -> Result<(), String> {
        self.execute_command("frame-step")
    }

    pub fn frame_back_step(&self) -> Result<(), String> {
        self.execute_command("frame-back-step")
    }

    pub fn screenshot(&self, path: &str) -> Result<(), String> {
        let cmd = format!("screenshot-to-file \"{}\" video", path.replace('\\', "/"));
        self.execute_command(&cmd)
    }

    pub fn get_media_info(&self) -> MediaInfo {
        let tracks = self.get_track_list();
        let audio_track_count = tracks
            .iter()
            .filter(|t| t.track_type == "audio")
            .count() as i64;
        let video_track_count = tracks
            .iter()
            .filter(|t| t.track_type == "video")
            .count() as i64;
        let subtitle_track_count = tracks
            .iter()
            .filter(|t| t.track_type == "sub" || t.track_type == "subtitle")
            .count() as i64;

        MediaInfo {
            width: self.get_property_string_safe("width").parse().unwrap_or(0),
            height: self.get_property_string_safe("height").parse().unwrap_or(0),
            video_codec: self.get_property_string_safe("video-codec"),
            audio_codec: self.get_property_string_safe("audio-codec-name"),
            file_size: self.get_property_string_safe("file-size").parse().unwrap_or(0),
            video_bitrate: self.get_property_string_safe("video-bitrate").parse().unwrap_or(0),
            audio_bitrate: self.get_property_string_safe("audio-bitrate").parse().unwrap_or(0),
            fps: self.get_property_double("container-fps").unwrap_or(0.0),
            sample_rate: self
                .get_property_string_safe("audio-params/samplerate")
                .parse()
                .unwrap_or(0),
            channels: self
                .get_property_string_safe("audio-params/channel-count")
                .parse()
                .unwrap_or(0),
            format_name: self.get_property_string_safe("file-format"),
            duration: self.get_duration(),
            format_long_name: String::new(),
            overall_bitrate: self.get_property_string_safe("video-bitrate").parse().unwrap_or(0)
                + self.get_property_string_safe("audio-bitrate").parse().unwrap_or(0),
            video_profile: self.get_property_string_safe("video-params/profile"),
            pixel_format: self.get_property_string_safe("video-params/pixelformat"),
            color_space: self.get_property_string_safe("video-params/colormatrix"),
            color_primaries: self.get_property_string_safe("video-params/primaries"),
            color_transfer: self.get_property_string_safe("video-params/gamma"),
            video_bit_depth: self
                .get_property_string_safe("video-params/bit-depth")
                .parse()
                .unwrap_or(0),
            audio_channel_layout: self.get_property_string_safe("audio-params/channel-layout"),
            audio_language: String::new(),
            audio_track_count,
            video_track_count,
            subtitle_track_count,
            video_frame_count: 0,
            sample_aspect_ratio: self.get_property_string_safe("video-params/sar"),
            display_aspect_ratio: self.get_property_string_safe("video-params/dar"),
        }
    }

    pub fn get_current_path(&self) -> String {
        self.get_property_string_safe("path")
    }

    pub fn get_audio_levels(&self) -> AudioLevels {
        fn parse_db(raw: &str) -> Option<f64> {
            let value = raw.trim();
            if value.is_empty() || value.eq_ignore_ascii_case("nan") {
                return None;
            }
            if value.eq_ignore_ascii_case("-inf") || value.eq_ignore_ascii_case("inf") {
                return Some(-90.0);
            }
            value.parse::<f64>().ok()
        }

        let left = parse_db(&self.get_property_string_safe(
            "af-metadata/dbmeter/by-key/lavfi.astats.1.RMS_level",
        ))
        .or_else(|| {
            parse_db(&self.get_property_string_safe(
                "af-metadata/dbmeter/by-key/lavfi.astats.1.Peak_level",
            ))
        });

        let right = parse_db(&self.get_property_string_safe(
            "af-metadata/dbmeter/by-key/lavfi.astats.2.RMS_level",
        ))
        .or_else(|| {
            parse_db(&self.get_property_string_safe(
                "af-metadata/dbmeter/by-key/lavfi.astats.2.Peak_level",
            ))
        });

        let overall = parse_db(&self.get_property_string_safe(
            "af-metadata/dbmeter/by-key/lavfi.astats.Overall.RMS_level",
        ))
        .or_else(|| {
            parse_db(&self.get_property_string_safe(
                "af-metadata/dbmeter/by-key/lavfi.astats.Overall.Peak_level",
            ))
        });

        let left_db = left.or(overall).unwrap_or(-90.0);
        let right_db = right.or(overall).unwrap_or(left_db);
        let overall_db = overall.unwrap_or((left_db + right_db) * 0.5);

        AudioLevels {
            left_db,
            right_db,
            overall_db,
            available: left.is_some() || right.is_some() || overall.is_some(),
        }
    }

    pub fn probe_media_info(path: &str) -> Result<MediaInfo, String> {
        fn parse_ratio(raw: &str) -> f64 {
            let text = raw.trim();
            if text.is_empty() {
                return 0.0;
            }
            if let Some((num, den)) = text.split_once('/') {
                let n = num.trim().parse::<f64>().unwrap_or(0.0);
                let d = den.trim().parse::<f64>().unwrap_or(1.0);
                if d.abs() < f64::EPSILON {
                    return 0.0;
                }
                return n / d;
            }
            text.parse::<f64>().unwrap_or(0.0)
        }

        fn parse_i64(value: Option<&Value>) -> i64 {
            fn parse_from_str(text: &str) -> Option<i64> {
                let t = text.trim();
                if t.is_empty() {
                    return None;
                }
                if let Ok(v) = t.parse::<i64>() {
                    return Some(v);
                }
                if let Ok(v) = t.parse::<f64>() {
                    return Some(v.round() as i64);
                }
                let filtered: String = t
                    .chars()
                    .filter(|c| c.is_ascii_digit() || *c == '.' || *c == '-' || *c == '+')
                    .collect();
                if filtered.is_empty() {
                    return None;
                }
                filtered.parse::<f64>().ok().map(|v| v.round() as i64)
            }

            value
                .and_then(|v| {
                    v.as_i64()
                        .or_else(|| v.as_u64().and_then(|u| i64::try_from(u).ok()))
                        .or_else(|| v.as_f64().map(|f| f.round() as i64))
                        .or_else(|| v.as_str().and_then(parse_from_str))
                })
                .unwrap_or(0)
        }

        fn parse_f64(value: Option<&Value>) -> f64 {
            value
                .and_then(|v| {
                    v.as_f64()
                        .or_else(|| v.as_i64().map(|n| n as f64))
                        .or_else(|| v.as_u64().map(|n| n as f64))
                        .or_else(|| v.as_str().and_then(|s| s.trim().parse::<f64>().ok()))
                })
                .unwrap_or(0.0)
        }

        fn parse_str(value: Option<&Value>) -> String {
            value
                .and_then(|v| {
                    v.as_str()
                        .map(|s| s.trim().to_string())
                        .or_else(|| v.as_i64().map(|n| n.to_string()))
                        .or_else(|| v.as_u64().map(|n| n.to_string()))
                        .or_else(|| v.as_f64().map(|n| n.to_string()))
                })
                .unwrap_or_default()
        }

        fn infer_bit_depth_from_pix_fmt(pix_fmt: &str) -> i64 {
            let lower = pix_fmt.to_ascii_lowercase();
            if lower.is_empty() {
                return 0;
            }
            if lower.contains("16") {
                return 16;
            }
            if lower.contains("14") {
                return 14;
            }
            if lower.contains("12") {
                return 12;
            }
            if lower.contains("10") {
                return 10;
            }
            if lower.contains("9") {
                return 9;
            }
            8
        }

        fn parse_stream_i64(stream: Option<&Value>, field: &str) -> i64 {
            parse_i64(stream.and_then(|s| s.get(field)))
        }

        fn parse_stream_tag_i64(stream: Option<&Value>, field: &str) -> i64 {
            parse_i64(stream.and_then(|s| s.get("tags")).and_then(|t| t.get(field)))
        }

        fn parse_stream_str(stream: Option<&Value>, field: &str) -> String {
            parse_str(stream.and_then(|s| s.get(field)))
        }

        let mut child = Command::new(super::commands::resolve_tool("ffprobe.exe"))
            .args([
                "-v",
                "error",
                "-show_streams",
                "-show_format",
                "-of",
                "json",
                path,
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("ffprobe indisponible: {}", e))?;

        let timeout = Duration::from_secs(4);
        let start = Instant::now();
        loop {
            match child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) => {
                    if start.elapsed() >= timeout {
                        let _ = child.kill();
                        let _ = child.wait();
                        return Err("ffprobe timeout (4s)".to_string());
                    }
                    thread::sleep(Duration::from_millis(20));
                }
                Err(e) => {
                    return Err(format!("ffprobe wait failed: {}", e));
                }
            }
        }

        let output = child
            .wait_with_output()
            .map_err(|e| format!("ffprobe output failed: {}", e))?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let root: Value =
            serde_json::from_slice(&output.stdout).map_err(|e| format!("ffprobe JSON invalide: {}", e))?;
        let streams = root
            .get("streams")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default();
        let format = root
            .get("format")
            .and_then(|v| v.as_object())
            .cloned()
            .unwrap_or_default();

        let video_stream = streams.iter().find(|stream| {
            stream
                .get("codec_type")
                .and_then(|v| v.as_str())
                .map(|kind| kind == "video")
                .unwrap_or(false)
        });
        let audio_stream = streams.iter().find(|stream| {
            stream
                .get("codec_type")
                .and_then(|v| v.as_str())
                .map(|kind| kind == "audio")
                .unwrap_or(false)
        });
        let subtitle_track_count = streams
            .iter()
            .filter(|stream| {
                stream
                    .get("codec_type")
                    .and_then(|v| v.as_str())
                    .map(|kind| kind == "subtitle" || kind == "sub")
                    .unwrap_or(false)
            })
            .count() as i64;
        let audio_track_count = streams
            .iter()
            .filter(|stream| {
                stream
                    .get("codec_type")
                    .and_then(|v| v.as_str())
                    .map(|kind| kind == "audio")
                    .unwrap_or(false)
            })
            .count() as i64;
        let video_track_count = streams
            .iter()
            .filter(|stream| {
                stream
                    .get("codec_type")
                    .and_then(|v| v.as_str())
                    .map(|kind| kind == "video")
                    .unwrap_or(false)
            })
            .count() as i64;

        let width = video_stream
            .and_then(|stream| stream.get("width"))
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        let height = video_stream
            .and_then(|stream| stream.get("height"))
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        let video_codec = video_stream
            .and_then(|stream| stream.get("codec_name"))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let audio_codec = audio_stream
            .and_then(|stream| stream.get("codec_name"))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();

        let mut video_bitrate = parse_stream_i64(video_stream, "bit_rate");
        if video_bitrate <= 0 {
            video_bitrate = parse_stream_tag_i64(video_stream, "BPS");
        }
        if video_bitrate <= 0 {
            video_bitrate = parse_stream_tag_i64(video_stream, "BPS-eng");
        }

        let mut audio_bitrate = parse_stream_i64(audio_stream, "bit_rate");
        if audio_bitrate <= 0 {
            audio_bitrate = parse_stream_tag_i64(audio_stream, "BPS");
        }
        if audio_bitrate <= 0 {
            audio_bitrate = parse_stream_tag_i64(audio_stream, "BPS-eng");
        }

        let fps = video_stream
            .and_then(|stream| stream.get("avg_frame_rate"))
            .and_then(|v| v.as_str())
            .map(parse_ratio)
            .filter(|v| *v > 0.0)
            .or_else(|| {
                video_stream
                    .and_then(|stream| stream.get("r_frame_rate"))
                    .and_then(|v| v.as_str())
                    .map(parse_ratio)
                    .filter(|v| *v > 0.0)
            })
            .unwrap_or_else(|| parse_f64(video_stream.and_then(|s| s.get("fps"))));

        let sample_rate = parse_stream_i64(audio_stream, "sample_rate");
        let channels = audio_stream
            .and_then(|stream| stream.get("channels"))
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        let audio_channel_layout = audio_stream
            .and_then(|stream| stream.get("channel_layout"))
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        let audio_language = audio_stream
            .and_then(|stream| stream.get("tags"))
            .and_then(|tags| tags.get("language"))
            .and_then(|v| v.as_str())
            .filter(|lang| !lang.eq_ignore_ascii_case("und"))
            .unwrap_or_default()
            .to_string();
        let video_profile = parse_stream_str(video_stream, "profile");
        let pixel_format = parse_stream_str(video_stream, "pix_fmt");
        let color_space = parse_stream_str(video_stream, "color_space");
        let color_primaries = parse_stream_str(video_stream, "color_primaries");
        let color_transfer = parse_stream_str(video_stream, "color_transfer");
        let video_bit_depth = video_stream
            .and_then(|stream| stream.get("bits_per_raw_sample").or_else(|| stream.get("bits_per_sample")))
            .map(|v| parse_i64(Some(v)))
            .unwrap_or(0);
        let video_frame_count = {
            let nb_frames = parse_stream_i64(video_stream, "nb_frames");
            if nb_frames > 0 {
                nb_frames
            } else {
                parse_stream_i64(video_stream, "nb_read_frames")
            }
        };
        let sample_aspect_ratio = parse_stream_str(video_stream, "sample_aspect_ratio");
        let display_aspect_ratio = parse_stream_str(video_stream, "display_aspect_ratio");

        let format_name = parse_str(format.get("format_name"));
        let format_long_name = parse_str(format.get("format_long_name"));
        let file_size = parse_i64(format.get("size"));
        let mut overall_bitrate = parse_i64(format.get("bit_rate"));
        if overall_bitrate <= 0 {
            overall_bitrate = video_bitrate.saturating_add(audio_bitrate);
        }
        let duration = {
            let d = parse_f64(format.get("duration"));
            if d > 0.0 {
                d
            } else {
                let v = parse_f64(video_stream.and_then(|s| s.get("duration")));
                if v > 0.0 {
                    v
                } else {
                    parse_f64(audio_stream.and_then(|s| s.get("duration")))
                }
            }
        };

        let video_frame_count = if video_frame_count > 0 {
            video_frame_count
        } else if fps > 0.0 && duration > 0.0 {
            (fps * duration).round() as i64
        } else {
            0
        };

        let video_bit_depth = if video_bit_depth > 0 {
            video_bit_depth
        } else {
            infer_bit_depth_from_pix_fmt(&pixel_format)
        };

        Ok(MediaInfo {
            width,
            height,
            video_codec,
            audio_codec,
            file_size,
            video_bitrate,
            audio_bitrate,
            fps,
            sample_rate,
            channels,
            format_name,
            duration,
            format_long_name,
            overall_bitrate,
            video_profile,
            pixel_format,
            color_space,
            color_primaries,
            color_transfer,
            video_bit_depth,
            audio_channel_layout,
            audio_language,
            audio_track_count,
            video_track_count,
            subtitle_track_count,
            video_frame_count,
            sample_aspect_ratio,
            display_aspect_ratio,
        })
    }

    pub fn set_detached_controls_enabled(&self, enabled: bool) -> Result<(), String> {
        let flag = if enabled { "yes" } else { "no" };
        self.set_property_string("osc", flag)?;
        self.set_property_string("input-default-bindings", flag)?;
        Ok(())
    }

    // Low-level property helpers
    fn execute_command(&self, command: &str) -> Result<(), String> {
        let cmd_c = to_cstring(command);
        let result = unsafe { (self.lib.command_string)(self.handle, cmd_c.as_ptr()) };
        if result < 0 {
            return Err(format!("Failed command `{}`: error {}", command, result));
        }
        Ok(())
    }

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
