# Product

## Register

product

## Users

Judges of AMV (Anime Music Video) competitions. They run the app on Windows desktops, often in dark rooms during screening sessions, watching clips while scoring them. Keyboard-heavy workflow (play/pause, seek, next clip, insert timecode). Multiple judges may exchange project/barème JSON files.

## Product Purpose

Desktop tool (Tauri v2 + React) to score AMV contest entries against configurable barèmes (scoring grids), take timecoded notes, aggregate per-judge results, and export results (XLSX, PDF, Discord announcements, posters). Success = a judge can score a full contest without leaving the keyboard and without losing data.

## Brand Personality

Focused, calm, professional. A precision tool for enthusiasts — quiet competence, not spectacle. The video is the hero; the UI stays out of the way.

## Anti-references

- Flashy SaaS dashboards (gradient heroes, metric-card grids, decorative glows).
- Consumer video apps with oversized chrome that competes with the video.
- Anything that interrupts playback or steals focus while judging.

## Design Principles

- Keyboard-first: every frequent action has a shortcut; the mouse is optional.
- The video is the hero: dark surfaces, restrained accents, no UI competing with playback.
- Never lose a judge's work: auto-save, undo, confirmation only for destructive acts.
- Multi-window coherence: detached notes/overlay windows mirror theme, language, state.
- Degrade gracefully: missing mpv/ffmpeg lowers capability, never crashes.

## Accessibility & Inclusion

- Source language French; runtime FR/EN/JA/RU/ZH/ES — all visible strings via i18n.
- Dark theme default plus light themes; selection/focus states must stay visible in both.
- Tooltips + aria-labels on icon-only buttons; ARIA combobox/listbox patterns where used.
- Respect typing context: shortcuts suspended in inputs unless explicitly global.
