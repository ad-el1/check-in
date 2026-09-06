import { NextResponse } from "next/server";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { QR_TTL_SECONDS, SCREEN_KEY } from "@/lib/config";

export const dynamic = "force-dynamic";

function keyMatches(provided: string | null): boolean {
  if (!SCREEN_KEY || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(SCREEN_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/qr — génère un token QR.
 * Autorisé si : session admin/checkin  OU  ?key=<SCREEN_KEY> valide.
 * Sinon 401 (empêche de récupérer un QR à distance sans le mot de passe écran).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viaKey = keyMatches(searchParams.get("key"));
    const viaSession = viaKey
      ? null
      : await requireRole(["admin", "checkin"]);

    if (!viaKey && !viaSession) {
      return NextResponse.json(
        { error: "Mot de passe de l'écran requis." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const supabase = createAdminClient();
    const now = Date.now();
    const token = randomUUID();
    const expiresAt = new Date(now + QR_TTL_SECONDS * 1000).toISOString();

    await supabase
      .from("qr_tokens")
      .delete()
      .lt("expires_at", new Date(now - 60_000).toISOString());

    const { error } = await supabase
      .from("qr_tokens")
      .insert({ token, expires_at: expiresAt });

    if (error) {
      console.error("qr insert error", error);
      return NextResponse.json(
        { error: "Impossible de générer le QR code." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { token, expires_at: expiresAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("qr route error", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
