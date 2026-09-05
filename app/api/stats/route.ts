import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDay } from "@/lib/date";

export const dynamic = "force-dynamic";

interface MemberLite {
  id: string;
  cne: string;
  nom: string;
  prenom: string;
  filiere: string | null;
}

/** GET /api/stats?day=N — agrégats pour le dashboard admin. */
export async function GET(request: Request) {
  const role = await requireRole(["admin"]);
  if (!role)
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const day = resolveDay(searchParams.get("day"));

  const supabase = createAdminClient();

  const [membersRes, checkinsRes, mealsRes] = await Promise.all([
    supabase.from("members").select("id, cne, nom, prenom, filiere").eq("active", true),
    supabase.from("checkins").select("member_id, day, checked_at"),
    supabase.from("meals").select("member_id, day, breakfast, lunch"),
  ]);

  if (membersRes.error || checkinsRes.error || mealsRes.error) {
    console.error(
      "stats error",
      membersRes.error || checkinsRes.error || mealsRes.error,
    );
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  const members = (membersRes.data ?? []) as MemberLite[];
  const checkins = checkinsRes.data ?? [];
  const meals = mealsRes.data ?? [];
  const totalActive = members.length;

  // Par jour (1..7)
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = i + 1;
    const dayCheckins = checkins.filter((c) => c.day === d);
    const dayMeals = meals.filter((m) => m.day === d);
    return {
      day: d,
      label: `J${d}`,
      presents: new Set(dayCheckins.map((c) => c.member_id)).size,
      breakfasts: dayMeals.filter((m) => m.breakfast).length,
      lunches: dayMeals.filter((m) => m.lunch).length,
    };
  });

  // Jour sélectionné
  const selectedCheckins = checkins.filter((c) => c.day === day);
  const presentIds = new Set(selectedCheckins.map((c) => c.member_id));
  const selectedMeals = meals.filter((m) => m.day === day);

  // Arrivées par heure
  const hours: Record<number, number> = {};
  for (const c of selectedCheckins) {
    const h = new Date(c.checked_at).getHours();
    hours[h] = (hours[h] ?? 0) + 1;
  }
  const arrivalsByHour = Object.keys(hours)
    .map(Number)
    .sort((a, b) => a - b)
    .map((h) => ({ hour: `${String(h).padStart(2, "0")}h`, count: hours[h] }));

  // Absents du jour
  const absents = members
    .filter((m) => !presentIds.has(m.id))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const presentsCount = presentIds.size;

  // Taux de présence global : moyenne des présents/jour sur total actifs
  const overallRate =
    totalActive > 0
      ? Math.round(
          (byDay.reduce((s, d) => s + d.presents, 0) /
            (byDay.length * totalActive)) *
            100,
        )
      : 0;

  return NextResponse.json({
    day,
    totalActive,
    kpi: {
      presents: presentsCount,
      breakfasts: selectedMeals.filter((m) => m.breakfast).length,
      lunches: selectedMeals.filter((m) => m.lunch).length,
      presenceRate:
        totalActive > 0
          ? Math.round((presentsCount / totalActive) * 100)
          : 0,
      overallRate,
    },
    byDay,
    arrivalsByHour,
    absents,
  });
}
