"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth"; 

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result.success) {
      router.push("/");
      router.refresh(); 
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-base p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Iniciar Sesión</h1>
          <p className="text-muted text-sm mt-2">
            Ingresa al sistema de gestión de empleados
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-warning/10 border border-warning/20 text-warning text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 bg-base border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2 bg-base border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand hover:bg-brand-hover text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70"
          >
            {loading ? "Verificando credenciales..." : "Ingresar al Sistema"}
          </button>
        </form>
      </div>
    </main>
  );
}