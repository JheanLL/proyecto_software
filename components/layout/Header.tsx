"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";

export default function Header() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
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
  );
}
