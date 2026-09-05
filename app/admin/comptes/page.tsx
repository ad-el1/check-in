import { ComptesClient } from "@/components/comptes-client";

export const dynamic = "force-dynamic";

export default function ComptesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comptes</h1>
        <p className="text-muted-foreground">
          Les 3 comptes de l&apos;application et leur rôle.
        </p>
      </div>
      <ComptesClient />
    </div>
  );
}
