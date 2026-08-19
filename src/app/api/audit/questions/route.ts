import { NextRequest, NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/audit/bank";
import { generateBaseAudit } from "@/lib/audit/generate";
import { Depth } from "@/lib/audit/types";

const VALID_DEPTHS: Depth[] = ["rapide", "standard", "approfondi"];

export function GET() {
  return NextResponse.json({ categories: CATEGORIES });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const categories: unknown = body?.categories;
  const depth: unknown = body?.depth;

  if (!Array.isArray(categories) || categories.length === 0) {
    return NextResponse.json({ error: "Sélectionnez au moins une catégorie." }, { status: 400 });
  }
  if (typeof depth !== "string" || !VALID_DEPTHS.includes(depth as Depth)) {
    return NextResponse.json({ error: "Profondeur d'audit invalide." }, { status: 400 });
  }

  const validCategoryIds = new Set(CATEGORIES.map((c) => c.id));
  const categoryIds = categories.filter((c): c is string => typeof c === "string" && validCategoryIds.has(c));
  if (categoryIds.length === 0) {
    return NextResponse.json({ error: "Catégories inconnues." }, { status: 400 });
  }

  // Generated fresh on every call: a new random subset of questions is
  // drawn from the bank each time an audit is started.
  const questions = generateBaseAudit(categoryIds, depth as Depth);
  return NextResponse.json({ questions });
}
