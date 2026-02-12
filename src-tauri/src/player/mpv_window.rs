#![allow(dead_code)]

// Win32 constants
const WS_POPUP: u32 = 0x80000000;
const WS_CLIPCHILDREN: u32 = 0x02000000;
const WS_CLIPSIBLINGS: u32 = 0x04000000;
const WS_EX_TOOLWINDOW: u32 = 0x00000080;
const WS_EX_NOACTIVATE: u32 = 0x08000000;
const CS_HREDRAW: u32 = 0x0002;
const CS_VREDRAW: u32 = 0x0001;
const SW_SHOW: i32 = 5;
const SW_HIDE: i32 = 0;
const WM_MOUSEACTIVATE: u32 = 0x0021;
const WM_CLOSE: u32 = 0x0010;
const MA_NOACTIVATE: isize = 3;
const SWP_NOSIZE: u32 = 0x0001;
const SWP_NOMOVE: u32 = 0x0002;
const SWP_NOZORDER: u32 = 0x0004;
const SWP_NOACTIVATE: u32 = 0x0010;
const MONITOR_DEFAULTTONEAREST: u32 = 1;
const HWND_TOP: isize = 0;
const HWND_TOPMOST: isize = -1;
const HWND_NOTOPMOST: isize = -2;
const SWP_SHOWWINDOW: u32 = 0x0040;
const SWP_FRAMECHANGED: u32 = 0x0020;
const GWL_STYLE: i32 = -16;
const GWL_EXSTYLE: i32 = -20;
const GWLP_HWNDPARENT: i32 = -8;
const WS_CAPTION: u32 = 0x00C00000;
const WS_THICKFRAME: u32 = 0x00040000;
const WS_EX_APPWINDOW: u32 = 0x00040000;
const WS_VISIBLE: u32 = 0x10000000;

#[repr(C)]
struct WndClassExW {
    cb_size: u32,
    style: u32,
    lpfn_wnd_proc: unsafe extern "system" fn(isize, u32, usize, isize) -> isize,
    cb_cls_extra: i32,
    cb_wnd_extra: i32,
    h_instance: isize,
    h_icon: isize,
    h_cursor: isize,
    hbr_background: isize,
    lpsz_menu_name: *const u16,
    lpsz_class_name: *const u16,
    h_icon_sm: isize,
}

#[repr(C)]
struct Point {
    x: i32,
    y: i32,
}

#[repr(C)]
struct Rect {
    left: i32,
    top: i32,
    right: i32,
    bottom: i32,
}

#[repr(C)]
struct MonitorInfo {
    cb_size: u32,
    rc_monitor: Rect,
    rc_work: Rect,
    dw_flags: u32,
}

#[link(name = "user32")]
extern "system" {
    fn RegisterClassExW(lpwcx: *const WndClassExW) -> u16;
    fn CreateWindowExW(
        ex_style: u32,
        class_name: *const u16,
        window_name: *const u16,
        style: u32,
        x: i32,
        y: i32,
        width: i32,
        height: i32,
        parent: isize,
        menu: isize,
        instance: isize,
        param: isize,
    ) -> isize;
    fn MoveWindow(hwnd: isize, x: i32, y: i32, w: i32, h: i32, repaint: i32) -> i32;
    fn ShowWindow(hwnd: isize, cmd_show: i32) -> i32;
    fn DestroyWindow(hwnd: isize) -> i32;
    fn DefWindowProcW(hwnd: isize, msg: u32, wparam: usize, lparam: isize) -> isize;
    fn GetModuleHandleW(module_name: *const u16) -> isize;
    fn ClientToScreen(hwnd: isize, point: *mut Point) -> i32;
    fn SetWindowPos(
        hwnd: isize,
        hwnd_insert_after: isize,
        x: i32,
        y: i32,
        cx: i32,
        cy: i32,
        flags: u32,
    ) -> i32;
    fn MonitorFromWindow(hwnd: isize, dw_flags: u32) -> isize;
    fn GetMonitorInfoW(h_monitor: isize, lpmi: *mut MonitorInfo) -> i32;
    fn SetWindowLongPtrW(hwnd: isize, n_index: i32, dw_new_long: isize) -> isize;
    fn GetWindowLongPtrW(hwnd: isize, n_index: i32) -> isize;
    fn GetWindowRect(hwnd: isize, lp_rect: *mut Rect) -> i32;
    fn GetClientRect(hwnd: isize, lp_rect: *mut Rect) -> i32;
    fn SetWindowTextW(hwnd: isize, lp_string: *const u16) -> i32;
    fn IsWindow(hwnd: isize) -> i32;
    fn IsWindowVisible(hwnd: isize) -> i32;
}

