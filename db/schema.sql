-- Audit App — schéma MySQL (base attendue : audit_app_dev)
-- Appliqué automatiquement au démarrage de l'app (voir src/lib/db/pool.ts),
-- ou manuellement via `npm run db:migrate`.
-- Toutes les colonnes de date/heure sont stockées en texte (ISO 8601 ou
-- YYYY-MM-DD) plutôt qu'en DATE/DATETIME : l'app les traite comme de
-- simples chaînes et ça évite toute conversion de fuseau horaire côté driver.
--
-- Les tables utilisent des clés métier (business keys) plutôt que des UUID
-- techniques quand une clé naturelle stable existe : le matricule
-- (code_user, ex. ADM-0001) pour les utilisateurs, un code (code_site, ex.
-- DEPF-0001) pour les sites. L'email et le nom du site restent uniques mais
-- ne sont plus les clés référencées par les autres tables. Les formulaires,
-- missions et soumissions restent identifiés par UUID (ce sont soit des
-- titres non garantis uniques, soit des enregistrements d'événements
-- horodatés).

CREATE TABLE IF NOT EXISTS users (
  code_user VARCHAR(20) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPERADMIN', 'ADMIN', 'PERSONNEL') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Added after the initial release — applies on top of an already-created
-- `users` table (MySQL 8.0.29+ / MariaDB 10.0.2+) without requiring a drop.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS sites (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type ENUM('USINE', 'DEPOT') NOT NULL,
  -- Only meaningful for DEPOT (a USINE is always fixed): fixed warehouse
  -- vs. a mobile/vehicle-based point of sale.
  nature ENUM('FIXE', 'MOBILE') NULL,
  region VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS templates (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sections JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_by VARCHAR(20) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  standard_key VARCHAR(64) NULL,
  UNIQUE INDEX idx_templates_standard_key (standard_key),
  CONSTRAINT fk_templates_created_by FOREIGN KEY (created_by) REFERENCES users (code_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  template_title VARCHAR(255) NOT NULL,
  site_code VARCHAR(20) NOT NULL,
  site VARCHAR(255) NOT NULL,
  filled_by VARCHAR(20) NOT NULL,
  filled_by_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  answers JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  submitted_at VARCHAR(32) NULL,
  INDEX idx_submissions_template (template_id),
  INDEX idx_submissions_filled_by (filled_by),
  INDEX idx_submissions_site_code (site_code),
  CONSTRAINT fk_submissions_filled_by FOREIGN KEY (filled_by) REFERENCES users (code_user),
  CONSTRAINT fk_submissions_site FOREIGN KEY (site_code) REFERENCES sites (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dropped after the inventory workflow moved to its own `inventories` table
-- (JSON photo/counts/rapprochement) — applies on top of an already-created
-- `submissions` table without requiring a drop of the whole database.
ALTER TABLE submissions DROP COLUMN IF EXISTS inventory_counts;

CREATE TABLE IF NOT EXISTS missions (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  template_title VARCHAR(255) NOT NULL,
  site_code VARCHAR(20) NOT NULL,
  site VARCHAR(255) NOT NULL,
  scheduled_date VARCHAR(16) NOT NULL,
  assigned_to VARCHAR(20) NOT NULL,
  assigned_to_name VARCHAR(255) NOT NULL,
  created_by VARCHAR(20) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  submission_id CHAR(36) NULL,
  is_inventory TINYINT(1) NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_missions_assigned_to (assigned_to),
  INDEX idx_missions_site_code (site_code),
  CONSTRAINT fk_missions_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (code_user),
  CONSTRAINT fk_missions_created_by FOREIGN KEY (created_by) REFERENCES users (code_user),
  CONSTRAINT fk_missions_site FOREIGN KEY (site_code) REFERENCES sites (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Added after the initial release — applies on top of an already-created
-- `missions` table without requiring a drop.
ALTER TABLE missions ADD COLUMN IF NOT EXISTS is_inventory TINYINT(1) NOT NULL DEFAULT 0;

-- Product catalog backing the optional inventory task on a mission. `code`
-- is the real SAP article code (free text, typed by the admin), not a
-- generated sequential code like users/sites.
CREATE TABLE IF NOT EXISTS products (
  code VARCHAR(50) PRIMARY KEY,
  designation VARCHAR(255) NOT NULL,
  famille VARCHAR(255) NULL,
  colisage INT NULL,
  prix_achat DECIMAL(10,3) NULL,
  prix_vente_1 DECIMAL(10,3) NULL,
  prix_vente_2 DECIMAL(10,3) NULL,
  prix_vente_3 DECIMAL(10,3) NULL,
  prix_vente_4 DECIMAL(10,3) NULL,
  prix_vente_5 DECIMAL(10,3) NULL,
  prix_vente_6 DECIMAL(10,3) NULL,
  INDEX idx_products_famille (famille)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One inventory session per mission with isInventory=true: blind physical
-- count against an imported SAP stock snapshot ("photo SAP"), reconciled on
-- closing. Photo rows, counts and the computed reconciliation are stored as
-- JSON (same pattern as templates.sections / submissions.answers) rather
-- than normalized tables, since they are only ever read/written as a whole
-- per session, never queried in part.
CREATE TABLE IF NOT EXISTS inventories (
  id CHAR(36) PRIMARY KEY,
  mission_id CHAR(36) NOT NULL UNIQUE,
  site_code VARCHAR(20) NOT NULL,
  site VARCHAR(255) NOT NULL,
  status ENUM('EN_COURS', 'CLOTURE') NOT NULL DEFAULT 'EN_COURS',
  selected_locations JSON NOT NULL,
  sap_photo JSON NOT NULL,
  counts JSON NOT NULL,
  rapprochement JSON NULL,
  created_by VARCHAR(20) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  closed_by VARCHAR(20) NULL,
  closed_by_name VARCHAR(255) NULL,
  closed_at VARCHAR(32) NULL,
  CONSTRAINT fk_inventories_mission FOREIGN KEY (mission_id) REFERENCES missions (id),
  CONSTRAINT fk_inventories_site FOREIGN KEY (site_code) REFERENCES sites (code),
  CONSTRAINT fk_inventories_created_by FOREIGN KEY (created_by) REFERENCES users (code_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
