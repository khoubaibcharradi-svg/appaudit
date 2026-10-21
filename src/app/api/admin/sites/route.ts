import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { DepotNature, SiteType, isValidSiteCode, siteCodePrefix } from "@/lib/audit/types";
import { createSite } from "@/lib/store/sites";

const SITE_TYPES: SiteType[] = ["USINE", "DEPOT"];
const DEPOT_NATURES: DepotNature[] = ["FIXE", "MOBILE"];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const type = SITE_TYPES.includes(body?.type) ? (body.type as SiteType) : null;
  const nature = DEPOT_NATURES.includes(body?.nature) ? (body.nature as DepotNature) : undefined;
  const region = typeof body?.region === "string" && body.region.trim() ? body.region.trim() : undefined;
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

  if (!name || !type || !code) {
    return NextResponse.json({ error: "Nom, type et code sont requis." }, { status: 400 });
  }
  if (type === "DEPOT" && !nature) {
    return NextResponse.json({ error: "La nature (fixe ou mobile) est requise pour un dépôt." }, { status: 400 });
  }
  if (!isValidSiteCode(code, type, nature)) {
    return NextResponse.json(
      { error: `Le code doit suivre le format ${siteCodePrefix(type, nature)}-0000.` },
      { status: 400 }
    );
  }

  try {
    const site = await createSite({ code, name, type, nature: type === "DEPOT" ? nature : undefined, region });
    return NextResponse.json({ site });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