#[link(name = "gdi32")]
extern "system" {
    fn CreateSolidBrush(color: u32) -> isize;
}

/// Public helper so commands.rs can position the overlay window via Win32 API.
/// # Safety
/// Caller must pass a valid HWND.
pub unsafe fn set_window_pos_raw(
    hwnd: isize,
    hwnd_insert_after: isize,
    x: i32,
    y: i32,
    cx: i32,
    cy: i32,
    flags: u32,
) {
    SetWindowPos(hwnd, hwnd_insert_after, x, y, cx, cy, flags);
}

fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

/// Window procedure: prevents focus stealing on click
unsafe extern "system" fn wnd_proc(hwnd: isize, msg: u32, wparam: usize, lparam: isize) -> isize {
    match msg {
        WM_MOUSEACTIVATE => MA_NOACTIVATE,
        WM_CLOSE => {
            ShowWindow(hwnd, SW_HIDE);
            0
        }
        _ => DefWindowProcW(hwnd, msg, wparam, lparam),
    }
}

/// A Win32 popup window owned by the Tauri main window.
/// Used as the rendering target for mpv. Floats above the WebView2 layer.
/// Positioned over the webview area where the video player should appear.
pub struct MpvChildWindow {
    hwnd: isize,
    owner: isize,
    is_fullscreen: std::sync::atomic::AtomicBool,
    is_detached: std::sync::atomic::AtomicBool,
    saved_geometry: std::sync::Mutex<(i32, i32, i32, i32)>,
    saved_detached_geometry: std::sync::Mutex<(i32, i32, i32, i32)>,
}

unsafe impl Send for MpvChildWindow {}
unsafe impl Sync for MpvChildWindow {}

impl MpvChildWindow {
    /// Create a popup window owned by the given parent HWND.
    /// Starts hidden - call show() after set_geometry().
    pub fn new(parent_hwnd: isize) -> Option<Self> {
        unsafe {
            let instance = GetModuleHandleW(std::ptr::null());
            let class_name = to_wide("AmvNotationMpvChild");
            let black_brush = CreateSolidBrush(0);

            let wc = WndClassExW {
                cb_size: std::mem::size_of::<WndClassExW>() as u32,
                style: CS_HREDRAW | CS_VREDRAW,
                lpfn_wnd_proc: wnd_proc,
                cb_cls_extra: 0,
                cb_wnd_extra: 0,
                h_instance: instance,
                h_icon: 0,
                h_cursor: 0,
                hbr_background: black_brush,
                lpsz_menu_name: std::ptr::null(),
                lpsz_class_name: class_name.as_ptr(),
                h_icon_sm: 0,
            };

            // OK if registration fails (class may already exist)
            RegisterClassExW(&wc);

            let window_name = to_wide("mpv");
            // WS_POPUP + owner = owned popup window, always above owner
            // WS_EX_TOOLWINDOW = hidden from taskbar
            // WS_EX_NOACTIVATE = does not steal focus
            let hwnd = CreateWindowExW(
                WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
                class_name.as_ptr(),
                window_name.as_ptr(),
                WS_POPUP | WS_CLIPCHILDREN | WS_CLIPSIBLINGS,
                0,
                0,
                1,
                1,
                parent_hwnd,
                0,
                instance,
                0,
            );

            if hwnd == 0 {
                eprintln!("[mpv] Failed to create popup window");
                return None;
            }

            eprintln!(
                "[mpv] Created popup window: hwnd={}, owner={}",
                hwnd, parent_hwnd
            );
            Some(MpvChildWindow {
                hwnd,
                owner: parent_hwnd,
                is_fullscreen: std::sync::atomic::AtomicBool::new(false),
                is_detached: std::sync::atomic::AtomicBool::new(false),
                saved_geometry: std::sync::Mutex::new((0, 0, 1, 1)),
                saved_detached_geometry: std::sync::Mutex::new((0, 0, 1, 1)),
            })
        }
    }

