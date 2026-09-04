import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { createMission } from "@/lib/store/missions";
import { getTemplate } from "@/lib/store/templates";
import { findUserById } from "@/lib/store/users";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  const site = typeof body?.site === "string" ? body.site.trim() : "";
  const scheduledDate = typeof body?.scheduledDate === "string" ? body.scheduledDate : "";
  const assignedTo = typeof body?.assignedTo === "string" ? body.assignedTo : "";

  if (!templateId || !site || !scheduledDate || !assignedTo) {
    return NextResponse.json({ error: "Formulaire, site, date et personnel affecté sont requis." }, { status: 400 });
  }

  const template = await getTemplate(templateId);
  if (!template) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });

  const assignee = await findUserById(assignedTo);
  if (!assignee) return NextResponse.json({ error: "Utilisateur affecté introuvable." }, { status: 404 });

  const mission = await createMission(
    {
      templateId,
      templateTitle: template.title,
      site,
      scheduledDate,
      assignedTo: assignee.id,
      assignedToName: assignee.name,
    },
    { id: session.sub, name: session.name }
  );
  return NextResponse.json({ mission });
}
