# Audit App

Application Next.js pour le département audit : les administrateurs créent des formulaires
d'audit (avec questions conditionnelles), le personnel les remplit sur le terrain, et les
résultats sont consultables avec un score de maturité par audit.

## Démarrage

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Au premier démarrage, deux comptes sont créés automatiquement (stockés dans `data/users.json`,
non versionné) :

| Rôle       | Email                  | Mot de passe    |
| ---------- | ----------------------- | ---------------- |
| Admin      | `admin@s2i.local`       | `Admin123!`      |
| Personnel  | `auditeur@s2i.local`    | `Personnel123!`  |

Ces identifiants sont personnalisables via les variables d'environnement `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `SEED_STAFF_EMAIL`, `SEED_STAFF_PASSWORD` (voir `.env.example`).
L'admin peut ensuite créer d'autres comptes depuis `/admin/users`.

## Fonctionnement

- **Admin** : crée/édite les formulaires d'audit (`/admin/templates`), organisés en sections de
  questions (échelle, oui/non, texte, nombre). Une question peut être définie comme "question de
  suivi" qui n'apparaît que si une question précédente reçoit une réponse déclenchante — le
  questionnaire vu par le personnel est donc généré dynamiquement au fil des réponses.
- **Personnel** : remplit les formulaires actifs (`/fill/[templateId]`) pour un site donné
  (usine, dépôt…) et soumet l'audit.
- **Résultats** (`/submissions`) : le personnel voit ses propres audits, l'admin voit tous les
  audits soumis, avec un score de maturité calculé sur les questions à échelle.

Les données (utilisateurs, formulaires, soumissions) sont stockées dans des fichiers JSON sous
`data/` (non versionné) via `src/lib/store`.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Authentification par session JWT (cookie
httpOnly, `jose`) avec mots de passe hachés (`bcryptjs`). Les routes sont protégées par
`src/proxy.ts` (le rôle `ADMIN` est requis sur `/admin/**`).
