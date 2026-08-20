import { notFound, redirect } from "next/navigation";
import FillForm from "@/components/FillForm";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { getTemplate } from "@/lib/store/templates";

export default async function FillTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { templateId } = await params;
  const template = await getTemplate(templateId);
  if (!template) notFound();
  if (!template.isActive && !isAdminRole(session.role)) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Nouvel audit</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">{template.title}</h1>
        {template.description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>}
      </div>
      <FillForm template={template} />
    </div>
  );
}
