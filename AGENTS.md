# AGENTS.md

This file provides guidance to Codex and other coding agents when working with code in this repository.

## Code Quality Requirements

- Keep code clean, refactored, and modular. Avoid large monolithic files when logic can be split into focused modules.
- Follow best practices for the stack (React/TypeScript/Rust): clear naming, strong typing, single-responsibility components/hooks, and reusable utilities.
- Any functional change should preserve or improve maintainability (readability, testability, and consistency with existing architecture).
- The expected quality bar is **100%**. Do not treat "mostly working" or "good enough" as finished if there are still known avoidable issues, regressions, broken states, or incomplete cleanup.
- When validating a change, aim to leave no avoidable errors or warnings in the touched area. If a check cannot reach a clean result, document the reason clearly instead of silently leaving it behind.

## Workflow Discipline

- Use `Apex` as the default workflow for any implementation, refactor, or bug-fix task.
- Before modifying code or docs, always select and follow the most relevant skill for the task at hand.
- Keep that skill usage consistent on every change, not only on major edits.
- Treat `Reactor` and the selected skill workflow as mandatory quality gates: do not skip them when you touch the repository.

## Build & Development Commands

```bash
# Development
npm run dev                # Frontend only (Vite)
npm run tauri dev          # Vite + Tauri desktop app

# Frontend build / preview
npm run build              # TypeScript build + Vite build
npm run preview            # Preview the Vite bundle

# Lint / i18n
npm run lint
npm run i18n:sync

# Rust checks
cd src-tauri && cargo check
cd src-tauri && cargo build

# Full desktop build
npm run tauri build
```

**Prerequisite**: `libmpv-2.dll` must be available for playback in development. In practice, keep it in the project root when running locally. Production bundles include the Windows resources from `src-tauri/resources/windows/*`.

## Stack Summary

- **Desktop shell**: Tauri v1
- **Frontend**: React 19, TypeScript 5, Vite 7, Zustand
- **Backend**: Rust 2021
- **Video**: mpv loaded dynamically at runtime, plus FFmpeg/ffprobe-based probing helpers
- **Primary platform**: Windows-first desktop behavior, with many Win32-specific player/window integrations

## Architecture

### Frontend (`src/`)

- **Multi-entry frontend**:
  - `src/main.tsx` -> main app window
  - `src/overlay-entry.tsx` -> fullscreen overlay window
  - `src/notes-entry.tsx` -> detached notes window
  - `src/resultats-notes-entry.tsx` -> detached judge-notes window
- **Path alias**: `@/` maps to `./src/` in TypeScript and Vite.
- **Tauri access rule**: always go through `src/services/tauri.ts`, which re-exports the typed API modules from `src/services/tauri_api/*`. Do not call `invoke()` directly from components.

### State Stores

- **Core shared Zustand stores**:
  - `useProjectStore` -> project entity, clips, current clip index, imported judges, dirty flag, removed clip history
  - `usePlayerStore` -> playback state, loaded file, tracks, fullscreen/detached state
  - `useNotationStore` -> notes, note history, current bareme, available baremes
  - `useUIStore` -> active tab, notation layout, theme, accent, language, zoom, shortcut bindings, modal flags, PiP visibility, notes detachment, UI preferences
- **Flow-specific store**:
  - `useClipDeletionStore` -> pending deletion confirmation flow

### UI Structure

- **Top-level tabs**:
  - `notation`
  - `resultats`
  - `export`
- **Notation layouts inside the notation tab**:
  - `spreadsheet`
  - `notation` (comments-focused scoring panel)
  - `dual` (spreadsheet + detached notes workflow)
- Historical `modern` interface values are still normalized back to `notation` for old settings, but the removed modern UI files should not be revived without a full app-wide plan.

### Important Frontend Modules

