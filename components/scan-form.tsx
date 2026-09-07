"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeCne, isValidCne } from "@/lib/cne";
import type { CheckinApiError, CheckinApiSuccess } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

type Result =
  | { kind: "success"; prenom: string }
  | { kind: "expired" }
  | { kind: "unknown" }
  | { kind: "already" }
  | { kind: "error"; message: string };

export function ScanForm({ token }: { token: string | null }) {
  const [cne, setCne] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const value = normalizeCne(cne);
    if (!isValidCne(value)) {
      setFormError("Format de CNE invalide.");
      return;
    }
    if (!token) {
      setResult({ kind: "expired" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, cne: value }),
      });
      const data = (await res.json()) as CheckinApiSuccess | CheckinApiError;
      if (res.ok && "success" in data) {
        setResult({ kind: "success", prenom: data.member.prenom });
        setCne("");
      } else {
        const code = (data as CheckinApiError).code;
        if (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID")
          setResult({ kind: "expired" });
        else if (code === "CNE_UNKNOWN") setResult({ kind: "unknown" });
        else if (code === "ALREADY_CHECKED") setResult({ kind: "already" });
        else
          setResult({
            kind: "error",
            message: (data as CheckinApiError).error ?? "Erreur.",
          });
      }
    } catch {
      setResult({
        kind: "error",
        message: "Connexion impossible. Vérifiez le réseau.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return <ResultScreen result={result} onRetry={() => setResult(null)} />;
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {!token && (
        <p className="rounded-md border border-border bg-secondary p-3 text-sm text-muted-foreground">
          Aucun QR détecté. Scannez le QR code affiché à l&apos;accueil.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="cne" className="text-base">
          Votre CNE <span className="font-normal text-muted-foreground">(lettre + chiffres)</span>
        </Label>
        <Input
          id="cne"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          placeholder="Ex : R123456789"
          value={cne}
          onChange={(e) => setCne(e.target.value.toUpperCase())}
          className="h-14 text-center text-xl uppercase tracking-widest"
        />
        {formError && (
          <p className="text-sm font-medium text-destructive">{formError}</p>
        )}
      </div>
      <Button
        type="submit"
        className="h-14 w-full text-lg"
        disabled={loading || !cne}
      >
        {loading && <Loader2 className="animate-spin" />}
        Valider ma présence
      </Button>
    </form>
  );
}

function ResultScreen({
  result,
  onRetry,
}: {
  result: Result;
  onRetry: () => void;
}) {
  const config = {
    success: {
      tone: "text-success",
      icon: <CheckCircle2 className="h-14 w-14" />,
      title:
        result.kind === "success"
          ? `Bonjour ${result.prenom}`
          : "Présence enregistrée",
      text: "Votre présence est enregistrée. Bonne journée.",
    },
    expired: {
      tone: "text-destructive",
      icon: <XCircle className="h-14 w-14" />,
      title: "QR code expiré",
      text: "Scannez à nouveau le QR code affiché à l'accueil.",
    },
    unknown: {
      tone: "text-destructive",
      icon: <XCircle className="h-14 w-14" />,
      title: "CNE non trouvé",
      text: "Vérifiez votre CNE ou contactez l'organisateur.",
    },
    already: {
      tone: "text-warning",
      icon: <AlertTriangle className="h-14 w-14" />,
      title: "Déjà enregistré",
      text: "Vous êtes déjà enregistré aujourd'hui.",
    },
    error: {
      tone: "text-destructive",
      icon: <XCircle className="h-14 w-14" />,
      title: "Erreur",
      text: result.kind === "error" ? result.message : "Une erreur est survenue.",
    },
  }[result.kind];

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <span className={config.tone}>{config.icon}</span>
      <h2 className="text-xl font-semibold">{config.title}</h2>
      <p className="text-sm text-muted-foreground">{config.text}</p>
      <Button variant="outline" className="mt-3" onClick={onRetry}>
        {result.kind === "success" ? "Nouveau check-in" : "Réessayer"}
      </Button>
    </div>
  );
}
