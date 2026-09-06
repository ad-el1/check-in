import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Endpoint de healthcheck (Railway). */
export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
