import pool from '@/lib/db';
import Link from 'next/link';
import { calcularGratificacion } from '@/lib/gratificacion';
import EmpleadosTable from '@/components/ui/EmpleadosTable';
import {
  Plus,
  Briefcase,
  ClipboardList,
  Download,
  AlertCircle,
  Users,
} from 'lucide-react';

import { mapEmpleado } from '@/lib/mappers';
import { calcularAntiguedad } from '@/lib/dateUtils';

export const dynamic = 'force-dynamic';

async function getEmpleados() {
  const [rows] = await pool.query(`
    SELECT 
      e.EmpCodigo, e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno, e.EmpDNI, e.EmpFechaNacimiento, e.EmpFechaIngreso, e.AreaID, e.EmpSalario, e.EmpGenero, e.EmpCorreo, e.EmpContratoInicio, e.EmpContratoFin, e.EmpActivo, a.AreaNombre,
      TIMESTAMPDIFF(YEAR, e.EmpFechaNacimiento, CURDATE()) AS EdadActual,
      COALESCE(e.EmpSalario, a.AreaSalario) AS SalarioFinal
    FROM EMPLEADO e
    INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    WHERE e.EmpActivo = 1
    ORDER BY CAST(SUBSTRING(e.EmpCodigo, 4) AS UNSIGNED) DESC  
  `);

  return (rows as any[]).map((row) => ({
    ...mapEmpleado(row),
    AreaNombre: row.AreaNombre,
    EdadActual: row.EdadActual,
    SalarioFinal: row.SalarioFinal,
  }));
}


export default async function Page() {
  let empleados: any[];
  try {
    empleados = await getEmpleados();
  } catch (error) {
    console.error('Error cargando datos del dashboard:', error);
    return (
      <main className='min-h-screen flex items-center justify-center p-4'>
        <div className='bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center shadow-sm'>
          <AlertCircle className='w-12 h-12 text-danger mx-auto mb-4' />
          <h2 className='text-xl font-bold text-foreground mb-2'>
            Error de conexión
          </h2>
          <p className='text-muted text-sm'>
            No se pudieron cargar los datos de los empleados. Revisa tu conexión
            a la base de datos o los logs en Vercel.
          </p>
        </div>
      </main>
    );
  }

  const empleadosConCalculos = empleados.map((emp) => {
    const gratificacion = calcularGratificacion(emp.EmpFechaIngreso);
    const antiguedadExacta = calcularAntiguedad(emp.EmpFechaIngreso);
    return { ...emp, antiguedadExacta, gratificacion };
  });

  return (
    <main className='min-h-screen p-4 md:p-6 lg:p-8'>
      <div className='max-w-7xl mx-auto animate-fade-in'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                Gestión de Empleados
              </h1>
              <p className='text-muted mt-1'>
                Administra la nómina, antigüedad y beneficios de tu equipo.
              </p>
            </div>

            <Link
              href='/empleados/nuevo'
              className='inline-flex items-center gap-2 px-5 py-2.5 gradient-brand text-white font-semibold rounded-xl shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98] transition-all'>
              <Plus className='w-4 h-4' strokeWidth={2.5} />
              Nuevo Empleado
            </Link>
          </div>

          {/* Stats & Actions */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
            <div className='bg-surface border border-border border-l-4 border-l-brand rounded-xl p-5 flex items-center justify-between gap-4'>
                <div>
                  <p className='text-xs font-bold text-brand uppercase tracking-wider mb-1'>
                    Total Activos
                  </p>
                  <p className='text-4xl font-black text-foreground tracking-tight'>
                    {empleados.length}
                  </p>
                </div>
                <div className='opacity-10 dark:opacity-20'>
                  <Users className='w-12 h-12 text-brand' />
                </div>
            </div>

            <a href='/api/informe' className='group bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-success/50 hover:bg-success/5 transition-all flex items-center gap-4 cursor-pointer'>
                <div className='w-12 h-12 rounded-xl bg-success-light group-hover:bg-success group-hover:scale-110 transition-all duration-300 flex items-center justify-center shrink-0'>
                  <Download className='w-6 h-6 text-success group-hover:text-white transition-colors' />
                </div>
                <div>
                  <p className='text-base font-bold text-foreground group-hover:text-success transition-colors'>
                    Informe
                  </p>
                  <p className='text-xs text-muted font-medium mt-0.5'>
                    Descargar reporte
                  </p>
                </div>
            </a>

            <Link href='/cargos' className='group bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-brand/50 hover:bg-brand/5 transition-all flex items-center gap-4 cursor-pointer'>
                <div className='w-12 h-12 rounded-xl bg-brand-light group-hover:bg-brand group-hover:scale-110 transition-all duration-300 flex items-center justify-center shrink-0'>
                  <Briefcase className='w-6 h-6 text-brand group-hover:text-white transition-colors' />
                </div>
                <div>
                  <p className='text-base font-bold text-foreground group-hover:text-brand transition-colors'>
                    Cargos
                  </p>
                  <p className='text-xs text-muted font-medium mt-0.5'>
                    Gestionar áreas
                  </p>
                </div>
            </Link>

            <Link href='/auditoria' className='group bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-warning/50 hover:bg-warning/5 transition-all flex items-center gap-4 cursor-pointer'>
                <div className='w-12 h-12 rounded-xl bg-warning-light group-hover:bg-warning group-hover:scale-110 transition-all duration-300 flex items-center justify-center shrink-0'>
                  <ClipboardList className='w-6 h-6 text-warning group-hover:text-white transition-colors' />
                </div>
                <div>
                  <p className='text-base font-bold text-foreground group-hover:text-warning transition-colors'>
                    Auditoría
                  </p>
                  <p className='text-xs text-muted font-medium mt-0.5'>
                    Ver registros
                  </p>
                </div>
            </Link>
          </div>
        </div>

        <EmpleadosTable empleadosConCalculos={empleadosConCalculos} />
      </div>
    </main>
  );
}