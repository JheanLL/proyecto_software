import pool from '@/lib/db';
import Link from 'next/link';
import FormSalario from './FormSalario';
import { modificarSalario } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function PerfilEmpleadoPage({ params }: { params: { codigo: string } }) {
  const { codigo } = params;

  // Consultamos los datos actuales del empleado
  const [rows] = await pool.query(`
    SELECT e.EmpCodigo, e.EmpNombres, e.EmpApePaterno, a.AreNombre,
    COALESCE(c.ConSalarioModificado, a.AreSalarioBase) AS SalarioActual
    FROM T_Empleado e
    INNER JOIN T_Area a ON e.AreCodigo = a.AreCodigo
    INNER JOIN T_CondicionLaboral c ON e.EmpCodigo = c.EmpCodigo
    WHERE e.EmpCodigo = ?
  `, [codigo]);

  const empleados = rows as any[];
  
  if (empleados.length === 0) {
    return redirect('/'); // Si no existe, lo regresamos al inicio
  }

  const emp = empleados[0];

  // Envolvemos el Server Action para pasarlo al Client Component
  const updateAction = async (empCodigo: string, nuevoSalario: number) => {
    'use server';
    await modificarSalario(empCodigo, nuevoSalario);
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Perfil: {emp.EmpNombres} {emp.EmpApePaterno}</h1>
        <Link href="/" className="text-blue-600 hover:underline">&larr; Volver a la lista</Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Código</p>
            <p className="font-medium text-gray-800">{emp.EmpCodigo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cargo</p>
            <p className="font-medium text-gray-800">{emp.AreNombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Salario Actual</p>
            <p className="font-medium text-green-600 text-lg">S/. {Number(emp.SalarioActual).toFixed(2)}</p>
          </div>
        </div>

        {/* Aquí insertamos el componente cliente para el Requerimiento de Usabilidad */}
        <FormSalario 
          empCodigo={emp.EmpCodigo} 
          salarioActual={Number(emp.SalarioActual)} 
          modificarSalarioAction={updateAction} 
        />
      </div>
    </main>
  );
}