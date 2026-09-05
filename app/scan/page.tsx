import { FssmLogo } from "@/components/fssm-logo";
import { ScanForm } from "@/components/scan-form";

export const dynamic = "force-dynamic";

export default function ScanPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? null;

  return (
    <main className="flex min-h-screen flex-col items-center bg-secondary px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <FssmLogo />
        </div>
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <h1 className="mb-1 text-xl font-bold text-primary">Check-in</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Saisissez votre CNE pour enregistrer votre présence.
          </p>
          <ScanForm token={token} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Comité d&apos;organisation · Rentrée FSSM 2026-2027
        </p>
      </div>
    </main>
  );
}
