import { NextRequest, NextResponse } from "next/server";
import { generateFollowUps } from "@/lib/audit/generate";
import { AnswersMap } from "@/lib/audit/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const answers: unknown = body?.answers;
  const includedIds: unknown = body?.includedIds;

  if (typeof answers !== "object" || answers === null) {
    return NextResponse.json({ error: "Réponses invalides." }, { status: 400 });
  }
  if (!Array.isArray(includedIds)) {
    return NextResponse.json({ error: "Liste de questions invalide." }, { status: 400 });
  }

  // Re-evaluated on every call so that new follow-up questions unlock
  // dynamically as soon as a weak answer is submitted.
  const followUps = generateFollowUps(
    answers as AnswersMap,
    includedIds.filter((id): id is string => typeof id === "string")
  );
  return NextResponse.json({ questions: followUps });
}
