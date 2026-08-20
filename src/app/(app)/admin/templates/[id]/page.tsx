import Link from "next/link";
import { notFound } from "next/navigation";
import TemplateBuilder from "@/components/TemplateBuilder";
import { getTemplate } from "@/lib/store/templates";
import { listSubmissionsForTemplate } from "@/lib/store/submissions";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  const submissions = await listSubmissionsForTemplate(id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">{template.title}</h1>
      </div>

      <TemplateBuilder mode="edit" templateId={template.id} initial={template} />

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">
          Audits soumis avec ce formulaire ({submissions.length})
        </h2>
        <div className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {submissions.length === 0 && <p className="py-3 text-sm text-zinc-500">Aucun audit soumis pour le moment.</p>}
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/submissions/${s.id}`}
              className="flex items-center justify-between py-3 text-sm hover:opacity-70"
            >
              <span>
                <span className="font-medium text-black dark:text-zinc-50">{s.site}</span>
                <span className="text-zinc-500"> · {s.filledByName}</span>
              </span>
              <span className="text-xs text-zinc-500">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
