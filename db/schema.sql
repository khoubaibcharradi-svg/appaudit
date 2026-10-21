-- Audit App — schéma MySQL (base attendue : audit_app_dev)
-- Appliqué automatiquement au démarrage de l'app (voir src/lib/db/pool.ts),
-- ou manuellement via `npm run db:migrate`.
-- Toutes les colonnes de date/heure sont stockées en texte (ISO 8601 ou
-- YYYY-MM-DD) plutôt qu'en DATE/DATETIME : l'app les traite comme de
-- simples chaînes et ça évite toute conversion de fuseau horaire côté driver.
--
-- Les tables utilisent des clés métier (business keys) plutôt que des UUID
-- techniques quand une clé naturelle stable existe : l'email pour les
-- utilisateurs, le nom pour les sites. Les formulaires, missions et
-- soumissions restent identifiés par UUID (ce sont soit des titres non
-- garantis uniques, soit des enregistrements d'événements horodatés).

CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPERADMIN', 'ADMIN', 'PERSONNEL') NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sites (
  name VARCHAR(255) PRIMARY KEY,
  type ENUM('USINE', 'DEPOT') NOT NULL,
  region VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS templates (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sections JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_by VARCHAR(255) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  standard_key VARCHAR(64) NULL,
  UNIQUE INDEX idx_templates_standard_key (standard_key),
  CONSTRAINT fk_templates_created_by FOREIGN KEY (created_by) REFERENCES users (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  template_title VARCHAR(255) NOT NULL,
  site VARCHAR(255) NOT NULL,
  filled_by VARCHAR(255) NOT NULL,
  filled_by_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  answers JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  submitted_at VARCHAR(32) NULL,
  INDEX idx_submissions_template (template_id),
  INDEX idx_submissions_filled_by (filled_by),
  CONSTRAINT fk_submissions_filled_by FOREIGN KEY (filled_by) REFERENCES users (email),
  CONSTRAINT fk_submissions_site FOREIGN KEY (site) REFERENCES sites (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS missions (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  template_title VARCHAR(255) NOT NULL,
  site VARCHAR(255) NOT NULL,
  scheduled_date VARCHAR(16) NOT NULL,
  assigned_to VARCHAR(255) NOT NULL,
  assigned_to_name VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  submission_id CHAR(36) NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_missions_assigned_to (assigned_to),
  CONSTRAINT fk_missions_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (email),
  CONSTRAINT fk_missions_created_by FOREIGN KEY (created_by) REFERENCES users (email),
  CONSTRAINT fk_missions_site FOREIGN KEY (site) REFERENCES sites (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
