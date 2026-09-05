import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ROUTE_GUARDS, HOME_BY_ROLE } from "@/lib/config";
import type { Role } from "@/lib/types";

const PUBLIC_PATHS = ["/login", "/scan", "/unauthorized"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const role = (user?.user_metadata?.role ?? null) as Role | null;

  // Déjà connecté sur /login -> rediriger vers son espace
  if (pathname === "/login" && role) {
    return NextResponse.redirect(
      new URL(HOME_BY_ROLE[role] ?? "/login", request.url),
    );
  }

  if (isPublic) return response;

  // Racine -> espace du rôle ou login
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(role ? HOME_BY_ROLE[role] : "/login", request.url),
    );
  }

  const guard = ROUTE_GUARDS.find((g) => pathname.startsWith(g.prefix));
  if (!guard) return response;

  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!role || !guard.roles.includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|.*\\.png$).*)"],
};
