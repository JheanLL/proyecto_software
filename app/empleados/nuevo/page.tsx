import pool from '@/lib/db';
import { agregarEmpleado } from '@/app/actions';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function NuevoEmpleadoPage() {
  const [rows] = await pool.query('SELECT AreCodigo, AreNombre FROM T_Area');
  const areas = rows as any[];

  async function handleSubmit(formData: FormData) {
    'use server';
    await agregarEmpleado(formData);
    redirect('/');
  }

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-3xl mx-auto">
      
      {/* Header moderno con enlace de retroceso integrado */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
        >
          &larr; Volver al tablero
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Nuevo Empleado</h1>
        <p className="text-muted mt-1">Registra los datos personales y asigna el cargo inicial.</p>
      </div>

      {/* Tarjeta del Formulario */}
      <form action={handleSubmit} className="bg-surface border border-border rounded-xl shadow-card p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Código de Empleado */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Código de Empleado</label>
            <input 
              type="text" 
              name="codigo" 
              required 
              placeholder="EMP00002" 
              maxLength={8}
              className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm" 
            />
          </div>

          {/* DNI */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">DNI</label>
            <input 
              type="text" 
              name="dni" 
              required 
              pattern="\d{8}" 
              title="El DNI debe tener exactamente 8 dígitos numéricos" 
              maxLength={8}
              placeholder="12345678"
              className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm" 
            />
          </div>

          {/* Nombres */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Nombres</label>
            <input 
              type="text" 
              name="nombres" 
              required
              placeholder="Ej. Juan Carlos"
              className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm" 
            />
          </div>

          {/* Apellidos */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Apellidos (Paterno y Materno)</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                name="apePaterno" 
                required 
                placeholder="Paterno"
                className="w-1/2 px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm" 
              />
              <input 
                type="text" 
                name="apeMaterno" 
                required 
                placeholder="Materno"
                className="w-1/2 px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm" 
              />
            </div>
          </div>

          {/* Género */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Género</label>
            <select 
              name="genero" 
              required 
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm cursor-pointer appearance-none"
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          {/* Fecha de Nacimiento */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Fecha de Nacimiento</label>
            <input 
              type="date" 
              name="fechaNac" 
              required
              className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm cursor-pointer" 
            />
          </div>

          {/* Correo */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Correo Electrónico</label>
            <input 
              type="email" 
              name="correo" 
              required
              placeholder="juan@empresa.com"
              className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm" 
            />
          </div>

          {/* Área / Cargo */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1.5">Área / Cargo Inicial</label>
            <select 
              name="area" 
              required 
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm cursor-pointer appearance-none"
            >
              {areas.map(area => (
                <option key={area.AreCodigo} value={area.AreCodigo}>
                  {area.AreNombre}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Separador sutil antes de los botones */}
        <hr className="my-8 border-border" />

        <div className="flex justify-end gap-3">
          <Link 
            href="/"
            className="px-6 py-2.5 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors shadow-sm"
          >
            Cancelar
          </Link>
          <button 
            type="submit" 
            className="px-6 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
          >
            Guardar Empleado
          </button>
        </div>
      </form>
    </main>
  );
}