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
        <p className="rounded-md bg-accent/20 p-3 text-sm text-accent-foreground">
          Aucun QR détecté. Scannez le QR code affiché à l&apos;accueil.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="cne" className="text-base">
          Votre CNE
        </Label>
        <Input
          id="cne"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="Ex : R123456789"
          value={cne}
          onChange={(e) => setCne(e.target.value)}
          className="h-14 text-center text-xl tracking-widest"
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
      bg: "bg-[hsl(var(--success))]",
      icon: <CheckCircle2 className="h-16 w-16" />,
      title:
        result.kind === "success"
          ? `Bonjour ${result.prenom} !`
          : "Présence enregistrée",
      text: "Présence enregistrée. Bonne journée !",
    },
    expired: {
      bg: "bg-destructive",
      icon: <XCircle className="h-16 w-16" />,
      title: "QR code expiré",
      text: "Scannez à nouveau le QR code affiché à l'accueil.",
    },
    unknown: {
      bg: "bg-destructive",
      icon: <XCircle className="h-16 w-16" />,
      title: "CNE non trouvé",
      text: "Vérifiez votre CNE ou contactez l'organisateur.",
    },
    already: {
      bg: "bg-[#E65100]",
      icon: <AlertTriangle className="h-16 w-16" />,
      title: "Déjà enregistré",
      text: "Vous êtes déjà enregistré aujourd'hui.",
    },
    error: {
      bg: "bg-destructive",
      icon: <XCircle className="h-16 w-16" />,
      title: "Erreur",
      text: result.kind === "error" ? result.message : "Une erreur est survenue.",
    },
  }[result.kind];

  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-xl ${config.bg} p-8 text-center text-white`}
    >
      {config.icon}
      <h2 className="text-2xl font-bold">{config.title}</h2>
      <p className="text-white/90">{config.text}</p>
      <Button
        variant="secondary"
        className="mt-2"
        onClick={onRetry}
      >
        {result.kind === "success" ? "Nouveau check-in" : "Réessayer"}
      </Button>
    </div>
  );
}
