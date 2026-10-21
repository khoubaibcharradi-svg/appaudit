"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DepotNature, Site } from "@/lib/audit/types";

interface Props {
  sites: Site[];
}

export default function CreateStorageLocationForm({ sites }: Props) {
  const router = useRouter();
  const depots = sites.filter((s) => s.type === "DEPOT");
  const [siteCode, setSiteCode] = useState(depots[0]?.code ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nature, setNature] = useState<DepotNature>("FIXE");
  const [societe, setSociete] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/storage-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, siteCode, name, nature, societe: societe || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création.");
      setCode("");
      setName("");
      setSociete("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  if (depots.length === 0) {
    return <p className="text-sm text-zinc-500">Créez d&apos;abord un dépôt ci-dessus.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Dépôt (site parent)</span>
          <select
            value={siteCode}
            onChange={(e) => setSiteCode(e.target.value)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          >
            {depots.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Code magasin SAP</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex : C1, 50, 01-PFG"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Nom</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Camion 1"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Nature</span>
          <select
            value={nature}
            onChange={(e) => setNature(e.target.value as DepotNature)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          >
            <option value="FIXE">Fixe (entrepôt)</option>
            <option value="MOBILE">Mobile (camion)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Société (optionnel)</span>
          <input
            value={societe}
            onChange={(e) => setSociete(e.target.value)}
            placeholder="Ex : PXM, PMF, BSK"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Création…" : "Ajouter le magasin"}
      </button>
    </form>
  );
}
