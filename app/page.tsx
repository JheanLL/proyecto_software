import pool from "@/lib/db";
import Link from "next/link";

export default async function Page() {
  const [rows] = await pool.query(`
    SELECT 
      e.EmpCodigo, e.EmpNombres, e.EmpApePaterno, a.AreNombre,
      TIMESTAMPDIFF(YEAR, e.EmpFechaNac, CURDATE()) AS EdadActual,
      c.ConFechaIngreso,
      COALESCE(c.ConSalarioModificado, a.AreSalarioBase) AS SalarioFinal
    FROM T_Empleado e
    INNER JOIN T_Area a ON e.AreCodigo = a.AreCodigo
    INNER JOIN T_CondicionLaboral c ON e.EmpCodigo = c.EmpCodigo
  `);

  const empleados = rows as any[];

  // RF01: Algoritmo exacto de antigüedad y beneficios
  const empleadosConCalculos = empleados.map((emp) => {
    const fechaIngreso = new Date(emp.ConFechaIngreso);
    const hoy = new Date();

    // Cálculo exacto: Años, Meses, Días
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

    // CORRECCIÓN: Prevenir negativos por la diferencia de zona horaria (UTC vs Perú)
    if (fechaIngreso > hoy || anios < 0) {
      anios = 0;
      meses = 0;
      dias = 0;
    }

    const antiguedadExacta = `${anios} años, ${meses} meses, ${dias} días`;
    return { ...emp, antiguedadExacta };
  });

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

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/cargos"
              className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm"
            >
              🏢 Gestión de Cargos
            </Link>
            <Link
              href="/auditoria"
              className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm"
            >
              📋 Ver Auditoría
            </Link>
            <a
              href="/api/informe"
              className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors font-medium text-sm shadow-sm"
            >
              📊 Informe General
            </a>
            <Link
              href="/empleados/nuevo"
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors font-medium text-sm shadow-sm"
            >
              + Nuevo Empleado
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Empleado</th>
                  <th className="px-6 py-4 font-semibold">Cargo</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Edad / Antigüedad Exacta
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Salario Mensual
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Beneficios
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {empleadosConCalculos.map((emp) => (
                  <tr
                    key={emp.EmpCodigo}
                    className="hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {emp.EmpNombres} {emp.EmpApePaterno}
                      </div>
                      <div className="text-muted text-xs mt-0.5 font-mono">
                        {emp.EmpCodigo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand">
                        {emp.AreNombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-foreground">
                        {emp.EdadActual} años
                      </div>
                      <div className="text-muted text-xs mt-0.5">
                        {emp.antiguedadExacta}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-medium text-success">
                      S/. {Number(emp.SalarioFinal).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-muted text-xs">
                      <div>Julio: S/. 300.00</div>
                      <div>Dic: S/. 300.00</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/empleados/${emp.EmpCodigo}`}
                          className="px-3 py-1.5 text-xs font-medium text-warning bg-warning/10 rounded-md hover:bg-warning/20 transition-colors"
                        >
                          Editar Salario
                        </Link>
                        <a
                          href={`/api/boleta/${emp.EmpCodigo}`}
                          className="px-3 py-1.5 text-xs font-medium text-success bg-success/10 rounded-md hover:bg-success/20 transition-colors"
                        >
                          Boleta
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
