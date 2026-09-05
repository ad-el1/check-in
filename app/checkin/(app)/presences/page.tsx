import { getEventDay } from "@/lib/date";
import { PresenceTable } from "@/components/presence-table";

export const dynamic = "force-dynamic";

export default function PresencesPage() {
  const day = getEventDay();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Présences — Jour {day}</h1>
        <p className="text-muted-foreground">
          Mise à jour en temps réel à chaque check-in.
        </p>
      </div>
      <PresenceTable day={day} />
    </div>
  );
}
