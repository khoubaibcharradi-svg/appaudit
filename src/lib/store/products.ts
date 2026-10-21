import type { RowDataPacket } from "mysql2/promise";
import { Product } from "@/lib/audit/types";
import pool, { ensureSchema } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

interface ProductRow extends RowDataPacket {
  code: string;
  designation: string;
  famille: string | null;
  colisage: number | null;
  prix_achat: string | null;
  prix_vente_1: string | null;
  prix_vente_2: string | null;
  prix_vente_3: string | null;
  prix_vente_4: string | null;
  prix_vente_5: string | null;
  prix_vente_6: string | null;
}

function toNumber(value: string | null): number | undefined {
  return value === null ? undefined : Number(value);
}

function mapProduct(row: ProductRow): Product {
  return {
    code: row.code,
    designation: row.designation,
    famille: row.famille ?? undefined,
    colisage: row.colisage ?? undefined,
    prixAchat: toNumber(row.prix_achat),
    prixVente1: toNumber(row.prix_vente_1),
    prixVente2: toNumber(row.prix_vente_2),
    prixVente3: toNumber(row.prix_vente_3),
    prixVente4: toNumber(row.prix_vente_4),
    prixVente5: toNumber(row.prix_vente_5),
    prixVente6: toNumber(row.prix_vente_6),
  };
}

export async function listProducts(): Promise<Product[]> {
  await ensureSchema();
  const [rows] = await pool.query<ProductRow[]>("SELECT * FROM products ORDER BY famille ASC, designation ASC");
  return rows.map(mapProduct);
}

export async function findProductByCode(code: string): Promise<Product | null> {
  await ensureSchema();
  const [rows] = await pool.query<ProductRow[]>("SELECT * FROM products WHERE code = ? LIMIT 1", [code]);
  return rows[0] ? mapProduct(rows[0]) : null;
}

/** Bulk import: inserts new articles and updates existing ones (matched by code). */
export async function importProducts(products: Product[]): Promise<{ imported: number }> {
  await ensureSchema();
  if (products.length === 0) return { imported: 0 };

  const values: unknown[] = [];
  const placeholders = products
    .map((p) => {
      values.push(
        p.code,
        p.designation,
        p.famille ?? null,
        p.colisage ?? null,
        p.prixAchat ?? null,
        p.prixVente1 ?? null,
        p.prixVente2 ?? null,
        p.prixVente3 ?? null,
        p.prixVente4 ?? null,
        p.prixVente5 ?? null,
        p.prixVente6 ?? null
      );
      return "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    })
    .join(", ");

  await pool.query(
    `INSERT INTO products
       (code, designation, famille, colisage, prix_achat, prix_vente_1, prix_vente_2, prix_vente_3, prix_vente_4, prix_vente_5, prix_vente_6)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       designation = VALUES(designation),
       famille = VALUES(famille),
       colisage = VALUES(colisage),
       prix_achat = VALUES(prix_achat),
       prix_vente_1 = VALUES(prix_vente_1),
       prix_vente_2 = VALUES(prix_vente_2),
       prix_vente_3 = VALUES(prix_vente_3),
       prix_vente_4 = VALUES(prix_vente_4),
       prix_vente_5 = VALUES(prix_vente_5),
       prix_vente_6 = VALUES(prix_vente_6)`,
    values
  );
  logger.info("products.imported", { count: products.length });
  return { imported: products.length };
}

export async function createProduct(input: Product): Promise<Product> {
  await ensureSchema();
  const [existing] = await pool.query<ProductRow[]>("SELECT code FROM products WHERE code = ? LIMIT 1", [
    input.code,
  ]);
  if (existing.length > 0) {
    throw new Error("Ce code article existe déjà.");
  }

  await pool.query(
    `INSERT INTO products
       (code, designation, famille, colisage, prix_achat, prix_vente_1, prix_vente_2, prix_vente_3, prix_vente_4, prix_vente_5, prix_vente_6)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.code,
      input.designation,
      input.famille ?? null,
      input.colisage ?? null,
      input.prixAchat ?? null,
      input.prixVente1 ?? null,
      input.prixVente2 ?? null,
      input.prixVente3 ?? null,
      input.prixVente4 ?? null,
      input.prixVente5 ?? null,
      input.prixVente6 ?? null,
    ]
  );
  logger.info("products.created", { code: input.code, designation: input.designation, famille: input.famille });
  return input;
}
