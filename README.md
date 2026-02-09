# AMV Notation

Application desktop de notation pour les concours AMV (Anime Music Video).

## Stack technique

- **Desktop** : Tauri v1 (Rust backend + WebView frontend)
- **Frontend** : React 19, TypeScript, Tailwind CSS 3, Zustand 5, Zod 4
- **Video** : mpv/libmpv via FFI dynamique (`libloading`) - tous codecs FFmpeg
- **Plateforme** : Windows

## Fonctionnalites

- Lecture video integree (mpv embarque dans l'interface via Win32 child window)
- 3 interfaces de notation interchangeables (Tableur, Moderne, Notation)
- Systeme de baremes personnalisables (criteres, poids, categories)
- Gestion de projets (creation, sauvegarde `.json`, ouverture, projets recents)
- Import de videos depuis un dossier
- Export JSON des resultats
- Sauvegarde automatique configurable
- Raccourcis clavier (Espace, fleches, N/P, Ctrl+1/2/3)

## Prerequis

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.60

### Installation de libmpv (lecture video)

1. Telecharger l'archive mpv : [mpv-dev-x86_64-v3-20260201-git-40d2947.7z](https://cdn.discordapp.com/attachments/1227985261682757735/1470490938496389272/mpv-dev-x86_64-v3-20260201-git-40d2947.7z?ex=698b7ce8&is=698a2b68&hm=0f5edc1d114e1264bc881c6a4d70798ab44bbeab7a71ed39ee721df8c71127e4&)
2. Extraire l'archive avec 7-Zip
3. Copier le fichier `libmpv-2.dll` a la racine du projet (au meme niveau que `package.json`)

## Installation

```bash
npm install
```

## Developpement

```bash
# Lance Vite + Tauri ensemble
npm run tauri dev

# Frontend seul (sans backend Rust)
npm run dev
```

## Build production

```bash
# Frontend uniquement (TypeScript check + Vite build)
npm run build

# Application desktop complete
npm run tauri build
```

## Structure du projet

```
src/                    # Frontend React
  components/
    layout/             # AppLayout, Header, Sidebar
    player/             # VideoPlayer, PlayerControls
    interfaces/         # SpreadsheetInterface, ModernInterface, NotationInterface
    project/            # ProjectManager, CreateProjectModal, VideoList
    settings/           # SettingsPanel (3 onglets)
    scoring/            # BaremeEditor
  store/                # 4 stores Zustand
  hooks/                # usePlayer, useAutoSave, useKeyboardShortcuts
  services/             # tauri.ts (wrappers invoke)
  types/                # Interfaces TypeScript
  schemas/              # Schemas Zod
  utils/                # scoring.ts, formatters.ts

src-tauri/src/          # Backend Rust
  main.rs               # Point d'entree, setup hook, 19 commandes
  state.rs              # AppState (player + child_window)
  player/               # mpv_ffi, mpv_wrapper, mpv_window, commands
  project/              # manager.rs (save/load .json)
  video/                # import.rs (scan dossiers)
```

## Formats video supportes

Via mpv/FFmpeg : MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV
Codecs : H.264, H.265/HEVC, VP8, VP9, AV1
