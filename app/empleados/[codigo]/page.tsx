import pool from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditEmployeeForm from "@/components/forms/EditEmployeeForm";

export const revalidate = 0;

export default async function PerfilEmpleadoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  // 1. Obtener la información base del empleado
  const [empRows] = await pool.query(
    "SELECT * FROM EMPLEADO WHERE EmpCodigo = ? AND activo = 1",
    [codigo],
  );
  const empleados = empRows as any[];
  if (empleados.length === 0) return redirect("/");
  const empleado = empleados[0];

  // 2. Obtener cargos para el selector
  const [areaRows] = await pool.query(
    "SELECT AreaID, AreaNombre, AreaSalario FROM AREA_TRABAJO WHERE activo = 1",
  );
  const areas = areaRows as any[];

  // 3. Obtener el historial exclusivo de salarios y cargos de este empleado
  const [historialRows] = await pool.query(
    `SELECT h.*, u.UserNombre 
   FROM HISTORIAL_MODIFICACIONES h
   LEFT JOIN USUARIO u ON h.UserCodigoHM = u.UserCodigo
   WHERE h.EmpCodigo = ? AND h.CampoModificado IN ('Ajuste Salarial', 'Cambio de Cargo / Área')
   ORDER BY h.FechaModificacion DESC, h.HistorialID DESC`,
    [codigo],
  );
  const historial = historialRows as any[];

  return (
    <main className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Expediente de Empleado
          </h1>
          <p className="text-muted text-sm mt-0.5">
            Edición general e histórico de movimientos.
          </p>
        </div>
        <Link
          href="/"
          className="px-3 py-1.5 text-xs bg-surface border border-border text-foreground rounded-md hover:bg-surface-hover transition-colors"
        >
          &larr; Volver
        </Link>
      </div>

      {/* Grid del Layout de Pantalla 50 / 50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Panel Izquierdo: Formulario */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Información del Personal
          </h2>
          <EditEmployeeForm empleado={empleado} areas={areas} />
        </div>

        {/* Panel Derecho: Historial */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Historial de Cargos y Salarios
          </h2>
          <div className="flow-root">
            <ul className="-mb-8">
              {historial.map((log, logIdx) => {
                const fechaStr = new Date(log.FechaModificacion).toLocaleString(
                  "es-PE",
                  {
                    timeZone: "America/Lima",
                  },
                );
                const isSalario =
                  log.CampoModificado.toLowerCase().includes("salario");

                return (
                  <li key={log.HistorialID}>
                    <div className="relative pb-8">
                      {logIdx !== historial.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span
                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-surface ${
                              isSalario
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-purple-500/10 text-purple-500"
                            }`}
                          >
                            {isSalario ? "💰" : "💼"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <p className="text-sm font-medium text-foreground">
                            {log.CampoModificado}
                          </p>
                          <div className="text-xs text-muted mt-1 space-y-0.5">
                            <p>
                              De:{" "}
                              <span className="font-mono bg-border/40 px-1 rounded">
                                {log.ValorAnterior || "Monto Base"}
                              </span>{" "}
                              &rarr; A:{" "}
                              <span className="font-mono bg-border/40 px-1 rounded text-foreground font-semibold">
                                {log.ValorNuevo}
                              </span>
                            </p>
                            <p className="text-[11px] text-muted/70 flex items-center gap-2 pt-0.5">
                              <span>📅 {fechaStr}</span>
                              <span>•</span>
                              <span>👤 {log.UserNombre || "Sistema"}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}

              {historial.length === 0 && (
                <div className="text-center py-12 text-muted text-sm">
                  <p>
                    No se han registrado modificaciones de sueldo o cargo para
                    este empleado.
                  </p>
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
