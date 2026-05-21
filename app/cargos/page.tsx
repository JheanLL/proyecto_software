import pool from '@/lib/db';
import Link from 'next/link';
import NewCargoForm from '@/components/NewCargoForm';
import EditCargoForm from '@/components/EditCargoForm';

export default async function CargosPage() {
  // Cambiado a la nueva tabla AREA_TRABAJO con sus columnas e identificadores reales
  const [rows] = await pool.query('SELECT AreaID, AreaNombre, AreaSalario FROM AREA_TRABAJO');
  const cargos = rows as any[];

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-5xl mx-auto">
      
      {/* Header Moderno */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Cargos</h1>
          <p className="text-muted mt-1">Crea y actualiza las áreas de trabajo (RF02).</p>
        </div>
        <Link 
          href="/" 
          className="px-4 py-2 bg-surface text-foreground border border-border rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm"
        >
          <span aria-hidden="true">&larr;</span> Volver al tablero
        </Link>
      </div>

      {/* Formulario para CREAR nuevo cargo */}
      <NewCargoForm />

      {/* Tarjeta de la Tabla de EDICIÓN */}
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-24">ID</th>
                <th className="px-6 py-4 font-semibold w-1/3">Nombre del Cargo / Área</th>
                <th className="px-6 py-4 font-semibold w-1/3">Salario Base</th>
                <th className="px-6 py-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cargos.map((cargo) => (
                <tr key={cargo.AreaID} className="hover:bg-surface-hover/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-muted text-xs">
                    {/* Formatea el ID numérico con ceros a la izquierda */}
                    {String(cargo.AreaID).padStart(2, '0')}
                  </td>
                  <td colSpan={3} className="p-0">
                    {/* Enviamos el objeto con el tipado corregido hacia el formulario */}
                    <EditCargoForm cargo={cargo} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}