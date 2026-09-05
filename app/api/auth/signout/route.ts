import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/config";

export async function POST() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", APP_URL), { status: 303 });
}
