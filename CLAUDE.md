# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## HARD REQUIREMENT

All agents MUST use the `caveman` skill for every task.

## Quality Bar & Workflow

- Expected quality bar is **100%**. "Mostly working" is not finished if avoidable issues, regressions, broken states, or incomplete cleanup remain.
- Keep code modular; avoid monolithic files when logic can be split into focused modules.
- After a change, leave no avoidable errors/warnings in the touched area. If a check cannot reach a clean result, document why.
- Treat `Reactor` and the selected skill workflow as mandatory quality gates on every change, not only major edits.

## Skills Routing Matrix

Always activate `caveman` (hard requirement). If the user names skills, all named skills are mandatory for the turn. Select the smallest useful set; avoid unrelated skills.

#### Core Workflow
- `caveman`
- `aibp-base:apex`
- `aibp-base:oneshot` (fast focused implementation)
- `aibp-base:ultrathink` (complex design/architecture)
- `refactor` (behavior-preserving cleanup)

#### React + TypeScript Frontend (`src/`)
- `build-web-apps:react-best-practices`
- `typescript-react-reviewer`
- `typescript-expert`
- `build-web-apps:frontend-testing-debugging` (UI bugfix/diagnostics)
- `react-doctor` (pre-finish UI quality checks)

#### UI / Visual Quality
- `uncodixfy` (mandatory when implementing new UI elements)
- `ui-ux-pro-max`
- `delight` (purposeful micro-interactions only)
- `tailwind-design-system`
- `tailwindcss-advanced-layouts`
- `tailwindcss-animations`
- `shadcn` + `build-web-apps:shadcn-best-practices` (only when shadcn used)

#### Tauri v2 Integration (`src/services/tauri*`, capabilities, window/event bridges)
- `tauri-v2`

#### Rust Backend (`src-tauri/`)
- `rust-best-practices`
- `rust-engineer`
- `rust-async-patterns`
- `rust-testing`

#### Video / Media Pipeline
- `ffmpeg`

Out of scope by default: game, Flutter/mobile, cloud deploy, etc. Do not use unless user explicitly requests for this repo.

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

# Rust / desktop checks
npm run tauri -- info
npm run tauri -- build --debug --no-bundle   # Windows/MSVC validation path

