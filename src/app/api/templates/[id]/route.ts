import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageTemplate } from "@/lib/audit/permissions";
import { ValidationError, sanitizeSections } from "@/lib/audit/validate";
import { deleteTemplate, getTemplate, updateTemplate } from "@/lib/store/templates";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const existing = await getTemplate(id);
  if (!existing) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });
  if (!canManageTemplate(session, existing)) {
    return NextResponse.json(
      { error: "Vous ne pouvez modifier que les formulaires que vous avez créés." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const isActive = Boolean(body?.isActive);

  if (!title) return NextResponse.json({ error: "Le titre du formulaire est requis." }, { status: 400 });

  try {
    const sections = sanitizeSections(body?.sections);
    const template = await updateTemplate(id, { title, description, sections, isActive });
    return NextResponse.json({ template });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const existing = await getTemplate(id);
  if (!existing) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });
  if (!canManageTemplate(session, existing)) {
    return NextResponse.json(
      { error: "Vous ne pouvez supprimer que les formulaires que vous avez créés." },
      { status: 403 }
    );
  }

  await deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
