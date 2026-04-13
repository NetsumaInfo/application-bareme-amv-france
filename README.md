# AMV Notation

![Version](https://img.shields.io/badge/version-v0.8.0-2563eb)
![Tauri](https://img.shields.io/badge/Tauri-v1-24c8db)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Rust](https://img.shields.io/badge/Rust-2021-b7410e)

Application desktop Windows-first pour noter des concours AMV, gérer les barèmes, lire les vidéos avec mpv, agréger les notes de plusieurs juges et exporter des résultats prêts à publier.

## Nouveautés v0.8.0

- Interface Export finalisée et refactorisée : orchestration plus légère, menu contextuel isolé, état poster extrait dans un hook dédié et utilitaires d’export partagés.
- Exports enrichis : affiches créatives, tableaux résultats, PNG/PDF, HTML/CSS, JSON, Excel et PDF des notes.
- Résultats plus complets : vues globales, par juge, top lists, couleurs de juges, notes détaillées et support de fenêtre détachée pour les notes de juges.
- UI consolidée : thèmes, couleur d’accent, i18n 6 langues, raccourcis configurables, miniatures et préférences persistées.
- Métadonnées de release synchronisées en `0.8.0` pour `package.json`, `package-lock.json` et Tauri.

## Stack Technique

- **Desktop** : Tauri v1, Windows-first, intégration Win32 pour la fenêtre vidéo.
- **Frontend** : React 19, TypeScript 5, Vite 7, Tailwind CSS, Zustand, Zod.
- **Backend** : Rust 2021.
- **Vidéo** : mpv chargé dynamiquement via `libmpv-2.dll`, helpers FFmpeg/ffprobe pour les infos média et prévisualisations.
- **i18n** : français source, runtime en français, anglais, japonais, russe, chinois et espagnol.

## Architecture

```text
src/                         Frontend React multi-entry
  main.tsx                   Fenêtre principale
  overlay-entry.tsx          Overlay plein écran
  notes-entry.tsx            Fenêtre notes détachée
  resultats-notes-entry.tsx  Fenêtre notes de juges
  components/                UI, interfaces, player, settings, project
  hooks/                     Raccourcis, autosave, player, sauvegarde
  services/tauri.ts          Point d’accès unique aux commandes Tauri
  store/                     Stores Zustand projet, player, notation, UI
  i18n/                      Provider, seed et locales JSON
  utils/                     Scoring, résultats, thème, raccourcis, imports

src-tauri/src/               Backend Rust
  main.rs                    Wiring Tauri et commandes
  app_windows.rs             Overlay, notes, resultats-notes
  state.rs                   Etat partagé mpv/fenêtre
  player/                    mpv FFI, wrapper, fenêtre Win32, commandes
  project/                   Chargement, sauvegarde, barèmes, settings
  video/                     Scan de dossiers vidéo
```

Le frontend ne doit pas appeler `invoke()` directement depuis les composants. Toute communication Tauri passe par `src/services/tauri.ts` et les modules `src/services/tauri_api/*`.

## Fonctionnalités

- Création, ouverture, sauvegarde et autosave de projets de notation.
- Import de clips vidéo avec convention `pseudo-nom_du_clip.mp4`.
- Workflow sans vidéo : création manuelle de lignes et rattachement vidéo plus tard.
- Barèmes personnalisables avec catégories, critères, coefficients et validation.
- Modes de notation tableur, commentaires, dual avec fenêtre notes détachée.
- Lecteur mpv intégré, détachable, plein écran, pistes audio/sous-titres et démarrage muet.
- Résultats multi-juges avec import/export de notations juge, vues détaillées et top lists.
- Export d’affiches et tableaux avec prévisualisation, calques image, polices, JSON, PDF, PNG, HTML/CSS et Excel.
- Paramètres persistés : thème, couleur, langue, raccourcis, miniatures, autosave et préférences UI.

## Prérequis

- Node.js 18 ou plus récent.
- Rust avec toolchain compatible Tauri v1.
- `libmpv-2.dll` à la racine du projet pour la lecture vidéo en développement.

En production, les ressources Windows sont empaquetées depuis `src-tauri/resources/windows/*`.

## Installation

```bash
npm install
```

Placez `libmpv-2.dll` dans la racine du projet si vous lancez l’application localement avec lecture vidéo.

## Développement

```bash
# Frontend seul
npm run dev

# Application desktop Tauri
npm run tauri dev

# Lint
npm run lint

# Synchronisation des chaînes i18n
npm run i18n:sync

# Rust
cd src-tauri && cargo check
```

Après tout ajout de texte visible dans l’UI, ajoutez la chaîne avec `useI18n().t(...)`, lancez `npm run i18n:sync`, puis relisez les traductions auto-remplies.

## Build

```bash
# Frontend TypeScript + Vite
npm run build

# Desktop complet
npm run tauri build
```

## Tests Et Validation

Les validations de base à exécuter avant publication :

```bash
npm run lint
npm run i18n:sync
npm run build
cd src-tauri && cargo check
npm run tauri build
```

Le build Vite peut signaler un avertissement de chunk supérieur à 500 kB. Ce n’est pas bloquant, mais il indique une piste d’optimisation de code splitting.

## Raccourcis Clavier

| Action | Raccourci |
| --- | --- |
| Onglet Notation | `Ctrl+1` |
| Onglet Résultats | `Ctrl+2` |
| Onglet Export | `Ctrl+3` |
| Sauvegarder | `Ctrl+S` |
| Sauvegarder sous | `Ctrl+Shift+S` |
| Nouveau projet | `Ctrl+N` |
| Ouvrir un projet | `Ctrl+O` |
| Plein écran vidéo | `F11` |
| Quitter le plein écran | `Escape` |
| Lecture / pause | `Space` |
| Reculer / avancer 5 s | `Left` / `Right` |
| Reculer / avancer 30 s | `Shift+Left` / `Shift+Right` |
| Clip précédent / suivant | `P` / `N` |
| Image précédente / suivante | `,` / `.` |
| Capture vidéo | `Ctrl+Shift+G` |
| Insérer un timecode | `Ctrl+T` |
| Activer les miniatures | `Ctrl+M` |
| Définir la frame miniature | `Ctrl+Shift+M` |

Les raccourcis sont configurables et persistés dans les réglages utilisateur.

## Structure Du Projet

- `src/components/interfaces/spreadsheet/` : tableur, workflow sans vidéo et contrôleurs.
- `src/components/interfaces/notation/` : vue notation/commentaires.
- `src/components/interfaces/resultats/` : agrégation, tables, notes de juges et bridge fenêtre détachée.
- `src/components/interfaces/export/` : options, prévisualisations, exports poster/tableau et hooks associés.
- `src/components/player/` : player intégré, overlay, fenêtre flottante, média info.
- `src/components/layout/` : shell, bootstrap, header, ponts de fenêtres et raccourcis.
- `src/store/` : stores Zustand et actions projet/notation.
- `src-tauri/src/player/` : mpv, Win32, commandes Tauri et probing média.
- `src-tauri/src/project/` : projets, barèmes, settings, JSON et chemins.

## Standards De Contribution

- Garder les composants et hooks focalisés, typés et cohérents avec l’architecture existante.
- Ne pas appeler Tauri directement depuis les composants : passer par `src/services/tauri.ts`.
- Préserver les chemins dégradés quand mpv, ffmpeg ou ffprobe sont absents.
- Ne pas réintroduire l’ancienne UI `modern` sans plan global.
- Ne pas ajouter d’import CSV/TSV/XLSX dans l’écran d’accueil par défaut.
- Préserver le workflow sans vidéo et la logique d’undo `clip supprimé` avant `undo notation`.
- Pour les fenêtres notes et notes de résultats, mettre à jour les deux côtés du bridge événementiel.

Voir aussi [AGENTS.md](./AGENTS.md) et [CLAUDE.md](./CLAUDE.md) pour les règles d’architecture détaillées.

## Formats Vidéo

Via mpv/FFmpeg : MP4, MKV, AVI, MOV, WebM, FLV, M4V, AMV, avec codecs usuels H.264, H.265/HEVC, VP8, VP9 et AV1.

## Licence

Licence non précisée dans le dépôt.
