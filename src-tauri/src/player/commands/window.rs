use crate::state::AppState;
use tauri::State;

use super::shared::with_child_window;

#[tauri::command]
pub fn player_set_geometry(
    state: State<'_, AppState>,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
) -> Result<(), String> {
    with_child_window(&state, |cw| {
        cw.set_geometry(x, y, width, height);
        Ok(())
    })
}

#[tauri::command]
pub fn player_show(state: State<'_, AppState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    with_child_window(&state, |cw| {
        cw.show();
        let mut overlay_sync = state.overlay_sync.lock().map_err(|e| e.to_string())?;
        super::overlay::sync_overlay_with_child(&app_handle, cw, false, &mut overlay_sync);
        Ok(())
    })
}

#[tauri::command]
pub fn player_hide(state: State<'_, AppState>, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::{Emitter, Manager};
    with_child_window(&state, |cw| {
        cw.hide();
        if let Some(overlay) = app_handle.get_webview_window("fullscreen-overlay") {
            let _ = overlay.set_fullscreen(false);
            let _ = overlay.hide();
            let _ = overlay.emit("overlay:visibility", false);
        }
        if let Ok(mut overlay_sync) = state.overlay_sync.lock() {
            *overlay_sync = crate::state::OverlaySyncState::default();
        }
        Ok(())
    })
}

#[tauri::command]
pub fn player_hide_surface(state: State<'_, AppState>) -> Result<(), String> {
    with_child_window(&state, |cw| {
        cw.hide();
        Ok(())
    })
}

#[tauri::command]
pub fn player_set_fullscreen(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
    fullscreen: bool,
) -> Result<(), String> {
    use tauri::Manager;
    with_child_window(&state, |cw| {
        let mut overlay_sync = state.overlay_sync.lock().map_err(|e| e.to_string())?;
        if fullscreen {
            cw.show();
            cw.set_fullscreen(true);
            super::overlay::sync_overlay_with_child(&app_handle, cw, true, &mut overlay_sync);
        } else {
            cw.set_fullscreen(false);
            super::overlay::sync_overlay_with_child(
                &app_handle,
                cw,
                cw.is_detached(),
                &mut overlay_sync,
            );
            if !cw.is_detached() {
                if let Some(main) = app_handle.get_webview_window("main") {
                    let _ = main.set_focus();
                }
            }
        }
        Ok(())
    })
}

#[tauri::command]
pub fn player_is_fullscreen(state: State<'_, AppState>) -> Result<bool, String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    Ok(child.as_ref().map(|cw| cw.is_fullscreen()).unwrap_or(false))
}

#[tauri::command]
pub fn player_is_visible(state: State<'_, AppState>) -> Result<bool, String> {
    let child = state.child_window.lock().map_err(|e| e.to_string())?;
    Ok(child.as_ref().map(|cw| cw.is_visible()).unwrap_or(false))
}

#[tauri::command]
pub fn player_sync_overlay(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<bool, String> {
    with_child_window(&state, |cw| {
        let mut overlay_sync = state.overlay_sync.lock().map_err(|e| e.to_string())?;
        let previous = *overlay_sync;
        super::overlay::sync_overlay_with_child(&app_handle, cw, false, &mut overlay_sync);
        Ok(previous != *overlay_sync)
    })
}
