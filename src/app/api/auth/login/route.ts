import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { findUserByEmail } from "@/lib/store/users";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    logger.warn("auth.login_failed", { email });
    return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
  }

  if (!user.isActive) {
    logger.warn("auth.login_blocked_inactive", { email });
    return NextResponse.json({ error: "Ce compte a été désactivé." }, { status: 403 });
  }

  await setSessionCookie({ sub: user.codeUser, role: user.role, name: user.name, email: user.email });
  logger.info("auth.login_success", { codeUser: user.codeUser, email: user.email, role: user.role });
  return NextResponse.json({ ok: true, role: user.role });
}
