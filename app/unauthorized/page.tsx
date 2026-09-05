import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FssmLogo } from "@/components/fssm-logo";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-secondary p-4 text-center">
      <FssmLogo />
      <ShieldX className="h-14 w-14 text-destructive" />
      <div>
        <h1 className="text-2xl font-bold">Accès non autorisé</h1>
        <p className="mt-1 text-muted-foreground">
          Votre compte n&apos;a pas les droits pour cette page.
        </p>
      </div>
      <Button asChild>
        <Link href="/login">Retour à la connexion</Link>
      </Button>
    </main>
  );
}