- `components/layout/AppLayout.tsx` orchestrates app bootstrap, bridges, shortcuts, zoom, auto-save, and player window lifecycle.
- `components/layout/AppMainContent.tsx` swaps between Welcome, Notation, Resultats, and Export.
- `components/layout/NotationTabContent.tsx` decides whether the notation tab renders spreadsheet mode or notation/comments mode.
- `components/interfaces/spreadsheet/hooks/useSpreadsheetInterfaceController.ts` is the central composition hook for spreadsheet mode.
- `components/notes/DetachedNotesWindow.tsx` is the detached notes UI.
- `components/interfaces/resultats/DetachedResultatsJudgeNotesWindow.tsx` is the detached judge-notes UI.
- `hooks/usePlayer.ts` + `hooks/usePlayerStatusPolling.ts` are the playback control/sync entry points on the frontend.
- `hooks/useWindowUiSettingsSync.ts` keeps auxiliary windows aligned with theme/language/shortcut settings.

### Backend (`src-tauri/src/`)

- `main.rs` wires Tauri commands, precreates auxiliary windows, and bootstraps the embedded player.
- `app_windows.rs` owns fullscreen overlay, detached notes window, detached results notes window, and related lifecycle events.
- `state.rs` stores `Mutex<Option<MpvPlayer>>` and `Mutex<Option<MpvChildWindow>>`.
- `player/` is split into focused modules:
  - `bootstrap.rs` -> player/window init during app startup
  - `commands/` -> Tauri command handlers grouped by concern (`control`, `window`, `media`, `probe_*`, `overlay`, `cache`, etc.)
  - `mpv_ffi.rs` -> raw dynamic DLL loading and symbols
  - `mpv_wrapper.rs` + helper modules -> high-level mpv control/properties/media helpers
  - `mpv_window.rs` + helper modules -> embedded/detached/fullscreen Win32 child window behavior
  - `mpv_probe/` -> ffprobe parsing helpers
- `project/manager.rs` is now a façade over submodules:
  - `project_files.rs`
  - `project_listing.rs`
  - `baremes.rs`
  - `user_settings.rs`
  - `json_io.rs`
  - `paths.rs`
  - `types.rs`
- `video/import.rs` scans folders for supported video files.

## Key Patterns

### mpv Embedded Rendering

mpv renders into a Win32 child/popup window layered over the webview rather than inside the DOM. The frontend computes geometry from the video container and sends it to `player_set_geometry`. This is the core invariant behind `VideoPlayer`, `FloatingVideoPlayer`, detached mode, and fullscreen overlay sync.

### Geometry Updates Are Deduplicated

`src/services/tauri_api/player.ts` caches the last geometry payload and skips duplicate `player_set_geometry` calls. Do not bypass this helper with raw `invoke()` calls from UI code.

### mpv Dynamic Loading

`libloading` is used so mpv remains an optional runtime dependency. In `mpv_ffi.rs`, dereference `Symbol<T>` to raw function pointers before moving the `Library` into the struct. Keep this pattern intact whenever touching the FFI layer.

### Player State Sync Is Adaptive

The frontend no longer polls at a flat 250 ms. `usePlayerStatusPolling()` uses:

- `120ms` while playing or fullscreen
- `320ms` while idle
- `500ms` after polling errors

It also refreshes fullscreen state only when needed. Preserve that adaptive behavior when changing player sync.

### First Playback Starts Muted

`usePlayer()` sets player volume to `0` on init. This is intentional to avoid surprise audio.

### Tabs vs Notation Layouts

`Ctrl+1/2/3` now switch the **top-level tabs** (`notation`, `resultats`, `export`). They do not switch between spreadsheet/comments layouts. The notation layouts are toggled from `NotationModeSwitcher` and settings.

### Detached Notes Window Is Bridge-Driven

Detached notes are not a second independent store. The detached window receives clip/bareme/note payloads from the main window through Tauri events such as:

- `main:clip-data`
- `main:note-updated`
- `notes:criterion-updated`
- `notes:text-notes-updated`
- `notes:timecode-jump`

If you change notes behavior, update both the main-window emitters and the detached-window listeners.

### Dual Mode Auto-Detaches Notes

When the notation tab is in `dual` mode, `useAutoDetachNotesWindow()` opens the detached notes window automatically. When that window closes, the app falls back out of dual mode to avoid a broken split state.

### Results Detached Notes Use a Separate Bridge

