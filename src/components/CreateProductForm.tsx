"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const PRICE_FIELDS = [
  { key: "prixAchat", label: "Prix d'achat" },
  { key: "prixVente1", label: "Prix de vente 1" },
  { key: "prixVente2", label: "Prix de vente 2" },
  { key: "prixVente3", label: "Prix de vente 3" },
  { key: "prixVente4", label: "Prix de vente 4" },
  { key: "prixVente5", label: "Prix de vente 5" },
  { key: "prixVente6", label: "Prix de vente 6" },
] as const;

type PriceKey = (typeof PRICE_FIELDS)[number]["key"];

export default function CreateProductForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [designation, setDesignation] = useState("");
  const [famille, setFamille] = useState("");
  const [colisage, setColisage] = useState("");
  const [prices, setPrices] = useState<Record<PriceKey, string>>({
    prixAchat: "",
    prixVente1: "",
    prixVente2: "",
    prixVente3: "",
    prixVente4: "",
    prixVente5: "",
    prixVente6: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setCode("");
    setDesignation("");
    setFamille("");
    setColisage("");
    setPrices({
      prixAchat: "",
      prixVente1: "",
      prixVente2: "",
      prixVente3: "",
      prixVente4: "",
      prixVente5: "",
      prixVente6: "",
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          designation,
          famille: famille || undefined,
          colisage: colisage || undefined,
          ...prices,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création.");
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Code article</span>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex : 100123"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-1">
          <span className="font-medium text-black dark:text-zinc-50">Désignation</span>
          <input
            required
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Famille</span>
          <input
            value={famille}
            onChange={(e) => setFamille(e.target.value)}
            placeholder="Ex : Boissons"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Colisage</span>
          <input
            type="number"
            min="0"
            value={colisage}
            onChange={(e) => setColisage(e.target.value)}
            placeholder="Unités / colis"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {PRICE_FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black dark:text-zinc-50">{f.label}</span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={prices[f.key]}
              onChange={(e) => setPrices((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
            />
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Création…" : "Créer l'article"}
      </button>
    </form>
  );
}
