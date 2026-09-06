import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEventDay } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * GET /api/presence-count — nombre de présents du jour.
 * Public : sert au compteur de l'écran QR (qui peut être affiché sans session).
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const day = getEventDay();
    const { count } = await supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("day", day);
    return NextResponse.json(
      { count: count ?? 0, day },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ count: 0, day: getEventDay() }, { status: 200 });
  }
}
