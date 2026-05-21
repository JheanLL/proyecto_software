"use client";

import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton() {
  const handleLogout = async () => {
    // 1. Borramos la cookie en el servidor
    await logoutAction();
    // 2. Forzamos la redirección nativa del navegador para limpiar cualquier caché
    window.location.href = "/login"; 
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-sm font-medium text-muted hover:text-red-500 transition-colors"
    >
      Cerrar Sesión
    </button>
  );
}