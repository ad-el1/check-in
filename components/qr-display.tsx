"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { getEventDay } from "@/lib/date";
import { QR_ROTATION_SECONDS } from "@/lib/config";
import { Loader2, WifiOff } from "lucide-react";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (typeof window !== "undefined" ? window.location.origin : "");

export function QrDisplay() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(100);
  const [count, setCount] = useState<number | null>(null);
  const day = getEventDay();
  const tickRef = useRef<number>(0);

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
      const supabase = createClient();
      const { count: c } = await supabase
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("day", day);
      if (typeof c === "number") setCount(c);
    } catch {
      /* silencieux */
    }
  }, [day]);

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

  // Compteur de présences + realtime
  useEffect(() => {
    fetchCount();
    const supabase = createClient();
    const channel = supabase
      .channel("qr-screen-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins" },
        () => fetchCount(),
      )
      .subscribe();
    const poll = setInterval(fetchCount, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
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

  const url = token ? `${APP_URL}/scan?token=${token}` : "";

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
