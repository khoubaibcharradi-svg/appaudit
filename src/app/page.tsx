"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/audit/bank";
import { Depth } from "@/lib/audit/types";

const DEPTH_OPTIONS: { value: Depth; label: string; description: string }[] = [
  { value: "rapide", label: "Rapide", description: "3 questions par catégorie" },
  { value: "standard", label: "Standard", description: "5 questions par catégorie" },
  { value: "approfondi", label: "Approfondi", description: "8 questions par catégorie" },
];

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(CATEGORIES.map((c) => c.id));
  const [depth, setDepth] = useState<Depth>("standard");

  function toggleCategory(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function startAudit() {
    if (selected.length === 0) return;
    const params = new URLSearchParams({ categories: selected.join(","), depth });
    router.push(`/audit?${params.toString()}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Audit App</p>
        <h1 className="mt-1 text-2xl font-semibold text-black dark:text-zinc-50">
          Lancez un audit avec des questions générées dynamiquement
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Choisissez les catégories à évaluer et la profondeur de l&apos;audit. À chaque lancement,
          un nouveau jeu de questions est généré à partir de la banque de questions, et des
          questions de suivi apparaissent automatiquement selon vos réponses.
        </p>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Catégories</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/[.08] p-3 transition-colors hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.04]"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                <span>
                  <span className="block text-sm font-medium text-black dark:text-zinc-50">
                    {category.label}
                  </span>
                  <span className="block text-xs text-zinc-500">{category.description}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">Profondeur</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {DEPTH_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex-1 cursor-pointer rounded-xl border p-3 text-sm transition-colors ${
                  depth === option.value
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/[.08] hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.04]"
                }`}
              >
                <input
                  type="radio"
                  name="depth"
                  className="hidden"
                  checked={depth === option.value}
                  onChange={() => setDepth(option.value)}
                />
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs opacity-70">{option.description}</span>
              </label>
            ))}
          </div>
        </section>

        <button
          onClick={startAudit}
          disabled={selected.length === 0}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
        >
          Démarrer l&apos;audit
        </button>
      </main>
    </div>
  );
}
