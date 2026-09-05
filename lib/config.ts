import type { Role } from "./types";

export const QR_ROTATION_SECONDS = Number(process.env.QR_ROTATION_SECONDS ?? 5);
export const QR_GRACE_SECONDS = Number(process.env.QR_GRACE_SECONDS ?? 10);
export const QR_TTL_SECONDS = Number(process.env.QR_TTL_SECONDS ?? 15);

export const EVENT_START_DATE =
  process.env.NEXT_PUBLIC_EVENT_START_DATE ?? "2026-09-08";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const EVENT_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Route par défaut après connexion selon le rôle. */
export const HOME_BY_ROLE: Record<Role, string> = {
  admin: "/admin/dashboard",
  checkin: "/checkin/presences",
  restauration: "/restauration/petit-dejeuner",
};

/** Préfixe de route -> rôles autorisés (admin toujours autorisé). */
export const ROUTE_GUARDS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/checkin", roles: ["admin", "checkin"] },
  { prefix: "/restauration", roles: ["admin", "restauration"] },
];
