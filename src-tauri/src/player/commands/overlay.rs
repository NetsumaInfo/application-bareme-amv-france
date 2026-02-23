pub(super) fn sync_overlay_with_child(
    app_handle: &tauri::AppHandle,
    cw: &crate::player::mpv_window::MpvChildWindow,
    focus_overlay: bool,
) {
    use tauri::Manager;

    let Some(overlay) = app_handle.get_window("fullscreen-overlay") else {
        return;
    };

    let should_show = (cw.is_detached() || cw.is_fullscreen()) && cw.is_visible();
    if !should_show {
        let _ = overlay.set_fullscreen(false);
        let _ = overlay.hide();
        return;
    }

    let _ = overlay.set_always_on_top(false);
    let _ = overlay.set_ignore_cursor_events(false);
    let _ = overlay.set_fullscreen(false);
    let _ = overlay.show();

    let target_rect = if cw.is_detached() && !cw.is_fullscreen() {
        cw.get_client_rect_screen().or_else(|| cw.get_window_rect())
    } else {
        cw.get_window_rect().or_else(|| cw.get_fullscreen_monitor_rect())
    };

    if let Some((mx, my, mw, mh)) = target_rect {
        #[cfg(target_os = "windows")]
        {
            if let Ok(hwnd) = overlay.hwnd() {
                let overlay_hwnd = hwnd.0 as isize;
                let video_hwnd = cw.hwnd();
                unsafe {
                    crate::player::mpv_window::set_window_owner_raw(overlay_hwnd, video_hwnd);
                }
                let positioned_above_video = unsafe {
                    crate::player::mpv_window::set_window_pos_raw(
                        overlay_hwnd,
                        0,
                        mx,
                        my,
                        mw,
                        mh,
                        0x0010,
                    )
                };
                if !positioned_above_video {
                    let _ = unsafe {
                        crate::player::mpv_window::set_window_pos_raw(
                            video_hwnd,
                            -2,
                            0,
                            0,
                            0,
                            0,
                            0x0013,
                        )
                    };
                    let retry_above_video = unsafe {
                        crate::player::mpv_window::set_window_pos_raw(
                            overlay_hwnd,
                            0,
                            mx,
                            my,
                            mw,
                            mh,
                            0x0010,
                        )
                    };
                    if !retry_above_video {
                        let positioned_top = unsafe {
                            crate::player::mpv_window::set_window_pos_raw(
                                overlay_hwnd,
                                0,
                                mx,
                                my,
                                mw,
                                mh,
                                0x0010,
                            )
                        };
                        if !positioned_top && cw.is_fullscreen() {
                            let _ = overlay.set_fullscreen(true);
                        }
                    }
                }
            } else if cw.is_fullscreen() {
                let _ = overlay.set_fullscreen(true);
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = overlay.set_fullscreen(true);
        }
    } else if cw.is_fullscreen() {
        let _ = overlay.set_fullscreen(true);
    }

    if focus_overlay {
        let _ = overlay.set_focus();
    }
}
