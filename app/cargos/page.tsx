import pool from '@/lib/db';
import Link from 'next/link';
import NewCargoForm from '@/components/forms/NewCargoForm';
import EditCargoForm from '@/components/forms/EditCargoForm';

export default async function CargosPage() {
  const [rows] = await pool.query('SELECT AreaID, AreaNombre, AreaSalario FROM AREA_TRABAJO');
  const cargos = rows as any[];

  return (
    <main className="min-h-screen p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto">
      
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

      <NewCargoForm />

      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-16 whitespace-nowrap">ID</th>
                <th className="px-6 py-4 font-semibold min-w-[200px]">Nombre del Cargo / Área</th>
                <th className="px-6 py-4 font-semibold min-w-[150px]">Salario Base</th>
                <th className="px-6 py-4 font-semibold text-center w-32 whitespace-nowrap">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cargos.map((cargo) => (
                // Ahora EditCargoForm envuelve toda la fila <tr>, no va dentro de un <td>
                <EditCargoForm key={cargo.AreaID} cargo={cargo} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}