import { notFound, redirect } from "next/navigation";
import InventoryWorkspace from "@/components/InventoryWorkspace";
import { getSession } from "@/lib/auth/session";
import { canAccessInventory } from "@/lib/audit/permissions";
import { getInventory } from "@/lib/store/inventories";
import { getMission } from "@/lib/store/missions";

export default async function InventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const inventory = await getInventory(id);
  if (!inventory) notFound();

  const mission = await getMission(inventory.missionId);
  if (!mission || !canAccessInventory(session, mission)) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Inventaire</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">{inventory.site}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Mission du {new Date(mission.scheduledDate).toLocaleDateString("fr-FR")} · affectée à{" "}
          {mission.assignedToName}
        </p>
      </div>
      <InventoryWorkspace inventory={inventory} />
    </div>
  );
}