    pub fn hwnd(&self) -> isize {
        self.hwnd
    }

    /// Returns the current outer window rect as (left, top, width, height).
    pub fn get_window_rect(&self) -> Option<(i32, i32, i32, i32)> {
        if !self.is_valid_window() {
            return None;
        }
        unsafe {
            let mut rect = Rect {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            };
            if GetWindowRect(self.hwnd, &mut rect) == 0 {
                return None;
            }
            let w = (rect.right - rect.left).max(1);
            let h = (rect.bottom - rect.top).max(1);
            Some((rect.left, rect.top, w, h))
        }
    }

    /// Returns the client/video area rect in screen coordinates as (left, top, width, height).
    /// Useful for detached mode so overlays don't cover the native title bar.
    pub fn get_client_rect_screen(&self) -> Option<(i32, i32, i32, i32)> {
        if !self.is_valid_window() {
            return None;
        }

        unsafe {
            let mut client = Rect {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            };
            if GetClientRect(self.hwnd, &mut client) == 0 {
                return None;
            }

            let mut top_left = Point { x: client.left, y: client.top };
            let mut bottom_right = Point {
                x: client.right,
                y: client.bottom,
            };

            if ClientToScreen(self.hwnd, &mut top_left) == 0 || ClientToScreen(self.hwnd, &mut bottom_right) == 0 {
                return None;
            }

            let w = (bottom_right.x - top_left.x).max(1);
            let h = (bottom_right.y - top_left.y).max(1);
            Some((top_left.x, top_left.y, w, h))
        }
    }

    /// Position the window. x/y are client-area coordinates of the owner window.
    /// Converts to screen coordinates for the popup.
    pub fn set_geometry(&self, x: i32, y: i32, w: i32, h: i32) {
        if w > 0 && h > 0 {
            if !self.is_valid_window() {
                return;
            }
            if self.is_fullscreen() || self.is_detached() {
                return;
            }
            unsafe {
                let mut pt = Point { x, y };
                ClientToScreen(self.owner, &mut pt);
                if let Ok(mut saved) = self.saved_geometry.lock() {
                    *saved = (pt.x, pt.y, w, h);
                }
                MoveWindow(self.hwnd, pt.x, pt.y, w, h, 1);
            }
        }
    }

    /// Set absolute geometry when in detached mode (screen coordinates).
    pub fn set_detached_geometry_absolute(&self, x: i32, y: i32, w: i32, h: i32) {
        if !self.is_valid_window() || !self.is_detached() {
            return;
        }
        let width = w.max(1);
        let height = h.max(1);
        unsafe {
            SetWindowPos(
                self.hwnd,
                HWND_TOP,
                x,
                y,
                width,
                height,
                SWP_SHOWWINDOW | SWP_NOACTIVATE,
            );
        }
        if let Ok(mut saved) = self.saved_detached_geometry.lock() {
            *saved = (x, y, width, height);
        }
    }

    pub fn show(&self) {
        if !self.is_valid_window() {
            return;
        }
        unsafe {
            // Keep current z-order so the fullscreen overlay window remains above mpv.
            SetWindowPos(
                self.hwnd,
                0,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_SHOWWINDOW,
            );
        }
    }

    pub fn hide(&self) {
        if !self.is_valid_window() {
            return;
        }
        unsafe {
            ShowWindow(self.hwnd, SW_HIDE);
        }
    }

