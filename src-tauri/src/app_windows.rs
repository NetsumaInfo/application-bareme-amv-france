use tauri::Manager;

#[tauri::command]
pub async fn open_notes_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(existing) = app_handle.get_window("notes-window") {
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }

    let handle = app_handle.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(existing) = handle.get_window("notes-window") {
            let _ = existing.show();
            let _ = existing.set_focus();
            return Ok(());
        }

        tauri::WindowBuilder::new(
            &handle,
            "notes-window",
            tauri::WindowUrl::App("notes.html".into()),
        )
        .title("AMV Notation - Notes")
        .inner_size(380.0, 700.0)
        .min_inner_size(320.0, 400.0)
        .resizable(true)
        .decorations(true)
        .visible(true)
        .focused(true)
        .initialization_script(
            "window.__AMV_NOTES_WINDOW__ = true; window.__AMV_FULLSCREEN_OVERLAY__ = false;",
        )
        .build()
        .map_err(|e| e.to_string())?;

        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("notes-window task error: {}", e))??;

    Ok(())
}

#[tauri::command]
pub fn close_notes_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_window("notes-window") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_resultats_judge_notes_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(existing) = app_handle.get_window("resultats-notes-window") {
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }

    let handle = app_handle.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(existing) = handle.get_window("resultats-notes-window") {
            let _ = existing.show();
            let _ = existing.set_focus();
            return Ok(());
        }

        tauri::WindowBuilder::new(
            &handle,
            "resultats-notes-window",
            tauri::WindowUrl::App("index.html?resultats-notes=true".into()),
        )
        .title("AMV Notation - Notes juges")
        .inner_size(1100.0, 760.0)
        .min_inner_size(760.0, 480.0)
        .resizable(true)
        .decorations(true)
        .visible(true)
        .focused(true)
        .initialization_script(
            "window.__AMV_RESULTATS_NOTES_WINDOW__ = true; window.__AMV_FULLSCREEN_OVERLAY__ = false; window.__AMV_NOTES_WINDOW__ = false;",
        )
        .build()
        .map_err(|e| e.to_string())?;

        Ok::<(), String>(())
    })
    .await
    .map_err(|e| format!("resultats-notes-window task error: {}", e))??;

    Ok(())
}

#[tauri::command]
pub fn close_resultats_judge_notes_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_window("resultats-notes-window") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn precreate_aux_windows(app: &tauri::App) {
    if app.get_window("fullscreen-overlay").is_none() {
        match tauri::WindowBuilder::new(
            app,
            "fullscreen-overlay",
            tauri::WindowUrl::App("index.html?overlay=true".into()),
        )
        .transparent(true)
        .decorations(false)
        .always_on_top(false)
        .fullscreen(false)
        .visible(false)
        .focused(false)
        .skip_taskbar(true)
        .resizable(false)
        .title("AMV Notation Overlay")
        .initialization_script(
            "window.__AMV_FULLSCREEN_OVERLAY__ = true; window.__AMV_NOTES_WINDOW__ = false;",
        )
        .build()
        {
            Ok(overlay) => {
                let _ = overlay.hide();
            }
            Err(e) => {
                eprintln!("[AMV] Failed to precreate overlay window: {}", e);
            }
        }
    }

    if app.get_window("notes-window").is_none() {
        match tauri::WindowBuilder::new(
            app,
            "notes-window",
            tauri::WindowUrl::App("notes.html".into()),
        )
        .title("AMV Notation - Notes")
        .inner_size(380.0, 700.0)
        .min_inner_size(320.0, 400.0)
        .resizable(true)
        .decorations(true)
        .visible(false)
        .focused(false)
        .initialization_script(
            "window.__AMV_NOTES_WINDOW__ = true; window.__AMV_FULLSCREEN_OVERLAY__ = false;",
        )
        .build()
        {
            Ok(notes) => {
                let _ = notes.hide();
            }
            Err(e) => {
                eprintln!("[AMV] Failed to precreate notes window: {}", e);
            }
        }
    }

    if app.get_window("resultats-notes-window").is_none() {
        match tauri::WindowBuilder::new(
            app,
            "resultats-notes-window",
            tauri::WindowUrl::App("index.html?resultats-notes=true".into()),
        )
        .title("AMV Notation - Notes juges")
        .inner_size(1100.0, 760.0)
        .min_inner_size(760.0, 480.0)
        .resizable(true)
        .decorations(true)
        .visible(false)
        .focused(false)
        .initialization_script(
            "window.__AMV_RESULTATS_NOTES_WINDOW__ = true; window.__AMV_FULLSCREEN_OVERLAY__ = false; window.__AMV_NOTES_WINDOW__ = false;",
        )
        .build()
        {
            Ok(resultats_notes) => {
                let _ = resultats_notes.hide();
            }
            Err(e) => {
                eprintln!("[AMV] Failed to precreate resultats notes window: {}", e);
            }
        }
    }
}

pub fn handle_window_event(event: &tauri::GlobalWindowEvent) {
    let label = event.window().label().to_string();
    match event.event() {
        tauri::WindowEvent::CloseRequested { .. } => {
            if label == "main" {
                if let Some(overlay) = event.window().app_handle().get_window("fullscreen-overlay") {
                    let _ = overlay.close();
                }
                if let Some(notes) = event.window().app_handle().get_window("notes-window") {
                    let _ = notes.close();
                }
                if let Some(resultats_notes) = event.window().app_handle().get_window("resultats-notes-window") {
                    let _ = resultats_notes.close();
                }
            } else if label == "notes-window" {
                let _ = event.window().app_handle().emit_all("notes:close", ());
            } else if label == "resultats-notes-window" {
                let _ = event.window().app_handle().emit_all("resultats-notes:close", ());
            }
        }
        tauri::WindowEvent::Destroyed => {
            if label == "notes-window" {
                let _ = event.window().app_handle().emit_all("notes:close", ());
            } else if label == "resultats-notes-window" {
                let _ = event.window().app_handle().emit_all("resultats-notes:close", ());
            }
        }
        _ => {}
    }
}
