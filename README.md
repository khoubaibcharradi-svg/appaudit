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

| Rôle       | Email                 | Mot de passe     |
| ---------- | --------------------- | ---------------- |
| Superadmin | `admin@s2i.local`     | `Admin123!`      |
| Personnel  | `auditeur@s2i.local`  | `Personnel123!`  |

Ces identifiants sont personnalisables via les variables d'environnement `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `SEED_STAFF_EMAIL`, `SEED_STAFF_PASSWORD` (voir `.env.example`).
Deux formulaires standards (voir plus bas) sont aussi créés automatiquement au premier
démarrage.

## Rôles

- **Superadmin** : tout ce qu'un admin peut faire, plus : créer d'autres comptes admin/superadmin,
  et modifier/supprimer **n'importe quel** formulaire (pas seulement les siens).
- **Admin** : crée des formulaires d'audit et des comptes personnel. Voit tous les formulaires et
  tous les audits soumis, mais ne peut modifier ou supprimer que les formulaires qu'il a
  lui-même créés — les formulaires des autres admins s'ouvrent en lecture seule, avec un bouton
  « Dupliquer » pour en repartir.
- **Personnel** : remplit les formulaires actifs pour un site donné (usine, dépôt…) et ne voit
  que ses propres audits soumis.

## Fonctionnement

- **Formulaires** (`/admin/templates`) : organisés en sections de questions (échelle, oui/non,
  texte, nombre). Une question peut être définie comme « question de suivi » qui n'apparaît que
  si une question précédente reçoit une réponse déclenchante — le questionnaire vu par le
  personnel est donc généré dynamiquement au fil des réponses.
- **Modèles standards** : deux formulaires de base sont seedés au premier démarrage, construits
  à partir des audits réels fournis :
  - « Audit industriel — Usine S2I » (ventes, ordres de fabrication, machines/moules, matières
    premières, rebuts, recouvrement, RH, hygiène/sécurité) ;
  - « Audit logistique et commercial — Dépôt » (inventaire stock, clôture de caisse, facturation
    et retours clients, organisation, recouvrement et effets).

  Ils sont inactifs par défaut ; pour créer un nouveau formulaire, dupliquez-en un (bouton
  « Dupliquer » sur sa page) puis ajustez les sections/questions avant d'enregistrer.
- **Remplissage** (`/fill/[templateId]`) : le personnel indique le site audité et répond aux
  questions ; les questions de suivi apparaissent en direct.
- **Résultats** (`/submissions`) : score de maturité calculé sur les questions à échelle.
- **Thème** : bouton clair/sombre dans la barre de navigation (persisté en `localStorage`,
  respecte la préférence système par défaut).

Les données (utilisateurs, formulaires, soumissions) sont stockées dans des fichiers JSON sous
`data/` (non versionné) via `src/lib/store`.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Authentification par session JWT (cookie
httpOnly, `jose`) avec mots de passe hachés (`bcryptjs`). Les routes sont protégées par
`src/proxy.ts` (rôle `ADMIN` ou `SUPERADMIN` requis sur `/admin/**`).
