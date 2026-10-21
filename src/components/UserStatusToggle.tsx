"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  email: string;
  isActive: boolean;
}

export default function UserStatusToggle({ email, isActive }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isActive: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la mise à jour.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          isActive
            ? "border-black/[.12] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.2] dark:text-zinc-300 dark:hover:bg-white/[.08]"
            : "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
        }`}
      >
        {saving ? "…" : isActive ? "Désactiver" : "Réactiver"}
      </button>
    </div>
  );
}
