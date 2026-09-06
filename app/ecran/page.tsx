import { EcranScreen } from "@/components/ecran-screen";

export const dynamic = "force-dynamic";

/**
 * Écran QR public (kiosque d'accueil), protégé par mot de passe (SCREEN_KEY).
 * `?key=<mot de passe>` pré-remplit ; sinon le navigateur le mémorise après
 * la première saisie.
 */
export default function EcranPublicPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  return <EcranScreen initialKey={searchParams.key} />;
}
