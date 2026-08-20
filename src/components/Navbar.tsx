"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Role } from "@/lib/auth/types";

interface Props {
  name: string;
  role: Role;
}

export default function Navbar({ name, role }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links =
    role === "ADMIN"
      ? [
          { href: "/", label: "Tableau de bord" },
          { href: "/admin/templates", label: "Formulaires" },
          { href: "/admin/users", label: "Utilisateurs" },
          { href: "/submissions", label: "Résultats" },
        ]
      : [
          { href: "/", label: "Tableau de bord" },
          { href: "/submissions", label: "Mes audits" },
        ];

  return (
    <header className="border-b border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-black dark:text-zinc-50">Audit App</span>
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-black dark:hover:text-zinc-50">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {name} ·{" "}
            <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs font-medium dark:bg-white/[.1]">
              {role === "ADMIN" ? "Admin" : "Personnel"}
            </span>
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full border border-black/[.12] px-3 py-1 text-xs font-medium transition-colors hover:bg-black/[.04] disabled:opacity-40 dark:border-white/[.2] dark:hover:bg-white/[.08]"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
