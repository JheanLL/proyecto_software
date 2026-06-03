import pool from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, User, Hash, FileSearch } from 'lucide-react';

import { mapHistorial } from '@/lib/mappers';
import { HistorialModificacion } from '@/types';

export const revalidate = 0;

export default async function AuditoriaPage() {
  const [rows] = await pool.query(`
    SELECT 
      h.HMID,
      h.HMFechaModificacion,
      h.HMCampoModificado,
      h.HMValorAnterior,
      h.HMValorNuevo,
      h.HMEmpCodigo,
      u.UserNombre
    FROM HISTORIAL_MODIFICACIONES h
    LEFT JOIN USUARIO u ON h.HMUserCodigo = u.UserCodigo
    ORDER BY h.HMID DESC
  `);

  const registros = (rows as any[]).map((row) => ({
    ...mapHistorial(row),
    UserNombre: row.UserNombre,
  }));

  const getFriendlyFieldName = (campo: string) => {
    if (campo === 'EmpSalario') return 'Ajuste Salarial';
    return campo;
  };

  const getBadgeStyle = (campo: string) => {
    const act = (campo || '').toLowerCase();

    if (act.includes('registro') || act.includes('alta'))
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (
      act.includes('salarial') ||
      act.includes('salario') ||
      act.includes('sueldo')
    )
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (act.includes('creación') || act.includes('creacion'))
      return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    if (act.includes('cargo') || act.includes('área') || act.includes('area'))
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    if (act.includes('baja') || act.includes('elimin'))
      return 'bg-red-500/10 text-red-400 border-red-500/20';

    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <main className='min-h-screen p-4 md:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Registro de Auditoría
          </h1>
          <p className='text-muted mt-1'>
            Historial inmutable de operaciones y cambios organizacionales.
          </p>
        </div>
        <Link
          href='/'
          className='inline-flex items-center gap-2 px-4 py-2 bg-surface text-foreground border border-border rounded-xl hover:bg-surface-hover transition-colors font-medium text-sm shadow-sm'>
          <ArrowLeft className='w-4 h-4' />
          Volver al tablero
        </Link>
      </div>

      <div className='bg-surface border border-border rounded-2xl shadow-card overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm text-left'>
            <thead>
              <tr className='bg-surface-hover/70 border-b border-border'>
                <th className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-24'>
                  <div className='flex items-center gap-1.5'>
                    <Hash className='w-3.5 h-3.5' />
                    ID Log
                  </div>
                </th>
                <th className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider'>
                  <div className='flex items-center gap-1.5'>
                    <Clock className='w-3.5 h-3.5' />
                    Fecha y Hora
                  </div>
                </th>
                <th className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider'>
                  <div className='flex items-center gap-1.5'>
                    <User className='w-3.5 h-3.5' />
                    Usuario
                  </div>
                </th>
                <th className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider'>
                  <div className='flex items-center gap-1.5'>
                    <FileSearch className='w-3.5 h-3.5' />
                    Acción Registrada
                  </div>
                </th>
                <th className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider'>
                  Detalle Operativo
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {registros.map((reg) => {
                const fecha = new Date(reg.HMFechaModificacion).toLocaleString(
                  'es-PE',
                  {
                    timeZone: 'America/Lima',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  },
                );

                const campoAmigable = getFriendlyFieldName(
                  reg.HMCampoModificado,
                );

                return (
                  <tr
                    key={reg.HMID}
                    className='hover:bg-surface-hover/40 transition-colors'>
                    <td className='px-6 py-4 font-mono text-muted text-xs'>
                      #{String(reg.HMID).padStart(4, '0')}
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-foreground tabular-nums'>
                      {fecha}
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center gap-2'>
                        <div className='w-7 h-7 rounded-full bg-brand-light flex items-center justify-center'>
                          <User
                            className='w-3.5 h-3.5 text-brand'
                            strokeWidth={2.5}
                          />
                        </div>
                        <span className='font-medium text-foreground'>
                          {reg.UserNombre || 'Sistema Automático'}
                        </span>
                      </div>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getBadgeStyle(campoAmigable)}`}>
                        {campoAmigable}
                      </span>
                    </td>

                    <td className='px-6 py-4 text-muted min-w-0 max-w-xs md:max-w-none'>
                      {reg.HMEmpCodigo ? (
                        <span>
                          Para el empleado{' '}
                          <code className='text-xs bg-surface-hover px-1.5 py-0.5 rounded-md border border-border font-mono text-foreground'>
                            {reg.HMEmpCodigo}
                          </code>
                          :
                          {reg.HMValorAnterior ? (
                            <span className='ml-1'>
                              se modificó de{' '}
                              <strong className='text-foreground font-medium'>
                                &ldquo;{reg.HMValorAnterior}&rdquo;
                              </strong>{' '}
                              a{' '}
                              <strong className='text-foreground font-medium'>
                                &ldquo;{reg.HMValorNuevo}&rdquo;
                              </strong>
                              .
                            </span>
                          ) : (
                            <span className='ml-1 text-foreground font-medium'>
                              {reg.HMValorNuevo}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className='text-foreground font-medium'>
                          {reg.HMValorNuevo}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {registros.length === 0 && (
                <tr>
                  <td colSpan={5} className='px-6 py-16 text-center'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-hover mb-4'>
                      <Shield className='w-8 h-8 text-muted' />
                    </div>
                    <h3 className='text-sm font-semibold text-foreground'>
                      Sistema sin alteraciones
                    </h3>
                    <p className='text-sm text-muted mt-1'>
                      Aún no se han registrado eventos de modificación.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
