import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatsCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              accent
                ? "bg-accent/20 text-accent-foreground"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
