import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCne, isValidCne } from "@/lib/cne";

export const dynamic = "force-dynamic";

/** PATCH /api/members/:id — modifie un membre (admin). */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const role = await requireRole(["admin"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.nom === "string") patch.nom = body.nom.trim();
  if (typeof body.prenom === "string") patch.prenom = body.prenom.trim();
  if (typeof body.filiere === "string" || body.filiere === null)
    patch.filiere = body.filiere ? String(body.filiere).trim() : null;
  if (typeof body.cne === "string") {
    const cne = normalizeCne(body.cne);
    if (!isValidCne(cne))
      return NextResponse.json({ error: "CNE invalide." }, { status: 400 });
    patch.cne = cne;
  }

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("members")
    .update(patch)
    .eq("id", params.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("member patch error", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
  return NextResponse.json({ success: true, member: data });
}
