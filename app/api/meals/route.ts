import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDay } from "@/lib/date";
import type { MealType } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/meals
 * body: { member_id: string, day?: number, meal_type: 'breakfast'|'lunch', value?: boolean }
 * Réservé restauration + admin. Upsert de la ligne meals du jour.
 */
export async function POST(request: Request) {
  const role = await requireRole(["admin", "restauration"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  let body: {
    member_id?: unknown;
    day?: unknown;
    meal_type?: unknown;
    value?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const memberId = typeof body.member_id === "string" ? body.member_id : "";
  const mealType = body.meal_type as MealType;
  const value = body.value === undefined ? true : Boolean(body.value);
  const day = resolveDay(typeof body.day === "number" ? body.day : undefined);

  if (!memberId || (mealType !== "breakfast" && mealType !== "lunch")) {
    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Vérifie la présence du membre ce jour
  const { data: present } = await supabase
    .from("checkins")
    .select("id")
    .eq("member_id", memberId)
    .eq("day", day)
    .maybeSingle();

  if (!present) {
    return NextResponse.json(
      { error: "Ce membre n'est pas enregistré présent aujourd'hui." },
      { status: 409 },
    );
  }

  const nowIso = new Date().toISOString();
  const patch =
    mealType === "breakfast"
      ? { breakfast: value, breakfast_at: value ? nowIso : null }
      : { lunch: value, lunch_at: value ? nowIso : null };

  const { error } = await supabase
    .from("meals")
    .upsert(
      { member_id: memberId, day, ...patch },
      { onConflict: "member_id,day" },
    );

  if (error) {
    console.error("meals upsert error", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
