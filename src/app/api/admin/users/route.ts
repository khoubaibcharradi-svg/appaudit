import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role, isAdminRole } from "@/lib/auth/types";
import { createUser } from "@/lib/store/users";

const ASSIGNABLE_ROLES: Role[] = ["PERSONNEL", "ADMIN", "SUPERADMIN"];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const requestedRole = ASSIGNABLE_ROLES.includes(body?.role) ? (body.role as Role) : "PERSONNEL";

  // A plain ADMIN may only onboard field staff. Granting ADMIN/SUPERADMIN
  // rights is reserved to SUPERADMIN accounts.
  if (requestedRole !== "PERSONNEL" && session.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Seul un superadmin peut créer un compte admin ou superadmin." },
      { status: 403 }
    );
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nom, email et mot de passe sont requis." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères." }, { status: 400 });
  }

  try {
    const user = await createUser({ name, email, password, role: requestedRole });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
