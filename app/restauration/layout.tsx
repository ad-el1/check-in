import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Coffee, UtensilsCrossed } from "lucide-react";

const NAV: NavItem[] = [
  { href: "/restauration/petit-dejeuner", label: "Petit-déjeuner", icon: Coffee },
  { href: "/restauration/dejeuner", label: "Déjeuner", icon: UtensilsCrossed },
];

export default async function RestaurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getSessionRole();
  if (role !== "admin" && role !== "restauration") redirect("/login");
  return <AppShell nav={NAV} role={role}>{children}</AppShell>;
}
