import type { Role } from "./types";

const num = (v: string | undefined, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
};

/** Rotation VISUELLE du QR à l'écran (secondes). */
export const QR_ROTATION_SECONDS = num(process.env.QR_ROTATION_SECONDS, 5);
/**
 * Durée pendant laquelle un token reste acceptable après sa création :
 * TTL + grâce. Doit couvrir : scan + ouverture page + saisie du CNE.
 * Planchers de sécurité pour qu'une mauvaise config d'env ne casse rien.
 */
export const QR_TTL_SECONDS = Math.max(90, num(process.env.QR_TTL_SECONDS, 120));
export const QR_GRACE_SECONDS = Math.max(
  20,
  num(process.env.QR_GRACE_SECONDS, 30),
);

/**
 * Clé secrète de l'écran QR public.
 * `/ecran?key=<SCREEN_KEY>` et `/api/qr?key=<SCREEN_KEY>`.
 * Sans elle, seule une session admin/checkin peut générer un QR.
 */
export const SCREEN_KEY = process.env.SCREEN_KEY ?? "";

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
