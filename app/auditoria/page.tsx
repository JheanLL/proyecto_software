import pool from "@/lib/db";
import Link from "next/link";

export const revalidate = 0;

export default async function AuditoriaPage() {
  // Consulta adaptada a HISTORIAL_MODIFICACIONES con JOINs para traer contexto amigable
  const [rows] = await pool.query(`
    SELECT 
      h.HistorialID,
      h.FechaModificacion,
      h.CampoModificado,
      h.ValorAnterior,
      h.ValorNuevo,
      h.EmpCodigo,
      u.UserNombre
    FROM HISTORIAL_MODIFICACIONES h
    LEFT JOIN USUARIO u ON h.UserCodigoHM = u.UserCodigo
    ORDER BY h.HistorialID DESC
  `);
  
  const registros = rows as any[];

  // Asignación de badges según la naturaleza exacta de la alteración
  const getBadgeStyle = (campo: string) => {
    const act = (campo || "").toLowerCase();
    
    // 1. Nuevos Empleados (Verde Esmeralda)
    if (act.includes("registro") || act.includes("alta"))
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      
    // 2. Temas de Dinero / Salarios (Azul)
    if (act.includes("salario") || act.includes("sueldo"))
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";

    // 3. Creación de nuevas Áreas (Verde Azulado / Teal)
    if (act.includes("creación") || act.includes("creacion"))
      return "bg-teal-500/10 text-teal-600 border-teal-500/20";

    // 4. Modificación de Áreas / Cargos existentes (Morado / Índigo)
    if (act.includes("área") || act.includes("area") || act.includes("modificación"))
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";

    // 5. Eliminaciones o Bajas (Rojo)
    if (act.includes("baja") || act.includes("elimin"))
      return "bg-red-500/10 text-red-600 border-red-500/20";

    // 6. Por defecto / Otros cambios (Gris Pizarra)
    return "bg-slate-500/10 text-slate-600 border-slate-500/20";
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
          <span aria-hidden="true">&larr;</span> Volver al tablero
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
                <th className="px-6 py-4 font-semibold">Usuario Realizó</th>
                <th className="px-6 py-4 font-semibold">Elemento Afectado</th>
                <th className="px-6 py-4 font-semibold">Detalle del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registros.map((reg) => {
                // Conversión temporal limpia basada en la configuración nativa de conexión
                const fecha = new Date(reg.FechaModificacion).toLocaleString("es-PE", {
                  timeZone: "America/Lima",
                });

                return (
                  <tr key={reg.HistorialID} className="hover:bg-surface-hover/50 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-4 font-mono text-muted text-xs">
                      #{String(reg.HistorialID).padStart(4, "0")}
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap text-foreground tabular-nums">
                      {fecha}
                    </td>

                    {/* Usuario */}
                    <td className="px-6 py-4 whitespace-nowrap text-foreground font-medium">
                      {reg.UserNombre || "Sistema / Init"}
                    </td>

                    {/* Acción / Campo Modificado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBadgeStyle(reg.CampoModificado)}`}>
                        {reg.CampoModificado}
                      </span>
                    </td>

                    {/* Detalle */}
                    <td className="px-6 py-4 text-muted min-w-75">
                      {reg.EmpCodigo ? (
                        <span>
                          Empleado <code className="text-xs bg-surface-hover px-1 py-0.5 rounded border font-mono">{reg.EmpCodigo}</code>: 
                          {reg.ValorAnterior ? ` Cambió de "${reg.ValorAnterior}" a "${reg.ValorNuevo}"` : ` ${reg.ValorNuevo}`}
                        </span>
                      ) : (
                        <span>{reg.ValorNuevo}</span>
                      )}
                      {reg.CampoModificado === "EmpSalario" && reg.ValorNuevo && isNaN(Number(reg.ValorNuevo)) && (
                        <div className="text-xs text-red-500 mt-1">Formato de valor inválido</div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Estado Vacío */}
              {registros.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-hover mb-3">
                      <span className="text-xl" role="img" aria-label="Escudo de seguridad">🛡️</span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground">Sistema sin alteraciones</h3>
                    <p className="text-sm text-muted mt-1">Aún no se han registrado eventos de modificación.</p>
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