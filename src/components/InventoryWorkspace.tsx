"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Inventory, PhysicalCount, Product, StorageLocation } from "@/lib/audit/types";

interface Props {
  inventory: Inventory;
  locations: StorageLocation[];
  products: Product[];
}

function countsToMap(counts: PhysicalCount[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of counts) map[`${c.locationCode}__${c.productCode}`] = String(c.quantity);
  return map;
}

export default function InventoryWorkspace({ inventory, locations, products }: Props) {
  const router = useRouter();
  const isOpen = inventory.status === "EN_COURS";
  const [selected, setSelected] = useState<string[]>(inventory.selectedLocations);
  const [counts, setCounts] = useState<Record<string, string>>(countsToMap(inventory.counts));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedLocations = useMemo(
    () => locations.filter((l) => selected.includes(l.code)),
    [locations, selected]
  );

  function toggleLocation(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  async function saveLocations() {
    setError(null);
    setNotice(null);
    setSaving("locations");
    try {
      const res = await fetch(`/api/inventories/${inventory.id}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationCodes: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'enregistrement.");
      setNotice("Sélection des magasins enregistrée.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(null);
    }
  }

  async function importPhoto() {
    setError(null);
    setNotice(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez choisir un fichier.");
      return;
    }
    setSaving("photo");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/inventories/${inventory.id}/photo`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'import.");
      setNotice(`${data.rows} ligne(s) importée(s) depuis la photo SAP.`);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import.");
    } finally {
      setSaving(null);
    }
  }

  async function saveCounts() {
    setError(null);
    setNotice(null);
    setSaving("counts");
    try {
      const payload: PhysicalCount[] = Object.entries(counts)
        .filter(([, v]) => v !== "")
        .map(([key, v]) => {
          const [locationCode, productCode] = key.split("__");
          return { locationCode, productCode, quantity: Number(v) };
        });
      const res = await fetch(`/api/inventories/${inventory.id}/counts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counts: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'enregistrement.");
      setNotice("Comptage enregistré.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(null);
    }
  }

  async function handleClose() {
    if (!confirm("Clôturer l'inventaire ? Le comptage et la sélection des magasins ne seront plus modifiables.")) {
      return;
    }
    setError(null);
    setSaving("close");
    try {
      const res = await fetch(`/api/inventories/${inventory.id}/close`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la clôture.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la clôture.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Magasins à inventorier</h2>
        {locations.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            Aucun magasin pour ce site. Ajoutez-en depuis « Sites » dans le menu admin.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {locations.map((l) => (
                <label
                  key={l.code}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected.includes(l.code)
                      ? "border-brand bg-brand text-white"
                      : "border-black/[.12] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.2] dark:text-zinc-300 dark:hover:bg-white/[.08]"
                  } ${!isOpen ? "pointer-events-none opacity-70" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(l.code)}
                    onChange={() => toggleLocation(l.code)}
                    disabled={!isOpen}
                    className="sr-only"
                  />
                  {l.name} ({l.nature === "MOBILE" ? "mobile" : "fixe"})
                </label>
              ))}
            </div>
            {isOpen && (
              <button
                onClick={saveLocations}
                disabled={saving === "locations"}
                className="mt-4 rounded-full border border-black/[.12] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-40 dark:border-white/[.2] dark:hover:bg-white/[.08]"
              >
                {saving === "locations" ? "Enregistrement…" : "Enregistrer la sélection"}
              </button>
            )}
          </>
        )}
      </div>

      {isOpen && (
        <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Photo SAP</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Fichier Excel/CSV avec les colonnes Société, Code magasin, Code article, Désignation, Qté
            SAP, CMUP — comme votre feuille « Photo SAP ». Utilisé uniquement au rapprochement, pas
            affiché pendant le comptage (comptage à l&apos;aveugle).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-black/[.06] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-black hover:file:bg-black/[.1] dark:text-zinc-400 dark:file:bg-white/[.1] dark:file:text-zinc-50 dark:hover:file:bg-white/[.15]"
            />
            <button
              onClick={importPhoto}
              disabled={saving === "photo"}
              className="rounded-full border border-black/[.12] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-40 dark:border-white/[.2] dark:hover:bg-white/[.08]"
            >
              {saving === "photo" ? "Import…" : "Importer"}
            </button>
            <span className="text-xs text-zinc-500">
              {inventory.sapPhoto.length > 0 ? `${inventory.sapPhoto.length} ligne(s) importée(s)` : "Aucune photo importée"}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Comptage à l&apos;aveugle</h2>
        {selectedLocations.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Sélectionnez au moins un magasin ci-dessus.</p>
        ) : products.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            Aucun article dans le catalogue produits. Ajoutez-en depuis « Produits » dans le menu admin.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/[.08] dark:border-white/[.145]">
                  <th className="px-2 py-2 text-left font-medium text-zinc-500">Article</th>
                  {selectedLocations.map((l) => (
                    <th key={l.code} className="px-2 py-2 text-left font-medium text-zinc-500">
                      {l.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.code} className="border-b border-black/[.06] dark:border-white/[.08]">
                    <td className="px-2 py-2">
                      <p className="text-black dark:text-zinc-50">{p.designation}</p>
                      <p className="text-xs text-zinc-500">{p.code}</p>
                    </td>
                    {selectedLocations.map((l) => {
                      const key = `${l.code}__${p.code}`;
                      return (
                        <td key={l.code} className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            disabled={!isOpen}
                            value={counts[key] ?? ""}
                            onChange={(e) => setCounts((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder="Qté"
                            className="w-20 rounded-lg border border-black/[.12] bg-transparent px-2 py-1 text-sm outline-none focus:border-brand disabled:opacity-60 dark:border-white/[.2] dark:focus:border-brand"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {isOpen && selectedLocations.length > 0 && products.length > 0 && (
          <button
            onClick={saveCounts}
            disabled={saving === "counts"}
            className="mt-4 rounded-full border border-black/[.12] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:opacity-40 dark:border-white/[.2] dark:hover:bg-white/[.08]"
          >
            {saving === "counts" ? "Enregistrement…" : "Enregistrer le comptage"}
          </button>
        )}
      </div>

      {isOpen && (
        <button
          onClick={handleClose}
          disabled={saving === "close"}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand px-5 font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {saving === "close" ? "Clôture…" : "Clôturer l'inventaire"}
        </button>
      )}

      {inventory.status === "CLOTURE" && inventory.rapprochement && (
        <>
          <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Rapprochement physique / SAP</h2>
              <span className="text-xs text-zinc-500">
                Clôturé par {inventory.closedByName} le{" "}
                {inventory.closedAt && new Date(inventory.closedAt).toLocaleString("fr-FR")}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Écart net valorisé" value={`${inventory.rapprochement.totals.ecartNetValorise.toFixed(3)} DT`} />
              <StatTile label="Total des manquants" value={`${inventory.rapprochement.totals.totalManquants.toFixed(3)} DT`} />
              <StatTile label="Total des excédents" value={`${inventory.rapprochement.totals.totalExcedents.toFixed(3)} DT`} />
              <StatTile
                label="Articles SAP hors liste"
                value={String(inventory.rapprochement.totals.articlesSapHorsListe)}
              />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-sm">
                <thead>
                  <tr className="border-b border-black/[.08] text-left text-zinc-500 dark:border-white/[.145]">
                    <th className="px-2 py-2 font-medium">Article</th>
                    <th className="px-2 py-2 font-medium">Qté SAP</th>
                    <th className="px-2 py-2 font-medium">Qté physique</th>
                    <th className="px-2 py-2 font-medium">Écart qté</th>
                    <th className="px-2 py-2 font-medium">Écart valorisé</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.rapprochement.lines.map((l) => (
                    <tr key={l.codeArticle} className="border-b border-black/[.06] dark:border-white/[.08]">
                      <td className="px-2 py-2">
                        <p className="text-black dark:text-zinc-50">{l.designation}</p>
                        <p className="text-xs text-zinc-500">{l.codeArticle}</p>
                      </td>
                      <td className="px-2 py-2">{l.qteSapTotale}</td>
                      <td className="px-2 py-2">{l.qtePhysiqueTotale}</td>
                      <td className={`px-2 py-2 ${l.ecartQte < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                        {l.ecartQte}
                      </td>
                      <td className={`px-2 py-2 ${l.ecartValorise < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                        {l.ecartValorise.toFixed(3)} DT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {inventory.rapprochement.topEcarts.length > 0 && (
            <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
              <h2 className="text-sm font-semibold text-black dark:text-zinc-50">
                Top {inventory.rapprochement.topEcarts.length} articles les plus manquants en valeur
              </h2>
              <div className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
                {inventory.rapprochement.topEcarts.map((l, i) => (
                  <div key={l.codeArticle} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <span className="text-xs text-zinc-500">#{i + 1}</span> {l.designation}{" "}
                      <span className="text-xs text-zinc-500">· {l.codeArticle}</span>
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">{l.ecartValorise.toFixed(3)} DT</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[.08] p-3 dark:border-white/[.145]">
      <p className="text-lg font-semibold text-black dark:text-zinc-50">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
