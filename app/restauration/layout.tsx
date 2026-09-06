import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function RestaurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getSessionRole();
  if (role !== "admin" && role !== "restauration") redirect("/login");
  return (
    <AppShell section="restauration" role={role}>
      {children}
    </AppShell>
  );
}
