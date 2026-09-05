import { createClient } from "@supabase/supabase-js";

/**
 * Client service_role — ignore la RLS.
 * À N'UTILISER QUE dans les route handlers serveur (jamais exposé au client).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
