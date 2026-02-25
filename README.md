# AMV Notation
![Version](https://img.shields.io/badge/version-v0.5.0-2563eb)

Application desktop de notation pour concours AMV (Anime Music Video), développée avec **Tauri + React + Rust**.

## Aperçu

AMV Notation permet de :

- gérer des projets de notation,
- importer des clips vidéo,
- noter selon un barème personnalisable,
- agréger des notations de plusieurs juges,
- exporter les résultats.

L’application est conçue pour une utilisation fluide en jury, avec lecteur vidéo intégré (mpv), raccourcis clavier et autosave.

## Stack technique

- **Desktop** : Tauri v1 (Rust + WebView)
- **Frontend** : React 19, TypeScript, Tailwind CSS, Zustand, Zod
- **Backend** : Rust
- **Lecture vidéo** : mpv/libmpv chargé dynamiquement via FFI (`libloading`)
- **Plateforme cible** : Windows

## Fonctionnalités principales

### Interfaces

L’application propose 5 interfaces qui partagent le même état global (Zustand) :

- **Spreadsheet** (tableur)
- **Modern** (cartes)
- **Notation**
- **Resultats**
- **Export**

### Lecture vidéo

- Lecteur mpv embarqué dans une fenêtre Win32 superposée au WebView
- Fenêtre vidéo attachable/détachable
- Plein écran avec overlay de contrôle
- Pistes audio et sous-titres sélectionnables
- Synchronisation de l’état du player côté frontend (polling)

### Notation

- Barèmes personnalisables (catégories, critères, coefficients)
- Notes par clip / critère avec recalcul automatique
- Validation de saisie
- Projet marqué “dirty” puis sauvegardé automatiquement selon configuration

### Résultats & exports

- Agrégation des résultats multi-juges
- Import de notations externes au format **JE.json**
- Export de la notation juge en **JE.json**
- Export des résultats en **PDF/PNG**

### Gestion de projet

- Création, ouverture, sauvegarde de projets JSON
- Autosave dans le dossier Documents utilisateur
- Import vidéo par dossier ou sélection multi-fichiers

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.60
- `libmpv-2.dll` à la racine du projet en développement

> Sans `libmpv-2.dll`, l’application démarre mais les fonctionnalités vidéo ne sont pas disponibles.

### Installation de `libmpv-2.dll`

1. Télécharger `libmpv-2.dll` :
   [libmpv-2.dll](https://drive.google.com/file/d/1N9cjXoVZ0kdbPBiYO4hL9DEYJ0IxKBDy/view?usp=sharing)
2. Copier le fichier dans le dossier racine du projet.

> En production, le DLL est embarqué dans l’installeur via les ressources Tauri.

## Installation

```bash
npm install
```

## Développement

```bash
# Vite + Tauri
npm run tauri dev

# Frontend seul
npm run dev

# Lint
npm run lint

# Vérification backend Rust
cd src-tauri && cargo check
```

## Build

```bash
# Frontend (TypeScript + Vite)
npm run build

# Application desktop complète
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

## Dépannage rapide

- **Pas de vidéo** : vérifier `libmpv-2.dll` à la racine.
- **Fenêtre vidéo incohérente** : relancer complètement l’application.
- **Comportement overlay plein écran** : vérifier que l’app est au premier plan.

## Formats vidéo supportés

Via mpv/FFmpeg : MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV (et codecs usuels H.264/H.265/VP8/VP9/AV1).
