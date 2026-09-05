"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MealType, PresentMealRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, Loader2, Search, Undo2 } from "lucide-react";

interface RawCheckin {
  member_id: string;
  checked_at: string;
  members: {
    cne: string;
    nom: string;
    prenom: string;
    filiere: string | null;
  } | null;
}

export function MealList({
  day,
  mealType,
}: {
  day: number;
  mealType: MealType;
}) {
  const [rows, setRows] = useState<PresentMealRow[] | null>(null);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<PresentMealRow | null>(null);
  const [pending, setPending] = useState(false);

  const label = mealType === "breakfast" ? "petit-déjeuner" : "déjeuner";

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: checkins }, { data: meals }] = await Promise.all([
      supabase
        .from("checkins")
        .select("member_id, checked_at, members(cne, nom, prenom, filiere)")
        .eq("day", day),
      supabase
        .from("meals")
        .select("member_id, breakfast, lunch")
        .eq("day", day),
    ]);

    const mealMap = new Map(
      (meals ?? []).map((m) => [
        m.member_id as string,
        { breakfast: !!m.breakfast, lunch: !!m.lunch },
      ]),
    );

    const merged: PresentMealRow[] = ((checkins ?? []) as unknown as RawCheckin[])
      .filter((c) => c.members)
      .map((c) => ({
        member_id: c.member_id,
        cne: c.members!.cne,
        nom: c.members!.nom,
        prenom: c.members!.prenom,
        filiere: c.members!.filiere,
        checked_at: c.checked_at,
        breakfast: mealMap.get(c.member_id)?.breakfast ?? false,
        lunch: mealMap.get(c.member_id)?.lunch ?? false,
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom));

    setRows(merged);
  }, [day]);

  useEffect(() => {
    setRows(null);
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`meals-${mealType}-${day}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meals" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [day, mealType, load]);

  const served = useMemo(
    () => (rows ?? []).filter((r) => r[mealType]).length,
    [rows, mealType],
  );

  const filtered = (rows ?? []).filter((r) => {
    if (!q) return true;
    return `${r.nom} ${r.prenom} ${r.cne}`
      .toLowerCase()
      .includes(q.toLowerCase());
  });

  async function confirm(value: boolean) {
    if (!target) return;
    setPending(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: target.member_id,
          day,
          meal_type: mealType,
          value,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erreur");
      }
      toast.success(
        value
          ? `${target.prenom} ${target.nom} — ${label} distribué`
          : `Annulé pour ${target.prenom} ${target.nom}`,
      );
      setTarget(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">
          {rows ? served : "…"}{" "}
          <span className="font-normal text-muted-foreground">
            / {rows?.length ?? "…"} servis
          </span>
        </p>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-2">
        {rows === null &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}

        {rows !== null && filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            Aucun membre présent à afficher.
          </p>
        )}

        {filtered.map((r) => {
          const done = r[mealType];
          return (
            <div
              key={r.member_id}
              className={`flex items-center justify-between gap-3 rounded-lg border bg-card p-3 ${
                done ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {r.nom} {r.prenom}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.cne} · {r.filiere ?? "—"}
                </p>
              </div>
              {done ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTarget(r)}
                  className="shrink-0 text-muted-foreground"
                >
                  <Undo2 className="h-4 w-4" />
                  Annuler
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setTarget(r)}
                  className="shrink-0"
                >
                  <Check className="h-4 w-4" />
                  Distribué
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!target}
        onOpenChange={(o) => !o && !pending && setTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target && target[mealType]
                ? "Annuler la distribution ?"
                : "Confirmer la distribution"}
            </DialogTitle>
            <DialogDescription>
              {target
                ? `${target.prenom} ${target.nom} — ${label} (Jour ${day})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={pending}
            >
              Retour
            </Button>
            {target && target[mealType] ? (
              <Button
                variant="destructive"
                onClick={() => confirm(false)}
                disabled={pending}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Annuler la distribution
              </Button>
            ) : (
              <Button onClick={() => confirm(true)} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
