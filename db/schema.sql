-- Audit App — schéma MySQL (base attendue : audit_app_dev)
-- Appliqué automatiquement au démarrage de l'app (voir src/lib/db/pool.ts),
-- ou manuellement via `npm run db:migrate`.
-- Toutes les colonnes de date/heure sont stockées en texte (ISO 8601 ou
-- YYYY-MM-DD) plutôt qu'en DATE/DATETIME : l'app les traite comme de
-- simples chaînes et ça évite toute conversion de fuseau horaire côté driver.

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPERADMIN', 'ADMIN', 'PERSONNEL') NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS templates (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sections JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_by CHAR(36) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  standard_key VARCHAR(64) NULL,
  INDEX idx_templates_standard_key (standard_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  template_title VARCHAR(255) NOT NULL,
  site VARCHAR(255) NOT NULL,
  filled_by CHAR(36) NOT NULL,
  filled_by_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  answers JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  submitted_at VARCHAR(32) NULL,
  INDEX idx_submissions_template (template_id),
  INDEX idx_submissions_filled_by (filled_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS missions (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  template_title VARCHAR(255) NOT NULL,
  site VARCHAR(255) NOT NULL,
  scheduled_date VARCHAR(16) NOT NULL,
  assigned_to CHAR(36) NOT NULL,
  assigned_to_name VARCHAR(255) NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  submission_id CHAR(36) NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_missions_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
