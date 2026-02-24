# AMV Notation
![Version](https://img.shields.io/badge/version-v0.5.0-2563eb)

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
- Preview FFmpeg avec cache LRU intégré
- Capture d'écran du lecteur

### Miniatures vidéo

- Miniatures (thumbnails) des clips dans la liste de clips
- Frame de miniature personnalisable par clip (Ctrl+Shift+M)
- Chargement asynchrone avec file d'attente concurrente
- Activation/désactivation via raccourci (Ctrl+M) ou paramètres
- Frame par défaut configurable dans les paramètres

### Notation

- 3 modes de notation: **Tableur**, **Notes** et **Dual** (vue combinée)
- Barèmes personnalisables (catégories, critères, coefficients, couleurs par catégorie)
- Éditeur de barème avec options déroulantes et Color Swatch Picker personnalisé
- Notes par critère avec commentaires textuels
- Notes par catégorie et notes globales
- Notes par critère et par catégorie pour les juges importés (JE.json)
- Système de timecodes dans les notes (détection automatique, chips cliquables, seek instantané)
- Fenêtre de notes détachée (multi-écran) synchronisée en temps réel
- Annuler (Undo) sur les notes
- Saisie numérique validée avec bornes (min/max/step)

### Résultats et exports

- Onglet **Résultat** avec vues multiples:
  - **Vue globale par catégorie**: synthèse des résultats par catégorie
  - **Vue globale détaillée**: résultats critère par critère
  - **Vue globale juge couleur**: visualisation colorée par juge
  - **Vue par juge**: résultats individuels de chaque juge
  - **Top lists**: classements automatiques
  - Contrôles de changement de vue intégrés
- Import de notations de juges externes (`JE.json`)
- Menu contextuel dans les résultats (actions par clip)
- Onglet **Export**: exports multiples
  - **Exporter projet (JSON)**: projet complet (clips, notes, config)
  - **Exporter notation (JE.json)**: uniquement les notes du juge pour partage
  - Export en **PNG** et **PDF** du tableau des résultats

### Gestion de projet

- Création de projets avec assistant
- Sauvegarde/ouverture de projets (`.json`)
- Projets récents avec session persistante
- Import de clips vidéo depuis un dossier
- Import de clips avec parsing intelligent des noms (tokens, ordre)
- Sauvegarde automatique configurable
- Indicateur de progression

### Interface

- Menu contextuel (clic droit) avec actions rapides
- Raccourcis clavier entièrement personnalisables (30+ actions configurables)
- Gestion améliorée du clavier via `event.code` (compatibilité layouts)
- Zoom de l'interface (Ctrl+=/Ctrl+-/Ctrl+0)
- Thème sombre moderne
- Throttle de navigation entre clips (anti-spam)

### Performance

- Cache LRU pour les previews vidéo (240 entrées) et media info (96 entrées)
- Processus ffmpeg/ffprobe optimisés (threads limités, fenêtre console masquée)
- ffmpeg, ffprobe et libmpv-2.dll bundlés dans l'installeur
- File d'attente concurrente pour le chargement des miniatures
- Architecture modulaire (composants décomposés, hooks dédiés)

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.60
- `libmpv-2.dll` à la racine du projet (sinon l'app démarre sans lecture vidéo)

### Installation de `libmpv-2.dll`

1. Télécharger `libmpv-2.dll`:
   [libmpv-2.dll](https://drive.google.com/file/d/1N9cjXoVZ0kdbPBiYO4hL9DEYJ0IxKBDy/view?usp=sharing)
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
| Activer miniatures | `Ctrl+M` |
| Définir frame miniature | `Ctrl+Shift+M` |
| Capture d'écran globale | `Ctrl+Shift+G` |
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
    layout/             AppLayout, AppMainContent, AppFloatingLayers,
                        Header, ContextMenu, BaremeSelector,
                        NotationModeSwitcher, NotationTabContent,
                        WelcomeScreen
      hooks/            Hooks layout
    player/             VideoPlayer, PlayerControls, PlayerMainControls,
                        PlayerSeekBar, FloatingVideoPlayer,
                        FullscreenOverlay, AudioDbMeter, MediaInfoPanel
      floating/         Composants lecteur flottant
      hooks/            Hooks lecteur
      mediaInfo/        Composants panneau MediaInfo
      overlay/          Composants overlay plein écran
    interfaces/         SpreadsheetInterface, ModernInterface,
                        NotationInterface, ResultatsInterface,
                        ExportInterface, InterfaceSwitcher
      spreadsheet/      Sous-composants tableur + hooks
      modern/           Sous-composants vue moderne
      notation/         Sous-composants vue notes
      resultats/        Vues résultats (Global, Détaillé, Juge,
                        TopLists, ContextMenus) + hooks
      export/           Sous-composants export
    notes/              DetachedNotesWindow, DetachedNotesHeader,
                        DetachedFramePreview, TimecodeInlineText
      detached/         Sous-composants fenêtre détachée
    project/            ProjectManager, CreateProjectModal, VideoList
                        useProjectFileActions, useProjectMenuActions,
                        useProjectVideoActions
    settings/           SettingsPanel, SettingsGeneralTab,
                        SettingsNotationTab, SettingsShortcutsTab
    scoring/            BaremeEditor, baremeEditorUtils
      bareme/           Sous-composants éditeur de barème
    ui/                 ColorSwatchPicker
  store/                usePlayerStore, useProjectStore, useNotationStore,
                        useUIStore
                        + actions modulaires (bareme, notes, clips, etc.)
  hooks/                usePlayer, useAutoSave, useKeyboardShortcuts,
                        useSaveProject
  services/             tauri.ts, projectSession, recentProjects
    tauri_api/          API Tauri modulaire (player, windows)
  types/                Types TypeScript (project, player, notation, bareme)
  schemas/              Schémas Zod
  utils/                scoring, formatters, shortcuts, timecodes, results,
                        colors, screenshot, clipImport, clipImportTokens,
                        clipOrder, manualClipParser, numberInput,
                        colorPickerStorage, framePreviewPosition, path

src-tauri/src/          Backend Rust
  main.rs               setup Tauri + init mpv + création overlay
  state.rs              AppState
  app_windows.rs        Gestion fenêtres applicatives
  player/
    bootstrap.rs        Initialisation mpv
    commands/           Commandes Tauri modulaires (cache, control,
                        media, overlay, parsing, probe_media)
    mpv_ffi.rs          Bindings FFI mpv
    mpv_wrapper.rs      Wrapper haut niveau mpv
    mpv_wrapper_media.rs    Media info
    mpv_wrapper_properties.rs  Propriétés mpv
    mpv_probe/          Probe media (ffprobe, mediainfo)
    mpv_window.rs       Gestion fenêtre mpv
    mpv_window_geometry.rs  Géométrie fenêtre
    mpv_window_mode.rs  Modes fenêtre (PiP, fullscreen)
    mpv_window_state.rs État fenêtre
    mpv_win32.rs        Intégration Win32
    mpv_types.rs        Types mpv
  project/
    manager/            Gestion projet modulaire
  video/                Scan de dossiers vidéos
```

## Formats vidéo supportés

Formats usuels via mpv/FFmpeg: MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV.
Codecs usuels: H.264, H.265/HEVC, VP8, VP9, AV1.
