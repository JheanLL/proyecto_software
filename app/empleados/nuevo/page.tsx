import pool from "@/lib/db";
import Link from "next/link";
import NewEmployeeForm from "@/components/forms/NewEmployeeForm";
import { ArrowLeft, UserPlus } from "lucide-react";

export default async function NuevoEmpleadoPage() {
  const [rows] = await pool.query(
    "SELECT AreaID, AreaNombre FROM AREA_TRABAJO WHERE activo = 1",
  );
  const areas = rows as any[];

  return (
    <main className="min-h-screen p-6 md:p-8 lg:p-12 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al tablero
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-brand/25">
            <UserPlus className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Empleado
            </h1>
            <p className="text-muted mt-0.5">
              Registra los datos personales y asigna el cargo inicial.
            </p>
          </div>
        </div>
      </div>

      <NewEmployeeForm areas={areas} />
    </main>
  );
}