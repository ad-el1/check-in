import { cn } from "@/lib/utils";

/** Logo texte (pas d'asset officiel — repère typographique sobre). */
export function FssmLogo({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
        F
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">FSSM Check-in</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            Rentrée 2026-2027 · UCA Marrakech
          </p>
        )}
      </div>
    </div>
  );
}
