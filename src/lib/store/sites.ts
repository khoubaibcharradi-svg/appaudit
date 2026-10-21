import type { RowDataPacket } from "mysql2/promise";
import { Site, siteCodePrefix } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface SiteRow extends RowDataPacket {
  code: string;
  name: string;
  type: Site["type"];
  nature: Site["nature"] | null;
  region: string | null;
}

function mapSite(row: SiteRow): Site {
  return {
    code: row.code,
    name: row.name,
    type: row.type,
    nature: row.nature ?? undefined,
    region: row.region ?? undefined,
  };
}

async function insertSite(site: Site, ignoreDuplicates = false): Promise<void> {
  await pool.query(
    `INSERT ${ignoreDuplicates ? "IGNORE " : ""}INTO sites (code, name, type, nature, region) VALUES (?, ?, ?, ?, ?)`,
    [site.code, site.name, site.type, site.nature ?? null, site.region ?? null]
  );
}

// The real sites audited by the department. Adding a new entry here makes
// it appear automatically on every installation (new or existing).
const SEED_SITES: Site[] = [
  { code: "USI-0001", name: "Usine S2I", type: "USINE" },
  { code: "DEPF-0001", name: "Dépôt Jendouba", type: "DEPOT", nature: "FIXE", region: "Jendouba" },
  { code: "DEPF-0002", name: "Dépôt Sfax", type: "DEPOT", nature: "FIXE", region: "Sfax" },
  { code: "DEPF-0003", name: "Dépôt Sousse", type: "DEPOT", nature: "FIXE", region: "Sousse" },
];

async function seedIfEmpty(): Promise<void> {
  const [rows] = await pool.query<SiteRow[]>("SELECT code FROM sites LIMIT 1");
  if (rows.length > 0) return;

  for (const site of SEED_SITES) await insertSite(site, true);
  logger.info("sites.seeded", { count: SEED_SITES.length });
}

export async function listSites(): Promise<Site[]> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<SiteRow[]>("SELECT * FROM sites ORDER BY type ASC, name ASC");
  return rows.map(mapSite);
}

export async function findSiteByCode(code: string): Promise<Site | null> {
  await ensureSchema();
  await seedIfEmpty();
  const [rows] = await pool.query<SiteRow[]>("SELECT * FROM sites WHERE code = ? LIMIT 1", [code]);
  return rows[0] ? mapSite(rows[0]) : null;
}

/** Next unused sequential code for a type/nature's prefix (e.g. "DEPF-0004"), suggested as a default in the creation form. */
export async function suggestNextSiteCode(type: Site["type"], nature?: Site["nature"]): Promise<string> {
  await ensureSchema();
  const prefix = siteCodePrefix(type, nature);
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT code FROM sites WHERE code LIKE ? ORDER BY code DESC LIMIT 1",
    [`${prefix}-%`]
  );
  const last = rows[0]?.code as string | undefined;
  const lastNumber = last ? parseInt(last.slice(prefix.length + 1), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export async function createSite(input: Site): Promise<Site> {
  await ensureSchema();
  const [existingCode] = await pool.query<SiteRow[]>("SELECT code FROM sites WHERE code = ? LIMIT 1", [input.code]);
  if (existingCode.length > 0) {
    throw new Error("Ce code site est déjà utilisé.");
  }
  const [existingName] = await pool.query<SiteRow[]>("SELECT code FROM sites WHERE name = ? LIMIT 1", [input.name]);
  if (existingName.length > 0) {
    throw new Error("Un site avec ce nom existe déjà.");
  }

  await insertSite(input);
  logger.info("sites.created", { code: input.code, name: input.name, type: input.type, nature: input.nature });
  return input;
}
