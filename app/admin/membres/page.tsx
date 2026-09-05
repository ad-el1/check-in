import { MembresClient } from "@/components/membres-client";

export const dynamic = "force-dynamic";

export default function MembresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Membres</h1>
        <p className="text-muted-foreground">
          Liste du comité d&apos;organisation — ajout, import CSV, activation.
        </p>
      </div>
      <MembresClient />
    </div>
  );
}
