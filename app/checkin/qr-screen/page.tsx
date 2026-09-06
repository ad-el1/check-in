import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { QrDisplay } from "@/components/qr-display";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QrScreenPage() {
  const { role } = await getSessionRole();
  if (role !== "admin" && role !== "checkin") redirect("/login");

  const backHref =
    role === "admin" ? "/admin/dashboard" : "/checkin/presences";

  return (
    <div className="relative">
      <Link
        href={backHref}
        className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-md bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur transition-colors hover:bg-white/25"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>
      <QrDisplay />
    </div>
  );
}
