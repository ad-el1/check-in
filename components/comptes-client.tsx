"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/date";
import { KeyRound, Loader2 } from "lucide-react";

interface Account {
  id: string;
  email: string | null;
  role: string;
  last_sign_in_at: string | null;
}

export function ComptesClient() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Account | null>(null);
  const [pwd, setPwd] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        if (d.accounts) setAccounts(d.accounts);
        else setError(d.error ?? "Erreur");
      })
      .catch(() => setError("Erreur de chargement"));
  }, []);

  async function reset() {
    if (!target) return;
    setPending(true);
    try {
      const res = await fetch("/api/accounts/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: target.id, password: pwd }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      toast.success(`Mot de passe mis à jour pour ${target.email}`);
      setTarget(null);
      setPwd("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  if (error)
    return (
      <p className="text-sm text-destructive">
        {error} — vérifiez la configuration Supabase.
      </p>
    );

  if (!accounts)
    return (
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{a.role}</Badge>
              </div>
              <p className="font-medium">{a.email}</p>
              <p className="text-xs text-muted-foreground">
                Dernière connexion :{" "}
                {a.last_sign_in_at
                  ? formatDateTime(a.last_sign_in_at)
                  : "jamais"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setTarget(a)}
              >
                <KeyRound className="h-4 w-4" />
                Réinitialiser le mot de passe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau mot de passe — {target?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-pwd">Mot de passe (8 caractères min.)</Label>
            <Input
              id="new-pwd"
              type="text"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Annuler
            </Button>
            <Button onClick={reset} disabled={pending || pwd.length < 8}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
