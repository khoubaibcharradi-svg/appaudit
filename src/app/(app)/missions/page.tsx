import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { listMissions, listMissionsForUser } from "@/lib/store/missions";

export default async function MissionsPage() {
  const session = await getSession();
  if (!session) return null;

  const admin = isAdminRole(session.role);
  const missions = admin ? await listMissions() : await listMissionsForUser(session.sub);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            {admin ? "Toutes les missions" : "Mes missions"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Missions d&apos;audit</h1>
        </div>
        {admin && (
          <Link
            href="/admin/missions/new"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            + Nouvelle mission
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        {missions.length === 0 && (
          <p className="p-6 text-sm text-zinc-500">
            {admin ? "Aucune mission créée pour le moment." : "Aucune mission ne vous est affectée pour le moment."}
          </p>
        )}
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {missions.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">{m.templateTitle}</p>
                <p className="text-xs text-zinc-500">
                  {m.site} · {new Date(m.scheduledDate).toLocaleDateString("fr-FR")}
                  {admin && <> · affectée à {m.assignedToName}</>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.status === "TERMINEE"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                  }`}
                >
                  {m.status === "TERMINEE" ? "Terminée" : "Planifiée"}
                </span>
                {m.status === "TERMINEE" && m.submissionId ? (
                  <Link
                    href={`/submissions/${m.submissionId}`}
                    className="rounded-full border border-black/[.12] px-3 py-1.5 text-xs font-medium hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.08]"
                  >
                    Voir le résultat
                  </Link>
                ) : (
                  (m.assignedTo === session.sub || admin) && (
                    <Link
                      href={`/fill/${m.templateId}?missionId=${m.id}`}
                      className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
                    >
                      Remplir
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
