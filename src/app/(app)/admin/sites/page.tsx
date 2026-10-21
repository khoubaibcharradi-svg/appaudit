import CreateSiteForm from "@/components/CreateSiteForm";
import { listSites, suggestNextSiteCode } from "@/lib/store/sites";

const TYPE_LABEL = { USINE: "Usine", DEPOT: "Dépôt" } as const;

export default async function SitesPage() {
  const sites = await listSites();
  const [usineCode, depotFixeCode, depotMobileCode] = await Promise.all([
    suggestNextSiteCode("USINE"),
    suggestNextSiteCode("DEPOT", "FIXE"),
    suggestNextSiteCode("DEPOT", "MOBILE"),
  ]);
  const nextCodeByKind: Record<string, string> = {
    USINE: usineCode,
    DEPOT_FIXE: depotFixeCode,
    DEPOT_MOBILE: depotMobileCode,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">Sites</h1>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Ajouter un site</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Usine, dépôt fixe ou dépôt mobile — le site apparaît ensuite dans les listes de choix à la
          création d&apos;une mission ou d&apos;un audit. Les magasins (entrepôt, camions) d&apos;un
          inventaire sont extraits directement de la photo SAP importée, pas gérés ici.
        </p>
        <div className="mt-4">
          <CreateSiteForm nextCodeByKind={nextCodeByKind} />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {sites.map((s) => (
            <div key={s.code} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-black dark:text-zinc-50">
                  {s.name} <span className="font-normal text-zinc-500">· {s.code}</span>
                </p>
                <p className="text-xs text-zinc-500">{s.region ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs font-medium dark:bg-white/[.1]">
                  {TYPE_LABEL[s.type]}
                </span>
                {s.type === "DEPOT" && (
                  <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs font-medium dark:bg-white/[.1]">
                    {s.nature === "MOBILE" ? "Mobile" : "Fixe"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
