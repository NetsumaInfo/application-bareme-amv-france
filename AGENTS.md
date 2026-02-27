# AGENTS.md

This file provides guidance to Codex and other coding agents when working with code in this repository.

## Code Quality Requirements

- Keep code clean, refactored, and modular. Avoid large monolithic files when logic can be split into focused modules.
- Follow best practices for the stack (React/TypeScript/Rust): clear naming, strong typing, single-responsibility components/hooks, and reusable utilities.
- Any functional change should preserve or improve maintainability (readability, testability, and consistency with existing architecture).

## Build & Development Commands

```bash
# Development (launches Vite + Tauri together)
npm run tauri dev

# Frontend only (no Rust backend)
npm run dev

# Build production
npm run build          # TypeScript check + Vite build (frontend only)
npm run tauri build    # Full desktop app build (frontend + Rust)

# Lint
npm run lint           # ESLint

# Rust checks
cd src-tauri && cargo check    # Type check Rust backend
cd src-tauri && cargo build    # Build Rust backend
```

**Prerequisite**: `libmpv-2.dll` must be in the project root for video playback. Without it, the app runs but video features are disabled.

## Architecture

**Tauri v1** desktop app: React frontend communicates with Rust backend via `invoke()` commands.

### Frontend (src/)

- **4 Zustand stores** share state across all interfaces:
  - `useProjectStore` - Project data, clips array, currentClipIndex, dirty flag, navigation, `removeClip()`
  - `usePlayerStore` - Playback state synced from mpv via 250ms polling (isPlaying, currentTime, duration, volume, tracks, isDetached)
  - `useNotationStore` - Scores (`notes: Record<clipId, Note>`), bareme, validation. `updateCriterion()` validates + recalculates
  - `useUIStore` - Interface mode (`spreadsheet | modern | notation | resultats | export`), sidebar state, modal flags, zoom level, floating video state

- **5 interfaces** read/write the same stores - switching is seamless:
  - Spreadsheet (table with keyboard nav, PiP floating video, right-click context menu for clip deletion, 3-way sorting)
  - Modern (cards, sliders, ScoreRing SVG)
  - Notation (compact panel alongside fullscreen video)
  - Resultats (aggregate scores from multiple judges, import JE.json files, right-click judge management, dedicated judge-notes view)
  - Export (table and poster modes, customizable PDF/PNG/JSON exports, summary/detailed table views, notes PDF export)

- **services/tauri.ts** - Typed wrappers around all `invoke()` calls. Always go through this module, never call `invoke()` directly from components.

- **Path alias**: `@/` maps to `./src/` (configured in tsconfig + vite)

### Backend (src-tauri/src/)

