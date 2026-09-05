"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HOME_BY_ROLE } from "@/lib/config";
import type { Role } from "@/lib/types";
import { FssmLogo } from "@/components/fssm-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError("Email ou mot de passe incorrect.");
        return;
      }
      const role = (data.user?.user_metadata?.role ?? null) as Role | null;
      const next = params.get("next");
      const dest =
        next && next.startsWith("/")
          ? next
          : role
            ? HOME_BY_ROLE[role]
            : "/login";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <FssmLogo />
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fssm.ma"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Se connecter
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Comité d'organisation — accès réservé
        </p>
      </div>
    </main>
  );
}
