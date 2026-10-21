import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canAccessInventory } from "@/lib/audit/permissions";
import { getInventory } from "@/lib/store/inventories";
import { getMission } from "@/lib/store/missions";
import { listProducts } from "@/lib/store/products";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const inventory = await getInventory(id);
  if (!inventory) return NextResponse.json({ error: "Inventaire introuvable." }, { status: 404 });
  const mission = await getMission(inventory.missionId);
  if (!mission || !canAccessInventory(session, mission)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  if (!inventory.rapprochement) {
    return NextResponse.json({ error: "Clôturez d'abord l'inventaire." }, { status: 400 });
  }

  const products = await listProducts();
  const productByCode = new Map(products.map((p) => [p.code, p]));

  const workbook = new ExcelJS.Workbook();

  const rapprochementSheet = workbook.addWorksheet("Rapprochement");
  rapprochementSheet.columns = [
    { header: "Code article", key: "code", width: 16 },
    { header: "Désignation", key: "designation", width: 36 },
    { header: "Famille", key: "famille", width: 20 },
    { header: "Qté SAP", key: "qteSap", width: 12 },
    { header: "Qté physique", key: "qtePhysique", width: 14 },
    { header: "Écart qté", key: "ecartQte", width: 12 },
    { header: "Écart valorisé (DT)", key: "ecartValorise", width: 18 },
    ...inventory.selectedLocations.map((code) => ({ header: `Écart ${code}`, key: `ecart_${code}`, width: 14 })),
  ];
  rapprochementSheet.getRow(1).font = { bold: true };
  for (const line of inventory.rapprochement.lines) {
    const product = productByCode.get(line.codeArticle);
    const row: Record<string, string | number> = {
      code: line.codeArticle,
      designation: product?.designation || line.designation,
      famille: product?.famille ?? "",
      qteSap: line.qteSapTotale,
      qtePhysique: line.qtePhysiqueTotale,
      ecartQte: line.ecartQte,
      ecartValorise: Number(line.ecartValorise.toFixed(3)),
    };
    for (const code of inventory.selectedLocations) {
      row[`ecart_${code}`] = line.ecartParMagasin[code] ?? 0;
    }
    rapprochementSheet.addRow(row);
  }

  const totalsSheet = workbook.addWorksheet("Totaux");
  totalsSheet.columns = [
    { header: "Indicateur", key: "label", width: 28 },
    { header: "Valeur (DT)", key: "value", width: 16 },
  ];
  totalsSheet.getRow(1).font = { bold: true };
  totalsSheet.addRow({ label: "Écart net valorisé", value: Number(inventory.rapprochement.totals.ecartNetValorise.toFixed(3)) });
  totalsSheet.addRow({ label: "Total des manquants", value: Number(inventory.rapprochement.totals.totalManquants.toFixed(3)) });
  totalsSheet.addRow({ label: "Total des excédents", value: Number(inventory.rapprochement.totals.totalExcedents.toFixed(3)) });

  const topEcartsSheet = workbook.addWorksheet("Top ecarts");
  topEcartsSheet.columns = [
    { header: "Rang", key: "rank", width: 8 },
    { header: "Code article", key: "code", width: 16 },
    { header: "Désignation", key: "designation", width: 36 },
    { header: "Écart valorisé (DT)", key: "ecartValorise", width: 18 },
  ];
  topEcartsSheet.getRow(1).font = { bold: true };
  inventory.rapprochement.topEcarts.forEach((line, index) => {
    const product = productByCode.get(line.codeArticle);
    topEcartsSheet.addRow({
      rank: index + 1,
      code: line.codeArticle,
      designation: product?.designation || line.designation,
      ecartValorise: Number(line.ecartValorise.toFixed(3)),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = inventory.site.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-");
  const filename = `rapprochement-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
