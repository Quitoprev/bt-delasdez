import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BT Delas · Super 8",
  description: "Inscrições do torneio Super 8 de Beach Tennis — BT Delas Maceió · 13/12/2026, 15h",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
      { url: "/apple-touch-icon-167.png", sizes: "167x167" },
      { url: "/apple-touch-icon-152.png", sizes: "152x152" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BT Delas",
  },
  openGraph: {
    title: "BT Delas · Super 8 🎾",
    description: "Torneio Super 8 de Beach Tennis · 13/12/2026 às 15h · Top Sports Academy",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6A1A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
