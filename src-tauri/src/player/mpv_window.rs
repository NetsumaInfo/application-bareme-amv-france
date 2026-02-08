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
const MA_NOACTIVATE: isize = 3;

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
}

#[link(name = "gdi32")]
extern "system" {
    fn CreateSolidBrush(color: u32) -> isize;
}

fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

/// Window procedure: prevents focus stealing on click
unsafe extern "system" fn wnd_proc(
    hwnd: isize,
    msg: u32,
    wparam: usize,
    lparam: isize,
) -> isize {
    match msg {
        WM_MOUSEACTIVATE => MA_NOACTIVATE,
        _ => DefWindowProcW(hwnd, msg, wparam, lparam),
    }
}

/// A Win32 popup window owned by the Tauri main window.
/// Used as the rendering target for mpv. Floats above the WebView2 layer.
/// Positioned over the webview area where the video player should appear.
pub struct MpvChildWindow {
    hwnd: isize,
    owner: isize,
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

            eprintln!("[mpv] Created popup window: hwnd={}, owner={}", hwnd, parent_hwnd);
            Some(MpvChildWindow { hwnd, owner: parent_hwnd })
        }
    }

    pub fn hwnd(&self) -> isize {
        self.hwnd
    }

    /// Position the window. x/y are client-area coordinates of the owner window.
    /// Converts to screen coordinates for the popup.
    pub fn set_geometry(&self, x: i32, y: i32, w: i32, h: i32) {
        if w > 0 && h > 0 {
            unsafe {
                let mut pt = Point { x, y };
                ClientToScreen(self.owner, &mut pt);
                MoveWindow(self.hwnd, pt.x, pt.y, w, h, 1);
            }
        }
    }

    pub fn show(&self) {
        unsafe {
            ShowWindow(self.hwnd, SW_SHOW);
        }
    }

    pub fn hide(&self) {
        unsafe {
            ShowWindow(self.hwnd, SW_HIDE);
        }
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
