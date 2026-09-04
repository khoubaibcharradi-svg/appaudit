import { notFound, redirect } from "next/navigation";
import FillForm from "@/components/FillForm";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { getMission } from "@/lib/store/missions";
import { getTemplate } from "@/lib/store/templates";

export default async function FillTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ missionId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { templateId } = await params;
  const { missionId } = await searchParams;

  const template = await getTemplate(templateId);
  if (!template) notFound();

  const mission = missionId ? await getMission(missionId) : null;
  if (missionId && !mission) notFound();
  if (mission) {
    if (mission.templateId !== templateId) notFound();
    if (mission.assignedTo !== session.sub && !isAdminRole(session.role)) notFound();
    if (mission.status === "TERMINEE") redirect(`/submissions/${mission.submissionId}`);
  }

  // Without a mission, direct access still requires the template to be
  // active (or an admin previewing it).
  if (!mission && !template.isActive && !isAdminRole(session.role)) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {mission ? `Mission du ${new Date(mission.scheduledDate).toLocaleDateString("fr-FR")}` : "Nouvel audit"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">{template.title}</h1>
        {template.description && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>}
      </div>
      <FillForm template={template} mission={mission ?? undefined} />
    </div>
  );
}