The Resultats tab has its own detached judge-notes bridge using events like:

- `main:resultats-judge-notes-data`
- `resultats-notes:request-data`
- `resultats-notes:select-clip`
- `resultats-notes:timecode-jump`

Do not mix the notation-window bridge and the resultats-window bridge.

### Auxiliary Windows Are Precreated/Warmed

The fullscreen overlay window is precreated in `app_windows::precreate_aux_windows()`. The notes/resultats-notes windows can also be warmed with `warm_aux_windows()` shortly after app load to avoid sluggish first-open behavior.

### UI Settings Persist And Broadcast Across Windows

Theme, accent color, language, shortcut bindings, audio meter visibility, and clip-deletion confirmation are persisted through `load_user_settings` / `save_user_settings`. Changes are broadcast with the `ui:settings-updated` event so detached windows stay visually in sync.

### Welcome Screen Loads Folder Projects Plus Recents

The welcome screen combines:

- the real project list from the default projects folder
- recent file paths stored in user settings

Recent entries that no longer exist are cleaned up. Keep this merge behavior intact if you touch project discovery.

### No-Video Workflow Is Supported

Spreadsheet mode supports creating a scoring table without imported video files. Users can:

- paste one participant per line
- create manual rows
- attach video files later

Do not regress this workflow by assuming every clip has `filePath`.

### Clip Naming Convention

`parseClipName()` / clip import helpers treat the first dash as the separator between author and clip title:

- `pseudo-nom_du_clip.mp4` -> author: `pseudo`, displayName: `nom du clip`
- `nom_du_clip.mp4` -> displayName only

Underscores become spaces. Match this logic when generating or reconciling clips.

### Clip Deletion Is Confirmation-Aware

Deletion should go through `useClipDeletionStore` when the UI needs the confirmation flow. `useProjectStore.removeClip()` is the raw state mutation and also manages selection/history bookkeeping.

### Undo Covers Two Domains

`Ctrl+Z` first restores the last removed clip if applicable; otherwise it falls back to notation history undo. Keep that ordering.

### Frame Preview / Media Info Use Probing And Caches

The backend can derive:

- frame previews (`player_get_frame_preview`)
- detailed media info (`player_get_media_info`)

These go through ffmpeg/mpv/ffprobe helpers and LRU caches in `src-tauri/src/player/commands/cache.rs`. Prefer extending that pipeline rather than inventing separate probing codepaths.

### Fullscreen Overlay Positioning

The overlay is a separate transparent Tauri window. The backend keeps it aligned with the player child window via `player_sync_overlay` and window-geometry helpers. Fullscreen/detached modes use different coordinate sources, so preserve those branches when editing overlay sync logic.

### Detached Player Window

The mpv child window can be detached into a native top-level window. In detached mode, geometry from embedded React containers should not drive the child window position.

### Custom Context Menus

- Use `AppContextMenuPanel` / `AppContextMenuItem` for custom menus.
- These menus render through a portal and are preferred over browser-native menus.
- Page-level and local menus must stop propagation correctly when intentionally overriding each other.

### App Appearance

- Appearance is driven by `src/utils/appTheme.ts`.
- `applyAppearanceToDocument(theme, primaryColor)` sets document-level attributes.
- Detached windows must bootstrap and re-apply theme/language; do not assume only the main window needs this.

## Keyboard Shortcuts

Shortcut definitions are centralized in `src/utils/shortcuts.ts`. Bindings are user-configurable and persisted.

Common defaults:

- `Ctrl+1` -> notation tab
- `Ctrl+2` -> resultats tab
- `Ctrl+3` -> export tab
- `Ctrl+S` -> save
- `Ctrl+Shift+S` -> save as
- `Ctrl+N` -> new project
- `Ctrl+O` -> open project
- `F11` -> fullscreen video
- `Escape` -> exit fullscreen
- `Space` -> play/pause
- `Left` / `Right` -> seek `-5s` / `+5s`
- `Shift+Left` / `Shift+Right` -> seek `-30s` / `+30s`
- `N` / `P` -> next / previous clip
- `,` / `.` -> frame back / forward
- `Ctrl+Shift+G` -> screenshot
- `Ctrl+T` -> insert timecode in notes
- `Ctrl+M` -> toggle miniatures
- `Ctrl+Shift+M` -> set current miniature frame

