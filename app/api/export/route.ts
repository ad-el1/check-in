import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/export — liste de présence complète (CSV, admin). */
export async function GET() {
  const role = await requireRole(["admin"]);
  if (!role) return new Response("Non autorisé", { status: 403 });

  const supabase = createAdminClient();
  const [{ data: members }, { data: checkins }, { data: meals }] =
    await Promise.all([
      supabase
        .from("members")
        .select("id, cne, nom, prenom, filiere, active")
        .order("nom"),
      supabase.from("checkins").select("member_id, day, method"),
      supabase.from("meals").select("member_id, day, breakfast, lunch"),
    ]);

  const header = [
    "CNE",
    "Nom",
    "Prenom",
    "Filiere",
    "Actif",
    ...Array.from({ length: 7 }, (_, i) => `J${i + 1}_present`),
    "Total_jours",
    "Petits_dejeuners",
    "Dejeuners",
  ];

  const lines = [header.join(";")];

  for (const m of members ?? []) {
    const mc = (checkins ?? []).filter((c) => c.member_id === m.id);
    const mm = (meals ?? []).filter((x) => x.member_id === m.id);
    const days = Array.from({ length: 7 }, (_, i) =>
      mc.some((c) => c.day === i + 1) ? "1" : "0",
    );
    lines.push(
      [
        m.cne,
        m.nom,
        m.prenom,
        m.filiere ?? "",
        m.active ? "1" : "0",
        ...days,
        mc.length,
        mm.filter((x) => x.breakfast).length,
        mm.filter((x) => x.lunch).length,
      ]
        .map(csvEscape)
        .join(";"),
    );
  }

  const csv = "﻿" + lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="presences-fssm-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
