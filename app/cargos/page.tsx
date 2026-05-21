import pool from '@/lib/db';
import Link from 'next/link';
import { modificarCargo } from '@/app/actions';

export default async function CargosPage() {
  const [rows] = await pool.query('SELECT AreCodigo, AreNombre, AreSalarioBase FROM T_Area');
  const cargos = rows as any[];

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Cargos</h1>
          <p className="text-gray-600">Actualiza los nombres y salarios base (RF02)</p>
        </div>
        <Link href="/" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition">
          Volver al Inicio
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 border-b text-left">ID</th>
              <th className="p-3 border-b text-left">Nombre del Cargo</th>
              <th className="p-3 border-b text-left">Salario Base (S/.)</th>
              <th className="p-3 border-b text-left">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargos.map((cargo) => (
              <tr key={cargo.AreCodigo} className="hover:bg-gray-50 border-b">
                <td className="p-3 text-gray-500">{cargo.AreCodigo}</td>
                <td colSpan={3} className="p-0">
                  {/* Convertimos cada fila en un formulario independiente */}
                  <form action={modificarCargo} className="flex w-full items-center">
                    <input type="hidden" name="areCodigo" value={cargo.AreCodigo} />
                    
                    <div className="w-1/3 p-2">
                      <input 
                        type="text" 
                        name="nombre" 
                        defaultValue={cargo.AreNombre} 
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="w-1/3 p-2">
                      <input 
                        type="number" 
                        step="0.01"
                        name="salario" 
                        defaultValue={Number(cargo.AreSalarioBase)} 
                        required
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="w-1/3 p-2">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm">
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}