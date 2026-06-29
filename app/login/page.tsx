"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    if (!password || password.trim() === "") {
      setError("La contraseña no puede estar vacía.");
      return;
    }

    setLoading(true);
    const result = await loginAction(formData);

    if (result.success) {
      // Usar window.location.href en lugar de router.push evita bugs de caché en el App Router
      // donde se queda colgado en "iniciando sesión" después de un pase a producción.
      window.location.href = "/";
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-base p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex gradient-brand rounded-2xl p-3 mb-4 shadow-lg shadow-brand/25">
            <Building2 className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Gestor RRHH
          </h1>
          <p className="text-muted text-sm mt-1.5">
            Sistema de gestión de empleados
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-8">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-3.5 bg-danger-light border border-danger/20 text-danger text-sm rounded-xl">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <Mail className="w-3.5 h-3.5 text-muted" />
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="admin@empresa.com"
                className="w-full px-4 py-2.5 bg-base border border-border rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-foreground placeholder:text-muted/50"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
                <Lock className="w-3.5 h-3.5 text-muted" />
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-base border border-border rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-foreground placeholder:text-muted/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 gradient-brand text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Ingresar al Sistema
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          &copy; {new Date().getFullYear()} Gestor RRHH. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}