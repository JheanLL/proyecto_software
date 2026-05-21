import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ToastProvider from "@/components/ui/ToastProvider";
import LogoutButton from "@/components/ui/LogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestor de Empleados",
  description: "Una aplicación para gestionar empleados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="w-full p-4 flex justify-between items-center border-b border-border">
          <Link href="/" className="font-bold text-lg hover:text-brand transition-colors flex items-center gap-2">
            <span>🏢</span> Gestor
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="text-lg">👤</span>
              <span>Admin</span>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-grow w-full overflow-x-hidden p-4 md:p-8">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </body>
    </html>
  );
}
