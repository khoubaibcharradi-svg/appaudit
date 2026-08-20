import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { duplicateTemplate } from "@/lib/store/templates";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const { id } = await params;
  const duplicate = await duplicateTemplate(id, { id: session.sub, name: session.name });
  if (!duplicate) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });

  return NextResponse.json({ template: duplicate });
}
