import ExcelJS from "exceljs";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { Product } from "@/lib/audit/types";
import { importProducts } from "@/lib/store/products";

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const COLUMN_ALIASES: Record<string, keyof Product> = {
  code: "code",
  codearticle: "code",
  designation: "designation",
  libelle: "designation",
  famille: "famille",
  famillearticle: "famille",
  colisage: "colisage",
  prixachat: "prixAchat",
  prixdachat: "prixAchat",
  prixvente1: "prixVente1",
  pv1: "prixVente1",
  prixvente2: "prixVente2",
  pv2: "prixVente2",
  prixvente3: "prixVente3",
  pv3: "prixVente3",
  prixvente4: "prixVente4",
  pv4: "prixVente4",
  prixvente5: "prixVente5",
  pv5: "prixVente5",
  prixvente6: "prixVente6",
  pv6: "prixVente6",
};

const NUMERIC_FIELDS = new Set<keyof Product>([
  "colisage",
  "prixAchat",
  "prixVente1",
  "prixVente2",
  "prixVente3",
  "prixVente4",
  "prixVente5",
  "prixVente6",
]);

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    const arrayBuffer = await file.arrayBuffer();
    if (file.name.toLowerCase().endsWith(".csv")) {
      await workbook.csv.read(Readable.from(Buffer.from(arrayBuffer)));
    } else {
      await workbook.xlsx.load(arrayBuffer);
    }
  } catch {
    return NextResponse.json({ error: "Fichier illisible (Excel .xlsx ou .csv attendu)." }, { status: 400 });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return NextResponse.json({ error: "Feuille vide ou sans données." }, { status: 400 });
  }

  const headerRow = sheet.getRow(1);
  const columnMap = new Map<number, keyof Product>();
  headerRow.eachCell((cell, colNumber) => {
    const field = COLUMN_ALIASES[normalizeHeader(cell.value)];
    if (field) columnMap.set(colNumber, field);
  });

  if (!Array.from(columnMap.values()).includes("code") || !Array.from(columnMap.values()).includes("designation")) {
    return NextResponse.json(
      { error: "Colonnes « Code article » et « Désignation » introuvables dans l'en-tête." },
      { status: 400 }
    );
  }

  const products: Product[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const partial: Partial<Product> = {};
    for (const [col, field] of columnMap) {
      const raw = row.getCell(col).value;
      if (raw === null || raw === undefined || raw === "") continue;
      if (NUMERIC_FIELDS.has(field)) {
        const n = Number(raw);
        if (Number.isFinite(n)) (partial as Record<string, unknown>)[field] = n;
      } else {
        (partial as Record<string, unknown>)[field] = String(raw).trim();
      }
    }
    if (partial.code && partial.designation) {
      products.push(partial as Product);
    }
  }

  if (products.length === 0) {
    return NextResponse.json({ error: "Aucune ligne valide (code + désignation requis)." }, { status: 400 });
  }

  const result = await importProducts(products);
  return NextResponse.json(result);
}
