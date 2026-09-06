import { QrDisplay } from "@/components/qr-display";

export const dynamic = "force-dynamic";

/**
 * Écran QR PUBLIC (kiosque d'accueil) — aucune connexion requise.
 * À ouvrir en plein écran sur la tablette/laptop d'accueil.
 */
export default function EcranPublicPage() {
  return <QrDisplay />;
}
