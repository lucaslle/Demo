# Autour de moi

Prix des carburants, équipements sportifs et risques près de chez soi, à partir
des données ouvertes de l'État. Site 100 % statique, sans backend.

> Projet en cours de construction. Le README complet (démo, captures, sources
> des données, choix techniques, Lighthouse, accessibilité) sera rédigé à la fin.

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
