"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getEventDay } from "@/lib/date";
import { QR_ROTATION_SECONDS } from "@/lib/config";
import { Loader2, WifiOff } from "lucide-react";

/**
 * Origine encodée dans le QR. On privilégie l'origine réelle du navigateur
 * (l'écran kiosque est servi depuis le domaine déployé) ; NEXT_PUBLIC_APP_URL
 * ne sert que de repli et on n'en garde que le schéma + l'hôte.
 */
function resolveOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

export function QrDisplay() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(100);
  const [count, setCount] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");
  const day = getEventDay();
  const tickRef = useRef<number>(0);

  useEffect(() => {
    setOrigin(resolveOrigin());
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch("/api/qr", { cache: "no-store" });
      if (!res.ok) throw new Error("qr");
      const data = (await res.json()) as { token: string };
      setToken(data.token);
      setError(false);
      tickRef.current = Date.now();
      setProgress(100);
    } catch {
      setError(true);
    }
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/presence-count", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      if (typeof data.count === "number") setCount(data.count);
    } catch {
      /* silencieux */
    }
  }, []);

  // Rotation du token
  useEffect(() => {
    fetchToken();
    const id = setInterval(fetchToken, QR_ROTATION_SECONDS * 1000);
    return () => clearInterval(id);
  }, [fetchToken]);

  // Barre de progression
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - tickRef.current) / 1000;
      const pct = Math.max(
        0,
        100 - (elapsed / QR_ROTATION_SECONDS) * 100,
      );
      setProgress(pct);
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Compteur de présences (polling — l'écran peut être public, sans session)
  useEffect(() => {
    fetchCount();
    const poll = setInterval(fetchCount, 5000);
    return () => clearInterval(poll);
  }, [fetchCount]);

  // Wake Lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        /* non supporté */
      }
    };
    request();
    const onVisibility = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => undefined);
    };
  }, []);

  const url = token && origin ? `${origin}/scan?token=${token}` : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-primary p-6 text-primary-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Check-in FSSM</h1>
        <p className="text-primary-foreground/80">
          Scannez ce QR code puis saisissez votre CNE
        </p>
      </div>

      <div className="relative rounded-2xl bg-white p-6 shadow-2xl">
        {url ? (
          <QRCodeSVG value={url} size={400} level="M" marginSize={2} />
        ) : (
          <div className="flex h-[400px] w-[400px] items-center justify-center text-primary">
            {error ? (
              <div className="flex flex-col items-center gap-2 text-destructive">
                <WifiOff className="h-12 w-12" />
                <span>Connexion perdue…</span>
              </div>
            ) : (
              <Loader2 className="h-12 w-12 animate-spin" />
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-[420px]">
        <div className="h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20">
          <div
            className="h-full bg-accent transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-primary-foreground/70">
          Nouveau code toutes les {QR_ROTATION_SECONDS} s
        </p>
      </div>

      <div className="rounded-xl bg-primary-foreground/10 px-8 py-4 text-center">
        <p className="text-5xl font-bold text-accent">
          {count ?? "—"}
        </p>
        <p className="text-sm text-primary-foreground/80">
          présents · Jour {day}
        </p>
      </div>
    </div>
  );
}
