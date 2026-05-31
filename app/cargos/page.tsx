import pool from "@/lib/db";
import Link from "next/link";
import NewCargoForm from "@/components/forms/NewCargoForm";
import EditCargoForm from "@/components/forms/EditCargoForm";
import { ArrowLeft, Briefcase } from "lucide-react";

export default async function CargosPage() {
  const [rows] = await pool.query(
    "SELECT AreaID, AreaNombre, AreaSalario FROM AREA_TRABAJO WHERE activo = 1",
  );
  const cargos = rows as unknown[];

  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gestión de Cargos
          </h1>
          <p className="text-muted mt-1">
            Crea y actualiza las áreas de trabajo.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface text-foreground border border-border rounded-xl hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al tablero
        </Link>
      </div>

      <NewCargoForm />

      <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-surface-hover/70 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-16 whitespace-nowrap">
                  ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider min-w-[140px] sm:min-w-[200px]">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Nombre del Cargo / Área
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider min-w-[120px] sm:min-w-[150px]">
                  Salario Base
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center w-24 sm:w-32 whitespace-nowrap">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cargos.map((cargo) => (
                <EditCargoForm key={cargo.AreaID} cargo={cargo} />
              ))}
              {cargos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center mb-3">
                      <Briefcase className="w-7 h-7 text-muted" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Sin cargos registrados
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      Crea tu primer cargo usando el formulario superior.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}