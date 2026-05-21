import pool from '@/lib/db';
import { agregarEmpleado } from '@/app/actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NuevoEmpleadoPage() {
  // Obtenemos las áreas (cargos) dinámicamente de la base de datos para el <select>
  const [rows] = await pool.query('SELECT AreCodigo, AreNombre FROM T_Area');
  const areas = rows as any[];

  // Componente de Formulario que usa Server Actions
  async function handleSubmit(formData: FormData) {
    'use server'; // Indicamos que esta función corre en el backend
    await agregarEmpleado(formData);
    redirect('/'); // Al terminar, regresa a la página principal
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-700">Agregar Nuevo Empleado</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Volver
        </Link>
      </div>

      <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Código de Empleado (Ej: EMP00002) */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Empleado</label>
            <input type="text" name="codigo" required placeholder="EMP00002" maxLength={8}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          {/* DNI (Validación estricta de 8 dígitos) */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <input type="text" name="dni" required pattern="\d{8}" title="El DNI debe tener exactamente 8 dígitos numéricos" maxLength={8}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
            <input type="text" name="nombres" required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos (Paterno y Materno)</label>
            <div className="flex gap-2">
              <input type="text" name="apePaterno" required placeholder="Paterno"
                className="w-1/2 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
              <input type="text" name="apeMaterno" required placeholder="Materno"
                className="w-1/2 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
            <select name="genero" required className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <input type="date" name="fechaNac" required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" name="correo" required
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Área / Cargo (Salario Base)</label>
            <select name="area" required className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500">
              {areas.map(area => (
                <option key={area.AreCodigo} value={area.AreCodigo}>
                  {area.AreNombre}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition">
            Guardar Empleado
          </button>
        </div>
      </form>
    </main>
  );
}