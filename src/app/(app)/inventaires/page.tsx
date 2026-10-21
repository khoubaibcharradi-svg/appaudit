import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/types";
import { listInventories, listInventoriesForUser } from "@/lib/store/inventories";

export default async function InventoriesPage() {
  const session = await getSession();
  if (!session) return null;

  const admin = isAdminRole(session.role);
  const inventories = admin ? await listInventories() : await listInventoriesForUser(session.sub);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {admin ? "Tous les inventaires" : "Mes inventaires"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Inventaires</h1>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        {inventories.length === 0 && (
          <p className="p-6 text-sm text-zinc-500">Aucun inventaire pour le moment.</p>
        )}
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {inventories.map((inv) => (
            <Link
              key={inv.id}
              href={`/inventaires/${inv.id}`}
              className="flex items-center justify-between gap-3 p-4 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
            >
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">{inv.site}</p>
                <p className="text-xs text-zinc-500">
                  {inv.selectedLocations.length} magasin(s) sélectionné(s) · créé par {inv.createdByName} le{" "}
                  {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  inv.status === "CLOTURE"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                }`}
              >
                {inv.status === "CLOTURE" ? "Clôturé" : "En cours"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
