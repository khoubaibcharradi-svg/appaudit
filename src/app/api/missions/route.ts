import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { createInventory } from "@/lib/store/inventories";
import { createMission } from "@/lib/store/missions";
import { findSiteByCode } from "@/lib/store/sites";
import { getTemplate } from "@/lib/store/templates";
import { findUserByCode } from "@/lib/store/users";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  const siteCode = typeof body?.siteCode === "string" ? body.siteCode.trim() : "";
  const scheduledDate = typeof body?.scheduledDate === "string" ? body.scheduledDate : "";
  const assignedTo = typeof body?.assignedTo === "string" ? body.assignedTo : "";
  const isInventory = Boolean(body?.isInventory);

  if (!templateId || !siteCode || !scheduledDate || !assignedTo) {
    return NextResponse.json({ error: "Formulaire, site, date et personnel affecté sont requis." }, { status: 400 });
  }

  const template = await getTemplate(templateId);
  if (!template) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });

  const site = await findSiteByCode(siteCode);
  if (!site) return NextResponse.json({ error: "Site inconnu." }, { status: 400 });

  const assignee = await findUserByCode(assignedTo);
  if (!assignee) return NextResponse.json({ error: "Utilisateur affecté introuvable." }, { status: 404 });

  const mission = await createMission(
    {
      templateId,
      templateTitle: template.title,
      siteCode: site.code,
      site: site.name,
      scheduledDate,
      assignedTo: assignee.codeUser,
      assignedToName: assignee.name,
      isInventory,
    },
    { codeUser: session.sub, name: session.name }
  );

  if (isInventory) {
    await createInventory(mission, { codeUser: session.sub, name: session.name });
  }

  return NextResponse.json({ mission });
}
