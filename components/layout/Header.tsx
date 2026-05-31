"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, User, LayoutDashboard } from "lucide-react";
import LogoutButton from "@/components/ui/LogoutButton";

export default function Header() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg text-foreground hover:text-brand transition-colors group"
        >
          <div className="gradient-brand rounded-lg p-1.5 flex items-center justify-center shadow-md shadow-brand/20">
            <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="hidden sm:inline">Gestor RRHH</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-hover"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover/80 border border-border/60">
            <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center shadow-sm shadow-brand/20">
              <User className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              Admin
            </span>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}