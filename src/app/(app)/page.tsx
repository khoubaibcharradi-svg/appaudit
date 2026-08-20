import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { listActiveTemplates, listTemplates } from "@/lib/store/templates";
import { listSubmissions, listSubmissionsForUser } from "@/lib/store/submissions";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  if (isAdminRole(session.role)) {
    const [templates, submissions] = await Promise.all([listTemplates(), listSubmissions()]);
    const activeCount = templates.filter((t) => t.isActive).length;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Tableau de bord</p>
          <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">
            Bonjour {session.name.split(" ")[0]}
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Formulaires actifs" value={activeCount} />
          <StatCard label="Formulaires au total" value={templates.length} />
          <StatCard label="Audits soumis" value={submissions.length} />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/templates/new"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Créer un formulaire
            </Link>
            <Link
              href="/admin/templates"
              className="rounded-full border border-black/[.12] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.08]"
            >
              Gérer les formulaires
            </Link>
            <Link
              href="/submissions"
              className="rounded-full border border-black/[.12] px-4 py-2 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.08]"
            >
              Voir les résultats
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Derniers audits soumis</h2>
          <div className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
            {submissions.length === 0 && <p className="py-3 text-sm text-zinc-500">Aucun audit soumis pour le moment.</p>}
            {submissions.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={`/submissions/${s.id}`}
                className="flex items-center justify-between py-3 text-sm hover:opacity-70"
              >
                <span>
                  <span className="font-medium text-black dark:text-zinc-50">{s.templateTitle}</span>
                  <span className="text-zinc-500"> · {s.site}</span>
                </span>
                <span className="text-xs text-zinc-500">
                  {s.filledByName} · {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const [activeTemplates, mySubmissions] = await Promise.all([
    listActiveTemplates(),
    listSubmissionsForUser(session.sub),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Tableau de bord</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">
          Bonjour {session.name.split(" ")[0]}
        </h1>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Formulaires disponibles</h2>
        <div className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {activeTemplates.length === 0 && (
            <p className="py-3 text-sm text-zinc-500">Aucun formulaire actif pour le moment.</p>
          )}
          {activeTemplates.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">{t.title}</p>
                {t.description && <p className="text-xs text-zinc-500">{t.description}</p>}
              </div>
              <Link
                href={`/fill/${t.id}`}
                className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Remplir
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Mes derniers audits</h2>
        <div className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {mySubmissions.length === 0 && <p className="py-3 text-sm text-zinc-500">Vous n&apos;avez soumis aucun audit.</p>}
          {mySubmissions.slice(0, 5).map((s) => (
            <Link
              key={s.id}
              href={`/submissions/${s.id}`}
              className="flex items-center justify-between py-3 text-sm hover:opacity-70"
            >
              <span>
                <span className="font-medium text-black dark:text-zinc-50">{s.templateTitle}</span>
                <span className="text-zinc-500"> · {s.site}</span>
              </span>
              <span className="text-xs text-zinc-500">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
      <p className="text-2xl font-semibold text-black dark:text-zinc-50">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
