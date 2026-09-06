import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getSessionRole();
  if (role !== "admin") redirect("/login");
  return (
    <AppShell section="admin" role={role}>
      {children}
    </AppShell>
  );
}
