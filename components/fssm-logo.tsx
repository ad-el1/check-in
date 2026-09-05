import { cn } from "@/lib/utils";

/** Logo texte FSSM (pas d'asset officiel — placeholder typographique). */
export function FssmLogo({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
        F
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-primary">FSSM Check-in</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            Rentrée 2026-2027 · UCA Marrakech
          </p>
        )}
      </div>
    </div>
  );
}
