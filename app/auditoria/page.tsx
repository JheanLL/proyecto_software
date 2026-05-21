import pool from "@/lib/db";
import Link from "next/link";

export default async function AuditoriaPage() {
  // Obtenemos los registros ordenados desde el más reciente
  const [rows] = await pool.query(
    "SELECT * FROM T_Auditoria ORDER BY AudFecha DESC",
  );
  const registros = rows as any[];

  // Función auxiliar para asignar colores a los badges según la palabra clave de la acción
  const getBadgeStyle = (accion: string) => {
    const act = accion.toLowerCase();
    if (act.includes("elimin"))
      return "bg-red-500/10 text-red-600 border-red-500/20";
    if (act.includes("modific") || act.includes("actualiz"))
      return "bg-warning/10 text-warning border-warning/20";
    if (act.includes("nuev") || act.includes("crea") || act.includes("insert"))
      return "bg-success/10 text-success border-success/20";
    return "bg-brand/10 text-brand border-brand/20";
  };

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-6xl mx-auto">
      {/* Header Moderno */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Registro de Auditoría
          </h1>
          <p className="text-muted mt-1">
            Historial inmutable de operaciones y cambios en la base de datos.
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm whitespace-nowrap"
        >
          &larr; Volver al tablero
        </Link>
      </div>

      {/* Tarjeta de la Tabla */}
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-24">ID Log</th>
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Acción</th>
                <th className="px-6 py-4 font-semibold">Tabla Afectada</th>
                <th className="px-6 py-4 font-semibold">Detalle del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registros.map((reg) => {
                const fecha = new Date(reg.AudFecha).toLocaleString("es-PE", {
                  timeZone: "America/Lima",
                });

                return (
                  <tr
                    key={reg.AudCodigo}
                    className="hover:bg-surface-hover/50 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-6 py-4 font-mono text-muted text-xs">
                      #{String(reg.AudCodigo).padStart(4, "0")}
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap text-foreground tabular-nums">
                      {fecha}
                    </td>

                    {/* Acción con Badge Dinámico */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyle(reg.AudAccion)}`}
                      >
                        {reg.AudAccion}
                      </span>
                    </td>

                    {/* Tabla Afectada */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-surface-hover border border-border text-muted">
                        {reg.AudTablaAfectada}
                      </span>
                    </td>

                    {/* Detalle */}
                    <td className="px-6 py-4 text-muted min-w-[300px]">
                      {reg.AudDetalle}
                    </td>
                  </tr>
                );
              })}

              {/* Estado Vacío */}
              {registros.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-hover mb-3">
                      <span className="text-xl">🛡️</span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground">
                      Sistema sin alteraciones
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      Aún no se han registrado eventos de modificación en la
                      base de datos.
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
