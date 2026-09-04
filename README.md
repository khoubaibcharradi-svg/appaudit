# Audit App

Application Next.js pour le département audit : les administrateurs créent des formulaires
d'audit (avec questions conditionnelles), le personnel les remplit sur le terrain, et les
résultats sont consultables avec un score de maturité par audit.

## Démarrage

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

Au premier démarrage, deux comptes sont créés automatiquement (stockés dans `data/users.json`,
non versionné) :

| Rôle       | Email                 | Mot de passe     |
| ---------- | --------------------- | ---------------- |
| Superadmin | `admin@s2i.local`     | `Admin123!`      |
| Personnel  | `auditeur@s2i.local`  | `Personnel123!`  |

Ces identifiants sont personnalisables via les variables d'environnement `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `SEED_STAFF_EMAIL`, `SEED_STAFF_PASSWORD` (voir `.env.example`).
Les formulaires standards (voir plus bas) sont aussi créés automatiquement — y compris ceux
ajoutés après le premier démarrage, sur une installation déjà en service.

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
- **Missions** (`/missions`, création sur `/admin/missions/new`) : un admin crée une mission en
  choisissant un formulaire (existant ou nouveau), un site, une date et un membre du personnel
  affecté. Le personnel voit ses missions à réaliser sur son tableau de bord et dans « Mes
  missions » ; le site est alors fixé par la mission. Une fois soumise, la mission passe à
  « Terminée » et pointe vers le résultat.
- **Résultats** (`/submissions`) : score de maturité calculé sur les questions à échelle.
- **Thème** : bouton clair/sombre dans la barre de navigation (persisté en `localStorage`,
  respecte la préférence système par défaut).

Les données (utilisateurs, formulaires, missions, soumissions) sont stockées dans des fichiers
JSON sous `data/` (non versionné) via `src/lib/store`.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS. Authentification par session JWT (cookie
httpOnly, `jose`) avec mots de passe hachés (`bcryptjs`). Les routes sont protégées par
`src/proxy.ts` (rôle `ADMIN` ou `SUPERADMIN` requis sur `/admin/**`).
