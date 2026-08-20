import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { AnswerEntry } from "@/lib/audit/types";
import { getVisibleQuestions } from "@/lib/audit/visibility";
import { getMission, markMissionSubmitted } from "@/lib/store/missions";
import { getTemplate } from "@/lib/store/templates";
import { createSubmission } from "@/lib/store/submissions";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  const site = typeof body?.site === "string" ? body.site.trim() : "";
  const missionId = typeof body?.missionId === "string" ? body.missionId : undefined;
  const rawAnswers: unknown[] = Array.isArray(body?.answers) ? body.answers : [];

  if (!templateId) return NextResponse.json({ error: "Formulaire manquant." }, { status: 400 });
  if (!site) return NextResponse.json({ error: "Le site audité est requis." }, { status: 400 });

  const template = await getTemplate(templateId);
  if (!template) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });

  if (missionId) {
    const mission = await getMission(missionId);
    if (!mission) return NextResponse.json({ error: "Mission introuvable." }, { status: 404 });
    if (mission.assignedTo !== session.sub && !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Cette mission ne vous est pas affectée." }, { status: 403 });
    }
    if (mission.status === "TERMINEE") {
      return NextResponse.json({ error: "Cette mission a déjà été réalisée." }, { status: 400 });
    }
  }

  const answers: AnswerEntry[] = rawAnswers
    .filter(
      (a: unknown): a is AnswerEntry =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as AnswerEntry).questionId === "string" &&
        typeof (a as AnswerEntry).value === "string" &&
        (a as AnswerEntry).value !== ""
    )
    .map((a) => ({ questionId: a.questionId, value: a.value }));

  const answerMap = Object.fromEntries(answers.map((a) => [a.questionId, a.value]));
  const visibleRequired = getVisibleQuestions(template.sections, answerMap).filter((q) => q.required);
  const missing = visibleRequired.filter((q) => !answerMap[q.id]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Réponse manquante pour : ${missing.map((q) => q.text).join(", ")}` },
      { status: 400 }
    );
  }

  const submission = await createSubmission(
    { templateId, templateTitle: template.title, site, answers },
    { id: session.sub, name: session.name }
  );

  if (missionId) {
    await markMissionSubmitted(missionId, submission.id);
  }

  return NextResponse.json({ submission });
}
