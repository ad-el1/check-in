import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDay } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkin/manual  body: { member_id: string, day?: number }
 * Réservé admin. Marque un membre présent manuellement.
 */
export async function POST(request: Request) {
  const role = await requireRole(["admin"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  let body: { member_id?: unknown; day?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const memberId = typeof body.member_id === "string" ? body.member_id : "";
  if (!memberId)
    return NextResponse.json({ error: "member_id requis." }, { status: 400 });
  const day = resolveDay(
    typeof body.day === "number" ? body.day : undefined,
  );

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("checkins")
    .insert({ member_id: memberId, day, method: "manual" });

  if (error && error.code !== "23505") {
    console.error("manual checkin error", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  await supabase
    .from("meals")
    .insert({ member_id: memberId, day })
    .then(undefined, () => undefined);

  return NextResponse.json({ success: true, day, already: error?.code === "23505" });
}
