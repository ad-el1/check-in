"use client";

import { useCallback, useEffect, useState } from "react";
import { QrDisplay } from "@/components/qr-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, LogOut } from "lucide-react";

const STORAGE_KEY = "fssm.screen.key";

/**
 * Écran QR public protégé par mot de passe.
 * Le mot de passe (SCREEN_KEY) est validé côté serveur par /api/qr et
 * mémorisé dans le navigateur de l'appareil (localStorage).
 */
export function EcranScreen({ initialKey }: { initialKey?: string }) {
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* localStorage indisponible */
    }
    setKey(initialKey || stored || null);
    setReady(true);
  }, [initialKey]);

  const clearStored = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setKey(null);
    setInput("");
  }, []);

  const forget = useCallback(() => {
    clearStored();
    setError("Mot de passe refusé. Réessayez.");
  }, [clearStored]);

  const logout = useCallback(() => {
    clearStored();
    setError(null);
  }, [clearStored]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const candidate = input.trim();
    if (!candidate) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/qr?key=${encodeURIComponent(candidate)}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Mot de passe incorrect.");
        return;
      }
      if (!res.ok) {
        setError("Erreur serveur, réessayez.");
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, candidate);
      } catch {
        /* ignore */
      }
      setKey(candidate);
    } catch {
      setError("Connexion impossible.");
    } finally {
      setChecking(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (key) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={logout}
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Déconnecter l&apos;écran
        </button>
        <QrDisplay screenKey={key} onUnauthorized={forget} />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4" />
          Écran de check-in
        </div>
        <div className="space-y-2">
          <Label htmlFor="screen-key">Mot de passe de l&apos;écran</Label>
          <Input
            id="screen-key"
            type="password"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={checking || !input}>
          {checking && <Loader2 className="h-4 w-4 animate-spin" />}
          Afficher le QR code
        </Button>
        <p className="text-xs text-muted-foreground">
          Une fois validé, ce navigateur retient le mot de passe.
        </p>
      </form>
    </main>
  );
}
