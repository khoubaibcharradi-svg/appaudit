import CreateSiteForm from "@/components/CreateSiteForm";
import CreateStorageLocationForm from "@/components/CreateStorageLocationForm";
import { listSites, suggestNextSiteCode } from "@/lib/store/sites";
import { listStorageLocations } from "@/lib/store/storageLocations";

const TYPE_LABEL = { USINE: "Usine", DEPOT: "Dépôt" } as const;

export default async function SitesPage() {
  const [sites, locations] = await Promise.all([listSites(), listStorageLocations()]);
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
  const locationsBySite = new Map<string, typeof locations>();
  for (const l of locations) {
    if (!locationsBySite.has(l.siteCode)) locationsBySite.set(l.siteCode, []);
    locationsBySite.get(l.siteCode)!.push(l);
  }

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
          création d&apos;une mission ou d&apos;un audit.
        </p>
        <div className="mt-4">
          <CreateSiteForm nextCodeByKind={nextCodeByKind} />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Ajouter un magasin (camion ou entrepôt)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Chaque dépôt regroupe son entrepôt fixe et ses camions (dépôts mobiles) — ce sont ces
          magasins qui sont sélectionnés lors d&apos;un inventaire.
        </p>
        <div className="mt-4">
          <CreateStorageLocationForm sites={sites} />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {sites.map((s) => (
            <div key={s.code} className="p-4">
              <div className="flex items-center justify-between gap-3">
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
              {(locationsBySite.get(s.code)?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 pl-1">
                  {locationsBySite.get(s.code)!.map((l) => (
                    <span
                      key={l.code}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.nature === "MOBILE"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      }`}
                    >
                      {l.name} · {l.code}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
