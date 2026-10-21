"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

export default function ImportProductsForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez choisir un fichier.");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/products/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'import.");
      setSuccess(`${data.imported} article(s) importé(s) ou mis à jour.`);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-black/[.06] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-black hover:file:bg-black/[.1] dark:text-zinc-400 dark:file:bg-white/[.1] dark:file:text-zinc-50 dark:hover:file:bg-white/[.15]"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-full border border-black/[.12] px-4 py-1.5 text-sm font-medium hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[.2] dark:hover:bg-white/[.08]"
        >
          {saving ? "Import…" : "Importer"}
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Colonnes attendues (en-têtes insensibles à la casse) : Code article, Désignation, Famille,
        Colisage, Prix achat, Prix vente 1 à 6. Un article avec un code déjà existant est mis à
        jour plutôt que dupliqué.
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}
    </form>
  );
}
