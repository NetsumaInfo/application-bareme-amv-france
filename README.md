# AMV Notation
![Version](https://img.shields.io/badge/version-v0.2.1-2563eb)

Application desktop de notation pour concours AMV (Anime Music Video).

## Stack technique

- **Desktop**: Tauri v1 (Rust + WebView)
- **Frontend**: React 19, TypeScript, Tailwind CSS 3, Zustand 5, Zod 4
- **Lecture vidéo**: mpv/libmpv via FFI dynamique (`libloading`)
- **Plateforme**: Windows

## Fonctionnalités

- Lecture vidéo intégrée (mpv embarqué via fenêtre Win32)
- Plein écran vidéo avec overlay de contrôle
- 3 interfaces de notation: **Tableur**, **Moderne**, **Notation**
- Onglets dédiés: **Résultat** et **Export**
- Barèmes personnalisables (catégories, critères, coefficients)
- Projets JSON (création, sauvegarde, ouverture, récents)
- Import de clips depuis un dossier
- Import de notation juge (`JE.json`) dans l'onglet Résultat
- Exports distincts:
  - **Exporter projet (JSON)**: projet complet (clips, notes, config)
  - **Exporter notation (JE.json)**: uniquement les notes du juge pour partage/intégration
- Sauvegarde automatique configurable

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

## Raccourcis clavier (lecteur)

- `Espace`: lecture/pause
- `←` / `→`: reculer/avancer de 5s
- `Shift+←` / `Shift+→`: reculer/avancer de 30s
- `N` / `P`: clip suivant / précédent
- `F11`: bascule plein écran
- `Esc`: quitter le plein écran

## Plein écran et overlay

- En mode plein écran, l'app utilise une fenêtre overlay dédiée au-dessus du rendu mpv.
- Les contrôles (play/pause, seek, volume, navigation clip, quitter plein écran) apparaissent au mouvement de souris puis se masquent après inactivité.
- Le bouton quitter et `Esc` déclenchent une sortie explicite du plein écran (pas un toggle ambigu).

## Dépannage rapide

- **Pas de vidéo**: vérifier que `libmpv-2.dll` est présent à la racine.
- **Comportement plein écran incohérent après update Rust**: fermer totalement l'app puis relancer `npm run tauri dev`.
- **Commandes non prises en compte**: vérifier que la fenêtre overlay est bien au premier plan en plein écran.

## Architecture (résumé)

```text
src/                    Frontend React
  components/
    layout/             AppLayout, Header, Sidebar
    player/             VideoPlayer, PlayerControls, FloatingVideoPlayer, FullscreenOverlay
    interfaces/         SpreadsheetInterface, ModernInterface, NotationInterface, ResultatsInterface, ExportInterface
    project/            ProjectManager, CreateProjectModal, VideoList
    settings/           SettingsPanel
    scoring/            BaremeEditor
  store/                Zustand stores
  hooks/                usePlayer, useAutoSave, useKeyboardShortcuts
  services/             tauri.ts (wrappers invoke)
  types/                Types TypeScript
  schemas/              Schémas Zod
  utils/                Helpers (formatage, score, etc.)

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
