import MissionForm from "@/components/MissionForm";
import { listTemplates } from "@/lib/store/templates";
import { listUsers } from "@/lib/store/users";

export default async function NewMissionPage() {
  const [templates, users] = await Promise.all([listTemplates(), listUsers()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Nouvelle mission</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Affectez un formulaire à réaliser, sur un site et une date données, à un membre de l&apos;équipe.
        </p>
      </div>
      <MissionForm
        templates={templates.map((t) => ({ id: t.id, title: t.title }))}
        users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
      />
    </div>
  );
}
