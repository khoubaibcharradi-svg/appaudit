import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { createProduct } from "@/lib/store/products";

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!isAdminRole(session.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const designation = typeof body?.designation === "string" ? body.designation.trim() : "";
  const famille = typeof body?.famille === "string" && body.famille.trim() ? body.famille.trim() : undefined;
  const colisage = parseOptionalNumber(body?.colisage);

  if (!code || !designation) {
    return NextResponse.json({ error: "Code article et désignation sont requis." }, { status: 400 });
  }

  try {
    const product = await createProduct({
      code,
      designation,
      famille,
      colisage,
      prixAchat: parseOptionalNumber(body?.prixAchat),
      prixVente1: parseOptionalNumber(body?.prixVente1),
      prixVente2: parseOptionalNumber(body?.prixVente2),
      prixVente3: parseOptionalNumber(body?.prixVente3),
      prixVente4: parseOptionalNumber(body?.prixVente4),
      prixVente5: parseOptionalNumber(body?.prixVente5),
      prixVente6: parseOptionalNumber(body?.prixVente6),
    });
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
