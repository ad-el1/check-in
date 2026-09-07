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
    .select("id, cne, nom, prenom, active, created_at")
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
 * body: single { cne, nom, prenom } OR { rows: [...] } pour import CSV.
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
  const cleaned: { cne: string; nom: string; prenom: string }[] = [];
  const errors: string[] = [];

  const rows = rawRows as Record<string, unknown>[];
  const seen = new Map<string, { cne: string; nom: string; prenom: string }>();
  let duplicates = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const cne = normalizeCne(String(r.cne ?? ""));
    const nom = String(r.nom ?? "").trim();
    const prenom = String(r.prenom ?? "").trim();
    if (!cne || !isValidCne(cne) || !nom || !prenom) {
      errors.push(`Ligne ${i + 1} ignorée (CNE/nom/prénom invalide).`);
      continue;
    }
    if (seen.has(cne)) duplicates++;
    seen.set(cne, { cne, nom, prenom }); // dernier gagne
  }
  cleaned.push(...seen.values());
  if (duplicates > 0) {
    errors.push(`${duplicates} doublon(s) de CNE dans le fichier (dernière occurrence conservée).`);
  }

  if (cleaned.length === 0) {
    return NextResponse.json(
      {
        error:
          "Aucune ligne valide. Colonnes attendues : cne, nom, prenom (séparateur , ou ;).",
        details: errors,
      },
      { status: 400 },
    );
  }

  // Upsert par lots ; en cas d'échec du lot, on retombe sur du ligne par ligne
  // pour ne pas tout perdre à cause d'une seule ligne fautive.
  let inserted = 0;
  const CHUNK = 200;
  for (let i = 0; i < cleaned.length; i += CHUNK) {
    const batch = cleaned.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("members")
      .upsert(batch, { onConflict: "cne", ignoreDuplicates: false })
      .select("id");

    if (!error) {
      inserted += data?.length ?? batch.length;
      continue;
    }

    console.error("members upsert batch error", error);
    for (const row of batch) {
      const { error: rowErr } = await supabase
        .from("members")
        .upsert(row, { onConflict: "cne", ignoreDuplicates: false });
      if (rowErr) {
        errors.push(`${row.cne} : ${rowErr.message}`);
      } else {
        inserted++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    inserted,
    skipped: errors,
  });
}
