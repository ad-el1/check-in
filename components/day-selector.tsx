"use client";

import { EVENT_DAYS } from "@/lib/config";
import { cn } from "@/lib/utils";

export function DaySelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (d: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {EVENT_DAYS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={cn(
            "h-9 w-12 rounded-md border text-sm font-medium transition-colors",
            value === d
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-secondary",
          )}
        >
          J{d}
        </button>
      ))}
    </div>
  );
}
