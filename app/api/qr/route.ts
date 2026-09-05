import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { QR_TTL_SECONDS } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/qr
 * Génère un token, le stocke (expires_at = now + TTL), purge les expirés.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const now = Date.now();
    const token = randomUUID();
    const expiresAt = new Date(now + QR_TTL_SECONDS * 1000).toISOString();

    // Purge des tokens expirés (best effort)
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
