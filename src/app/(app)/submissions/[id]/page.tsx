import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { QuestionDef, SCALE_OPTIONS, YES_NO_OPTIONS } from "@/lib/audit/types";
import { computeMaturityScore } from "@/lib/audit/score";
import { getSubmission } from "@/lib/store/submissions";
import { getTemplate } from "@/lib/store/templates";

function formatAnswer(question: QuestionDef, value: string | undefined): string {
  if (value === undefined || value === "") return "—";
  if (question.type === "SCALE") return SCALE_OPTIONS.find((o) => o.value === value)?.label ?? value;
  if (question.type === "YES_NO") return YES_NO_OPTIONS.find((o) => o.value === value)?.label ?? value;
  return value;
}

export default async function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) notFound();
  if (!isAdminRole(session.role) && submission.filledBy !== session.sub) notFound();

  const template = await getTemplate(submission.templateId);
  const answerMap = Object.fromEntries(submission.answers.map((a) => [a.questionId, a.value]));
  const maturity = template ? computeMaturityScore(template.sections, submission.answers) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Résultat d&apos;audit</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">{submission.templateTitle}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {submission.site} · rempli par {submission.filledByName} le{" "}
          {new Date(submission.createdAt).toLocaleString("fr-FR")}
        </p>
      </div>

      {maturity && (
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Score de maturité</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-black dark:text-zinc-50">{maturity.scorePercent}%</span>
            <span className="text-xs text-zinc-500">sur {maturity.scaleQuestionCount} questions à échelle</span>
          </div>
        </div>
      )}

      {!template && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Le formulaire d&apos;origine a été modifié ou supprimé : les réponses brutes sont conservées ci-dessous.
        </p>
      )}

      {template &&
        template.sections.map((section) => {
          const questions = section.questions.filter((q) => answerMap[q.id] !== undefined);
          if (questions.length === 0) return null;
          return (
            <div
              key={section.id}
              className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <h2 className="text-sm font-semibold text-black dark:text-zinc-50">{section.label}</h2>
              <div className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
                {questions.map((q) => (
                  <div key={q.id} className="py-3">
                    <p className="text-sm text-black dark:text-zinc-50">{q.text}</p>
                    <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {formatAnswer(q, answerMap[q.id])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
