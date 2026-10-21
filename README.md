# Audit App

Application Next.js pour le département audit : les administrateurs créent des formulaires
d'audit (avec questions conditionnelles), le personnel les remplit sur le terrain, et les
résultats sont consultables avec un score de maturité par audit.

## Démarrage

### Base de données

Les données sont stockées dans MySQL (ou MariaDB), pas dans des fichiers JSON. Avant le premier
démarrage :

1. Créer la base (une seule fois, l'app ne crée pas la base elle-même — seulement ses tables) :
   ```sql
   CREATE DATABASE audit_app_dev;
   ```
2. Copier `.env.example` vers `.env.local` et renseigner `DB_HOST`, `DB_PORT` (3306 par défaut),
   `DB_NAME`, `DB_USER`, `DB_PASSWORD` selon votre installation locale.
3. Appliquer le schéma (crée les tables `users`, `sites`, `templates`, `missions`, `submissions` si
   elles n'existent pas) :
   ```bash
   npm run db:migrate
   ```

`npm run dev` et `npm run build` appliquent aussi le schéma automatiquement au premier accès à la
base (`ensureSchema()`), donc l'étape 3 est surtout utile pour vérifier la connexion séparément.

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Accès depuis un autre poste sur le réseau local

`npm run dev` affiche aussi une URL réseau (ex. `http://192.168.1.11:3000`). Pour que
l'authentification et le reste de l'app fonctionnent depuis un autre poste (pas seulement
l'affichage de la page), deux choses sont nécessaires :

1. **Pare-feu Windows** : autoriser le port 3000 en entrée sur le poste qui exécute `npm run dev`
   (Pare-feu Windows Defender → Règles de trafic entrant → Nouvelle règle → Port TCP 3000 →
   Autoriser).
2. **`allowedDevOrigins`** dans `next.config.ts` : Next.js bloque par défaut, en développement,
   les requêtes internes (`/_next/*`) dont l'origine n'est pas `localhost` — sans ça, la page se
   charge mais le JavaScript ne s'hydrate jamais et rien ne fonctionne (formulaires, connexion…).
   L'adresse à lister est celle du **serveur** (l'IP affichée par `npm run dev`), pas celle du
   poste client — chaque poste qui s'y connecte envoie cette même origine. Si l'IP réseau de la
   machine qui héberge le serveur change, mettez à jour cette valeur.

Au premier démarrage, deux comptes sont créés automatiquement dans la base :

| Rôle       | Email                 | Mot de passe     |
| ---------- | --------------------- | ---------------- |
| Superadmin | `admin@s2i.local`     | `Admin123!`      |
| Personnel  | `auditeur@s2i.local`  | `Personnel123!`  |

Ces identifiants sont personnalisables via les variables d'environnement `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `SEED_STAFF_EMAIL`, `SEED_STAFF_PASSWORD` (voir `.env.example`).
Les formulaires standards (voir plus bas), les sites et deux missions de démonstration (une
planifiée, une terminée avec son audit soumis) sont aussi créés automatiquement au premier accès,
pour avoir tout de suite un exemple concret à l'écran.

## Rôles

- **Superadmin** : tout ce qu'un admin peut faire, plus : créer d'autres comptes admin/superadmin,
  et modifier/supprimer **n'importe quel** formulaire (pas seulement les siens).
- **Admin** : crée des formulaires d'audit et des comptes personnel. Voit tous les formulaires et
  tous les audits soumis, mais ne peut modifier ou supprimer que les formulaires qu'il a
  lui-même créés — les formulaires des autres admins s'ouvrent en lecture seule, avec un bouton
  « Dupliquer » pour en repartir.
- **Personnel** : réalise les missions d'audit qui lui sont affectées et ne voit que ses propres
  missions/audits soumis.

## Fonctionnement

- **Formulaires** (`/admin/templates`) : organisés en sections de questions (échelle, oui/non,
  texte, nombre). Une question peut être définie comme « question de suivi » qui n'apparaît que
  si une question précédente reçoit une réponse déclenchante — le questionnaire vu par le
  personnel est donc généré dynamiquement au fil des réponses.
- **Modèles standards** : des formulaires de base construits à partir des audits réels fournis
  sont créés automatiquement (dès qu'un compte superadmin existe) et complétés à chaque ajout
  d'un nouveau modèle, même sur une installation déjà en service (`standardKey` évite les
  doublons — voir `src/lib/store/templates.ts`) :
  - « Audit industriel — Usine S2I » (ventes, ordres de fabrication, machines/moules, matières
    premières, rebuts, recouvrement, RH, hygiène/sécurité) ;
  - « Audit logistique et commercial — Dépôt » (inventaire stock, clôture de caisse, facturation
    et retours clients, organisation, recouvrement et effets) ;
  - « Audit logistique — Déchargement de containers importés » (contrôle documentaire avant
    ouverture, inspection de l'état général, comptage contradictoire et DLC, procédure en cas de
    non-conformité avec photos/quarantaine/fiche transmise aux Achats).

  Ils sont inactifs par défaut ; pour créer un nouveau formulaire, dupliquez-en un (bouton
  « Dupliquer » sur sa page) puis ajustez les sections/questions avant d'enregistrer.
- **Sites** (usines et dépôts) : liste gérée dans la table `sites` (`src/lib/store/sites.ts`), pas
  en texte libre — elle alimente les listes déroulantes de choix du site dans la création de
  mission et dans le formulaire de remplissage libre. Les sites réels du département (Usine S2I,
  Dépôts Jendouba/Sfax/Sousse) sont créés automatiquement au premier accès ; ajouter un site se
  fait pour l'instant en complétant `SEED_SITES` dans `src/lib/store/sites.ts`.
- **Missions** (`/missions`, création sur `/admin/missions/new`) : un admin crée une mission en
  choisissant un formulaire (existant ou nouveau), un site (liste déroulante), une date et un
  membre du personnel affecté. Le personnel voit ses missions à réaliser sur son tableau de bord et
  dans « Mes missions » ; le site est alors fixé par la mission. Une fois soumise, la mission passe
  à « Terminée » et pointe vers le résultat.
- **Résultats** (`/submissions`) : score de maturité calculé sur les questions à échelle.
- **Thème** : bouton clair/sombre dans la barre de navigation (persisté en `localStorage`,
  respecte la préférence système par défaut).

Les données (utilisateurs, sites, formulaires, missions, soumissions) sont stockées dans MySQL via
`src/lib/store` (`mysql2`, pool de connexions dans `src/lib/db/pool.ts`, schéma dans
`db/schema.sql`).

### Clés métier (business keys)

Le schéma privilégie des clés métier stables plutôt que des UUID techniques quand une clé
naturelle existe :

- **`users`** : clé primaire = `email` (pas d'UUID `id`). C'est aussi la valeur portée par la
  session (`session.sub`) et par tous les champs `created_by` / `assigned_to` / `filled_by` des
  autres tables — un admin ou un audit est donc rattaché à un email, pas à un identifiant opaque.
- **`sites`** : clé primaire = `name` (ex. `"Dépôt Jendouba"`). Référencée par `missions.site` et
  `submissions.site` via des clés étrangères, ce qui empêche d'enregistrer un site qui n'existe pas
  dans la liste.
- **`templates`**, **`missions`**, **`submissions`** gardent un UUID technique : un titre de
  formulaire n'est pas garanti unique (deux admins peuvent créer le même), et une mission/un audit
  est un enregistrement d'événement horodaté, pas une entité métier stable.

## Journalisation (logs)

Chaque action notable (connexion réussie/échouée, création/modification/suppression de
formulaire, création de mission, soumission d'audit…) est journalisée dans
`logs/app-AAAA-MM-JJ.log` (un fichier par jour, non versionné, une ligne JSON par événement) :

```json
{"time":"2026-10-21T08:33:41.902Z","level":"info","message":"submissions.created","id":"...","templateId":"...","site":"Dépôt Jendouba","by":"..."}
```

La journalisation n'interrompt jamais l'application (erreurs d'écriture ignorées silencieusement).
Voir `src/lib/logger.ts`.

## Sauvegarde

```bash
npm run backup
```

Écrit un fichier texte horodaté dans `backups/backup-<date>.txt` (non versionné) avec le contenu
de toutes les tables (`users`, `templates`, `missions`, `submissions`) au format JSON lisible. Les
mots de passe hachés sont remplacés par `[REDACTED]` — aucun secret n'est jamais écrit dans une
sauvegarde. Voir `scripts/backup.mjs`.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Authentification par session JWT (cookie
httpOnly, `jose`) avec mots de passe hachés (`bcryptjs`). Les routes sont protégées par
`src/proxy.ts` (rôle `ADMIN` ou `SUPERADMIN` requis sur `/admin/**`). Stockage MySQL (`mysql2`),
journalisation fichier et sauvegarde `.txt` (voir sections ci-dessus).
