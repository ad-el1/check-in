import { EVENT_START_DATE, EVENT_TZ_OFFSET_HOURS } from "./config";

/** Minuit UTC de la date calendaire "sur le lieu de l'événement" pour l'instant d. */
function eventMidnightUTC(d: Date): number {
  const shifted = new Date(d.getTime() + EVENT_TZ_OFFSET_HOURS * 3_600_000);
  return Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
}

/**
 * Jour de l'événement (1..7) pour l'instant passé (par défaut maintenant),
 * calculé depuis EVENT_START_DATE dans le fuseau du lieu (Maroc = UTC+1).
 * Format de date invalide -> 1. Avant le début -> 1, après -> 7.
 */
export function getEventDay(now: Date = new Date()): number {
  const m = EVENT_START_DATE.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return 1;
  const startUTC = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const diffDays = Math.round(
    (eventMidnightUTC(now) - startUTC) / 86_400_000,
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
