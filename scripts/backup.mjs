#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPool } from "mysql2/promise";
import { dbConfig, loadEnv } from "./lib/env.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
loadEnv(root);

const TABLES = ["users", "sites", "products", "templates", "submissions", "missions"];

function redact(row) {
  if (!("password_hash" in row)) return row;
  return { ...row, password_hash: "[REDACTED]" };
}

async function main() {
  const pool = createPool(dbConfig());
  const now = new Date();
  const lines = [];
  lines.push(`Sauvegarde ${dbConfig().database} — ${now.toISOString()}`);
  lines.push("=".repeat(60));

  for (const table of TABLES) {
    const [rows] = await pool.query(`SELECT * FROM ${table}`);
    lines.push("");
    lines.push(`## ${table} (${rows.length} ligne${rows.length > 1 ? "s" : ""})`);
    lines.push("-".repeat(60));
    if (rows.length === 0) {
      lines.push("(vide)");
    } else {
      for (const row of rows) {
        lines.push(JSON.stringify(redact(row), null, 2));
      }
    }
  }

  const backupDir = path.join(root, "backups");
  mkdirSync(backupDir, { recursive: true });
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const file = path.join(backupDir, `backup-${timestamp}.txt`);
  writeFileSync(file, lines.join("\n") + "\n", "utf8");

  console.log(`Sauvegarde écrite dans ${file}`);
  await pool.end();
}

main().catch((err) => {
  console.error("Échec de la sauvegarde :", err);
  process.exit(1);
});
