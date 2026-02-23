use crate::player::mpv_win32::*;
use super::MpvChildWindow;

impl MpvChildWindow {
    pub fn show(&self) {
        if !self.is_valid_window() {
            return;
        }
        unsafe {
            if IsWindowVisible(self.hwnd) != 0 {
                return;
            }
        }
        unsafe {
            if self.is_detached() {
                // Detached window should come to front when explicitly shown,
                // but must not stay top-most globally.
                SetWindowPos(
                    self.hwnd,
                    HWND_TOP,
                    0,
                    0,
                    0,
                    0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW,
                );
            } else {
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
    }

    pub fn hide(&self) {
        if !self.is_valid_window() {
            return;
        }
        unsafe {
            ShowWindow(self.hwnd, SW_HIDE);
        }
    }

    pub fn is_fullscreen(&self) -> bool {
        self.is_fullscreen
            .load(std::sync::atomic::Ordering::Relaxed)
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
}
