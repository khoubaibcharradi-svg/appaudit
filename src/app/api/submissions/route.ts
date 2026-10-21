import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { AnswerEntry, AuditMission } from "@/lib/audit/types";
import { getVisibleQuestions } from "@/lib/audit/visibility";
import { getInventoryByMissionId } from "@/lib/store/inventories";
import { getMission, markMissionSubmitted } from "@/lib/store/missions";
import { findSiteByCode } from "@/lib/store/sites";
import { getTemplate } from "@/lib/store/templates";
import { createSubmission } from "@/lib/store/submissions";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  const siteCode = typeof body?.siteCode === "string" ? body.siteCode.trim() : "";
  const missionId = typeof body?.missionId === "string" ? body.missionId : undefined;
  const rawAnswers: unknown[] = Array.isArray(body?.answers) ? body.answers : [];

  if (!templateId) return NextResponse.json({ error: "Formulaire manquant." }, { status: 400 });

  const template = await getTemplate(templateId);
  if (!template) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });

  let site: { code: string; name: string };
  let mission: AuditMission | null = null;

  if (missionId) {
    mission = await getMission(missionId);
    if (!mission) return NextResponse.json({ error: "Mission introuvable." }, { status: 404 });
    if (mission.assignedTo !== session.sub && !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Cette mission ne vous est pas affectée." }, { status: 403 });
    }
    if (mission.status === "TERMINEE") {
      return NextResponse.json({ error: "Cette mission a déjà été réalisée." }, { status: 400 });
    }
    if (mission.isInventory) {
      const inventory = await getInventoryByMissionId(mission.id);
      if (!inventory || inventory.status !== "CLOTURE") {
        return NextResponse.json(
          { error: "Clôturez d'abord l'inventaire avant de soumettre l'audit." },
          { status: 400 }
        );
      }
    }
    site = { code: mission.siteCode, name: mission.site };
  } else {
    if (!siteCode) return NextResponse.json({ error: "Le site audité est requis." }, { status: 400 });
    const found = await findSiteByCode(siteCode);
    if (!found) return NextResponse.json({ error: "Site inconnu." }, { status: 400 });
    site = found;
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
    { templateId, templateTitle: template.title, siteCode: site.code, site: site.name, answers },
    { codeUser: session.sub, name: session.name }
  );

  if (missionId) {
    await markMissionSubmitted(missionId, submission.id);
  }

  return NextResponse.json({ submission });
}
