import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import {
  AuditMission,
  Inventory,
  PhysicalCount,
  Product,
  Rapprochement,
  RapprochementLine,
  SapPhotoRow,
} from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";
import { listProducts } from "./products";

interface InventoryRow extends RowDataPacket {
  id: string;
  mission_id: string;
  site_code: string;
  site: string;
  status: Inventory["status"];
  selected_locations: string[] | string;
  sap_photo: SapPhotoRow[] | string;
  counts: PhysicalCount[] | string;
  rapprochement: Rapprochement | string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
  closed_by: string | null;
  closed_by_name: string | null;
  closed_at: string | null;
}

function parseJson<T>(value: T | string): T {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapInventory(row: InventoryRow): Inventory {
  return {
    id: row.id,
    missionId: row.mission_id,
    siteCode: row.site_code,
    site: row.site,
    status: row.status,
    selectedLocations: parseJson<string[]>(row.selected_locations),
    sapPhoto: parseJson<SapPhotoRow[]>(row.sap_photo),
    counts: parseJson<PhysicalCount[]>(row.counts),
    rapprochement: row.rapprochement ? parseJson<Rapprochement>(row.rapprochement) : undefined,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    closedBy: row.closed_by ?? undefined,
    closedByName: row.closed_by_name ?? undefined,
    closedAt: row.closed_at ?? undefined,
  };
}

export async function createInventory(
  mission: AuditMission,
  creator: { codeUser: string; name: string }
): Promise<Inventory> {
  await ensureSchema();
  const inventory: Inventory = {
    id: randomUUID(),
    missionId: mission.id,
    siteCode: mission.siteCode,
    site: mission.site,
    status: "EN_COURS",
    selectedLocations: [],
    sapPhoto: [],
    counts: [],
    createdBy: creator.codeUser,
    createdByName: creator.name,
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT IGNORE INTO inventories
       (id, mission_id, site_code, site, status, selected_locations, sap_photo, counts, created_by, created_by_name, created_at)
     VALUES (?, ?, ?, ?, 'EN_COURS', ?, ?, ?, ?, ?, ?)`,
    [
      inventory.id,
      inventory.missionId,
      inventory.siteCode,
      inventory.site,
      JSON.stringify(inventory.selectedLocations),
      JSON.stringify(inventory.sapPhoto),
      JSON.stringify(inventory.counts),
      inventory.createdBy,
      inventory.createdByName,
      inventory.createdAt,
    ]
  );
  logger.info("inventories.created", { id: inventory.id, missionId: mission.id });
  return inventory;
}

export async function getInventory(id: string): Promise<Inventory | null> {
  await ensureSchema();
  const [rows] = await pool.query<InventoryRow[]>("SELECT * FROM inventories WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapInventory(rows[0]) : null;
}

export async function getInventoryByMissionId(missionId: string): Promise<Inventory | null> {
  await ensureSchema();
  const [rows] = await pool.query<InventoryRow[]>("SELECT * FROM inventories WHERE mission_id = ? LIMIT 1", [
    missionId,
  ]);
  return rows[0] ? mapInventory(rows[0]) : null;
}

export async function listInventories(): Promise<Inventory[]> {
  await ensureSchema();
  const [rows] = await pool.query<InventoryRow[]>("SELECT * FROM inventories ORDER BY created_at DESC");
  return rows.map(mapInventory);
}

export async function listInventoriesForUser(userCode: string): Promise<Inventory[]> {
  await ensureSchema();
  const [rows] = await pool.query<InventoryRow[]>(
    `SELECT i.* FROM inventories i
       JOIN missions m ON m.id = i.mission_id
     WHERE m.assigned_to = ?
     ORDER BY i.created_at DESC`,
    [userCode]
  );
  return rows.map(mapInventory);
}

function assertOpen(inventory: Inventory): void {
  if (inventory.status === "CLOTURE") {
    throw new Error("Cet inventaire est déjà clôturé.");
  }
}

export async function updateSelectedLocations(id: string, locationCodes: string[]): Promise<Inventory> {
  await ensureSchema();
  const inventory = await getInventory(id);
  if (!inventory) throw new Error("Inventaire introuvable.");
  assertOpen(inventory);
  await pool.query("UPDATE inventories SET selected_locations = ? WHERE id = ?", [
    JSON.stringify(locationCodes),
    id,
  ]);
  logger.info("inventories.locations_updated", { id, count: locationCodes.length });
  return { ...inventory, selectedLocations: locationCodes };
}

export async function updateSapPhoto(id: string, photo: SapPhotoRow[]): Promise<Inventory> {
  await ensureSchema();
  const inventory = await getInventory(id);
  if (!inventory) throw new Error("Inventaire introuvable.");
  assertOpen(inventory);
  await pool.query("UPDATE inventories SET sap_photo = ? WHERE id = ?", [JSON.stringify(photo), id]);
  logger.info("inventories.photo_imported", { id, rows: photo.length });
  return { ...inventory, sapPhoto: photo };
}

export async function updateCounts(id: string, counts: PhysicalCount[]): Promise<Inventory> {
  await ensureSchema();
  const inventory = await getInventory(id);
  if (!inventory) throw new Error("Inventaire introuvable.");
  assertOpen(inventory);
  await pool.query("UPDATE inventories SET counts = ? WHERE id = ?", [JSON.stringify(counts), id]);
  logger.info("inventories.counts_updated", { id, count: counts.length });
  return { ...inventory, counts };
}

function computeRapprochement(
  photo: SapPhotoRow[],
  counts: PhysicalCount[],
  selectedLocations: string[],
  products: Product[]
): Rapprochement {
  const productByCode = new Map(products.map((p) => [p.code, p]));
  const inScope = new Set(selectedLocations);
  const scopedPhoto = photo.filter((row) => inScope.has(row.codeMagasin));
  const scopedCounts = counts.filter((c) => inScope.has(c.locationCode));

  const qteSapByArticle = new Map<string, number>();
  const qteSapByArticleMagasin = new Map<string, Map<string, number>>();
  const cmupByArticle = new Map<string, number>();
  const designationByArticle = new Map<string, string>();
  for (const row of scopedPhoto) {
    qteSapByArticle.set(row.codeArticle, (qteSapByArticle.get(row.codeArticle) ?? 0) + row.qteSap);
    if (!qteSapByArticleMagasin.has(row.codeArticle)) qteSapByArticleMagasin.set(row.codeArticle, new Map());
    const byMagasin = qteSapByArticleMagasin.get(row.codeArticle)!;
    byMagasin.set(row.codeMagasin, (byMagasin.get(row.codeMagasin) ?? 0) + row.qteSap);
    if (row.cmup !== undefined) cmupByArticle.set(row.codeArticle, row.cmup);
    designationByArticle.set(row.codeArticle, row.designation);
  }

  const qtePhysiqueByArticle = new Map<string, number>();
  const qtePhysiqueByArticleMagasin = new Map<string, Map<string, number>>();
  for (const c of scopedCounts) {
    qtePhysiqueByArticle.set(c.productCode, (qtePhysiqueByArticle.get(c.productCode) ?? 0) + c.quantity);
    if (!qtePhysiqueByArticleMagasin.has(c.productCode)) qtePhysiqueByArticleMagasin.set(c.productCode, new Map());
    const byMagasin = qtePhysiqueByArticleMagasin.get(c.productCode)!;
    byMagasin.set(c.locationCode, (byMagasin.get(c.locationCode) ?? 0) + c.quantity);
  }

  const articleCodes = new Set([...qteSapByArticle.keys(), ...qtePhysiqueByArticle.keys()]);
  const lines: RapprochementLine[] = [];
  for (const code of articleCodes) {
    const product = productByCode.get(code);
    const designation = designationByArticle.get(code) ?? product?.designation ?? code;
    const cmup = cmupByArticle.get(code) ?? product?.prixAchat;
    const qteSapTotale = qteSapByArticle.get(code) ?? 0;
    const qtePhysiqueTotale = qtePhysiqueByArticle.get(code) ?? 0;
    const ecartQte = qtePhysiqueTotale - qteSapTotale;
    const ecartValorise = cmup !== undefined ? ecartQte * cmup : 0;

    const ecartParMagasin: Record<string, number> = {};
    for (const magasin of selectedLocations) {
      const sap = qteSapByArticleMagasin.get(code)?.get(magasin) ?? 0;
      const physique = qtePhysiqueByArticleMagasin.get(code)?.get(magasin) ?? 0;
      ecartParMagasin[magasin] = physique - sap;
    }

    lines.push({
      codeArticle: code,
      designation,
      cmup,
      qteSapTotale,
      qtePhysiqueTotale,
      ecartQte,
      ecartValorise,
      ecartParMagasin,
    });
  }
  lines.sort((a, b) => a.codeArticle.localeCompare(b.codeArticle));

  const ecartNetValorise = lines.reduce((sum, l) => sum + l.ecartValorise, 0);
  const totalManquants = lines
    .filter((l) => l.ecartValorise < 0)
    .reduce((sum, l) => sum + Math.abs(l.ecartValorise), 0);
  const totalExcedents = lines.filter((l) => l.ecartValorise > 0).reduce((sum, l) => sum + l.ecartValorise, 0);

  const topEcarts = lines
    .filter((l) => l.ecartValorise < 0)
    .sort((a, b) => a.ecartValorise - b.ecartValorise)
    .slice(0, 25);

  return {
    lines,
    totals: { ecartNetValorise, totalManquants, totalExcedents },
    topEcarts,
  };
}

export async function closeInventory(id: string, closer: { codeUser: string; name: string }): Promise<Inventory> {
  await ensureSchema();
  const inventory = await getInventory(id);
  if (!inventory) throw new Error("Inventaire introuvable.");
  assertOpen(inventory);

  const products = await listProducts();
  const rapprochement = computeRapprochement(
    inventory.sapPhoto,
    inventory.counts,
    inventory.selectedLocations,
    products
  );
  const closedAt = new Date().toISOString();

  await pool.query(
    "UPDATE inventories SET status = 'CLOTURE', rapprochement = ?, closed_by = ?, closed_by_name = ?, closed_at = ? WHERE id = ?",
    [JSON.stringify(rapprochement), closer.codeUser, closer.name, closedAt, id]
  );
  logger.info("inventories.closed", { id, ecartNetValorise: rapprochement.totals.ecartNetValorise });

  return {
    ...inventory,
    status: "CLOTURE",
    rapprochement,
    closedBy: closer.codeUser,
    closedByName: closer.name,
    closedAt,
  };
}
