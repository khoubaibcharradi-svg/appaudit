"use client";

import { useLayoutEffect, useState } from "react";

type Theme = "light" | "dark";

function resolveTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // Matches the inline script in the root layout — also re-applies the
  // attribute after React's Strict Mode dev remount clears it.
  useLayoutEffect(() => {
    const resolved = resolveTheme();
    document.documentElement.setAttribute("data-theme", resolved);
    // Server always renders "light" (see root layout), so correcting this
    // once on mount — before paint — can't produce a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolved);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/[.12] text-sm transition-colors hover:bg-black/[.04] dark:border-white/[.2] dark:hover:bg-white/[.08]"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
