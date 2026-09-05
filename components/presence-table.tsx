"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/date";
import type { CheckinRow } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

interface RawRow {
  id: string;
  checked_at: string;
  method: "qr" | "manual";
  member_id: string;
  members: {
    cne: string;
    nom: string;
    prenom: string;
    filiere: string | null;
  } | null;
}

export function PresenceTable({ day }: { day: number }) {
  const [rows, setRows] = useState<CheckinRow[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("checkins")
        .select(
          "id, checked_at, method, member_id, members(cne, nom, prenom, filiere)",
        )
        .eq("day", day)
        .order("checked_at", { ascending: false }),
      supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
    ]);
    const mapped: CheckinRow[] = ((data ?? []) as unknown as RawRow[]).map(
      (r) => ({
        id: r.id,
        day,
        checked_at: r.checked_at,
        method: r.method,
        member_id: r.member_id,
        cne: r.members?.cne ?? "—",
        nom: r.members?.nom ?? "—",
        prenom: r.members?.prenom ?? "",
        filiere: r.members?.filiere ?? null,
      }),
    );
    setRows(mapped);
    setTotal(count ?? 0);
  }, [day]);

  useEffect(() => {
    setRows(null);
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`presences-${day}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [day, load]);

  const filtered = (rows ?? []).filter((r) => {
    if (!q) return true;
    const s = `${r.nom} ${r.prenom} ${r.cne}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          {rows ? filtered.length : "…"}{" "}
          <span className="font-normal text-muted-foreground">
            présents sur {total} membres
          </span>
        </div>
        <Input
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Filière</TableHead>
              <TableHead>Heure</TableHead>
              <TableHead>Méthode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {rows !== null && filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Aucun présent pour le moment.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nom}</TableCell>
                <TableCell>{r.prenom}</TableCell>
                <TableCell className="text-muted-foreground">
                  {r.filiere ?? "—"}
                </TableCell>
                <TableCell>{formatTime(r.checked_at)}</TableCell>
                <TableCell>
                  <Badge
                    variant={r.method === "qr" ? "default" : "secondary"}
                  >
                    {r.method === "qr" ? "QR" : "Manuel"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
