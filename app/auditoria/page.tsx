import pool from '@/lib/db';
import Link from 'next/link';

export default async function AuditoriaPage() {
  // Consultamos el historial ordenado desde el más reciente
  const [rows] = await pool.query(`
    SELECT 
      AudCodigo, 
      AudTablaAfectada, 
      AudAccion, 
      AudDetalle, 
      AudFecha 
    FROM T_Auditoria 
    ORDER BY AudFecha DESC
  `);
  
  const registros = rows as any[];

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Registro de Auditoría</h1>
          <p className="text-gray-600">Historial de modificaciones en el sistema (RF02)</p>
        </div>
        <Link href="/" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition">
          Volver a Empleados
        </Link>
      </div>
      
      <div className="overflow-x-auto shadow-sm rounded-lg">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50 text-gray-700">
              <th className="p-3 border-b text-left">ID</th>
              <th className="p-3 border-b text-left">Fecha y Hora</th>
              <th className="p-3 border-b text-left">Acción</th>
              <th className="p-3 border-b text-left">Tabla Afectada</th>
              <th className="p-3 border-b text-left">Detalle del Cambio</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay modificaciones registradas todavía.
                </td>
              </tr>
            ) : (
              registros.map((reg) => (
                <tr key={reg.AudCodigo} className="hover:bg-gray-50 transition">
                  <td className="p-3 border-b text-gray-600">{reg.AudCodigo}</td>
                  <td className="p-3 border-b">
                    {new Date(reg.AudFecha).toLocaleString('es-PE', { 
                      timeZone: 'America/Lima' 
                    })}
                  </td>
                  <td className="p-3 border-b font-medium text-blue-600">{reg.AudAccion}</td>
                  <td className="p-3 border-b text-gray-600 font-mono text-sm">{reg.AudTablaAfectada}</td>
                  <td className="p-3 border-b text-gray-800">{reg.AudDetalle}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}