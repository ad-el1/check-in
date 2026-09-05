import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "./types";

export function roleOf(user: User | null): Role | null {
  const r = user?.user_metadata?.role;
  return r === "admin" || r === "checkin" || r === "restauration" ? r : null;
}

/** Récupère l'utilisateur + rôle courants (côté serveur). */
export async function getSessionRole(): Promise<{
  user: User | null;
  role: Role | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, role: roleOf(user) };
}

/** Garde pour route handler : exige un des rôles. Renvoie le rôle ou null. */
export async function requireRole(allowed: Role[]): Promise<Role | null> {
  const { role } = await getSessionRole();
  return role && allowed.includes(role) ? role : null;
}
