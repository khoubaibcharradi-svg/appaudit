import type { RowDataPacket } from "mysql2/promise";
import { Site } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface SiteRow extends RowDataPacket {
  name: string;
  type: Site["type"];
  region: string | null;
}

function mapSite(row: SiteRow): Site {
  return { name: row.name, type: row.type, region: row.region ?? undefined };
}

// The real sites audited by the department. Adding a new entry here makes
// it appear automatically on every installation (new or existing).
const SEED_SITES: Site[] = [
  { name: "Usine S2I", type: "USINE" },
  { name: "Dépôt Jendouba", type: "DEPOT", region: "Jendouba" },
  { name: "Dépôt Sfax", type: "DEPOT", region: "Sfax" },
  { name: "Dépôt Sousse", type: "DEPOT", region: "Sousse" },
];

async function seedIfEmpty(): Promise<void> {
  const [rows] = await pool.query<SiteRow[]>("SELECT name FROM sites LIMIT 1");
  if (rows.length > 0) return;

  for (const site of SEED_SITES) {
    await pool.query("INSERT IGNORE INTO sites (name, type, region) VALUES (?, ?, ?)", [
      site.name,
      site.type,
      site.region ?? null,
    ]);
  }
  logger.info("sites.seeded", { count: SEED_SITES.length });
}

export async function listSites(): Promise<Site[]> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<SiteRow[]>("SELECT * FROM sites ORDER BY type ASC, name ASC");
  return rows.map(mapSite);
}
