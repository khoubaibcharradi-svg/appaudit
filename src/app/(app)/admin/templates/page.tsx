import Link from "next/link";
import { listTemplates } from "@/lib/store/templates";
import { listSubmissions } from "@/lib/store/submissions";

export default async function TemplatesListPage() {
  const [templates, submissions] = await Promise.all([listTemplates(), listSubmissions()]);
  const submissionCountByTemplate = new Map<string, number>();
  for (const s of submissions) {
    submissionCountByTemplate.set(s.templateId, (submissionCountByTemplate.get(s.templateId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Formulaires d&apos;audit</h1>
        </div>
        <Link
          href="/admin/templates/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          + Nouveau formulaire
        </Link>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        {templates.length === 0 && <p className="p-6 text-sm text-zinc-500">Aucun formulaire créé pour le moment.</p>}
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/admin/templates/${t.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
            >
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">{t.title}</p>
                <p className="text-xs text-zinc-500">
                  {t.sections.reduce((n, s) => n + s.questions.length, 0)} questions ·{" "}
                  {submissionCountByTemplate.get(t.id) ?? 0} audits soumis
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.isActive
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {t.isActive ? "Actif" : "Inactif"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
