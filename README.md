# AMV Notation
![Version](https://img.shields.io/badge/version-v0.3-2563eb)

Application desktop de notation pour concours AMV (Anime Music Video).

## Stack technique

- **Desktop**: Tauri v1 (Rust + WebView)
- **Frontend**: React 19, TypeScript, Tailwind CSS 3, Zustand 5, Zod 4
- **Lecture vidéo**: mpv/libmpv via FFI dynamique (`libloading`)
- **Plateforme**: Windows

## Fonctionnalités

### Lecteur vidéo

- Lecture vidéo intégrée (mpv embarqué via fenêtre Win32)
- Plein écran vidéo avec overlay de contrôle auto-masquable
- Mode Picture-in-Picture (PiP) avec lecteur flottant redimensionnable
- Avance/retour image par image
- Sélecteur de piste audio (multi-pistes)
- Sélecteur de sous-titres
- VU-mètre audio temps réel (niveaux dB gauche/droite)
- Panneau MediaInfo détaillé (résolution, codec, FPS, bitrate, espace colorimétrique, etc.)
- Capture d'écran du lecteur

### Notation

- 2 vues de notation interchangeables: **Tableur** et **Notes**
- Barèmes personnalisables (catégories, critères, coefficients, couleurs par catégorie)
- Notes par critère avec commentaires textuels
- Notes par catégorie et notes globales
- Système de timecodes dans les notes (détection automatique, chips cliquables, seek instantané)
- Fenêtre de notes détachée (multi-écran) synchronisée en temps réel
- Annuler (Undo) sur les notes

### Résultats et exports

- Onglet **Résultat**: tableau récapitulatif par clip et par juge
- Import de notations de juges externes (`JE.json`)
- Onglet **Export**: exports multiples
  - **Exporter projet (JSON)**: projet complet (clips, notes, config)
  - **Exporter notation (JE.json)**: uniquement les notes du juge pour partage
  - Export en **PNG** et **PDF** du tableau des résultats

### Gestion de projet

- Création de projets avec assistant
- Sauvegarde/ouverture de projets (`.json`)
- Projets récents
- Import de clips vidéo depuis un dossier
- Sauvegarde automatique configurable
- Indicateur de progression

### Interface

- Menu contextuel (clic droit) avec actions rapides
- Raccourcis clavier entièrement personnalisables (28 actions configurables)
- Zoom de l'interface (Ctrl+=/Ctrl+-/Ctrl+0)
- Thème sombre moderne

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.60
- `libmpv-2.dll` à la racine du projet (sinon l'app démarre sans lecture vidéo)

### Installation de `libmpv-2.dll`

1. Télécharger `libmpv-2.dll`:
   [libmpv-2.dll](https://cdn.discordapp.com/attachments/1227985261682757735/1470540545041502238/libmpv-2.dll?ex=698bab1b&is=698a599b&hm=7c60b7be993d6873c34c12cbaf2e1548b5ba33c45256cb4d2ebc2c0eba942206&)
2. Copier le fichier dans le dossier racine du projet:
   `s:\projet_app\app bareme amv\libmpv-2.dll`

## Installation

```bash
npm install
```

## Développement

```bash
# Vite + Tauri
npm run tauri dev

# Frontend seul (sans backend Rust)
npm run dev

# Lint
npm run lint

# Vérification Rust
cd src-tauri
cargo check
```

## Build

```bash
# Frontend (tsc + vite)
npm run build

# App desktop complète
npm run tauri build
```

## Raccourcis clavier

| Action | Raccourci par défaut |
|--------|---------------------|
| Lecture / Pause | `Espace` |
| Reculer 5s | `←` |
| Avancer 5s | `→` |
| Reculer 30s | `Shift+←` |
| Avancer 30s | `Shift+→` |
| Image suivante | `.` |
| Image précédente | `,` |
| Clip suivant | `N` |
| Clip précédent | `P` |
| Plein écran | `F11` |
| Quitter plein écran | `Échap` |
| Sauvegarder | `Ctrl+S` |
| Sauvegarder sous | `Ctrl+Alt+S` |
| Nouveau projet | `Ctrl+N` |
| Ouvrir un projet | `Ctrl+O` |
| Onglet Notation | `Ctrl+1` |
| Onglet Résultat | `Ctrl+2` |
| Onglet Export | `Ctrl+3` |
| Zoom + / - / Reset | `Ctrl+=` / `Ctrl+-` / `Ctrl+0` |
| Annuler (Undo) | `Ctrl+Z` |
| Capture d'écran | `Ctrl+Shift+S` |
| Insérer timecode | `Ctrl+T` |
| Navigation champs notes | `Ctrl+Flèches` |

Tous les raccourcis sont personnalisables dans les paramètres.

## Dépannage rapide

- **Pas de vidéo**: vérifier que `libmpv-2.dll` est présent à la racine.
- **Comportement plein écran incohérent après update Rust**: fermer totalement l'app puis relancer `npm run tauri dev`.
- **Commandes non prises en compte**: vérifier que la fenêtre overlay est bien au premier plan en plein écran.

## Architecture

```text
src/                    Frontend React
  components/
    layout/             AppLayout, Header, Sidebar, ContextMenu
    player/             VideoPlayer, PlayerControls, FloatingVideoPlayer,
                        FullscreenOverlay, AudioDbMeter, MediaInfoPanel,
                        AudioTrackSelector, SubtitleSelector
    interfaces/         SpreadsheetInterface, ModernInterface, NotationInterface,
                        ResultatsInterface, ExportInterface, InterfaceSwitcher
    notes/              DetachedNotesWindow, TimecodeChipList, TimecodeTextarea,
                        InlineTimecodeText
    project/            ProjectManager, CreateProjectModal, VideoList,
                        ProgressIndicator
    settings/           SettingsPanel
    scoring/            BaremeEditor
  store/                usePlayerStore, useProjectStore, useNotationStore, useUIStore
  hooks/                usePlayer, useAutoSave, useKeyboardShortcuts, useSaveProject
  services/             tauri.ts (wrappers invoke)
  types/                Types TypeScript (project, player, notation, bareme)
  schemas/              Schémas Zod
  utils/                scoring, formatters, shortcuts, timecodes, results, colors

src-tauri/src/          Backend Rust
  main.rs               setup Tauri + init mpv + création overlay
  state.rs              AppState
  player/               mpv_ffi, mpv_wrapper, mpv_window, commands
  project/              save/load/export JSON
  video/                scan de dossiers vidéos
```

## Formats vidéo supportés

Formats usuels via mpv/FFmpeg: MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV.
Codecs usuels: H.264, H.265/HEVC, VP8, VP9, AV1.
