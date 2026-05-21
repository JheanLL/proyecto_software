import pool from '@/lib/db';
import Link from 'next/link';

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

  const empleadosConCalculos = empleados.map(emp => {
    const fechaIngreso = new Date(emp.ConFechaIngreso);
    const hoy = new Date();
    let antiguedadAnios = hoy.getFullYear() - fechaIngreso.getFullYear();
    const gratificacionTotal = 300 * 2; 

    return { ...emp, antiguedadAnios, gratificacionTotal };
  });

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header de la vista */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Empleados</h1>
            <p className="text-muted mt-1">Administra la nómina, antigüedad y beneficios.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/auditoria" 
              className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm"
            >
              📋 Ver Auditoría
            </Link>
            <Link 
              href="/empleados/nuevo" 
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors font-medium text-sm shadow-sm"
            >
              + Nuevo Empleado
            </Link>
          </div>
        </div>
        
        {/* Tarjeta de la Tabla */}
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Empleado</th>
                  <th className="px-6 py-4 font-semibold">Cargo</th>
                  <th className="px-6 py-4 font-semibold text-center">Edad / Antigüedad</th>
                  <th className="px-6 py-4 font-semibold text-right">Salario Base</th>
                  <th className="px-6 py-4 font-semibold text-right">Beneficios</th>
                  <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {empleadosConCalculos.map((emp) => (
                  <tr key={emp.EmpCodigo} className="hover:bg-surface-hover/50 transition-colors">
                    
                    {/* Empleado (Código + Nombre) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{emp.EmpNombres} {emp.EmpApePaterno}</div>
                      <div className="text-muted text-xs mt-0.5 font-mono">{emp.EmpCodigo}</div>
                    </td>
                    
                    {/* Cargo (Estilo Badge) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand">
                        {emp.AreNombre}
                      </span>
                    </td>
                    
                    {/* Edad y Antigüedad agrupados para ahorrar espacio visual */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-foreground">{emp.EdadActual} años</div>
                      <div className="text-muted text-xs mt-0.5">{emp.antiguedadAnios} años en empresa</div>
                    </td>
                    
                    {/* Dinero alineado a la derecha y con fuente tabular */}
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-medium text-success">
                      S/. {Number(emp.SalarioFinal).toFixed(2)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums text-muted">
                      S/. {emp.gratificacionTotal.toFixed(2)}
                    </td>
                    
                    {/* Acciones limpias */}
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
                          ↓ Excel
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Estado vacío moderno */}
                {empleadosConCalculos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-hover mb-3">
                        <span className="text-xl">📁</span>
                      </div>
                      <h3 className="text-sm font-medium text-foreground">No hay empleados</h3>
                      <p className="text-sm text-muted mt-1">Comienza agregando un nuevo empleado al sistema.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}