import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listSubmissions, listSubmissionsForUser } from "@/lib/store/submissions";

export default async function SubmissionsPage() {
  const session = await getSession();
  if (!session) return null;

  const submissions = session.role === "ADMIN" ? await listSubmissions() : await listSubmissionsForUser(session.sub);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {session.role === "ADMIN" ? "Tous les audits" : "Mes audits"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Résultats</h1>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        {submissions.length === 0 && <p className="p-6 text-sm text-zinc-500">Aucun audit soumis pour le moment.</p>}
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/submissions/${s.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
            >
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">{s.templateTitle}</p>
                <p className="text-xs text-zinc-500">
                  {s.site} · {s.filledByName}
                </p>
              </div>
              <span className="text-xs text-zinc-500">{new Date(s.createdAt).toLocaleString("fr-FR")}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
