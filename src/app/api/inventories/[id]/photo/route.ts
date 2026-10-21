import ExcelJS from "exceljs";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canAccessInventory } from "@/lib/audit/permissions";
import { SapPhotoRow } from "@/lib/audit/types";
import { getInventory, updateSapPhoto } from "@/lib/store/inventories";
import { getMission } from "@/lib/store/missions";

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const COLUMN_ALIASES: Record<string, keyof SapPhotoRow> = {
  societe: "societe",
  codemagasin: "codeMagasin",
  whscode: "codeMagasin",
  codearticle: "codeArticle",
  itemcode: "codeArticle",
  designation: "designation",
  itemname: "designation",
  qtesap: "qteSap",
  onhand: "qteSap",
  cmup: "cmup",
  avgprice: "cmup",
  horodatage: "horodatage",
};

const NUMERIC_FIELDS = new Set<keyof SapPhotoRow>(["qteSap", "cmup"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const inventory = await getInventory(id);
  if (!inventory) return NextResponse.json({ error: "Inventaire introuvable." }, { status: 404 });
  const mission = await getMission(inventory.missionId);
  if (!mission || !canAccessInventory(session, mission)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
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
  const columnMap = new Map<number, keyof SapPhotoRow>();
  headerRow.eachCell((cell, colNumber) => {
    const field = COLUMN_ALIASES[normalizeHeader(cell.value)];
    if (field) columnMap.set(colNumber, field);
  });

  if (!Array.from(columnMap.values()).includes("codeArticle") || !Array.from(columnMap.values()).includes("qteSap")) {
    return NextResponse.json(
      { error: "Colonnes « Code article » et « Qté SAP » introuvables dans l'en-tête." },
      { status: 400 }
    );
  }

  const rows: SapPhotoRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const partial: Partial<SapPhotoRow> = {};
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
    if (partial.codeArticle && partial.qteSap !== undefined) {
      rows.push({
        codeArticle: partial.codeArticle,
        qteSap: partial.qteSap,
        designation: partial.designation ?? partial.codeArticle,
        codeMagasin: partial.codeMagasin ?? "",
        cmup: partial.cmup,
        societe: partial.societe,
        horodatage: partial.horodatage,
      });
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne valide (code article + quantité SAP requis)." }, { status: 400 });
  }

  const updated = await updateSapPhoto(id, rows);
  return NextResponse.json({ inventory: updated, rows: rows.length });
}
