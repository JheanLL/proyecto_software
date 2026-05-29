import pool from "@/lib/db";
import Link from "next/link";
import { calcularGratificacion } from "@/actions/boletas";
import EmpleadosTable from "@/components/ui/EmpleadosTable";
import {
  Plus,
  Briefcase,
  ClipboardList,
  Download,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.EmpCodigo, e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno, a.AreaNombre,
        TIMESTAMPDIFF(YEAR, e.EmpFechaNacimiento, CURDATE()) AS EdadActual,
        e.EmpFechaIngreso,
        COALESCE(e.EmpSalario, a.AreaSalario) AS SalarioFinal
      FROM EMPLEADO e
      INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
      WHERE e.activo = 1
      ORDER BY CAST(SUBSTRING(e.EmpCodigo, 4) AS UNSIGNED) DESC  
    `);

    const empleados = rows as any[];

    const empleadosConCalculos = await Promise.all(
      empleados.map(async (emp) => {
        const gratificacion = await calcularGratificacion(emp.EmpCodigo);
        const fechaIngreso = new Date(emp.EmpFechaIngreso);
        const hoy = new Date();

        let anios = hoy.getFullYear() - fechaIngreso.getFullYear();
        let meses = hoy.getMonth() - fechaIngreso.getMonth();
        let dias = hoy.getDate() - fechaIngreso.getDate();

        if (dias < 0) {
          meses--;
          dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
        }
        if (meses < 0) {
          anios--;
          meses += 12;
        }

        if (fechaIngreso > hoy || anios < 0) {
          anios = 0;
          meses = 0;
          dias = 0;
        }

        const antiguedadExacta = `${anios} años, ${meses} meses, ${dias} días`;
        return { ...emp, antiguedadExacta, gratificacion };
      }),
    );

    return (
      <main className="min-h-screen p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Gestión de Empleados
                </h1>
                <p className="text-muted mt-1">
                  Administra la nómina, antigüedad y beneficios de tu equipo.
                </p>
              </div>

              <Link
                href="/empleados/nuevo"
                className="inline-flex items-center gap-2 px-5 py-2.5 gradient-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Nuevo Empleado
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {empleados.length}
                    </p>
                    <p className="text-xs text-muted font-medium">
                      Empleados activos
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
                    <Download className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Informe
                    </p>
                    <a
                      href="/api/informe"
                      className="text-xs text-brand hover:text-brand-hover font-medium transition-colors"
                    >
                      Descargar reporte &rarr;
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning-light flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Accesos rápidos
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Link
                        href="/cargos"
                        className="text-xs text-brand hover:text-brand-hover font-medium transition-colors"
                      >
                        Cargos
                      </Link>
                      <span className="text-border">|</span>
                      <Link
                        href="/auditoria"
                        className="text-xs text-brand hover:text-brand-hover font-medium transition-colors"
                      >
                        Auditoría
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <EmpleadosTable empleadosConCalculos={empleadosConCalculos} />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error cargando datos del dashboard:", error);
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Error de conexión
          </h2>
          <p className="text-muted text-sm">
            No se pudieron cargar los datos de los empleados. Revisa tu conexión
            a la base de datos o los logs en Vercel.
          </p>
        </div>
      </main>
    );
  }
}
