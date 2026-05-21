import pool from "@/lib/db";
import Link from "next/link";
import NewEmployeeForm from "@/components/NewEmployeeForm";

export default async function NuevoEmpleadoPage() {
  // Cambiado a la nueva tabla AREA_TRABAJO con sus columnas reales
  const [rows] = await pool.query(
    "SELECT AreaID, AreaNombre FROM AREA_TRABAJO",
  );
  const areas = rows as any[];

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-5xl mx-auto">
      {/* Header moderno con enlace de retroceso integrado */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
        >
          <span aria-hidden="true">&larr;</span> Volver al tablero
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Nuevo Empleado
        </h1>
        <p className="text-muted mt-1">
          Registra los datos personales y asigna el cargo inicial.
        </p>
      </div>

      <NewEmployeeForm areas={areas} />
    </main>
  );
}
