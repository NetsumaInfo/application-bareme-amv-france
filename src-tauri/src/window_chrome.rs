#![allow(non_snake_case)]
//! Native window chrome theming.
//!
//! Harmonises the native Windows title bar (caption background, title text,
//! border and the square min/max/close buttons) of every decorated window
//! (main, detached notes, detached results notes) and of the detached Win32
//! mpv player window with the in-app theme.
//!
//! Driven from the frontend: each window calls `set_window_chrome` whenever the
//! appearance is (re)applied. The last theme is cached so the Win32 player
//! window — which is recreated/restyled on detach/fullscreen transitions — can
//! re-apply it without a frontend round-trip.

/// COLORREF (0x00BBGGRR) parsed from a `#RRGGBB` string.
#[cfg(target_os = "windows")]
fn colorref_from_hex(s: &str) -> Option<u32> {
    let h = s.trim().trim_start_matches('#');
    if h.len() != 6 {
        return None;
    }
    let r = u32::from_str_radix(&h[0..2], 16).ok()?;
    let g = u32::from_str_radix(&h[2..4], 16).ok()?;
    let b = u32::from_str_radix(&h[4..6], 16).ok()?;
    Some(r | (g << 8) | (b << 16))
}

#[cfg(target_os = "windows")]
mod imp {
    use std::os::raw::c_void;
    use std::sync::Mutex;

    // DWM window attributes (dwmapi.h).
    const DWMWA_USE_IMMERSIVE_DARK_MODE: u32 = 20; // Win10 1809+
    const DWMWA_BORDER_COLOR: u32 = 34; // Win11 22000+
    const DWMWA_CAPTION_COLOR: u32 = 35; // Win11 22000+
    const DWMWA_TEXT_COLOR: u32 = 36; // Win11 22000+

    const GWL_STYLE: i32 = -16;
    const WS_CAPTION: u32 = 0x00C0_0000;

    #[link(name = "dwmapi")]
    extern "system" {
        fn DwmSetWindowAttribute(hwnd: isize, attr: u32, pv: *const c_void, cb: u32) -> i32;
    }
    #[link(name = "user32")]
    extern "system" {
        fn GetWindowLongPtrW(hwnd: isize, n_index: i32) -> isize;
    }

    #[derive(Clone, Copy)]
    pub struct CaptionTheme {
        pub dark: bool,
        pub caption: u32,
        pub text: u32,
        pub border: u32,
    }

    // Sensible dark default (theme `midnight` / accent `petrol`) used before the
    // frontend has pushed a theme, so the very first detached player frame never
    // flashes a bright OS title bar.
    const DEFAULT_THEME: CaptionTheme = CaptionTheme {
        dark: true,
        caption: 0x0023_0F0F, // #0f0f23
        text: 0x00EB_E7E5,    // #e5e7eb
        border: 0x0063_3F24,  // #243f63
    };

    static LAST: Mutex<Option<CaptionTheme>> = Mutex::new(None);

    pub fn store(theme: CaptionTheme) {
        if let Ok(mut g) = LAST.lock() {
            *g = Some(theme);
        }
    }

    fn current() -> CaptionTheme {
        LAST.lock().ok().and_then(|g| *g).unwrap_or(DEFAULT_THEME)
    }

    fn set_attr(hwnd: isize, attr: u32, value: u32) {
        unsafe {
            let _ = DwmSetWindowAttribute(
                hwnd,
                attr,
                &value as *const u32 as *const c_void,
                std::mem::size_of::<u32>() as u32,
            );
        }
    }

    /// Apply a caption theme to a single HWND. Caption/text colours are only set
    /// on windows that actually own a native caption; dark-mode and border apply
    /// to any decorated window.
    pub fn apply(hwnd: isize, theme: CaptionTheme) {
        if hwnd == 0 {
            return;
        }
        let has_caption = unsafe { (GetWindowLongPtrW(hwnd, GWL_STYLE) as u32) & WS_CAPTION != 0 };
        set_attr(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, theme.dark as u32);
        if has_caption {
            set_attr(hwnd, DWMWA_CAPTION_COLOR, theme.caption);
            set_attr(hwnd, DWMWA_TEXT_COLOR, theme.text);
        }
        set_attr(hwnd, DWMWA_BORDER_COLOR, theme.border);
    }

    /// Re-apply the last pushed theme (or the dark default) to an HWND. Used by
    /// the Win32 player window when it (re)gains a native caption.
    pub fn apply_last(hwnd: isize) {
        apply(hwnd, current());
    }
}

/// Re-apply the last known caption theme to a raw HWND. No-op off Windows.
/// Called from the Win32 player window when it enters detached/windowed mode.
#[allow(unused_variables)]
pub fn apply_last_to(hwnd: isize) {
    #[cfg(target_os = "windows")]
    imp::apply_last(hwnd);
}

/// Theme the calling window's native title bar (and the detached mpv player
/// window) to match the in-app appearance. Colours are `#RRGGBB`.
#[tauri::command]
#[allow(unused_variables)]
pub fn set_window_chrome(
    window: tauri::WebviewWindow,
    state: tauri::State<'_, crate::state::AppState>,
    dark: bool,
    caption: String,
    text: String,
    border: String,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let theme = imp::CaptionTheme {
            dark,
            caption: colorref_from_hex(&caption).unwrap_or(0),
            text: colorref_from_hex(&text).unwrap_or(0x00FF_FFFF),
            border: colorref_from_hex(&border).unwrap_or(0),
        };
        imp::store(theme);

        if let Ok(h) = window.hwnd() {
            imp::apply(h.0 as isize, theme);
        }

        // Keep the detached Win32 player title bar in sync with the same theme.
        if let Ok(child) = state.child_window.lock() {
            if let Some(cw) = child.as_ref() {
                imp::apply(cw.hwnd(), theme);
            }
        }
    }
    Ok(())
}
