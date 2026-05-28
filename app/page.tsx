import pool from "@/lib/db";
import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { calcularGratificacion } from "@/actions/boletas";
import EmpleadosTable from "@/components/ui/EmpleadosTable";

export const dynamic = "force-dynamic";

export default async function Page() {
  let userName = "Usuario";
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      const SECRET_KEY = new TextEncoder().encode(
        process.env.JWT_SECRET ||
          "mi_clave_secreta_super_segura_para_desarrollo",
      );
      const { payload } = await jwtVerify(token, SECRET_KEY);
      userName = payload.userName as string;
    }
  } catch (error) {
    console.error("Error leyendo token en dashboard:", error);
  }

  const [rows] = await pool.query(`
    SELECT 
      e.EmpCodigo, e.EmpNombres, e.EmpApellidoPaterno, a.AreaNombre,
      TIMESTAMPDIFF(YEAR, e.EmpFechaNacimiento, CURDATE()) AS EdadActual,
      e.EmpFechaIngreso,
      COALESCE(e.EmpSalario, a.AreaSalario) AS SalarioFinal
    FROM EMPLEADO e
    INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    WHERE e.activo = 1
    ORDER BY CAST(SUBSTRING(e.EmpCodigo, 4) AS UNSIGNED) DESC  
`);

  const empleados = rows as any[];
  // const gratificacion = await calcularGratificacion(); // Esto fallaba porque requiere empCodigo

  const empleadosConCalculos = await Promise.all(empleados.map(async (emp) => {
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
  }));

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Gestión de Empleados
            </h1>
            <p className="text-muted mt-1">
              Administra la nómina, antigüedad y beneficios.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cargos"
                className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm"
              >
                <span aria-hidden="true" className="mr-1.5">
                  🏢
                </span>
                Gestión de Cargos
              </Link>
              <Link
                href="/auditoria"
                className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm"
              >
                <span aria-hidden="true" className="mr-1.5">
                  📋
                </span>
                Ver Auditoría
              </Link>
              <a
                href="/api/informe"
                className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors font-medium text-sm shadow-sm"
              >
                <span aria-hidden="true" className="mr-1.5">
                  📊
                </span>
                Descargar Informe de Operaciones
              </a>
              <Link
                href="/empleados/nuevo"
                className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors font-medium text-sm shadow-sm"
              >
                <span aria-hidden="true" className="mr-1.5">
                  +
                </span>
                Nuevo Empleado
              </Link>
            </div>
          </div>
        </div>

        <EmpleadosTable empleadosConCalculos={empleadosConCalculos} />
      </div>
    </main>
  );
}
