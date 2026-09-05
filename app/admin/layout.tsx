import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { LayoutDashboard, Users, KeyRound } from "lucide-react";

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/membres", label: "Membres", icon: Users },
  { href: "/admin/comptes", label: "Comptes", icon: KeyRound },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getSessionRole();
  if (role !== "admin") redirect("/login");
  return <AppShell nav={NAV} role={role}>{children}</AppShell>;
}
