import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { DepotNature } from "@/lib/audit/types";
import { findSiteByCode } from "@/lib/store/sites";
import { createStorageLocation } from "@/lib/store/storageLocations";

const NATURES: DepotNature[] = ["FIXE", "MOBILE"];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const siteCode = typeof body?.siteCode === "string" ? body.siteCode.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const nature = NATURES.includes(body?.nature) ? (body.nature as DepotNature) : null;
  const societe = typeof body?.societe === "string" && body.societe.trim() ? body.societe.trim() : undefined;

  if (!code || !siteCode || !name || !nature) {
    return NextResponse.json({ error: "Code, site, nom et nature sont requis." }, { status: 400 });
  }

  const site = await findSiteByCode(siteCode);
  if (!site) return NextResponse.json({ error: "Site inconnu." }, { status: 400 });

  try {
    const location = await createStorageLocation({ code, siteCode: site.code, name, nature, societe });
    return NextResponse.json({ location });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
