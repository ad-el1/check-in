"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "petit-dejeuner", label: "Petit-déjeuner", href: "/restauration/petit-dejeuner" },
  { key: "dejeuner", label: "Déjeuner", href: "/restauration/dejeuner" },
] as const;

export function RestaurationTabs({
  active,
}: {
  active: "petit-dejeuner" | "dejeuner";
}) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            active === t.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
