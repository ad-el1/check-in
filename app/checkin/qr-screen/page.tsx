import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { QrDisplay } from "@/components/qr-display";

export const dynamic = "force-dynamic";

export default async function QrScreenPage() {
  const { role } = await getSessionRole();
  if (role !== "admin" && role !== "checkin") redirect("/login");
  return <QrDisplay />;
}
