import { readFileSync } from "fs";
import path from "path";
import mysql, { type Pool } from "mysql2/promise";
import { logger } from "@/lib/logger";

const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "audit_app_dev",
  waitForConnections: true,
  connectionLimit: 10,
});

let schemaReady: Promise<void> | null = null;

/** Applies db/schema.sql (idempotent CREATE TABLE IF NOT EXISTS). Cached after the first success. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sqlPath = path.join(process.cwd(), "db", "schema.sql");
      const statements = readFileSync(sqlPath, "utf8")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await pool.query(statement);
      }
      logger.info("db.schema_ready");
    })().catch((err) => {
      logger.error("db.schema_failed", { error: err instanceof Error ? err.message : String(err) });
      schemaReady = null; // allow a retry on the next call instead of staying broken forever
      throw err;
    });
  }
  return schemaReady;
}

export default pool;
