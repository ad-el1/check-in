"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FssmLogo } from "@/components/fssm-logo";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function AppShell({
  nav,
  role,
  children,
}: {
  nav: NavItem[];
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const links = (
    <nav className="flex flex-1 flex-col gap-1">
      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-secondary">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
        <div className="mb-6">
          <FssmLogo subtitle={false} />
        </div>
        {links}
        <div className="mt-auto space-y-2 pt-4">
          <p className="px-3 text-xs uppercase text-muted-foreground">
            Rôle : {role}
          </p>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Topbar mobile */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card p-3 md:hidden">
          <FssmLogo subtitle={false} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {open && (
          <div className="flex flex-col gap-2 border-b bg-card p-4 md:hidden">
            {links}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
