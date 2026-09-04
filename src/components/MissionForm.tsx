"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { KNOWN_SITES } from "@/lib/audit/types";

interface TemplateOption {
  id: string;
  title: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

interface Props {
  templates: TemplateOption[];
  users: UserOption[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MissionForm({ templates, users }: Props) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [site, setSite] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayIso());
  const [assignedTo, setAssignedTo] = useState(users[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, site, scheduledDate, assignedTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création de la mission.");
      router.push("/missions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la mission.");
    } finally {
      setSaving(false);
    }
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-black/[.08] bg-white p-6 text-sm dark:border-white/[.145] dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">
          Aucun formulaire n&apos;existe encore. Créez-en un d&apos;abord.
        </p>
        <Link
          href="/admin/templates/new"
          className="mt-3 inline-block rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Créer un formulaire
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Formulaire</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">
            Vous ne trouvez pas le bon formulaire ?{" "}
            <Link href="/admin/templates/new" className="underline">
              Créez-en un nouveau
            </Link>{" "}
            puis revenez ici pour créer la mission.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">Site à auditer</span>
          <input
            list="known-sites"
            required
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="Ex : Dépôt Jendouba"
            className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
          />
          <datalist id="known-sites">
            {KNOWN_SITES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black dark:text-zinc-50">Date de la mission</span>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-black dark:text-zinc-50">Affectée à</span>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="rounded-lg border border-black/[.12] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand dark:border-white/[.2] dark:focus:border-brand"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "PERSONNEL" ? "Personnel" : u.role === "ADMIN" ? "Admin" : "Superadmin"})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving || !site.trim()}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand px-5 font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {saving ? "Création…" : "Créer la mission"}
      </button>
    </form>
  );
}
