"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

export default function LogoutButton() {
  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-danger transition-colors px-2 py-1.5 rounded-lg hover:bg-danger-light"
      title="Cerrar sesión"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Salir</span>
    </button>
  );
}