import { NextResponse } from "next/server";
import { getEventDay } from "@/lib/date";
import { EVENT_START_DATE, EVENT_TZ_OFFSET_HOURS } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Healthcheck (Railway) + diagnostic du jour courant. */
export function GET() {
  return NextResponse.json({
    ok: true,
    day: getEventDay(),
    eventStartDate: EVENT_START_DATE,
    tzOffsetHours: EVENT_TZ_OFFSET_HOURS,
    serverTime: new Date().toISOString(),
  });
}
