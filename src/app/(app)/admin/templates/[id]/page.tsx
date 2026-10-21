import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TemplateBuilder from "@/components/TemplateBuilder";
import { getSession } from "@/lib/auth/session";
import { canManageTemplate } from "@/lib/audit/permissions";
import { getTemplate } from "@/lib/store/templates";
import { listSubmissionsForTemplate } from "@/lib/store/submissions";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  const canManage = canManageTemplate(session, template);
  const submissions = await listSubmissionsForTemplate(id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">{template.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Créé par {template.createdBy === session.sub ? "vous" : template.createdByName}
        </p>
      </div>

      {!canManage && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Lecture seule — seul l&apos;auteur (ou un superadmin) peut modifier ou supprimer ce formulaire. Vous
          pouvez le dupliquer pour créer votre propre version.
        </p>
      )}

      <TemplateBuilder mode="edit" templateId={template.id} initial={template} readOnly={!canManage} />

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
