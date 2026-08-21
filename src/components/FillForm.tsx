"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuditMission, AuditTemplate, KNOWN_SITES, QuestionDef, SCALE_OPTIONS, YES_NO_OPTIONS } from "@/lib/audit/types";
import { allQuestions, isQuestionVisible } from "@/lib/audit/visibility";

interface Props {
  template: AuditTemplate;
  mission?: AuditMission;
}

export default function FillForm({ template, mission }: Props) {
  const router = useRouter();
  const [site, setSite] = useState(mission?.site ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visibleIds = useMemo(() => {
    const all = allQuestions(template.sections);
    return new Set(all.filter((q) => isQuestionVisible(q, answers)).map((q) => q.id));
  }, [template.sections, answers]);

  const visibleRequired = useMemo(
    () => allQuestions(template.sections).filter((q) => visibleIds.has(q.id) && q.required),
    [template.sections, visibleIds]
  );
  const answeredRequired = visibleRequired.filter((q) => answers[q.id]).length;
  const allRequiredAnswered = visibleRequired.length === answeredRequired;

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    setError(null);
    if (!site.trim()) {
      setError("Veuillez indiquer le site audité.");
      return;
    }
    if (!allRequiredAnswered) {
      setError("Merci de répondre à toutes les questions obligatoires affichées.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        templateId: template.id,
        site: site.trim(),
        missionId: mission?.id,
        answers: Object.entries(answers)
          .filter(([id]) => visibleIds.has(id))
          .map(([questionId, value]) => ({ questionId, value })),
      };
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'envoi.");
      router.push(`/submissions/${data.submission.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        {mission ? (
          <div className="text-sm">
            <span className="font-medium text-black dark:text-zinc-50">Site audité</span>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {mission.site} — fixé par la mission, affectée à {mission.assignedToName}
            </p>
          </div>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black dark:text-zinc-50">Site audité</span>
            <input
              list="known-sites"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="Ex : Dépôt Jendouba"
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
            />
            <datalist id="known-sites">
              {KNOWN_SITES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {answeredRequired} / {visibleRequired.length} questions obligatoires répondues
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.1]">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${visibleRequired.length ? (answeredRequired / visibleRequired.length) * 100 : 0}%` }}
        />
      </div>

      {template.sections.map((section) => {
        const visibleQuestions = section.questions.filter((q) => visibleIds.has(q.id));
        if (visibleQuestions.length === 0) return null;
        return (
          <div
            key={section.id}
            className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
          >
            <h2 className="text-sm font-semibold text-black dark:text-zinc-50">{section.label}</h2>
            <div className="mt-4 flex flex-col gap-4">
              {visibleQuestions.map((q) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  isFollowUp={Boolean(q.dependsOn)}
                  value={answers[q.id]}
                  onChange={(v) => setAnswer(q.id, v)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex h-12 w-full items-center justify-center rounded-full bg-brand px-5 font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Envoi…" : "Soumettre l'audit"}
      </button>
    </div>
  );
}

function QuestionField({
  question,
  isFollowUp,
  value,
  onChange,
}: {
  question: QuestionDef;
  isFollowUp: boolean;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isFollowUp
          ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          : "border-black/[.08] dark:border-white/[.145]"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {isFollowUp && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100">
            Question de suivi
          </span>
        )}
        {question.required && <span>Obligatoire</span>}
      </div>
      <p className="mt-1 text-sm font-medium text-black dark:text-zinc-50">{question.text}</p>

      {question.type === "SCALE" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                value === option.value
                  ? "border-brand bg-brand text-white dark:border-brand dark:bg-brand dark:text-white"
                  : "border-black/[.12] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.2] dark:text-zinc-300 dark:hover:bg-white/[.08]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {question.type === "YES_NO" && (
        <div className="mt-3 flex gap-2">
          {YES_NO_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                value === option.value
                  ? "border-brand bg-brand text-white dark:border-brand dark:bg-brand dark:text-white"
                  : "border-black/[.12] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.2] dark:text-zinc-300 dark:hover:bg-white/[.08]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {question.type === "TEXT" && (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Constat, observation, plan d'action…"
          className="mt-3 w-full rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
        />
      )}

      {question.type === "NUMBER" && (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 w-40 rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
        />
      )}
    </div>
  );
}
