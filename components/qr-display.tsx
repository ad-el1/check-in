"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QR_ROTATION_SECONDS } from "@/lib/config";
import { Loader2, WifiOff } from "lucide-react";

/**
 * Origine encodée dans le QR : l'origine réelle du navigateur (l'écran est
 * servi depuis le domaine déployé) ; NEXT_PUBLIC_APP_URL sert de repli.
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

/** Écran QR épuré : uniquement le QR code + un fin indicateur de rotation. */
export function QrDisplay() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(100);
  const [origin, setOrigin] = useState("");
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

  useEffect(() => {
    fetchToken();
    const id = setInterval(fetchToken, QR_ROTATION_SECONDS * 1000);
    return () => clearInterval(id);
  }, [fetchToken]);

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - tickRef.current) / 1000;
      setProgress(Math.max(0, 100 - (elapsed / QR_ROTATION_SECONDS) * 100));
    }, 100);
    return () => clearInterval(id);
  }, []);

  const url = token && origin ? `${origin}/scan?token=${token}` : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="flex flex-col items-center gap-5">
        <div className="rounded-2xl border border-border p-5">
          {url ? (
            <QRCodeSVG
              value={url}
              size={440}
              level="M"
              marginSize={0}
              className="h-[min(78vw,440px)] w-[min(78vw,440px)]"
            />
          ) : (
            <div className="flex h-[min(78vw,440px)] w-[min(78vw,440px)] items-center justify-center">
              {error ? (
                <WifiOff className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
        </div>
        <div className="h-1 w-[min(78vw,440px)] overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-foreground/70 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
