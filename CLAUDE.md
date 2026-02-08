# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
  - `useProjectStore` - Project data, clips array, currentClipIndex, dirty flag, navigation (nextClip/previousClip)
  - `usePlayerStore` - Playback state synced from mpv via 250ms polling (isPlaying, currentTime, duration, volume, tracks)
  - `useNotationStore` - Scores (`notes: Record<clipId, Note>`), barème, validation. `updateCriterion()` validates + recalculates
  - `useUIStore` - Interface mode (`spreadsheet | modern | notation`), sidebar state, modal flags

- **3 scoring interfaces** read/write the same stores - switching is seamless:
  - Spreadsheet (table with keyboard nav)
  - Modern (cards, sliders, ScoreRing SVG)
  - Notation (compact panel alongside fullscreen video)

- **services/tauri.ts** - Typed wrappers around all `invoke()` calls. Always go through this module, never call `invoke()` directly from components.

- **Path alias**: `@/` maps to `./src/` (configured in tsconfig + vite)

### Backend (src-tauri/src/)

- **player/** - mpv integration via dynamic loading (`libloading` crate)
  - `mpv_ffi.rs` - Raw FFI: loads DLL at runtime, stores function pointers. Searches CWD, exe ancestors, and system PATH.
  - `mpv_wrapper.rs` - High-level API: `new(wid: Option<i64>)`, load_file, play, pause, seek, get/set properties. `wid` parameter embeds mpv into a Win32 child window.
  - `mpv_window.rs` - Win32 child window (WS_CHILD) for mpv rendering. Creates a black-background window parented to the Tauri main window. Handles WM_MOUSEACTIVATE to prevent focus stealing.
  - `commands.rs` - Tauri command handlers (19 commands registered in main.rs)

- **project/manager.rs** - Save/load `.json` project files via `serde_json::Value`

- **video/import.rs** - Scan folders for video files using `walkdir` (depth 1)

- **state.rs** - `AppState` with `Mutex<Option<MpvPlayer>>` and `Mutex<Option<MpvChildWindow>>`. Both are Option because mpv may not be available. Initialized as None, populated in the `.setup()` hook.

- **main.rs** - Uses `.setup()` hook to: get Tauri window HWND, create MpvChildWindow, create MpvPlayer with `wid` for embedded rendering.

## Key Patterns

### mpv Embedded Rendering (critical)
mpv renders into a Win32 child window overlaid on the webview. The frontend tracks the video container's position via `ResizeObserver` + `getBoundingClientRect()` and sends geometry updates (DPI-scaled) to the backend via `player_set_geometry`. The child window is shown/hidden as the VideoPlayer component mounts/unmounts.

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
`tauri.conf.json` has `"resources": []`. Use empty array when no bundled resources - glob patterns like `resources/**/*` fail if nothing matches.

### Rust Modules
Use `#![allow(dead_code)]` at top of FFI/future-use modules to suppress warnings.

## File Layout

```
src/
  types/          # TypeScript interfaces (project, bareme, notation, player)
  schemas/        # Zod validation schemas
  store/          # 4 Zustand stores
  services/       # tauri.ts - all Tauri invoke wrappers
  hooks/          # usePlayer, useAutoSave, useKeyboardShortcuts
  utils/          # scoring.ts (calculate/validate), formatters.ts, recentProjects.ts
  components/
    layout/       # AppLayout (WelcomeScreen + layouts), Header, Sidebar
    player/       # VideoPlayer (mpv embed), PlayerControls, SubtitleSelector, AudioTrackSelector
    interfaces/   # SpreadsheetInterface, ModernInterface, NotationInterface, InterfaceSwitcher
    project/      # ProjectManager (dropdown menu), CreateProjectModal, VideoList, ProgressIndicator
    settings/     # SettingsPanel (3 tabs: General, Notation, Lecteur)
    scoring/      # BaremeEditor (create/edit custom baremes)

src-tauri/src/
  main.rs         # Entry point, .setup() hook for mpv init, registers 19 commands
  state.rs        # AppState (player + child_window, both Mutex<Option<...>>)
  player/         # mpv_ffi.rs, mpv_wrapper.rs, mpv_window.rs, commands.rs
  project/        # manager.rs (save/load .json project files)
  video/          # import.rs (folder scanning)
```

## Language

The UI is in French. Component labels, error messages, and tooltips use French text.
