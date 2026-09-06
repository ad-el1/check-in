import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { QrDisplay } from "@/components/qr-display";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QrScreenPage() {
  const { role } = await getSessionRole();
  if (role !== "admin" && role !== "checkin") redirect("/login");

  const backHref = role === "admin" ? "/admin/dashboard" : "/checkin/presences";

  return (
    <div className="relative">
      <Link
        href={backHref}
        className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>
      <p className="absolute right-4 top-4 z-10 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
        Écran public sans connexion : <b className="text-foreground">/ecran</b>
      </p>
      <QrDisplay />
    </div>
  );
}
