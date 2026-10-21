import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canAccessInventory } from "@/lib/audit/permissions";
import { closeInventory, getInventory } from "@/lib/store/inventories";
import { getMission } from "@/lib/store/missions";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const inventory = await getInventory(id);
  if (!inventory) return NextResponse.json({ error: "Inventaire introuvable." }, { status: 404 });
  const mission = await getMission(inventory.missionId);
  if (!mission || !canAccessInventory(session, mission)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const closed = await closeInventory(id, { codeUser: session.sub, name: session.name });
    return NextResponse.json({ inventory: closed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