`useKeyboardShortcuts(shortcuts, globalShortcuts?)` still differentiates between:

- **Regular shortcuts**: blocked while typing in inputs/textareas/selects
- **Global shortcuts**: always active

## Welcome Screen Import Policy

- The welcome screen must not handle **CSV**, **TSV**, or **XLSX** judging-sheet imports for now.
- Keep regular project creation/opening flows simple and isolate any future tabular-import work from the default welcome screen path.

## File Layout

```text
src/
  components/
    interfaces/
      spreadsheet/    # Spreadsheet view + controller hooks
      notation/       # Comments/scoring mode
      resultats/      # Aggregation, judge notes, detached notes support
      export/         # Export options, preview, actions
    layout/           # App shell, header, context menu, bridges, welcome
    notes/            # Detached notes window UI + helpers
    player/           # Embedded player, overlay, floating player, media info
    project/          # Project menu, create/open/save flows
    scoring/          # Bareme editor
    settings/         # Settings tabs and config
    ui/               # Shared UI primitives
  hooks/
    usePlayer.ts
    usePlayerStatusPolling.ts
    useAutoSave.ts
    useKeyboardShortcuts.ts
    useSaveProject.ts
    useWindowUiSettingsSync.ts
  i18n/
    locales/
    seed.ts
  schemas/
  services/
    tauri.ts
    tauri_api/
    projectSession.ts
    recentProjects.ts
  store/
    useProjectStore.ts
    usePlayerStore.ts
    useNotationStore.ts
    useUIStore.ts
    useClipDeletionStore.ts
  utils/
    appTheme.ts
    clipImport.ts
    clipOrder.ts
    results.ts
    resultsVisibility.ts
    scoring.ts
    shortcuts.ts
    uiSettingsEvents.ts
  main.tsx
  overlay-entry.tsx
  notes-entry.tsx
  resultats-notes-entry.tsx

src-tauri/src/
  app_windows.rs
  main.rs
  state.rs
  player/
    bootstrap.rs
    commands/
    mpv_ffi.rs
    mpv_probe/
    mpv_window.rs
    mpv_wrapper.rs
  project/
    manager.rs
    manager/
  video/
    import.rs
```

## Language

- The **source language** of the UI is French.
- Runtime UI languages: French, English, Japanese, Russian, Chinese, Spanish.
- Any new visible UI string must go through `useI18n().t(...)`.
- Avoid raw user-facing strings in JSX unless they are domain/project data.

## Internationalization

- Add new French-visible strings with `t('Texte français')`.
- Config-driven labels/descriptions that are not direct JSX literals must be added to `src/i18n/seed.ts`.
- After changing French UI text, run:

```bash
npm run i18n:sync
```

- The sync script updates `src/i18n/locales/fr.json` and fills missing keys in the other locale files.
- Auto-filled translations are only a baseline. Manually review user-visible wording, especially:
  - judging / barème vocabulary
  - placeholder preservation (`{path}`, `{error}`, etc.)
  - Japanese / Chinese layout fit
- Runtime fallback remains French.

## Supported Video Formats

Via mpv/FFmpeg, the app supports common formats including:

- **Containers**: MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV
- **Codecs**: H.264, H.265/HEVC, VP8, VP9, AV1

## Important Notes

- `src-tauri/tauri.conf.json` bundles Windows resources with `"resources": ["resources/windows/*"]`.
- The overlay, notes, and resultats-notes windows are separate HTML entry points. Do not assume a single-window frontend.
- `WM_CLOSE` handling in the mpv window code intentionally hides instead of destroying some windows to keep the player reusable.
- All Win32 operations in the player window layer should keep `IsWindow()`-style validity checks to avoid stale HWND crashes.
- Many playback and probing features degrade gracefully when mpv/ffmpeg/ffprobe are unavailable. Preserve graceful failure paths instead of turning them into hard crashes.
