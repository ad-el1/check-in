"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import type { Member } from "@/lib/types";
import { normalizeCne } from "@/lib/cne";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Search,
  Upload,
  UserPlus,
  Ban,
  RotateCcw,
} from "lucide-react";

const PAGE_SIZE = 20;

export function MembresClient() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const url = q ? `/api/members?q=${encodeURIComponent(q)}` : "/api/members";
    const res = await fetch(url);
    const d = await res.json();
    setMembers(d.members ?? []);
    setPage(0);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const all = members ?? [];
  const pageRows = all.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));

  async function toggleActive(m: Member) {
    setBusyId(m.id);
    try {
      const res = await fetch(`/api/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !m.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(m.active ? "Membre désactivé" : "Membre réactivé");
      load();
    } catch {
      toast.error("Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function markPresent(m: Member) {
    setBusyId(m.id);
    try {
      const res = await fetch("/api/checkin/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: m.id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success(
        d.already
          ? `${m.prenom} était déjà présent`
          : `${m.prenom} ${m.nom} marqué présent`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data
          .map((r) => {
            const get = (...keys: string[]) => {
              for (const k of Object.keys(r)) {
                if (keys.includes(k.trim().toLowerCase()))
                  return r[k]?.trim() ?? "";
              }
              return "";
            };
            return {
              cne: normalizeCne(get("cne", "code", "cin")),
              nom: get("nom", "name", "lastname"),
              prenom: get("prenom", "prénom", "firstname"),
              filiere: get("filiere", "filière", "filiere_", "branch"),
            };
          })
          .filter((r) => r.cne && r.nom && r.prenom);

        if (rows.length === 0) {
          toast.error("Aucune ligne valide (colonnes attendues : cne, nom, prenom, filiere).");
          return;
        }
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        const d = await res.json();
        if (!res.ok) {
          toast.error(d.error ?? "Import échoué");
          return;
        }
        toast.success(`${d.inserted} membre(s) importé(s)`);
        load();
      },
      error: () => toast.error("Lecture du fichier impossible"),
    });
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom ou CNE…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onImport}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Importer CSV
        </Button>
        <AddMemberDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onAdded={load}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CNE</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Filière</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members === null &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {members !== null && pageRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Aucun membre.
                </TableCell>
              </TableRow>
            )}
            {pageRows.map((m) => (
              <TableRow key={m.id} className={m.active ? "" : "opacity-50"}>
                <TableCell className="font-mono text-xs">{m.cne}</TableCell>
                <TableCell className="font-medium">{m.nom}</TableCell>
                <TableCell>{m.prenom}</TableCell>
                <TableCell className="text-muted-foreground">
                  {m.filiere ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={m.active ? "default" : "secondary"}>
                    {m.active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === m.id || !m.active}
                      onClick={() => markPresent(m)}
                    >
                      {busyId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Présent
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === m.id}
                      onClick={() => toggleActive(m)}
                    >
                      {m.active ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{all.length} membre(s)</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span>
            {page + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    cne: "",
    nom: "",
    prenom: "",
    filiere: "",
  });
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Erreur");
      toast.success("Membre ajouté");
      setForm({ cne: "", nom: "", prenom: "", filiere: "" });
      onOpenChange(false);
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Le CNE est normalisé automatiquement (majuscules, sans espaces).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {(["cne", "nom", "prenom", "filiere"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={k} className="capitalize">
                {k === "filiere" ? "Filière (optionnel)" : k}
              </Label>
              <Input
                id={k}
                required={k !== "filiere"}
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