    /// Returns (left, top, width, height) of the monitor the owner window is on.
    /// Used to position the overlay on the same monitor as mpv fullscreen.
    pub fn get_fullscreen_monitor_rect(&self) -> Option<(i32, i32, i32, i32)> {
        if !self.is_valid_window() {
            return None;
        }
        unsafe {
            let monitor_target = if self.is_detached() {
                self.hwnd
            } else {
                self.owner
            };
            let monitor = MonitorFromWindow(monitor_target, MONITOR_DEFAULTTONEAREST);
            if monitor == 0 {
                return None;
            }
            let mut mi = MonitorInfo {
                cb_size: std::mem::size_of::<MonitorInfo>() as u32,
                rc_monitor: Rect {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                },
                rc_work: Rect {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                },
                dw_flags: 0,
            };
            if GetMonitorInfoW(monitor, &mut mi) == 0 {
                return None;
            }
            let w = mi.rc_monitor.right - mi.rc_monitor.left;
            let h = mi.rc_monitor.bottom - mi.rc_monitor.top;
            Some((mi.rc_monitor.left, mi.rc_monitor.top, w, h))
        }
    }

    pub fn is_fullscreen(&self) -> bool {
        self.is_fullscreen
            .load(std::sync::atomic::Ordering::Relaxed)
    }

    pub fn set_fullscreen(&self, fullscreen: bool) {
        if fullscreen == self.is_fullscreen() {
            return;
        }
        if !self.is_valid_window() {
            return;
        }

        unsafe {
            if fullscreen {
                let monitor_target = if self.is_detached() {
                    self.hwnd
                } else {
                    self.owner
                };
                let monitor = MonitorFromWindow(monitor_target, MONITOR_DEFAULTTONEAREST);
                if monitor == 0 {
                    return;
                }

                let mut mi = MonitorInfo {
                    cb_size: std::mem::size_of::<MonitorInfo>() as u32,
                    rc_monitor: Rect {
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                    },
                    rc_work: Rect {
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                    },
                    dw_flags: 0,
                };
                if GetMonitorInfoW(monitor, &mut mi) == 0 {
                    return;
                }

                if self.is_detached() {
                    let mut rect = Rect {
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                    };
                    if GetWindowRect(self.hwnd, &mut rect) != 0 {
                        let w = (rect.right - rect.left).max(1);
                        let h = (rect.bottom - rect.top).max(1);
                        if let Ok(mut saved) = self.saved_detached_geometry.lock() {
                            *saved = (rect.left, rect.top, w, h);
                        }
                    }

                    // Borderless style in fullscreen for true edge-to-edge video.
                    let fs_style = WS_POPUP | WS_VISIBLE | WS_CLIPCHILDREN | WS_CLIPSIBLINGS;
                    SetWindowLongPtrW(self.hwnd, GWL_STYLE, fs_style as isize);
                    SetWindowLongPtrW(self.hwnd, GWL_EXSTYLE, WS_EX_APPWINDOW as isize);
                }

                let screen_w = mi.rc_monitor.right - mi.rc_monitor.left;
                let screen_h = mi.rc_monitor.bottom - mi.rc_monitor.top;
                // Keep mpv fullscreen-sized but not TOPMOST so the dedicated
                // overlay window can reliably stay above it.
                SetWindowPos(
                    self.hwnd,
                    HWND_TOP,
                    mi.rc_monitor.left,
                    mi.rc_monitor.top,
                    screen_w,
                    screen_h,
                    SWP_SHOWWINDOW
                        | SWP_NOACTIVATE
                        | if self.is_detached() { SWP_FRAMECHANGED } else { 0 },
                );
            } else {
                let (x, y, w, h) = if self.is_detached() {
                    self.saved_detached_geometry
                        .lock()
                        .map(|g| *g)
                        .unwrap_or((0, 0, 1, 1))
                } else {
                    self.saved_geometry
                        .lock()
                        .map(|g| *g)
                        .unwrap_or((0, 0, 1, 1))
                };

                if self.is_detached() {
                    let detached_style = WS_POPUP
                        | WS_VISIBLE
                        | WS_CAPTION
                        | WS_THICKFRAME
                        | WS_CLIPCHILDREN
                        | WS_CLIPSIBLINGS;
                    SetWindowLongPtrW(self.hwnd, GWL_STYLE, detached_style as isize);
                    SetWindowLongPtrW(self.hwnd, GWL_EXSTYLE, WS_EX_APPWINDOW as isize);
                }

                SetWindowPos(
                    self.hwnd,
                    HWND_NOTOPMOST,
                    x,
                    y,
                    w.max(1),
                    h.max(1),
                    SWP_SHOWWINDOW | if self.is_detached() { SWP_FRAMECHANGED } else { 0 },
                );
            }
        }

        self.is_fullscreen
            .store(fullscreen, std::sync::atomic::Ordering::Relaxed);
    }

