import { CategoryDef, QuestionTemplate } from "./types";

export const CATEGORIES: CategoryDef[] = [
  {
    id: "securite",
    label: "Sécurité",
    description: "Protection des données, accès et vulnérabilités.",
  },
  {
    id: "conformite",
    label: "Conformité (RGPD)",
    description: "Gestion des données personnelles et consentement.",
  },
  {
    id: "qualite",
    label: "Qualité du code",
    description: "Maintenabilité, tests et revue de code.",
  },
  {
    id: "performance",
    label: "Performance",
    description: "Temps de réponse, optimisation et montée en charge.",
  },
  {
    id: "accessibilite",
    label: "Accessibilité",
    description: "Utilisabilité pour tous les utilisateurs.",
  },
  {
    id: "exploitation",
    label: "Exploitation",
    description: "Sauvegardes, supervision et gestion des incidents.",
  },
];

// Large pool per category so that each audit run can draw a different,
// randomly-selected subset — this is what makes the questionnaire dynamic
// rather than a fixed static list.
export const QUESTION_BANK: QuestionTemplate[] = [
  // --- Sécurité ---
  { id: "sec-1", categoryId: "securite", text: "Les mots de passe des comptes utilisateurs sont-ils stockés de façon hachée et salée ?", weight: 3 },
  { id: "sec-2", categoryId: "securite", text: "L'authentification à deux facteurs est-elle proposée ou imposée ?", weight: 2 },
  { id: "sec-3", categoryId: "securite", text: "Les dépendances du projet sont-elles auditées régulièrement (npm audit, Dependabot, etc.) ?", weight: 2 },
  { id: "sec-4", categoryId: "securite", text: "Les échanges avec le serveur sont-ils systématiquement chiffrés en HTTPS ?", weight: 3 },
  { id: "sec-5", categoryId: "securite", text: "Les entrées utilisateurs sont-elles validées et échappées pour éviter les injections (SQL, XSS) ?", weight: 3 },
  { id: "sec-6", categoryId: "securite", text: "Existe-t-il une politique de gestion des secrets (clés API, tokens) hors du code source ?", weight: 2 },
  { id: "sec-7", categoryId: "securite", text: "Les droits d'accès sont-ils appliqués selon le principe du moindre privilège ?", weight: 2 },
  { id: "sec-8", categoryId: "securite", text: "Des tests d'intrusion ou scans de vulnérabilités sont-ils réalisés périodiquement ?", weight: 1 },
  { id: "sec-9", categoryId: "securite", text: "Les en-têtes de sécurité HTTP (CSP, HSTS, X-Frame-Options) sont-ils configurés ?", weight: 1 },
  { id: "sec-10", categoryId: "securite", text: "Existe-t-il un processus documenté de réponse aux incidents de sécurité ?", weight: 2 },
  {
    id: "sec-1-followup",
    categoryId: "securite",
    text: "Un plan de migration vers un algorithme de hachage plus robuste est-il prévu ?",
    weight: 2,
    dependsOn: { questionId: "sec-1", whenValueAtMost: "sometimes" },
  },
  {
    id: "sec-5-followup",
    categoryId: "securite",
    text: "Une revue de sécurité du code est-elle prévue à court terme pour corriger ce risque ?",
    weight: 2,
    dependsOn: { questionId: "sec-5", whenValueAtMost: "rarely" },
  },

  // --- Conformité RGPD ---
  { id: "conf-1", categoryId: "conformite", text: "Un registre des traitements de données personnelles est-il tenu à jour ?", weight: 2 },
  { id: "conf-2", categoryId: "conformite", text: "Le consentement des utilisateurs est-il recueilli avant tout dépôt de cookies non essentiels ?", weight: 3 },
  { id: "conf-3", categoryId: "conformite", text: "Les utilisateurs peuvent-ils exercer facilement leurs droits (accès, suppression, portabilité) ?", weight: 2 },
  { id: "conf-4", categoryId: "conformite", text: "Une politique de confidentialité claire et à jour est-elle publiée ?", weight: 1 },
  { id: "conf-5", categoryId: "conformite", text: "Les données sont-elles conservées uniquement pour la durée nécessaire (politique de rétention) ?", weight: 2 },
  { id: "conf-6", categoryId: "conformite", text: "Les sous-traitants qui manipulent des données personnelles sont-ils encadrés contractuellement (DPA) ?", weight: 2 },
  { id: "conf-7", categoryId: "conformite", text: "Un délégué à la protection des données (DPO) ou référent est-il désigné ?", weight: 1 },
  { id: "conf-8", categoryId: "conformite", text: "Les transferts de données hors UE respectent-ils un cadre légal approprié ?", weight: 2 },
  {
    id: "conf-2-followup",
    categoryId: "conformite",
    text: "Un plan de mise en conformité du bandeau de consentement est-il en cours ?",
    weight: 3,
    dependsOn: { questionId: "conf-2", whenValueAtMost: "sometimes" },
  },

  // --- Qualité du code ---
  { id: "qual-1", categoryId: "qualite", text: "Le projet dispose-t-il d'une couverture de tests automatisés suffisante ?", weight: 2 },
  { id: "qual-2", categoryId: "qualite", text: "Les revues de code (pull requests) sont-elles systématiques avant fusion ?", weight: 2 },
  { id: "qual-3", categoryId: "qualite", text: "Des outils de lint et de formatage sont-ils appliqués automatiquement ?", weight: 1 },
  { id: "qual-4", categoryId: "qualite", text: "L'architecture du projet est-elle documentée et compréhensible pour un nouvel arrivant ?", weight: 1 },
  { id: "qual-5", categoryId: "qualite", text: "Une intégration continue (CI) exécute-t-elle les tests à chaque changement ?", weight: 2 },
  { id: "qual-6", categoryId: "qualite", text: "La dette technique est-elle suivie et traitée régulièrement ?", weight: 1 },
  { id: "qual-7", categoryId: "qualite", text: "Les erreurs et exceptions sont-elles gérées de manière cohérente dans tout le code ?", weight: 2 },
  { id: "qual-8", categoryId: "qualite", text: "Le versionnage sémantique et le changelog sont-ils maintenus à jour ?", weight: 1 },

  // --- Performance ---
  { id: "perf-1", categoryId: "performance", text: "Les temps de réponse des pages/API sont-ils mesurés et suivis dans le temps ?", weight: 2 },
  { id: "perf-2", categoryId: "performance", text: "Les images et assets statiques sont-ils optimisés et servis via un CDN ?", weight: 2 },
  { id: "perf-3", categoryId: "performance", text: "Les requêtes base de données lentes sont-elles identifiées et optimisées (index, requêtes N+1) ?", weight: 3 },
  { id: "perf-4", categoryId: "performance", text: "Une stratégie de mise en cache est-elle en place (HTTP, mémoire, CDN) ?", weight: 2 },
  { id: "perf-5", categoryId: "performance", text: "L'application a-t-elle été testée sous charge (tests de montée en charge) ?", weight: 2 },
  { id: "perf-6", categoryId: "performance", text: "Le chargement du JavaScript est-il optimisé (code splitting, lazy loading) ?", weight: 1 },
  { id: "perf-7", categoryId: "performance", text: "Des budgets de performance (Core Web Vitals) sont-ils définis et surveillés ?", weight: 1 },

  // --- Accessibilité ---
  { id: "acc-1", categoryId: "accessibilite", text: "Les éléments interactifs sont-ils accessibles au clavier ?", weight: 2 },
  { id: "acc-2", categoryId: "accessibilite", text: "Les images disposent-elles de textes alternatifs pertinents ?", weight: 2 },
  { id: "acc-3", categoryId: "accessibilite", text: "Les contrastes de couleurs respectent-ils les recommandations WCAG ?", weight: 2 },
  { id: "acc-4", categoryId: "accessibilite", text: "Le site a-t-il été testé avec un lecteur d'écran ?", weight: 1 },
  { id: "acc-5", categoryId: "accessibilite", text: "Les formulaires disposent-ils de labels explicites associés à chaque champ ?", weight: 2 },
  { id: "acc-6", categoryId: "accessibilite", text: "La structure sémantique HTML (titres, landmarks) est-elle correctement utilisée ?", weight: 1 },

  // --- Exploitation ---
  { id: "exp-1", categoryId: "exploitation", text: "Des sauvegardes régulières des données sont-elles réalisées et testées ?", weight: 3 },
  { id: "exp-2", categoryId: "exploitation", text: "Une supervision (monitoring, alerting) de la disponibilité est-elle en place ?", weight: 2 },
  { id: "exp-3", categoryId: "exploitation", text: "Un plan de reprise d'activité (PRA) est-il documenté et testé ?", weight: 2 },
  { id: "exp-4", categoryId: "exploitation", text: "Les déploiements se font-ils via un processus automatisé et reproductible ?", weight: 2 },
  { id: "exp-5", categoryId: "exploitation", text: "Les journaux (logs) applicatifs sont-ils centralisés et conservés ?", weight: 1 },
  { id: "exp-6", categoryId: "exploitation", text: "Un environnement de staging distinct de la production est-il utilisé pour valider les changements ?", weight: 1 },
];
