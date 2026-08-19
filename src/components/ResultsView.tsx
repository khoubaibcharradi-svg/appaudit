import { AuditResult } from "@/lib/audit/types";

const LEVEL_STYLES: Record<AuditResult["categories"][number]["level"], string> = {
  critique: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  a_ameliorer: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  correct: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  excellent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

const LEVEL_LABELS: Record<AuditResult["categories"][number]["level"], string> = {
  critique: "Critique",
  a_ameliorer: "À améliorer",
  correct: "Correct",
  excellent: "Excellent",
};

export default function ResultsView({ result, onRestart }: { result: AuditResult; onRestart: () => void }) {
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Résultat de l&apos;audit</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-4xl font-semibold text-black dark:text-zinc-50">{result.overallScorePercent}%</span>
        <span className="text-sm text-zinc-500">score global · {result.answeredCount} réponses</span>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {result.categories.map((category) => (
          <div key={category.categoryId} className="rounded-xl border border-black/[.08] p-4 dark:border-white/[.145]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-black dark:text-zinc-50">{category.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[category.level]}`}>
                {LEVEL_LABELS[category.level]} · {category.scorePercent}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.1]">
              <div
                className="h-full rounded-full bg-black dark:bg-white"
                style={{ width: `${category.scorePercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{category.recommendation}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="mt-8 flex h-11 w-full items-center justify-center rounded-full border border-black/[.12] px-5 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.08]"
      >
        Refaire un audit
      </button>
    </div>
  );
}