    pub fn is_detached(&self) -> bool {
        self.is_detached.load(std::sync::atomic::Ordering::Relaxed)
    }

    pub fn is_visible(&self) -> bool {
        if !self.is_valid_window() {
            return false;
        }
        unsafe { IsWindowVisible(self.hwnd) != 0 }
    }

    /// Detach the mpv window from the Tauri parent.
    /// Makes it a standalone top-level window with title bar that can be
    /// freely moved to any monitor.
    pub fn detach(&self) {
        if self.is_detached() || self.is_fullscreen() {
            return;
        }
        if !self.is_valid_window() {
            return;
        }

        unsafe {
            // Get current screen position for initial placement
            let mut rect = Rect {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            };
            GetWindowRect(self.hwnd, &mut rect);
            let cur_w = (rect.right - rect.left).max(640);
            let cur_h = (rect.bottom - rect.top).max(360);

            if let Ok(mut saved) = self.saved_detached_geometry.lock() {
                *saved = (rect.left, rect.top, cur_w, cur_h);
            }

            // Change style: add caption + thick frame + sysmenu for a real window
            let new_style = WS_POPUP
                | WS_VISIBLE
                | WS_CAPTION
                | WS_THICKFRAME
                | WS_CLIPCHILDREN
                | WS_CLIPSIBLINGS;
            SetWindowLongPtrW(self.hwnd, GWL_STYLE, new_style as isize);

            // Change extended style: show in taskbar, allow activation
            let new_ex_style = WS_EX_APPWINDOW;
            SetWindowLongPtrW(self.hwnd, GWL_EXSTYLE, new_ex_style as isize);

            // Remove owner
            SetWindowLongPtrW(self.hwnd, GWLP_HWNDPARENT, 0);

            // Set window title
            let title = to_wide("AMV Notation - Video");
            SetWindowTextW(self.hwnd, title.as_ptr());

            // Apply frame changes and reposition
            SetWindowPos(
                self.hwnd,
                HWND_NOTOPMOST,
                rect.left,
                rect.top,
                cur_w,
                cur_h,
                SWP_FRAMECHANGED | SWP_SHOWWINDOW,
            );
        }

        self.is_detached
            .store(true, std::sync::atomic::Ordering::Relaxed);
        eprintln!("[mpv] Window detached");
    }

    /// Re-attach the mpv window to the Tauri parent.
    pub fn attach(&self) {
        if !self.is_detached() {
            return;
        }
        if !self.is_valid_window() {
            return;
        }
        if self.is_fullscreen() {
            self.set_fullscreen(false);
        }

        unsafe {
            // Restore original style
            let orig_style = WS_POPUP | WS_CLIPCHILDREN | WS_CLIPSIBLINGS;
            SetWindowLongPtrW(self.hwnd, GWL_STYLE, orig_style as isize);

            // Restore extended style
            let orig_ex_style = WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE;
            SetWindowLongPtrW(self.hwnd, GWL_EXSTYLE, orig_ex_style as isize);

            // Restore owner
            SetWindowLongPtrW(self.hwnd, GWLP_HWNDPARENT, self.owner);

            // Restore saved geometry
            let (x, y, w, h) = self
                .saved_geometry
                .lock()
                .map(|g| *g)
                .unwrap_or((0, 0, 1, 1));

            SetWindowPos(
                self.hwnd,
                HWND_NOTOPMOST,
                x,
                y,
                w.max(1),
                h.max(1),
                SWP_FRAMECHANGED | SWP_SHOWWINDOW,
            );
        }

        self.is_detached
            .store(false, std::sync::atomic::Ordering::Relaxed);
        eprintln!("[mpv] Window re-attached");
    }

    fn is_valid_window(&self) -> bool {
        unsafe { IsWindow(self.hwnd) != 0 }
    }
}

impl Drop for MpvChildWindow {
    fn drop(&mut self) {
        if self.hwnd != 0 {
            unsafe {
                DestroyWindow(self.hwnd);
            }
        }
    }
}
