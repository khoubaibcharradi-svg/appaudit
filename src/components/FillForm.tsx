"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AuditMission,
  AuditTemplate,
  Product,
  QuestionDef,
  SCALE_OPTIONS,
  Site,
  YES_NO_OPTIONS,
} from "@/lib/audit/types";
import { allQuestions, isQuestionVisible } from "@/lib/audit/visibility";

interface Props {
  template: AuditTemplate;
  mission?: AuditMission;
  sites: Site[];
  products: Product[];
}

export default function FillForm({ template, mission, sites, products }: Props) {
  const router = useRouter();
  const [siteCode, setSiteCode] = useState(mission?.siteCode ?? sites[0]?.code ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inventory, setInventory] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isInventory = Boolean(mission?.isInventory);
  const productsByFamille = useMemo(() => {
    const groups = new Map<string, Product[]>();
    for (const p of products) {
      const key = p.famille ?? "Sans famille";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return groups;
  }, [products]);

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
    if (!siteCode.trim()) {
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
        siteCode: siteCode.trim(),
        missionId: mission?.id,
        answers: Object.entries(answers)
          .filter(([id]) => visibleIds.has(id))
          .map(([questionId, value]) => ({ questionId, value })),
        inventoryCounts: isInventory
          ? Object.entries(inventory)
              .filter(([, value]) => value !== "")
              .map(([productCode, value]) => ({ productCode, quantity: Number(value) }))
          : undefined,
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
            <select
              value={siteCode}
              onChange={(e) => setSiteCode(e.target.value)}
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
            >
              <optgroup label="Usines">
                {sites.filter((s) => s.type === "USINE").map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Dépôts">
                {sites.filter((s) => s.type === "DEPOT").map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.nature === "MOBILE" ? "mobile" : "fixe"})
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        )}
      </div>

      {isInventory && (
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Inventaire — comptage produits</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Comptage à l&apos;aveugle : indiquez la quantité physique constatée pour chaque article.
            Laissez vide les articles absents du site.
          </p>
          {products.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              Aucun article dans le catalogue produits. Ajoutez-en depuis « Produits » dans le menu admin.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {Array.from(productsByFamille.entries()).map(([famille, items]) => (
                <div key={famille}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{famille}</p>
                  <div className="mt-2 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
                    {items.map((p) => (
                      <div key={p.code} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-black dark:text-zinc-50">{p.designation}</p>
                          <p className="text-xs text-zinc-500">
                            {p.code}
                            {p.colisage ? ` · colisage ${p.colisage}` : ""}
                          </p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={inventory[p.code] ?? ""}
                          onChange={(e) => setInventory((prev) => ({ ...prev, [p.code]: e.target.value }))}
                          placeholder="Qté"
                          className="w-24 shrink-0 rounded-lg border border-black/[.12] bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
