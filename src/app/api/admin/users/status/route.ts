import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { findUserByEmail, setUserActive } from "@/lib/store/users";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const isActive = Boolean(body?.isActive);

  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

  if (email.toLowerCase() === session.email.toLowerCase()) {
    return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre compte." }, { status: 400 });
  }

  const target = await findUserByEmail(email);
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  // A plain ADMIN may only manage field staff, same rule as account creation.
  if (target.role !== "PERSONNEL" && session.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Seul un superadmin peut modifier un compte admin ou superadmin." },
      { status: 403 }
    );
  }

  const updated = await setUserActive(email, isActive);
  if (!updated) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  return NextResponse.json({ user: { name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive } });
}
