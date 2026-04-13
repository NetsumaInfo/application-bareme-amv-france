# AMV Notation v0.8.0

## Nouveautés

- Export finalisé : l’onglet Export couvre maintenant l’affiche créative et les tableaux de résultats dans une interface unifiée.
- Affiches créatives : blocs texte personnalisables, top généré depuis le classement, choix des polices, fond couleur/thème, image de fond, calques image, zoom d’aperçu et export PNG/PDF.
- Exports de résultats : PNG, PDF, HTML/CSS, Excel, JSON complet, JSON par juge et PDF des notes.
- Résultats : vues globales détaillées, par catégorie, par juge et top lists avec couleurs par juge.
- Notes de juges : support des notes générales, notes par catégorie, notes par critère et fenêtre détachée dédiée côté Résultats.
- Interface : thèmes, couleur d’accent, préférences persistées, raccourcis configurables et i18n synchronisée pour français, anglais, japonais, russe, chinois et espagnol.
- Packaging : icônes Windows/macOS rafraîchies et métadonnées d’application passées en `0.8.0`.

## Améliorations Techniques

- `ExportInterface.tsx` a été refactorisé : menu contextuel extrait, switcher d’export isolé, logique poster déplacée dans `useExportPosterState`, utilitaires d’export regroupés.
- La logique d’export tableur est isolée dans des modules dédiés pour la génération de feuilles et de workbook.
- Les chaînes i18n ajoutées pendant le refactor ont été resynchronisées.
- Le README a été reconstruit pour documenter correctement l’architecture, les prérequis, les commandes, les validations et les règles de contribution.

## Correctifs

- Réduction du fichier `ExportInterface.tsx` de 1568 à environ 800 lignes.
- Suppression de dépendances implicites dans l’export poster après extraction.
- Correction des messages de chargement des polices système pour passer par le système i18n.
- Synchronisation de la version entre `package.json`, `package-lock.json` et `src-tauri/tauri.conf.json`.

## Validation

- `npm run lint`
- `npm run i18n:sync`
- `npx -y react-doctor@latest . --verbose --yes --no-dead-code`
- `npm run build`
- `npm run tauri build`

Le build frontend et le build desktop Tauri réussissent. Vite conserve un avertissement non bloquant sur un chunk supérieur à 500 kB, déjà présent dans la configuration actuelle et à traiter plus tard par code splitting si nécessaire.
