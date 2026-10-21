import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canAccessInventory } from "@/lib/audit/permissions";
import { PhysicalCount } from "@/lib/audit/types";
import { getInventory, updateCounts } from "@/lib/store/inventories";
import { getMission } from "@/lib/store/missions";

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

  const body = await request.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.counts) ? body.counts : [];
  const counts: PhysicalCount[] = raw
    .filter(
      (c): c is PhysicalCount =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as PhysicalCount).locationCode === "string" &&
        typeof (c as PhysicalCount).productCode === "string" &&
        Number.isFinite((c as PhysicalCount).quantity)
    )
    .map((c) => ({ locationCode: c.locationCode, productCode: c.productCode, quantity: c.quantity }));

  try {
    const updated = await updateCounts(id, counts);
    return NextResponse.json({ inventory: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