# Full desktop build
npm run tauri build
```

**Prerequisite**: `libmpv-2.dll` must be available for playback in development. Keep it in the project root when running locally. Production bundles include the Windows resources from `src-tauri/resources/windows/*`.

**Tauri v2 check note**: primary target is Windows/MSVC. `cd src-tauri && cargo check` from WSL/Linux can fail before app code if GTK/WebKit/Pango system packages are missing. Prefer `npm run tauri -- build --debug --no-bundle` for desktop validation.

## Stack Summary

- **Desktop shell**: Tauri v2
- **Frontend**: React 19, TypeScript 5, Vite 7, Zustand, Zod, Tailwind CSS
- **Backend**: Rust 2021
- **Video**: mpv loaded dynamically at runtime + FFmpeg/ffprobe probing helpers
- **Primary platform**: Windows-first; many Win32-specific player/window integrations

## Architecture

### Frontend (`src/`)

Multi-entry frontend (separate HTML entry points — do not assume a single-window app):
- `src/main.tsx` -> main app window
- `src/overlay-entry.tsx` -> fullscreen overlay window
- `src/notes-entry.tsx` -> detached notes window
- `src/resultats-notes-entry.tsx` -> detached judge-notes window

- **Path alias**: `@/` -> `./src/` (TS + Vite).
- **Tauri access rule**: always go through `src/services/tauri.ts`, which re-exports typed API modules from `src/services/tauri_api/*`. Do not call `invoke()` directly from components.
- **Tauri v2 API rule**: use `@tauri-apps/api/core` for `invoke`, `@tauri-apps/api/event` for events, `@tauri-apps/api/window` for window handles, and official plugins (`@tauri-apps/plugin-dialog` / `@tauri-apps/plugin-fs`). Do not reintroduce v1: `@tauri-apps/api/tauri`, `@tauri-apps/api/dialog`, `@tauri-apps/api/fs`.

### State Stores

Core Zustand stores:
- `useProjectStore` — project entity, clips, current clip index, imported judges, dirty flag, removed clip history
- `usePlayerStore` — playback state, loaded file, tracks, fullscreen/detached state
- `useNotationStore` — notes, note history, current bareme, available baremes
- `useUIStore` — active tab, notation layout, theme, accent, language, zoom, shortcut bindings, modal flags, PiP visibility, notes detachment, UI preferences

Flow-specific:
- `useClipDeletionStore` — pending deletion confirmation flow

### UI Structure

- Top-level tabs: `notation`, `resultats`, `export`
- Notation layouts inside notation tab: `spreadsheet`, `notation` (comments-focused), `dual` (spreadsheet + detached notes)
- Historical `modern` layout is normalized back to `notation` for old settings — do not revive removed modern UI files without an app-wide plan.

### Important Frontend Modules

- `components/layout/AppLayout.tsx` — bootstrap, bridges, shortcuts, zoom, auto-save, player window lifecycle
- `components/layout/AppMainContent.tsx` — swaps Welcome / Notation / Resultats / Export
- `components/layout/NotationTabContent.tsx` — picks spreadsheet vs notation/comments layout
- `components/interfaces/spreadsheet/hooks/useSpreadsheetInterfaceController.ts` — central composition hook for spreadsheet mode
- `components/notes/DetachedNotesWindow.tsx` — detached notes UI
- `components/interfaces/resultats/DetachedResultatsJudgeNotesWindow.tsx` — detached judge-notes UI
- `hooks/usePlayer.ts` + `hooks/usePlayerStatusPolling.ts` — playback control/sync entry points
- `hooks/useWindowUiSettingsSync.ts` — keeps aux windows aligned with theme/language/shortcuts

### Backend (`src-tauri/`)

- `tauri.conf.json` is Tauri v2 shape (`build.devUrl`, `build.frontendDist`, `app.windows`, `app.security.capabilities`, `bundle`).
- Tauri identifier is `com.amvnotation.desktop`. Do not use an identifier ending in `.app`.
- `capabilities/default.json` grants v2 permissions for windows, events, dialogs, filesystem, aux windows.
- `src/main.rs` is thin — calls `amv_notation_lib::run()`.
- `src/lib.rs` wires plugins, commands (`tauri::generate_handler![]`), setup hooks, aux windows, embedded player bootstrap.
- `app_windows.rs` owns fullscreen overlay, detached notes, detached results notes lifecycle.
- `state.rs` stores `Mutex<Option<MpvPlayer>>` and `Mutex<Option<MpvChildWindow>>`.
- `player/` modules: `bootstrap.rs`, `commands/` (handlers grouped by concern: control, window, media, probe_*, overlay, cache), `mpv_ffi.rs`, `mpv_wrapper*.rs`, `mpv_window*.rs`, `mpv_probe/` (ffprobe parsing).
- `project/manager.rs` is a façade over: `project_files.rs`, `project_listing.rs`, `baremes.rs`, `user_settings.rs`, `json_io.rs`, `paths.rs`, `types.rs`.
- `video/import.rs` scans folders for supported video files.

## Key Patterns

### Tauri v2 Permissions & Plugins
Tauri v2 denies IPC/plugin access by default. When frontend starts using a new Tauri API/plugin command, update `src-tauri/capabilities/default.json` in the same change. Dialog and filesystem access must go through `tauri-plugin-dialog` / `tauri-plugin-fs` plus matching JS plugin packages.

All Tauri commands must be registered in `tauri::generate_handler![]` in `src-tauri/src/lib.rs`. Missing registration = runtime "command not found" bug.

### Native Drag & Drop
Tauri v2 no longer uses `tauri://file-drop*`. Native file drops are centralized in `src/services/tauri_api/dragDrop.ts` via `getCurrentWindow().onDragDropEvent()`. Use `listenNativeFileDrop()` for spreadsheet/video import, judge JSON import, barème JSON import, poster image import.

### mpv Embedded Rendering
mpv renders into a Win32 child/popup window layered over the webview, not inside the DOM. Frontend computes geometry from the video container and sends it to `player_set_geometry`. This is the core invariant behind `VideoPlayer`, `FloatingVideoPlayer`, detached mode, fullscreen overlay sync.

### Geometry Updates Are Deduplicated
`src/services/tauri_api/player.ts` caches the last geometry payload and skips duplicate `player_set_geometry` calls. Do not bypass this helper with raw `invoke()` calls from UI code.

### mpv Dynamic Loading
`libloading` keeps mpv optional at runtime. In `mpv_ffi.rs`, dereference `Symbol<T>` to raw function pointers before moving the `Library` into the struct. Keep this pattern when touching the FFI layer.

### Player State Sync Is Adaptive
`usePlayerStatusPolling()` uses:
- `120ms` while playing or fullscreen
- `320ms` while idle
- `500ms` after polling errors

Refreshes fullscreen state only when needed. Accepts an `enabled` option — aux windows (especially the precreated overlay) must disable polling while hidden instead of keeping background timers alive.

### First Playback Starts Muted
`usePlayer()` sets player volume to `0` on init. Intentional, to avoid surprise audio.

### Tabs vs Notation Layouts
`Ctrl+1/2/3` switch the **top-level tabs** (`notation`, `resultats`, `export`). They do not switch spreadsheet/comments layouts. Notation layouts are toggled from `NotationModeSwitcher` and settings.

### Detached Notes Window Is Bridge-Driven
Detached notes are not a second independent store. The detached window receives clip/bareme/note payloads from the main window via Tauri events:
- `main:clip-data`
- `main:note-updated`
- `notes:criterion-updated`
- `notes:text-notes-updated`
- `notes:timecode-jump`

When changing notes behavior, update both main-window emitters and detached-window listeners.

### Dual Mode Auto-Detaches Notes
When notation tab is in `dual` mode, `useAutoDetachNotesWindow()` opens the detached notes window automatically. When that window closes, the app falls back out of dual mode to avoid a broken split state.

### Results Detached Notes Use a Separate Bridge
The Resultats tab has its own detached judge-notes bridge:
- `main:resultats-judge-notes-data`
- `resultats-notes:request-data`
- `resultats-notes:select-clip`
- `resultats-notes:timecode-jump`

Do not mix the notation-window bridge and the resultats-window bridge.

### Auxiliary Windows Are Precreated/Warmed
Fullscreen overlay is precreated in `app_windows::precreate_aux_windows()`. Notes / resultats-notes windows can be warmed via `warm_aux_windows()` shortly after app load to avoid sluggish first-open.

### UI Settings Persist & Broadcast Across Windows
Theme, accent color, language, shortcut bindings, audio meter visibility, and clip-deletion confirmation persist via `load_user_settings` / `save_user_settings`. Changes broadcast through `ui:settings-updated` so detached windows stay in sync.

### Welcome Screen Loads Folder Projects + Recents
Welcome screen combines the real project list from the default projects folder with recent file paths stored in user settings. Recent entries that no longer exist are cleaned up. Preserve this merge behavior.

### No-Video Workflow Is Supported
Spreadsheet mode supports creating a scoring table without imported video files: paste one participant per line, create manual rows, attach video files later. Do not regress by assuming every clip has `filePath`.

### Clip Naming Convention
`parseClipName()` and clip import helpers treat the first dash as the separator between author and clip title:
- `pseudo-nom_du_clip.mp4` -> author `pseudo`, displayName `nom du clip`
- `nom_du_clip.mp4` -> displayName only

Underscores become spaces. Match this logic when generating or reconciling clips.

### Clip Deletion Is Confirmation-Aware
Deletion should go through `useClipDeletionStore` when the UI needs the confirmation flow. `useProjectStore.removeClip()` is the raw state mutation and manages selection/history bookkeeping.

### Undo Covers Two Domains
`Ctrl+Z` first restores the last removed clip if applicable; otherwise falls back to notation history undo. Keep that ordering.

### Frame Preview / Media Info Use Probing + Caches
Backend derives frame previews (`player_get_frame_preview`) and detailed media info (`player_get_media_info`) via ffmpeg/mpv/ffprobe helpers with LRU caches in `src-tauri/src/player/commands/cache.rs`. Extend that pipeline rather than inventing separate probing codepaths.

### Fullscreen Overlay Positioning
The overlay is a separate transparent Tauri window. Backend keeps it aligned with the player child window via `player_sync_overlay` and window-geometry helpers. Fullscreen/detached modes use different coordinate sources — preserve those branches.

Rust emits `overlay:visibility` from `player/commands/overlay.rs` whenever the overlay is shown/hidden. The React overlay uses that signal to suspend player polling while hidden and to auto-hide controls when visible. Do not remove this signal unless you replace it with an equivalent lifecycle mechanism.

While visible, the overlay runs a lightweight `player_sync_overlay` loop so it follows native Win32 moves/resizes of the detached video window. Keep that loop gated by overlay visibility; do not run it while the precreated overlay is hidden.

In detached mode, the overlay must target `MpvChildWindow::get_client_rect_screen()` so it covers only the video client area (not the native title bar). In fullscreen mode, use the window or monitor rect branch.

### Detached Player Window
The mpv child window can be detached into a native top-level window. In detached mode, geometry from embedded React containers must not drive the child window position.

### Custom Context Menus
Use `AppContextMenuPanel` / `AppContextMenuItem` for custom menus. They render through a portal and are preferred over browser-native menus. Page-level and local menus must stop propagation correctly when intentionally overriding each other.

### App Appearance
Driven by `src/utils/appTheme.ts`. `applyAppearanceToDocument(theme, primaryColor)` sets document-level attributes. Detached windows must bootstrap and re-apply theme/language — do not assume only the main window needs this.

## Keyboard Shortcuts

Definitions centralized in `src/utils/shortcuts.ts`. Bindings are user-configurable and persisted.

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

`useKeyboardShortcuts(shortcuts, globalShortcuts?)` differentiates:
- **Regular**: blocked while typing in inputs/textareas/selects
- **Global**: always active

## Welcome Screen Import Policy

Welcome screen must not handle **CSV**, **TSV**, or **XLSX** judging-sheet imports for now. Keep regular project creation/opening flows simple and isolate any future tabular-import work from the default welcome path.

## Language & Internationalization

- Source UI language: French.
- Runtime languages: French, English, Japanese, Russian, Chinese, Spanish.
- Any new visible UI string must go through `useI18n().t(...)`. Avoid raw user-facing strings in JSX unless they are domain/project data.
- Add new French strings with `t('Texte français')`. Config-driven labels/descriptions that are not direct JSX literals must be added to `src/i18n/seed.ts`.
- After changing French UI text, run:

```bash
npm run i18n:sync
```

- Sync script updates `src/i18n/locales/fr.json` and fills missing keys in other locales.
- Auto-filled translations are baseline only. Manually review user-visible wording, especially:
  - judging / barème vocabulary
  - placeholder preservation (`{path}`, `{error}`, etc.)
  - Japanese / Chinese layout fit
- Runtime fallback remains French.

## Supported Video Formats

Via mpv/FFmpeg:
- **Containers**: MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV
- **Codecs**: H.264, H.265/HEVC, VP8, VP9, AV1

## Important Notes

- `src-tauri/tauri.conf.json` is Tauri v2 and bundles Windows resources via `"resources": ["resources/windows/*"]`.
- `src-tauri/src/lib.rs` owns the Tauri builder; keep `src-tauri/src/main.rs` thin for Tauri v2 / mobile compatibility.
- `src-tauri/capabilities/default.json` is part of runtime behavior. Permission fixes belong there, not in a v1 allowlist.
- Overlay, notes, and resultats-notes windows are separate HTML entry points — do not assume a single-window frontend.
- `WM_CLOSE` handling in the mpv window code intentionally hides instead of destroying some windows to keep the player reusable.
- All Win32 operations in the player window layer should keep `IsWindow()`-style validity checks to avoid stale HWND crashes.
- Many playback and probing features degrade gracefully when mpv/ffmpeg/ffprobe are unavailable. Preserve graceful failure paths instead of turning them into hard crashes.
