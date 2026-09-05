import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/accounts — liste des comptes (admin). */
export async function GET() {
  const role = await requireRole(["admin"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 50,
  });
  if (error) {
    console.error("listUsers error", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  const accounts = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: (u.user_metadata?.role as string) ?? "—",
    last_sign_in_at: u.last_sign_in_at,
  }));

  return NextResponse.json({ accounts });
}
