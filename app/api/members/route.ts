import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCne, isValidCne } from "@/lib/cne";

export const dynamic = "force-dynamic";

/** GET /api/members?q=... — liste (admin). */
export async function GET(request: Request) {
  const role = await requireRole(["admin"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("members")
    .select("*")
    .order("nom", { ascending: true });

  if (q) {
    query = query.or(
      `nom.ilike.%${q}%,prenom.ilike.%${q}%,cne.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("members list error", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
  return NextResponse.json({ members: data });
}

/**
 * POST /api/members
 * body: single { cne, nom, prenom, filiere? } OR { rows: [...] } pour import CSV.
 */
export async function POST(request: Request) {
  const role = await requireRole(["admin"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const rawRows = Array.isArray(body.rows) ? body.rows : [body];
  const cleaned: {
    cne: string;
    nom: string;
    prenom: string;
    filiere: string | null;
  }[] = [];
  const errors: string[] = [];

  const rows = rawRows as Record<string, unknown>[];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const cne = normalizeCne(String(r.cne ?? ""));
    const nom = String(r.nom ?? "").trim();
    const prenom = String(r.prenom ?? "").trim();
    const filiere = r.filiere ? String(r.filiere).trim() : null;
    if (!cne || !isValidCne(cne) || !nom || !prenom) {
      errors.push(`Ligne ${i + 1} ignorée (CNE/nom/prénom invalide).`);
      continue;
    }
    cleaned.push({ cne, nom, prenom, filiere });
  }

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne valide.", details: errors },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("members")
    .upsert(cleaned, { onConflict: "cne", ignoreDuplicates: false })
    .select();

  if (error) {
    console.error("members upsert error", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    inserted: data?.length ?? 0,
    skipped: errors,
  });
}
