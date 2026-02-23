use lazy_static::lazy_static;
use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;

const FRAME_PREVIEW_CACHE_MAX_ENTRIES: usize = 240;
const MEDIA_INFO_CACHE_MAX_ENTRIES: usize = 96;

struct LruCache<V: Clone> {
    max_entries: usize,
    map: HashMap<String, V>,
    order: VecDeque<String>,
}

impl<V: Clone> LruCache<V> {
    fn new(max_entries: usize) -> Self {
        Self {
            max_entries,
            map: HashMap::new(),
            order: VecDeque::new(),
        }
    }

    fn get(&mut self, key: &str) -> Option<V> {
        let value = self.map.get(key).cloned()?;
        self.touch(key);
        Some(value)
    }

    fn put(&mut self, key: String, value: V) {
        if self.map.contains_key(&key) {
            self.map.insert(key.clone(), value);
            self.touch(&key);
            return;
        }

        self.map.insert(key.clone(), value);
        self.order.push_back(key.clone());

        while self.map.len() > self.max_entries {
            if let Some(oldest) = self.order.pop_front() {
                self.map.remove(&oldest);
            } else {
                break;
            }
        }
    }

    fn touch(&mut self, key: &str) {
        if let Some(index) = self.order.iter().position(|entry| entry == key) {
            self.order.remove(index);
            self.order.push_back(key.to_string());
        }
    }
}

lazy_static! {
    static ref FRAME_PREVIEW_CACHE: Mutex<LruCache<String>> =
        Mutex::new(LruCache::new(FRAME_PREVIEW_CACHE_MAX_ENTRIES));
    static ref MEDIA_INFO_CACHE: Mutex<LruCache<crate::player::mpv_wrapper::MediaInfo>> =
        Mutex::new(LruCache::new(MEDIA_INFO_CACHE_MAX_ENTRIES));
}

fn normalized_cache_path(path: &str) -> String {
    let normalized = super::parsing::normalize_path(path);
    #[cfg(target_os = "windows")]
    {
        return normalized.to_ascii_lowercase();
    }
    #[cfg(not(target_os = "windows"))]
    {
        normalized
    }
}

fn media_info_cache_key(path: &str) -> String {
    normalized_cache_path(path)
}

fn frame_preview_cache_key(path: &str, seconds: f64, width: u32) -> String {
    let tick = if seconds.is_finite() {
        (seconds.max(0.0) * 1000.0).round() as i64
    } else {
        0
    };
    format!("{}|{}|{}", normalized_cache_path(path), tick, width)
}

pub(super) fn get_media_info_cached(path: &str) -> Option<crate::player::mpv_wrapper::MediaInfo> {
    let key = media_info_cache_key(path);
    let mut cache = MEDIA_INFO_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    cache.get(&key)
}

pub(super) fn put_media_info_cache(path: &str, info: crate::player::mpv_wrapper::MediaInfo) {
    let key = media_info_cache_key(path);
    let mut cache = MEDIA_INFO_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    cache.put(key, info);
}

pub(super) fn get_frame_preview_cached(path: &str, seconds: f64, width: u32) -> Option<String> {
    let key = frame_preview_cache_key(path, seconds, width);
    let mut cache = FRAME_PREVIEW_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    cache.get(&key)
}

pub(super) fn put_frame_preview_cache(path: &str, seconds: f64, width: u32, image: String) {
    let key = frame_preview_cache_key(path, seconds, width);
    let mut cache = FRAME_PREVIEW_CACHE.lock().unwrap_or_else(|e| e.into_inner());
    cache.put(key, image);
}
