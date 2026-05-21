import pool from '@/lib/db';
import Link from 'next/link';
import FormSalario from './FormSalario';
import { modificarSalario } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function PerfilEmpleadoPage({ 
  params 
}: { 
  params: Promise<{ codigo: string }> 
}) {
  // Await obligatorio para params en Next.js 15
  const { codigo } = await params;

  // Consulta refactorizada a la nueva estructura relacional
  const [rows] = await pool.query(`
    SELECT 
      e.EmpCodigo, 
      e.EmpNombres, 
      e.EmpApellidoPaterno, 
      a.AreaNombre,
      COALESCE(e.EmpSalario, a.AreaSalario) AS SalarioActual
    FROM EMPLEADO e
    INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    WHERE e.EmpCodigo = ?
  `, [codigo]);

  const empleados = rows as any[];
  
  if (empleados.length === 0) {
    return redirect('/');
  }

  const emp = empleados[0];

  const updateAction = async (empCodigo: string, nuevoSalario: number) => {
    'use server';
    return await modificarSalario(empCodigo, nuevoSalario);
  };

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground transition-colors mb-4"
        >
          <span aria-hidden="true">&larr;</span> Volver a la lista
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Perfil del Empleado
        </h1>
        <p className="text-muted mt-1">
          {emp.EmpNombres} {emp.EmpApellidoPaterno}
        </p>
      </div>

      {/* Tarjeta Principal */}
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        
        {/* Sección de Datos */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted mb-1">Código</p>
              <p className="font-mono text-foreground">{emp.EmpCodigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-1">Cargo Actual</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand">
                {emp.AreaNombre}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-1">Salario Actual</p>
              <p className="font-medium text-success text-xl tabular-nums">
                S/. {Number(emp.SalarioActual).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Acción (Formulario) */}
        <div className="bg-surface-hover border-t border-border p-6 md:p-8">
          <FormSalario 
            empCodigo={emp.EmpCodigo} 
            salarioActual={Number(emp.SalarioActual)} 
            modificarSalarioAction={updateAction} 
          />
        </div>

      </div>
    </main>
  );
}