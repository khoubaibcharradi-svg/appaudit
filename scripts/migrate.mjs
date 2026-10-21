#!/usr/bin/env node
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPool } from "mysql2/promise";
import { dbConfig, loadEnv } from "./lib/env.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
loadEnv(root);

async function main() {
  const pool = createPool(dbConfig());
  const statements = readFileSync(path.join(root, "db", "schema.sql"), "utf8")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log(`Schéma appliqué sur "${dbConfig().database}" (${statements.length} instructions).`);
  await pool.end();
}

main().catch((err) => {
  console.error("Échec de la migration :", err);
  process.exit(1);
});
