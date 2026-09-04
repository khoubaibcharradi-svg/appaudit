"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Role } from "@/lib/auth/types";

interface Props {
  /** Only a SUPERADMIN may grant ADMIN/SUPERADMIN rights; a plain ADMIN can only onboard PERSONNEL. */
  canGrantAdmin: boolean;
}

export default function CreateUserForm({ canGrantAdmin }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PERSONNEL");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création.");
      setName("");
      setEmail("");
      setPassword("");
      setRole("PERSONNEL");
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
          <span className="font-medium text-black dark:text-zinc-50">Nom complet</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Mot de passe</span>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Rôle</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          >
            <option value="PERSONNEL">Personnel (remplit les audits)</option>
            {canGrantAdmin && (
              <>
                <option value="ADMIN">Admin (crée les formulaires)</option>
                <option value="SUPERADMIN">Superadmin (accès complet)</option>
              </>
            )}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Création…" : "Créer l'utilisateur"}
      </button>
    </form>
  );
}
