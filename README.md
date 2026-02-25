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

## Raccourcis clavier (principaux)

- `Ctrl+S` : sauvegarder
- `Ctrl+N` : nouveau projet
- `Ctrl+O` : ouvrir un projet
- `Ctrl+1 / Ctrl+2 / Ctrl+3` : changer d’interface
- `F11` : basculer le plein écran vidéo
- `Espace` : lecture / pause
- `← / →` : seek -5s / +5s
- `Shift+← / Shift+→` : seek -30s / +30s
- `N / P` : clip suivant / précédent

## Architecture (résumé)

```text
src/
  components/    Interfaces, lecteur, layout, projet, settings, scoring
  store/         useProjectStore, usePlayerStore, useNotationStore, useUIStore
  services/      tauri.ts (wrappers invoke)
  hooks/         usePlayer, useAutoSave, useKeyboardShortcuts, useSaveProject
  utils/         scoring, formatters, results, shortcuts, etc.

src-tauri/src/
  main.rs        setup Tauri + init mpv/fenêtres
  state.rs       AppState (player + child window)
  player/        mpv_ffi, mpv_wrapper, mpv_window, commands
  project/       manager (save/load projets + JE.json)
  video/         import (scan de dossiers)
```

## Dépannage rapide

- **Pas de vidéo** : vérifier `libmpv-2.dll` à la racine.
- **Fenêtre vidéo incohérente** : relancer complètement l’application.
- **Comportement overlay plein écran** : vérifier que l’app est au premier plan.

## Formats vidéo supportés

Via mpv/FFmpeg : MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV (et codecs usuels H.264/H.265/VP8/VP9/AV1).
