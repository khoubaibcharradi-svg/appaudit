import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { ValidationError, sanitizeSections } from "@/lib/audit/validate";
import { createTemplate } from "@/lib/store/templates";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const isActive = Boolean(body?.isActive);

  if (!title) return NextResponse.json({ error: "Le titre du formulaire est requis." }, { status: 400 });

  try {
    const sections = sanitizeSections(body?.sections);
    const template = await createTemplate(
      { title, description, sections, isActive },
      { id: session.sub, name: session.name }
    );
    return NextResponse.json({ template });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
