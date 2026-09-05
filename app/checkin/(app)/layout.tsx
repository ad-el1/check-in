import { getSessionRole } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { QrCode, Users } from "lucide-react";

const NAV: NavItem[] = [
  { href: "/checkin/qr-screen", label: "Écran QR", icon: QrCode },
  { href: "/checkin/presences", label: "Présences", icon: Users },
];

export default async function CheckinAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getSessionRole();
  return <AppShell nav={NAV} role={role ?? ""}>{children}</AppShell>;
}
