import pool from '@/lib/db';
import Link from 'next/link';
import { modificarCargo, crearCargo } from '@/app/actions';

export default async function CargosPage() {
  const [rows] = await pool.query('SELECT AreCodigo, AreNombre, AreSalarioBase FROM T_Area');
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
          &larr; Volver al tablero
        </Link>
      </div>

      {/* Formulario para CREAR nuevo cargo */}
      <div className="bg-surface border border-border rounded-xl shadow-card p-6 mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Agregar Nuevo Cargo</h2>
        <form action={crearCargo} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-2/5">
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombre del Cargo</label>
            <input 
              type="text" 
              name="nombre" 
              required
              placeholder="Ej. Diseñador UX"
              className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
            />
          </div>
          <div className="w-full md:w-2/5">
            <label className="block text-sm font-medium text-foreground mb-1.5">Salario Base Mensual</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">S/.</span>
              <input 
                type="number" 
                step="0.01"
                name="salario" 
                required
                placeholder="2000.00"
                className="w-full pl-9 pr-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm tabular-nums"
              />
            </div>
          </div>
          <div className="w-full md:w-1/5">
            <button type="submit" className="w-full px-4 py-2.5 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors shadow-sm">
              + Crear Cargo
            </button>
          </div>
        </form>
      </div>

      {/* Tarjeta de la Tabla de EDICIÓN */}
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-24">ID</th>
                <th className="px-6 py-4 font-semibold w-1/3">Nombre del Cargo</th>
                <th className="px-6 py-4 font-semibold w-1/3">Salario Base</th>
                <th className="px-6 py-4 font-semibold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cargos.map((cargo) => (
                <tr key={cargo.AreCodigo} className="hover:bg-surface-hover/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-muted text-xs">
                    {String(cargo.AreCodigo).padStart(2, '0')}
                  </td>
                  <td colSpan={3} className="p-0">
                    <form action={modificarCargo} className="flex w-full items-center">
                      <input type="hidden" name="areCodigo" value={cargo.AreCodigo} />
                      
                      <div className="w-1/3 px-6 py-3">
                        <input 
                          type="text" 
                          name="nombre" 
                          defaultValue={cargo.AreNombre} 
                          required
                          className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                        />
                      </div>
                      
                      <div className="w-1/3 px-6 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">S/.</span>
                          <input 
                            type="number" 
                            step="0.01"
                            name="salario" 
                            defaultValue={Number(cargo.AreSalarioBase)} 
                            required
                            className="w-full pl-9 pr-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm tabular-nums"
                          />
                        </div>
                      </div>
                      
                      <div className="w-1/3 px-6 py-3 flex justify-center">
                        <button 
                          type="submit" 
                          className="w-full md:w-auto px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-lg transition-colors shadow-sm whitespace-nowrap opacity-90 group-hover:opacity-100"
                        >
                          Actualizar
                        </button>
                      </div>
                    </form>
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