# Autour de moi

Les données ouvertes de l'État rendues utiles autour de chez soi : carburants,
bornes de recharge, entreprises, commerces bio, emploi, immobilier et énergie.
Site 100 % statique, sans backend, sans compte ni clé d'API.

> Projet en cours de construction. Le README complet (démo, captures, choix
> techniques, Lighthouse, accessibilité) sera rédigé à la fin.

## Modules

| Catégorie             | Module                       | Source des données                          |
| --------------------- | ---------------------------- | ------------------------------------------- |
| Mobilité et énergie   | Carburants                   | Prix des carburants (data.economie.gouv.fr) |
| Mobilité et énergie   | Recharge électrique          | Bornes IRVE (ODRE)                          |
| Mobilité et énergie   | Comparateur                  | Carburants et bornes IRVE                   |
| Entreprises et emploi | Recherche d'entreprises      | API Recherche d'entreprises (DINUM)         |
| Entreprises et emploi | Producteurs et commerces bio | API Professionnels bio (Agence Bio)         |
| Entreprises et emploi | Emploi et salaires           | Données ouvertes Urssaf                     |
| Immobilier et énergie | Ventes immobilières          | API Données foncières DVF (Cerema)          |
| Immobilier et énergie | Diagnostics énergétiques     | API DPE logements et tertiaire (ADEME)      |
| Immobilier et énergie | Consommation électrique      | Données ouvertes Enedis                     |

Toutes ces API sont gratuites, sans clé et autorisent les appels depuis le
navigateur (CORS), ce qui permet de se passer de serveur. Les lieux sont
recherchés avec le géocodage de la Géoplateforme (IGN) et l'API Géo.

### Ajouter un module

Le menu du site et le répertoire de l'accueil sont générés à partir d'un seul
registre, `src/features/hub/model/modules.ts` :

1. ajouter une entrée dans `MODULES` (avec `href: null` tant que la page
   n'existe pas : le module s'affiche alors « Bientôt ») ;
2. au besoin, ajouter une catégorie dans `CATEGORIES` ;
3. créer la page dans `src/app/<chemin>/page.tsx` et le code dans
   `src/features/<module>/`.

## Stack

- Next.js (export statique) + React + TypeScript strict
- TanStack Query, Zustand, Zod
- Leaflet / react-leaflet, Recharts
- Vitest + React Testing Library, ESLint, Prettier

## Développement

Prérequis : Node 22 et pnpm.

```bash
pnpm install
pnpm dev
```

| Commande            | Rôle                        |
| ------------------- | --------------------------- |
| `pnpm lint`         | ESLint                      |
| `pnpm typecheck`    | Vérification TypeScript     |
| `pnpm test`         | Tests Vitest                |
| `pnpm format:check` | Vérification Prettier       |
| `pnpm build`        | Export statique dans `out/` |

## Déploiement

Le workflow `deploy.yml` construit le site et le publie sur GitHub Pages à
chaque push sur `main`. Le `basePath` est déduit du nom du dépôt
(`NEXT_PUBLIC_BASE_PATH`), donc un renommage du dépôt ne casse rien.
