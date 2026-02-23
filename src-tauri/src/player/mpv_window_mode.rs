use crate::player::mpv_win32::*;
use super::MpvChildWindow;

impl MpvChildWindow {
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
            let was_visible = IsWindowVisible(self.hwnd) != 0;

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

            // Detached mode: standalone top-level window.
            // This avoids accidental overlap priority issues with other app windows
            // (notes/media panels) while still allowing manual focus behavior.
            SetWindowLongPtrW(self.hwnd, GWLP_HWNDPARENT, 0);

            // Set window title
            let title = to_wide("AMV Notation - Video");
            SetWindowTextW(self.hwnd, title.as_ptr());

            // Apply frame changes and reposition
            let mut flags = SWP_FRAMECHANGED;
            if was_visible {
                flags |= SWP_SHOWWINDOW;
            }
            SetWindowPos(
                self.hwnd,
                HWND_NOTOPMOST,
                rect.left,
                rect.top,
                cur_w,
                cur_h,
                flags,
            );
            if !was_visible {
                ShowWindow(self.hwnd, SW_HIDE);
            }
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
}
