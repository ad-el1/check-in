import { EVENT_START_DATE } from "./config";

/** Minuit local pour une date donnée. */
function atMidnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Jour de l'événement (1..7) pour la date passée (par défaut aujourd'hui),
 * calculé depuis EVENT_START_DATE. Avant le début -> 1, après -> 7.
 */
export function getEventDay(now: Date = new Date()): number {
  const start = new Date(`${EVENT_START_DATE}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 1;
  const diffDays = Math.floor(
    (atMidnight(now) - atMidnight(start)) / 86_400_000,
  );
  return Math.min(7, Math.max(1, diffDays + 1));
}

/** Résout un paramètre `day` (query/route) sinon retombe sur le jour courant. */
export function resolveDay(param?: string | number | null): number {
  const n = typeof param === "string" ? parseInt(param, 10) : param;
  if (typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 7) return n;
  return getEventDay();
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