- **player/** - mpv integration via dynamic loading (`libloading` crate)
  - `mpv_ffi.rs` - Raw FFI: loads DLL at runtime, stores function pointers. Searches CWD, exe ancestors, and system PATH.
  - `mpv_wrapper.rs` - High-level API: `new(wid: Option<i64>)`, load_file, play, pause, seek, get/set properties.
  - `mpv_window.rs` - Win32 popup window for mpv rendering. Supports attached (owned popup over Tauri window), detached (standalone top-level window with title bar), and fullscreen modes. Handles WM_MOUSEACTIVATE and WM_CLOSE.
  - `commands.rs` - Tauri command handlers. Includes `sync_overlay_with_child()` helper for precise overlay positioning.

- **project/manager.rs** - Save/load `.json` project files via `serde_json::Value`. Projects auto-saved to `Documents/AMV Notation/Projets/` folder. Also handles JE.json export format for judge notation sharing.

- **video/import.rs** - Scan folders for video files using `walkdir` (depth 1)

- **state.rs** - `AppState` with `Mutex<Option<MpvPlayer>>` and `Mutex<Option<MpvChildWindow>>`. Both are Option because mpv may not be available. Initialized as None, populated in the `.setup()` hook.

- **main.rs** - Uses `.setup()` hook to: create fullscreen overlay window (hidden, transparent), get Tauri window HWND, create MpvChildWindow, create MpvPlayer with `wid` for embedded rendering.

## Key Patterns

### mpv Embedded Rendering (critical)
mpv renders into a Win32 popup window overlaid on the webview. The frontend tracks the video container's position via `ResizeObserver` + `getBoundingClientRect()` and sends geometry updates (DPI-scaled) to the backend via `player_set_geometry`. The popup window is shown/hidden as the VideoPlayer component mounts/unmounts. When detached, geometry updates are ignored since the window is independently positioned.

### mpv Dynamic Loading (critical)
`libloading` loads mpv DLL at runtime - no compile-time dependency. In `mpv_ffi.rs`, `Symbol` borrows from `Library`, so you must dereference to raw fn pointers *before* moving Library into the struct:
```rust
let create_ptr = *lib.get::<unsafe fn() -> MpvHandle>(b"mpv_create\0")?;
// ... then move lib into struct, store raw fn pointers separately
```

### Player State Sync
`usePlayer` hook polls `player_get_status` every 250ms to sync mpv state (isPlaying, currentTime, duration) into the Zustand store. Playback commands (play, pause, seek, volume) go through `services/tauri.ts` invoke wrappers.

### Video Loading on Interface Switch
When switching interfaces (Ctrl+1/2/3), the VideoPlayer remounts. It checks `usePlayerStore.getState().currentFilePath` to avoid reloading the same file (which would restart playback). If the file is already loaded, it just shows the child window and updates geometry.

### TypeScript Strictness
`tsconfig.app.json` has `noUnusedLocals` and `noUnusedParameters` enabled. Prefix unused params with `_`. React 19 requires `useRef()` to have an initial value argument.

### Scoring Flow
User input -> `useNotationStore.updateCriterion()` -> `validateCriterionValue()` -> `calculateScore()` -> updates `notes[clipId]` -> marks project dirty -> auto-save triggers.

### Clip Naming Convention
Video filenames are parsed with `parseClipName()` in `utils/formatters.ts`:
- `pseudo-nom_du_clip.mp4` -> author: "pseudo", displayName: "nom du clip"
- `nom_du_clip.mp4` -> displayName: "nom du clip" (no author)
First dash separates author from title, underscores become spaces.

### Tauri Resources
`tauri.conf.json` bundles `libmpv-2.dll` via `"resources": ["resources/windows/libmpv-2.dll"]`. The installer includes the DLL so end users don't need to download it separately. In development, place `libmpv-2.dll` in the project root. Managed by Git LFS.

### Rust Modules
Use `#![allow(dead_code)]` at top of FFI/future-use modules to suppress warnings.

### Projects Folder Management
Projects are auto-saved to `Documents/AMV Notation/Projets/{name}.json` on creation. The WelcomeScreen scans this folder via `list_projects_in_folder` Rust command. The `useSaveProject` hook extracts save/saveAs logic for reuse across keyboard shortcuts and menu actions.

### Keyboard Shortcuts
Shortcut definitions are centralized in `utils/shortcuts.ts` with `ShortcutAction` type and `SHORTCUT_DEFINITIONS` array (French labels).

The `useKeyboardShortcuts(shortcuts, globalShortcuts?)` hook differentiates between:
- **Regular shortcuts**: Blocked when typing in INPUT/TEXTAREA/SELECT elements
- **Global shortcuts**: Always fire, even in input fields (used for Ctrl+S, Ctrl+N, Ctrl+O, F11, zoom)

Common shortcuts:
- `Ctrl+S`: Save project
- `Ctrl+N`: New project
- `Ctrl+O`: Open project
- `Ctrl+1/2/3`: Switch interfaces (Spreadsheet/Modern/Notation)
- `F11`: Toggle fullscreen video
- `Space`: Play/pause
- `←`/`→`: Seek -5s/+5s
- `Shift+←`/`Shift+→`: Seek -30s/+30s
- `N`/`P`: Next/previous clip

### Fullscreen Video
Fullscreen mode uses Win32 `MonitorFromWindow` + `GetMonitorInfoW` to get monitor bounds, then `SetWindowPos` to resize mpv. An `AtomicBool` tracks fullscreen state. A separate overlay Tauri window displays controls that auto-hide after inactivity. The `sync_overlay_with_child()` helper in `commands.rs` positions the overlay precisely on the correct monitor, using `get_client_rect_screen()` for detached mode and `get_window_rect()` for fullscreen mode.

The `FullscreenOverlay` is viewport-aware with compact/tiny control modes for smaller windows. It includes subtitle and audio track selectors (fetched directly from the backend via `playerGetTracks()`).

### Detachable Video Window
The mpv window can be detached from the Tauri parent into a standalone top-level window with a native title bar (`WS_CAPTION | WS_THICKFRAME`). This allows dragging the video to any monitor.

Key Win32 operations:
- **Detach**: `SetWindowLongPtrW` to change style (add caption/frame), remove owner (`GWLP_HWNDPARENT = 0`), add `WS_EX_APPWINDOW` for taskbar visibility
- **Attach**: Restore original `WS_POPUP` style, re-set owner, restore `WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE`
- **Geometry isolation**: `set_geometry()` is no-op when detached; `saved_detached_geometry` tracks detached position separately

### FloatingVideoPlayer
In Spreadsheet mode, video can detach into a floating PiP window (fixed position, draggable via mousedown/move/up). Uses the same mpv geometry tracking as VideoPlayer. Includes detach/attach button (`ExternalLink`/`Undo2` icons). On close or unmount, re-attaches automatically if detached.

### Track Selectors (Subtitle/Audio)
`SubtitleSelector` and `AudioTrackSelector` render as icon-only buttons (always visible, dimmed when no tracks). On click, a portal-mounted popup menu appears with track options. Uses `createPortal` to `document.body` with viewport-aware positioning.

### CSS Zoom
The app supports zoom in/out via `style={{ zoom: zoomLevel + '%' }}` on the root container. Zoom level is stored in `useUIStore` and adjustable via keyboard shortcuts.

### Clip Deletion
Right-click on a clip row in SpreadsheetInterface opens a context menu with "Supprimer". The `removeClip(clipId)` action in `useProjectStore` handles index adjustment for `currentClipIndex`.

### Video Import
Both folder import (`scanVideoFolder`) and individual file import (`openVideoFilesDialog` with multi-select) are supported. Available from ProjectManager menu and SpreadsheetInterface empty state.

### JE.json Export Format
Separate from full project export, "Exporter notation (JE.json)" exports only the current judge's scores for sharing/integration. This format can be imported in the Resultats interface to aggregate scores from multiple judges.

### Resultats Notes Panel
- The bottom panel in `ResultatsInterface` is for the **general note** only (current judge editable text).
- Detailed per-judge notes must remain in `ResultatsJudgeNotesView`.
- Visibility is controlled by `hideTextNotes` and can be toggled from the panel close button or the right-click context menu ("Afficher/Masquer note générale").

### Export Table Views
- Export table supports two views:
  - `summary`: one column per category
  - `detailed`: category headers + criterion/sub-category columns
- `useExportData` prepares both category-level and criterion-level aggregates used by these views.

### Export PNG/PDF Notes
- PNG export supports `single`, `paged`, and `both` modes.
- Paged PNG uses `exportPageRefs` targets marked with `data-export-page="true"` and sorted by `data-export-page-index`.
- Notes PDF export supports `general`, `judges`, and `both`.
- Notes PDF pagination avoids orphan clip headers at the bottom of a page by reserving space for header + first note lines before rendering a clip block.

## File Layout

```
src/
  types/          # TypeScript interfaces (project, bareme, notation, player)
  schemas/        # Zod validation schemas
  store/          # 4 Zustand stores
  services/       # tauri.ts - all Tauri invoke wrappers
  hooks/          # usePlayer, useAutoSave, useKeyboardShortcuts, useSaveProject
  utils/          # scoring.ts, formatters.ts, colors.ts, results.ts, shortcuts.ts, videoElement.ts
  components/
    layout/       # AppLayout (WelcomeScreen + layouts), Header, Sidebar, ContextMenu
    player/       # VideoPlayer, FloatingVideoPlayer (PiP), PlayerControls, FullscreenOverlay, SubtitleSelector, AudioTrackSelector
    interfaces/   # SpreadsheetInterface, ModernInterface, NotationInterface, ResultatsInterface, ExportInterface, InterfaceSwitcher
    project/      # ProjectManager, CreateProjectModal, VideoList, ProgressIndicator
    settings/     # SettingsPanel (3 tabs: General, Notation, Lecteur)
    scoring/      # BaremeEditor (create/edit custom baremes)

src-tauri/src/
  main.rs         # Entry point, .setup() hook for mpv init
  state.rs        # AppState (player + child_window, both Mutex<Option<...>>)
  player/         # mpv_ffi.rs, mpv_wrapper.rs, mpv_window.rs, commands.rs
  project/        # manager.rs (save/load .json project files, JE.json export)
  video/          # import.rs (folder scanning)
```

## Language

The UI is in French. Component labels, error messages, and tooltips use French text.

## Supported Video Formats

Via mpv/FFmpeg, the app supports common formats:
- **Containers**: MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV
- **Codecs**: H.264, H.265/HEVC, VP8, VP9, AV1

## Important Notes

- **libmpv-2.dll location**: In development, place in project root. In production, bundled via `resources/windows/libmpv-2.dll` (managed by Git LFS).
- **Video player muted by default**: First playback starts muted to avoid startling users.
- **Fullscreen overlay window**: Created at app startup (hidden, transparent) to avoid WebView creation deadlocks in sync Tauri commands on Windows. Positioned via `sync_overlay_with_child()` helper using Win32 API.
- **Auto-save**: Configurable interval in settings. Projects marked dirty when scores change, auto-saved to their existing file path.
- **WM_CLOSE handling**: The mpv window intercepts WM_CLOSE to hide instead of destroy, preventing accidental destruction when the user closes the detached window.
- **Window validity**: All Win32 operations in `mpv_window.rs` check `IsWindow()` before proceeding, guarding against stale HWND references.
