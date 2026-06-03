import pool from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EditEmployeeForm from '@/components/forms/EditEmployeeForm';
import { mapEmpleado, mapArea, mapHistorial } from '@/lib/mappers';
import {
  ArrowLeft,
  User,
  FileText,
  Clock,
  DollarSign,
  Briefcase,
} from 'lucide-react';

export const revalidate = 0;

export default async function PerfilEmpleadoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const [empRows] = await pool.query(
    'SELECT * FROM EMPLEADO WHERE EmpCodigo = ? AND EmpActivo = 1',
    [codigo],
  );
  const empleados = (empRows as any[]).map(mapEmpleado);
  if (empleados.length === 0) return redirect('/');
  const empleado = empleados[0];

  const [areaRows] = await pool.query(
    'SELECT AreaID, AreaNombre, AreaSalario, AreaActivo FROM AREA_TRABAJO WHERE AreaActivo = 1',
  );
  const areas = (areaRows as any[]).map(mapArea);

  const [historialRows] = await pool.query(
    `SELECT h.*, u.UserNombre 
   FROM HISTORIAL_MODIFICACIONES h
   LEFT JOIN USUARIO u ON h.UserCodigo = u.UserCodigo
   WHERE h.EmpCodigo = ? AND h.HMCampoModificado IN ('Ajuste Salarial', 'Cambio de Cargo / Área')
   ORDER BY h.HMFechaModificacion DESC, h.HMID DESC`,
    [codigo],
  );
  const historial = (historialRows as any[]).map((row) => ({
    ...mapHistorial(row),
    UserNombre: row.UserNombre,
  }));

  return (
    <main className='min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in'>
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-2xl font-bold text-foreground tracking-tight'>
            Expediente de Empleado
          </h1>
          <p className='text-muted text-sm mt-0.5'>
            Edición general e histórico de movimientos.
          </p>
        </div>
        <Link
          href='/'
          className='inline-flex items-center gap-2 px-4 py-2 text-sm bg-surface border border-border text-foreground rounded-xl hover:bg-surface-hover transition-colors font-medium'>
          <ArrowLeft className='w-4 h-4' />
          Volver
        </Link>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'>
        {/* Panel Izquierdo: Formulario */}
        <div className='bg-surface border border-border rounded-2xl p-6 shadow-card'>
          <div className='flex items-center gap-2 mb-5'>
            <div className='w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center'>
              <User className='w-4 h-4 text-brand' strokeWidth={2.5} />
            </div>
            <h2 className='text-base font-semibold text-foreground'>
              Información del Personal
            </h2>
          </div>
          <EditEmployeeForm empleado={empleado} areas={areas} />
        </div>

        {/* Panel Derecho: Historial */}
        <div className='bg-surface border border-border rounded-2xl p-6 shadow-card min-h-[300px] md:min-h-[500px]'>
          <div className='flex items-center gap-2 mb-5'>
            <div className='w-8 h-8 rounded-lg bg-warning-light flex items-center justify-center'>
              <Clock className='w-4 h-4 text-warning' strokeWidth={2.5} />
            </div>
            <h2 className='text-base font-semibold text-foreground'>
              Historial de Cargos y Salarios
            </h2>
          </div>
          <div className='flow-root'>
            <ul className='-mb-8'>
              {historial.map((log, logIdx) => {
                const fechaStr = new Date(
                  log.HMFechaModificacion,
                ).toLocaleString('es-PE', {
                  timeZone: 'America/Lima',
                });
                const isSalario =
                  log.HMCampoModificado.toLowerCase().includes('salario');

                return (
                  <li key={log.HMID}>
                    <div className='relative pb-8'>
                      {logIdx !== historial.length - 1 ? (
                        <span
                          className='absolute top-4 left-4 -ml-px h-full w-0.5 bg-border'
                          aria-hidden='true'
                        />
                      ) : null}
                      <div className='relative flex space-x-3'>
                        <div>
                          <span
                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 md:ring-8 ring-surface ${
                              isSalario
                                ? 'bg-info-light text-info'
                                : 'bg-brand-light text-brand'
                            }`}>
                            {isSalario ? (
                              <DollarSign className='w-4 h-4' />
                            ) : (
                              <Briefcase className='w-4 h-4' />
                            )}
                          </span>
                        </div>
                        <div className='flex-1 min-w-0 pt-1.5'>
                          <p className='text-sm font-semibold text-foreground'>
                            {log.HMCampoModificado}
                          </p>
                          <div className='text-xs text-muted mt-1 space-y-0.5'>
                            <p>
                              De:{' '}
                              <span className='font-mono bg-surface-hover px-1.5 py-0.5 rounded-md border border-border'>
                                {log.HMValorAnterior || 'Monto Base'}
                              </span>{' '}
                              &rarr; A:{' '}
                              <span className='font-mono bg-brand-light text-brand font-semibold px-1.5 py-0.5 rounded-md border border-brand/10'>
                                {log.HMValorNuevo}
                              </span>
                            </p>
                            <p className='text-[11px] text-muted/70 flex items-center gap-2 pt-0.5'>
                              <span className='inline-flex items-center gap-1'>
                                <Clock className='w-3 h-3' /> {fechaStr}
                              </span>
                              <span>&bull;</span>
                              <span className='inline-flex items-center gap-1'>
                                <User className='w-3 h-3' />{' '}
                                {log.UserNombre || 'Sistema'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}

              {historial.length === 0 && (
                <div className='text-center py-16'>
                  <div className='w-14 h-14 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center mb-3'>
                    <FileText className='w-7 h-7 text-muted' />
                  </div>
                  <p className='text-sm font-medium text-foreground'>
                    Sin modificaciones registradas
                  </p>
                  <p className='text-sm text-muted mt-1'>
                    No se han registrado cambios de sueldo o cargo para este
                    empleado.
                  </p>
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
