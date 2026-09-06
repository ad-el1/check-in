import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "FSSM Check-in 2026",
  description:
    "Check-in du comité d'organisation — Rentrée FSSM 2026-2027, Université Cadi Ayyad.",
  manifest: "/manifest.json",
  // Favicon : app/icon.svg + app/apple-icon.png (détectés automatiquement).
};

export const viewport: Viewport = {
  themeColor: "#18181B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
