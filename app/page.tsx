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

  // RF01: Cálculos automáticos en el servidor
  const empleadosConCalculos = empleados.map(emp => {
    const fechaIngreso = new Date(emp.ConFechaIngreso);
    const hoy = new Date();
    
    // Cálculo de antigüedad básica (Años)
    let antiguedadAnios = hoy.getFullYear() - fechaIngreso.getFullYear();
    
    // RF01: Beneficios (Gratificaciones fijas de S/. 300 x 2)
    const gratificacionTotal = 300 * 2; 

    return { ...emp, antiguedadAnios, gratificacionTotal };
  });

  return (
    <main className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Sistema de Gestión de Empleados</h1>
        
        {/* Enlaces de Navegación Global */}
        <div className="space-x-4">
          <Link href="/auditoria" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition">
            📋 Ver Auditoría
          </Link>
          <Link href="/empleados/nuevo" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
            + Nuevo Empleado
          </Link>
        </div>
      </div>
      
      <div className="overflow-x-auto shadow-sm rounded-lg">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 border-b">Código</th>
              <th className="p-3 border-b">Nombres</th>
              <th className="p-3 border-b">Cargo</th>
              <th className="p-3 border-b">Edad</th>
              <th className="p-3 border-b">Antigüedad</th>
              <th className="p-3 border-b">Salario Base</th>
              <th className="p-3 border-b">Beneficios (Grat.)</th>
              <th className="p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosConCalculos.map((emp) => (
              <tr key={emp.EmpCodigo} className="text-center hover:bg-gray-50 transition">
                <td className="p-3 border-b text-gray-600 font-medium">{emp.EmpCodigo}</td>
                <td className="p-3 border-b">{emp.EmpNombres} {emp.EmpApePaterno}</td>
                <td className="p-3 border-b text-gray-600">{emp.AreNombre}</td>
                <td className="p-3 border-b">{emp.EdadActual} años</td>
                <td className="p-3 border-b">{emp.antiguedadAnios} años</td>
                <td className="p-3 border-b font-medium text-green-700">S/. {Number(emp.SalarioFinal).toFixed(2)}</td>
                <td className="p-3 border-b text-blue-600">S/. {emp.gratificacionTotal.toFixed(2)}</td>
                
                {/* Botones de Acción por cada fila */}
                <td className="p-3 border-b space-x-2">
                  <Link 
                    href={`/empleados/${emp.EmpCodigo}`} 
                    className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition shadow-sm"
                  >
                    Editar Salario
                  </Link>
                  <a 
                    href={`/api/boleta/${emp.EmpCodigo}`} 
                    className="inline-block bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition shadow-sm"
                  >
                    Descargar Excel
                  </a>
                </td>
              </tr>
            ))}
            
            {empleadosConCalculos.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No hay empleados registrados. Haz clic en "Nuevo Empleado" para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}