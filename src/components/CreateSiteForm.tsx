"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DepotNature, SiteType, siteCodePrefix } from "@/lib/audit/types";

interface Props {
  /** Next free code suggested per (type, nature) combo, e.g. { USINE: "USI-0002", DEPOT_FIXE: "DEPF-0004", DEPOT_MOBILE: "DEPM-0001" }. */
  nextCodeByKind: Record<string, string>;
}

function kindKey(type: SiteType, nature?: DepotNature): string {
  return type === "USINE" ? "USINE" : `DEPOT_${nature ?? "FIXE"}`;
}

export default function CreateSiteForm({ nextCodeByKind }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<SiteType>("DEPOT");
  const [nature, setNature] = useState<DepotNature>("FIXE");
  const [region, setRegion] = useState("");
  const [code, setCode] = useState(nextCodeByKind[kindKey("DEPOT", "FIXE")] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function applyKind(nextType: SiteType, nextNature: DepotNature) {
    const previousSuggestion = nextCodeByKind[kindKey(type, nature)];
    if (code === previousSuggestion) {
      setCode(nextCodeByKind[kindKey(nextType, nextNature)] ?? "");
    }
    setType(nextType);
    setNature(nextNature);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          nature: type === "DEPOT" ? nature : undefined,
          region: region || undefined,
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création.");
      setName("");
      setRegion("");
      setCode(nextCodeByKind[kindKey(type, nature)] ?? "");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Nom du site</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Dépôt Kairouan"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Type</span>
          <select
            value={type}
            onChange={(e) => applyKind(e.target.value as SiteType, nature)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          >
            <option value="DEPOT">Dépôt</option>
            <option value="USINE">Usine</option>
          </select>
        </label>
        {type === "DEPOT" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black dark:text-zinc-50">Nature</span>
            <select
              value={nature}
              onChange={(e) => applyKind(type, e.target.value as DepotNature)}
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
            >
              <option value="FIXE">Fixe</option>
              <option value="MOBILE">Mobile</option>
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Région (optionnel)</span>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Ex : Kairouan"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Code</span>
          <input
            required
            pattern={`${siteCodePrefix(type, type === "DEPOT" ? nature : undefined)}-\\d{4}`}
            title={`Format : ${siteCodePrefix(type, type === "DEPOT" ? nature : undefined)}-0000`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
          <span className="text-xs text-zinc-500">
            Format : {siteCodePrefix(type, type === "DEPOT" ? nature : undefined)}-0000
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Création…" : "Créer le site"}
      </button>
    </form>
  );
}
