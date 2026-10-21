import type { RowDataPacket } from "mysql2/promise";
import { StorageLocation } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface StorageLocationRow extends RowDataPacket {
  code: string;
  site_code: string;
  name: string;
  nature: StorageLocation["nature"];
  societe: string | null;
}

function mapLocation(row: StorageLocationRow): StorageLocation {
  return {
    code: row.code,
    siteCode: row.site_code,
    name: row.name,
    nature: row.nature,
    societe: row.societe ?? undefined,
  };
}

export async function listStorageLocations(): Promise<StorageLocation[]> {
  await ensureSchema();
  const [rows] = await pool.query<StorageLocationRow[]>(
    "SELECT * FROM storage_locations ORDER BY site_code ASC, nature ASC, name ASC"
  );
  return rows.map(mapLocation);
}

export async function listStorageLocationsForSite(siteCode: string): Promise<StorageLocation[]> {
  await ensureSchema();
  const [rows] = await pool.query<StorageLocationRow[]>(
    "SELECT * FROM storage_locations WHERE site_code = ? ORDER BY nature ASC, name ASC",
    [siteCode]
  );
  return rows.map(mapLocation);
}

export async function findStorageLocationByCode(code: string): Promise<StorageLocation | null> {
  await ensureSchema();
  const [rows] = await pool.query<StorageLocationRow[]>("SELECT * FROM storage_locations WHERE code = ? LIMIT 1", [
    code,
  ]);
  return rows[0] ? mapLocation(rows[0]) : null;
}

export async function createStorageLocation(input: StorageLocation): Promise<StorageLocation> {
  await ensureSchema();
  const [existing] = await pool.query<StorageLocationRow[]>(
    "SELECT code FROM storage_locations WHERE code = ? LIMIT 1",
    [input.code]
  );
  if (existing.length > 0) {
    throw new Error("Ce code magasin existe déjà.");
  }

  await pool.query(
    "INSERT INTO storage_locations (code, site_code, name, nature, societe) VALUES (?, ?, ?, ?, ?)",
    [input.code, input.siteCode, input.name, input.nature, input.societe ?? null]
  );
  logger.info("storage_locations.created", { code: input.code, siteCode: input.siteCode, nature: input.nature });
  return input;
}
