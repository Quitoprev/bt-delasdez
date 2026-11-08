import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BT Delas · Super 8",
  description: "Inscrições do torneio Super 8 de Beach Tennis — BT Delas Maceió",
  themeColor: "#FF6A1A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
