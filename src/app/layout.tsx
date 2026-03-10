import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import "./globals.css";
import { LayoutSwitcher } from "@/components/LayoutSwitcher";

export const metadata: Metadata = {
  title: "MONITOREO | Club Rotario",
  description: "Sistema de seguimiento semanal de proyectos del Club Rotario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-slate-100 text-slate-900 antialiased flex flex-col`}>
        <LayoutSwitcher>{children}</LayoutSwitcher>
      </body>
    </html>
  );
}
