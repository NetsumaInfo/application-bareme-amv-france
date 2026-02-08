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
  - `mpv_ffi.rs` - Raw FFI: loads DLL at runtime, stores function pointers
  - `mpv_wrapper.rs` - High-level API: load_file, play, pause, seek, get/set properties
  - `commands.rs` - Tauri command handlers (16 commands registered in main.rs)

- **project/manager.rs** - Save/load `.json` project files via `serde_json::Value`

- **video/import.rs** - Scan folders for video files using `walkdir` (depth 1)

- **state.rs** - `AppState` with `Mutex<Option<MpvPlayer>>`. Player is Option because mpv may not be available.

## Key Patterns

### mpv Dynamic Loading (critical)
`libloading` loads mpv DLL at runtime - no compile-time dependency. In `mpv_ffi.rs`, `Symbol` borrows from `Library`, so you must dereference to raw fn pointers *before* moving Library into the struct:
```rust
let create_ptr = *lib.get::<unsafe fn() -> MpvHandle>(b"mpv_create\0")?;
// ... then move lib into struct, store raw fn pointers separately
```

### TypeScript Strictness
`tsconfig.app.json` has `noUnusedLocals` and `noUnusedParameters` enabled. Prefix unused params with `_`.

### Scoring Flow
User input → `useNotationStore.updateCriterion()` → `validateCriterionValue()` → `calculateScore()` → updates `notes[clipId]` → marks project dirty → auto-save triggers.

### Clip Naming Convention
Video filenames are parsed with `parseClipName()` in `utils/formatters.ts`:
- `pseudo-nom_du_clip.mp4` → author: "pseudo", displayName: "nom du clip"
- `nom_du_clip.mp4` → displayName: "nom du clip" (no author)
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
  utils/          # scoring.ts (calculate/validate), formatters.ts
  components/
    layout/       # AppLayout, Header, Sidebar
    player/       # VideoPlayer, PlayerControls, SubtitleSelector, AudioTrackSelector
    interfaces/   # SpreadsheetInterface, ModernInterface, NotationInterface, InterfaceSwitcher
    project/      # ProjectManager, CreateProjectModal, VideoList, ProgressIndicator
    settings/     # SettingsPanel
    scoring/      # BaremeEditor (create/edit custom barèmes)

src-tauri/src/
  main.rs         # Entry point, registers 16 commands
  state.rs        # AppState (Mutex<Option<MpvPlayer>>)
  player/         # mpv_ffi.rs, mpv_wrapper.rs, commands.rs
  project/        # manager.rs (save/load .json project files)
  video/          # import.rs (folder scanning)
```

## Language

The UI is in French. Component labels, error messages, and tooltips use French text.
