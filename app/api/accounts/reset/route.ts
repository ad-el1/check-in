import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/accounts/reset  body: { user_id: string, password: string }
 * Admin définit un nouveau mot de passe pour un compte.
 */
export async function POST(request: Request) {
  const role = await requireRole(["admin"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  let body: { user_id?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const userId = typeof body.user_id === "string" ? body.user_id : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!userId || password.length < 8) {
    return NextResponse.json(
      { error: "Mot de passe : 8 caractères minimum." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password,
  });
  if (error) {
    console.error("reset password error", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
