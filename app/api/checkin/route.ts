import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCne, isValidCne } from "@/lib/cne";
import { getEventDay } from "@/lib/date";
import { QR_GRACE_SECONDS } from "@/lib/config";
import type { CheckinApiError } from "@/lib/types";

export const dynamic = "force-dynamic";

function err(code: CheckinApiError["code"], message: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * POST /api/checkin  body: { token: string, cne: string }
 * Valide le token (fenêtre de grâce), le membre, l'unicité (member_id, day).
 */
export async function POST(request: Request) {
  let body: { token?: unknown; cne?: unknown };
  try {
    body = await request.json();
  } catch {
    return err("BAD_REQUEST", "Requête invalide.", 400);
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const rawCne = typeof body.cne === "string" ? body.cne : "";
  const cne = normalizeCne(rawCne);

  if (!token) return err("TOKEN_INVALID", "QR code manquant.", 400);
  if (!cne || !isValidCne(cne))
    return err("BAD_REQUEST", "CNE invalide.", 400);

  try {
    const supabase = createAdminClient();
    const day = getEventDay();
    const nowMs = Date.now();

    // 1. Token
    const { data: tokenRow } = await supabase
      .from("qr_tokens")
      .select("token, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!tokenRow) return err("TOKEN_INVALID", "QR code invalide.", 401);

    const graceLimit =
      new Date(tokenRow.expires_at).getTime() + QR_GRACE_SECONDS * 1000;
    if (nowMs > graceLimit)
      return err("TOKEN_EXPIRED", "QR code expiré, scannez à nouveau.", 401);

    // 2. Membre
    const { data: member } = await supabase
      .from("members")
      .select("id, prenom, nom, active")
      .eq("cne", cne)
      .maybeSingle();

    if (!member || !member.active)
      return err(
        "CNE_UNKNOWN",
        "CNE non trouvé. Contactez l'organisateur.",
        404,
      );

    // 3. Insertion (l'unicité (member_id, day) protège du doublon)
    const { error: insertError } = await supabase
      .from("checkins")
      .insert({ member_id: member.id, day, method: "qr" });

    if (insertError) {
      if (insertError.code === "23505")
        return err(
          "ALREADY_CHECKED",
          "Vous êtes déjà enregistré aujourd'hui.",
          409,
        );
      console.error("checkin insert error", insertError);
      return err("SERVER_ERROR", "Erreur lors de l'enregistrement.", 500);
    }

    // Crée la ligne repas du jour si absente (ignore le conflit)
    await supabase
      .from("meals")
      .insert({ member_id: member.id, day })
      .then(undefined, () => undefined);

    return NextResponse.json({
      success: true,
      member: { prenom: member.prenom, nom: member.nom },
      day,
    });
  } catch (e) {
    console.error("checkin route error", e);
    return err("SERVER_ERROR", "Erreur serveur.", 500);
  }
}
