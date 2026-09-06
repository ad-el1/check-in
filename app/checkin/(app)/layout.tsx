import { getSessionRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function CheckinAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getSessionRole();
  return (
    <AppShell section="checkin" role={role ?? ""}>
      {children}
    </AppShell>
  );
}
