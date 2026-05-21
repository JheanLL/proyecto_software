import pool from "@/lib/db";
import Link from "next/link";
import { generarBoletasMes } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

export default async function BoletasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // Capturar mensajes de retorno en la URL de forma sutil
  const params = await searchParams;
  const errorMsg = params.error;
  const successMsg = params.success;

  // Consulta para listar el historial de boletas emitidas
  const [rows] = await pool.query(`
    SELECT 
      b.BoletaID,
      b.FechaBoleta,
      b.EmpCodigo,
      CONCAT(e.EmpNombres, ' ', e.EmpApellidoPaterno) AS EmpleadoNombre,
      b.SalarioBase,
      b.Gratificacion,
      b.TotalPago
    FROM BOLETA_PAGO b
    INNER JOIN EMPLEADO e ON b.EmpCodigo = e.EmpCodigo
    ORDER BY b.FechaBoleta DESC, b.BoletaID DESC
  `);

  const boletas = rows as any[];

  // Atajo de Server Action para manejar el clic del formulario
  const handleGenerar = async () => {
    "use server";
    const res = await generarBoletasMes();

    if (res.success) {
      redirect(`/boletas?success=${encodeURIComponent(res.message)}`);
    } else {
      redirect(`/boletas?error=${encodeURIComponent(res.message)}`);
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Historial de Planillas
          </h1>
          <p className="text-muted mt-1">
            Cierre mensual de remuneraciones y beneficios procesados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover text-sm font-medium shadow-sm"
          >
            &larr; Volver
          </Link>

          {/* Formulario rápido para ejecutar la acción sin usar 'use client' */}
          <form
            action={async () => {
              "use server";
              await handleGenerar();
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover text-sm font-medium shadow-sm transition-colors"
            >
              ⚙️ Procesar Planilla de Este Mes
            </button>
          </form>
        </div>
      </div>

      {/* Alertas de Respuesta */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm rounded-lg">
          {decodeURIComponent(successMsg)}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/20 text-warning text-sm rounded-lg">
          {decodeURIComponent(errorMsg)}
        </div>
      )}

      {/* Tabla del Historial */}
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Periodo</th>
                <th className="px-6 py-4 font-semibold">Código</th>
                <th className="px-6 py-4 font-semibold">Empleado</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Sueldo Base
                </th>
                <th className="px-6 py-4 font-semibold text-right">
                  Gratificación
                </th>
                <th className="px-6 py-4 font-semibold text-right">
                  Total Neto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {boletas.map((bol) => {
                const periodo = new Date(bol.FechaBoleta).toLocaleDateString(
                  "es-PE",
                  {
                    year: "numeric",
                    month: "long",
                    timeZone: "UTC",
                  },
                );

                return (
                  <tr
                    key={bol.BoletaID}
                    className="hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-foreground capitalize">
                      {periodo}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {bol.EmpCodigo}
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      {bol.EmpleadoNombre}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-foreground">
                      S/. {Number(bol.SalarioBase).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-emerald-600 font-medium">
                      {Number(bol.Gratificacion) > 0
                        ? `+ S/. ${Number(bol.Gratificacion).toFixed(2)}`
                        : "S/. 0.00"}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-foreground font-bold">
                      S/. {Number(bol.TotalPago).toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {boletas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    No hay registros de planillas cerradas. Presione el botón
                    superior para procesar el mes actual.
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
