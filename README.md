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

| Rôle       | Matricule  | Email                 | Mot de passe     |
| ---------- | ---------- | --------------------- | ---------------- |
| Superadmin | `SUP-0001` | `admin@s2i.local`     | `Admin123!`      |
| Personnel  | `PER-0001` | `auditeur@s2i.local`  | `Personnel123!`  |

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
- **Sites** (`/admin/sites`) : usine ou dépôt. Un dépôt regroupe un ou plusieurs **magasins**
  (table `storage_locations`) : son entrepôt fixe et ses camions (dépôts mobiles) — ce sont ces
  magasins qui sont sélectionnés lors d'un inventaire, pas le site lui-même. L'interface admin
  permet d'ajouter des sites (nom, type, région optionnelle, code) et des magasins par site (code
  magasin SAP, nom, nature fixe/mobile, société optionnelle). Les sites réels du département
  (Usine S2I, Dépôts Radès/Tazarka/Sousse/Sfax/Jendouba/Kram/Charguia/Charguia Proxim) sont créés
  automatiquement au premier accès ; les magasins (camions compris) s'ajoutent ensuite à la main.
- **Produits** (`/admin/products`) : catalogue utilisé par la tâche d'inventaire — code article
  (le code réel, ex. SAP, saisi librement : pas de format imposé contrairement aux matricules et
  codes site), désignation, famille, colisage et jusqu'à 6 prix de vente en plus du prix d'achat.
  Affiché groupé par famille. Import en masse possible (Excel/CSV, upsert par code — voir plus bas).
- **Missions** (`/missions`, création sur `/admin/missions/new`) : un admin crée une mission en
  choisissant un formulaire (existant ou nouveau), un site (liste déroulante), une date et un
  membre du personnel affecté. Le personnel voit ses missions à réaliser sur son tableau de bord et
  dans « Mes missions » ; le site est alors fixé par la mission. Une fois soumise, la mission passe
  à « Terminée » et pointe vers le résultat.
  - **Tâche d'inventaire** : case à cocher « Faire un inventaire » à la création. Si cochée, un
    inventaire est automatiquement créé pour cette mission (voir ci-dessous) ; un bandeau dans le
    formulaire de remplissage y renvoie.
- **Inventaires** (`/inventaires`) : comptage physique façon Excel, rattaché à une mission.
  - **Sélection des magasins** : parmi les magasins du site de la mission (entrepôt fixe, camions).
  - **Import de la photo SAP** : fichier Excel/CSV (colonnes Société, Code magasin, Code article,
    Désignation, Qté SAP, CMUP — mêmes en-têtes que la feuille « Photo SAP »). Non affiché pendant
    le comptage : c'est un comptage à l'aveugle, comme dans les fichiers d'origine.
  - **Comptage** : une grille article × magasin sélectionné, quantité physique par case.
  - **Clôture** : fige la sélection et le comptage, puis calcule et affiche le **rapprochement**
    (écart quantité et valorisé par article, écart net valorisé, total des manquants/excédents,
    articles SAP hors catalogue) et le **top des articles les plus manquants en valeur** —
    équivalents des feuilles « Rapprochement » et « Top ecarts ». Le personnel affecté à la mission
    et les admins peuvent tout faire (sélection, import, comptage, clôture) et consulter le résultat
    à tout moment ; tout est conservé dans la table `inventories` (photo, comptage et rapprochement
    en JSON, comme `templates.sections`).
- **Résultats** (`/submissions`) : score de maturité calculé sur les questions à échelle.
- **Thème** : bouton clair/sombre dans la barre de navigation (persisté en `localStorage`,
  respecte la préférence système par défaut).

Les données (utilisateurs, sites, magasins, produits, formulaires, missions, soumissions,
inventaires) sont stockées dans MySQL via `src/lib/store` (`mysql2`, pool de connexions dans
`src/lib/db/pool.ts`, schéma dans `db/schema.sql`).

### Import de fichiers (produits, photo SAP)

L'import de produits (`/admin/products`) et de la photo SAP (dans un inventaire) utilise
`exceljs` pour lire les fichiers `.xlsx`/`.csv` uploadés, et non le paquet `xlsx` (SheetJS), qui a
des failles de sécurité connues (pollution de prototype, ReDoS) sans correctif publié sur npm.

### Clés métier (business keys)

Le schéma privilégie des clés métier stables plutôt que des UUID techniques quand une clé
naturelle existe :

- **`users`** : clé primaire = `code_user`, le matricule (ex. `ADM-0001`, `PER-0002`), saisi par
  l'admin à la création du compte — un `SUP-0000`/`ADM-0000`/`PER-0000` selon le rôle, l'app propose
  un numéro libre suivant par défaut mais il reste modifiable. C'est cette valeur qui est portée par
  la session (`session.sub`) et par tous les champs `created_by` / `assigned_to` / `filled_by` des
  autres tables — un admin ou un audit est donc rattaché à un matricule, pas à un identifiant opaque
  ni à l'email (qui reste unique, mais sert uniquement à la connexion).
- **`sites`** : clé primaire = `code` (ex. `DEPF-0001` pour un dépôt fixe, `DEPM-0001` pour un
  dépôt mobile, `USI-0001` pour une usine), saisi par l'admin à la création sur `/admin/sites` avec
  la même logique de suggestion que les matricules. Référencé par `missions.site_code` et
  `submissions.site_code` via des clés étrangères (`missions.site`/`submissions.site` restent le
  nom lisible du site, dénormalisé pour l'affichage — comme `created_by_name` pour les utilisateurs).
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
