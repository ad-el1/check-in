"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { getEventDay } from "@/lib/date";
import { StatsCard } from "@/components/stats-card";
import { DaySelector } from "@/components/day-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Users,
  Coffee,
  UtensilsCrossed,
  Percent,
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const FSSM_GREEN = "#1B5E20";
const FSSM_GOLD = "#F9A825";

interface Stats {
  day: number;
  totalActive: number;
  kpi: {
    presents: number;
    breakfasts: number;
    lunches: number;
    presenceRate: number;
    overallRate: number;
  };
  byDay: {
    day: number;
    label: string;
    presents: number;
    breakfasts: number;
    lunches: number;
  }[];
  arrivalsByHour: { hour: string; count: number }[];
  absents: {
    id: string;
    cne: string;
    nom: string;
    prenom: string;
    filiere: string | null;
  }[];
}

export function DashboardClient() {
  const [day, setDay] = useState(getEventDay());
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    const res = await fetch(`/api/stats?day=${d}`);
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    setStats(null);
    load(day);
  }, [day, load]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        () => load(day),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meals" },
        () => load(day),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [day, load]);

  async function markPresent(id: string, name: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/checkin/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: id, day }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${name} marqué présent`);
      load(day);
    } catch {
      toast.error("Erreur");
    } finally {
      setBusyId(null);
    }
  }

  const absents = (stats?.absents ?? []).filter((a) =>
    q
      ? `${a.nom} ${a.prenom} ${a.cne}`.toLowerCase().includes(q.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Statistiques temps réel — {stats?.totalActive ?? "…"} membres actifs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DaySelector value={day} onChange={setDay} />
          <Button variant="outline" asChild>
            <a href="/api/export">
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : (
          <>
            <StatsCard
              label={`Présents — J${day}`}
              value={stats.kpi.presents}
              sub={`${stats.kpi.presenceRate}% des membres`}
              icon={Users}
            />
            <StatsCard
              label="Petits-déjeuners"
              value={stats.kpi.breakfasts}
              sub={`J${day}`}
              icon={Coffee}
              accent
            />
            <StatsCard
              label="Déjeuners"
              value={stats.kpi.lunches}
              sub={`J${day}`}
              icon={UtensilsCrossed}
              accent
            />
            <StatsCard
              label="Taux présence global"
              value={`${stats.kpi.overallRate}%`}
              sub="Moyenne J1→J7"
              icon={Percent}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={`Arrivées par heure — J${day}`}>
          {!stats ? (
            <Skeleton className="h-[260px] w-full" />
          ) : stats.arrivalsByHour.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.arrivalsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="hour" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Arrivées"
                  stroke={FSSM_GREEN}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Présences par jour">
          {!stats ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="presents"
                  name="Présents"
                  fill={FSSM_GREEN}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Repas distribués par jour" className="lg:col-span-2">
          {!stats ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="breakfasts"
                  name="Petit-déjeuner"
                  fill={FSSM_GREEN}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="lunches"
                  name="Déjeuner"
                  fill={FSSM_GOLD}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Absents */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Absents — Jour {day}</CardTitle>
          <Input
            placeholder="Rechercher…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-48"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CNE</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {stats && absents.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Aucun absent 🎉
                    </TableCell>
                  </TableRow>
                )}
                {absents.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">
                      {a.cne}
                    </TableCell>
                    <TableCell className="font-medium">{a.nom}</TableCell>
                    <TableCell>{a.prenom}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.filiere ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === a.id}
                        onClick={() =>
                          markPresent(a.id, `${a.prenom} ${a.nom}`)
                        }
                      >
                        {busyId === a.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Marquer présent
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      Aucune donnée pour ce jour.
    </div>
  );
}
