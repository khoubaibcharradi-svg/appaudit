"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuditTemplate, QuestionDef, QuestionType, SectionDef, optionsForType } from "@/lib/audit/types";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SCALE: "Échelle (Toujours → Jamais)",
  YES_NO: "Oui / Non",
  TEXT: "Texte libre",
  NUMBER: "Nombre",
};

function newId() {
  return crypto.randomUUID();
}

function emptyQuestion(): QuestionDef {
  return { id: newId(), text: "", type: "SCALE", weight: 1, required: true };
}

function emptySection(): SectionDef {
  return { id: newId(), label: "", questions: [emptyQuestion()] };
}

interface Props {
  mode: "create" | "edit";
  templateId?: string;
  initial?: AuditTemplate;
}

export default function TemplateBuilder({ mode, templateId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sections, setSections] = useState<SectionDef[]>(initial?.sections ?? [emptySection()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allQuestions = sections.flatMap((s) => s.questions);

  function updateSection(sectionId: string, patch: Partial<SectionDef>) {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  }

  function removeSection(sectionId: string) {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }

  function addSection() {
    setSections((prev) => [...prev, emptySection()]);
  }

  function updateQuestion(sectionId: string, questionId: string, patch: Partial<QuestionDef>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, questions: s.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)) }
      )
    );
  }

  function removeQuestion(sectionId: string, questionId: string) {
    setSections((prev) =>
      prev.map((s) => (s.id !== sectionId ? s : { ...s, questions: s.questions.filter((q) => q.id !== questionId) }))
    );
    // Clear dependsOn on any question that referenced the removed one.
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        questions: s.questions.map((q) =>
          q.dependsOn?.questionId === questionId ? { ...q, dependsOn: undefined } : q
        ),
      }))
    );
  }

  function addQuestion(sectionId: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, questions: [...s.questions, emptyQuestion()] } : s))
    );
  }

  async function handleSubmit() {
    setError(null);
    if (!title.trim()) {
      setError("Le titre du formulaire est requis.");
      return;
    }
    for (const section of sections) {
      if (!section.label.trim()) {
        setError("Chaque section doit avoir un intitulé.");
        return;
      }
      for (const q of section.questions) {
        if (!q.text.trim()) {
          setError("Chaque question doit avoir un texte.");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const url = mode === "create" ? "/api/templates" : `/api/templates/${templateId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isActive, sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'enregistrement.");
      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black dark:text-zinc-50">Titre du formulaire</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Audit dépôt — Inventaire et caisse"
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/[.2] dark:focus:border-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black dark:text-zinc-50">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Objectif de l'audit, périmètre…"
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/[.2] dark:focus:border-white"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Formulaire actif (visible par le personnel)</span>
          </label>
        </div>
      </div>

      {sections.map((section, sIndex) => (
        <div
          key={section.id}
          className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between gap-3">
            <input
              value={section.label}
              onChange={(e) => updateSection(section.id, { label: e.target.value })}
              placeholder={`Section ${sIndex + 1} (ex : Inventaire stock)`}
              className="flex-1 rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm font-medium outline-none focus:border-black dark:border-white/[.2] dark:focus:border-white"
            />
            {sections.length > 1 && (
              <button
                onClick={() => removeSection(section.id)}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                Supprimer la section
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {section.questions.map((question, qIndex) => (
              <QuestionRow
                key={question.id}
                question={question}
                index={qIndex}
                candidateParents={allQuestions.filter(
                  (q) => q.id !== question.id && (q.type === "SCALE" || q.type === "YES_NO")
                )}
                onChange={(patch) => updateQuestion(section.id, question.id, patch)}
                onRemove={
                  section.questions.length > 1 ? () => removeQuestion(section.id, question.id) : undefined
                }
              />
            ))}
          </div>

          <button
            onClick={() => addQuestion(section.id)}
            className="mt-4 rounded-full border border-black/[.12] px-3 py-1.5 text-xs font-medium hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.08]"
          >
            + Ajouter une question
          </button>
        </div>
      ))}

      <button
        onClick={addSection}
        className="self-start rounded-full border border-black/[.12] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.08]"
      >
        + Ajouter une section
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc] sm:w-auto"
      >
        {saving ? "Enregistrement…" : mode === "create" ? "Créer le formulaire" : "Enregistrer les modifications"}
      </button>
    </div>
  );
}

function QuestionRow({
  question,
  index,
  candidateParents,
  onChange,
  onRemove,
}: {
  question: QuestionDef;
  index: number;
  candidateParents: QuestionDef[];
  onChange: (patch: Partial<QuestionDef>) => void;
  onRemove?: () => void;
}) {
  const parent = candidateParents.find((q) => q.id === question.dependsOn?.questionId);
  const parentOptions = parent ? optionsForType(parent.type) : null;

  return (
    <div className="rounded-xl border border-black/[.08] p-3 dark:border-white/[.145]">
      <div className="flex items-start gap-2">
        <span className="mt-2 text-xs text-zinc-400">#{index + 1}</span>
        <div className="flex-1 flex flex-col gap-2">
          <input
            value={question.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Texte de la question"
            className="w-full rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/[.2] dark:focus:border-white"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1">
              <span className="text-zinc-500">Type</span>
              <select
                value={question.type}
                onChange={(e) => onChange({ type: e.target.value as QuestionType, dependsOn: undefined })}
                className="rounded-md border border-black/[.12] bg-transparent px-2 py-1 dark:border-white/[.2]"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span className="text-zinc-500">Poids</span>
              <select
                value={question.weight}
                onChange={(e) => onChange({ weight: Number(e.target.value) as 1 | 2 | 3 })}
                className="rounded-md border border-black/[.12] bg-transparent px-2 py-1 dark:border-white/[.2]"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={question.required} onChange={(e) => onChange({ required: e.target.checked })} />
              <span className="text-zinc-500">Obligatoire</span>
            </label>
            {onRemove && (
              <button onClick={onRemove} className="ml-auto text-red-600 hover:underline dark:text-red-400">
                Supprimer
              </button>
            )}
          </div>

          {candidateParents.length > 0 && (
            <div className="rounded-lg bg-black/[.02] p-2 text-xs dark:bg-white/[.04]">
              <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <span className="text-zinc-500">Question de suivi conditionnelle (facultatif) — dépend de</span>
                <select
                  value={question.dependsOn?.questionId ?? ""}
                  onChange={(e) =>
                    onChange({
                      dependsOn: e.target.value ? { questionId: e.target.value, triggerValues: [] } : undefined,
                    })
                  }
                  className="w-full rounded-md border border-black/[.12] bg-transparent px-2 py-1 sm:w-auto dark:border-white/[.2]"
                >
                  <option value="">Aucune (toujours visible)</option>
                  {candidateParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.text || "(sans texte)"}
                    </option>
                  ))}
                </select>
              </label>

              {parent && parentOptions && (
                <div className="mt-2 flex flex-wrap gap-3">
                  <span className="text-zinc-500">Apparaît si la réponse est :</span>
                  {parentOptions.map((opt) => {
                    const checked = question.dependsOn?.triggerValues.includes(opt.value) ?? false;
                    return (
                      <label key={opt.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const current = question.dependsOn?.triggerValues ?? [];
                            const next = e.target.checked
                              ? [...current, opt.value]
                              : current.filter((v) => v !== opt.value);
                            onChange({ dependsOn: { questionId: parent.id, triggerValues: next } });
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
