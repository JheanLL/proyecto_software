'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ModalGenerarBoleta from '@/components/ui/ModalGenerarBoleta';
import ModalConfirmDelete from '@/components/ui/ModalConfirmDelete';
import { eliminarEmpleado } from '@/actions/empleados';
import {
  User,
  Calendar,
  DollarSign,
  Gift,
  Pencil,
  Trash2,
  FileText,
  Hash,
  Briefcase,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';

export default function EmpleadosTable({
  empleadosConCalculos,
}: {
  empleadosConCalculos: any[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [deletingEmp, setDeletingEmp] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    column: 'empleado' | 'cargo' | 'edad' | 'salario' | null;
    direction: 'codeDesc' | 'codeAsc' | 'nameAsc' | 'nameDesc' | 'asc' | 'desc';
  }>({ column: 'empleado', direction: 'codeDesc' });

  const handleSort = (column: 'empleado' | 'cargo' | 'edad' | 'salario') => {
    if (column === 'empleado') {
      if (sortConfig.column !== 'empleado') {
        setSortConfig({ column: 'empleado', direction: 'codeDesc' });
      } else {
        const cycle = { codeDesc: 'codeAsc', codeAsc: 'nameAsc', nameAsc: 'nameDesc', nameDesc: 'codeDesc' };
        setSortConfig({ column: 'empleado', direction: cycle[sortConfig.direction as keyof typeof cycle] as any });
      }
    } else {
      if (sortConfig.column === column) {
        setSortConfig({ column, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
      } else {
        setSortConfig({ column, direction: 'asc' });
      }
    }
  };

  const sortedEmpleados = [...empleadosConCalculos].sort((a, b) => {
    if (sortConfig.column === 'empleado') {
      if (sortConfig.direction === 'codeDesc') {
        const codeA = parseInt(a.EmpCodigo.substring(3) || '0', 10);
        const codeB = parseInt(b.EmpCodigo.substring(3) || '0', 10);
        return codeB - codeA;
      }
      if (sortConfig.direction === 'codeAsc') {
        const codeA = parseInt(a.EmpCodigo.substring(3) || '0', 10);
        const codeB = parseInt(b.EmpCodigo.substring(3) || '0', 10);
        return codeA - codeB;
      }
      if (sortConfig.direction === 'nameAsc') {
        const nameA = `${a.EmpNombres} ${a.EmpApellidoPaterno} ${a.EmpApellidoMaterno}`;
        const nameB = `${b.EmpNombres} ${b.EmpApellidoPaterno} ${b.EmpApellidoMaterno}`;
        return nameA.localeCompare(nameB);
      }
      if (sortConfig.direction === 'nameDesc') {
        const nameA = `${a.EmpNombres} ${a.EmpApellidoPaterno} ${a.EmpApellidoMaterno}`;
        const nameB = `${b.EmpNombres} ${b.EmpApellidoPaterno} ${b.EmpApellidoMaterno}`;
        return nameB.localeCompare(nameA);
      }
    }
    if (sortConfig.column === 'cargo') {
      if (sortConfig.direction === 'asc') return a.AreaNombre.localeCompare(b.AreaNombre);
      if (sortConfig.direction === 'desc') return b.AreaNombre.localeCompare(a.AreaNombre);
    }
    if (sortConfig.column === 'edad') {
      if (sortConfig.direction === 'asc') return a.EdadActual - b.EdadActual;
      if (sortConfig.direction === 'desc') return b.EdadActual - a.EdadActual;
    }
    if (sortConfig.column === 'salario') {
      const salA = Number(a.SalarioFinal);
      const salB = Number(b.SalarioFinal);
      if (sortConfig.direction === 'asc') return salA - salB;
      if (sortConfig.direction === 'desc') return salB - salA;
    }
    return 0;
  });

  const renderSortIcon = (column: string) => {
    if (sortConfig.column !== column) {
      return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-100 transition-opacity ml-1" />;
    }
    
    if (column === 'empleado') {
      if (sortConfig.direction === 'codeDesc') return <div className="flex items-center text-brand ml-1"><Hash className="w-3 h-3 mr-0.5"/><ChevronDown className="w-3.5 h-3.5" /></div>;
      if (sortConfig.direction === 'codeAsc') return <div className="flex items-center text-brand ml-1"><Hash className="w-3 h-3 mr-0.5"/><ChevronUp className="w-3.5 h-3.5" /></div>;
      if (sortConfig.direction === 'nameAsc') return <div className="flex items-center text-brand ml-1"><span className="text-[10px] font-bold mr-0.5">AZ</span><ChevronUp className="w-3.5 h-3.5" /></div>;
      if (sortConfig.direction === 'nameDesc') return <div className="flex items-center text-brand ml-1"><span className="text-[10px] font-bold mr-0.5">ZA</span><ChevronDown className="w-3.5 h-3.5" /></div>;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 text-brand ml-1" /> 
      : <ChevronDown className="w-3.5 h-3.5 text-brand ml-1" />;
  };

  const handleDelete = async () => {
    if (!deletingEmp) return;
    await eliminarEmpleado(deletingEmp.EmpCodigo);
    setIsDeleteModalOpen(false);
    setDeletingEmp(null);
    router.refresh();
  };

  return (
    <>
      <div className='bg-surface border border-border rounded-2xl shadow-card overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full text-sm text-left'>
            <thead>
              <tr className='bg-surface-hover/70 border-b border-border'>
                <th 
                  className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:bg-surface-hover/80 transition-colors group select-none'
                  onClick={() => handleSort('empleado')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('empleado'); } }}
                  role="button"
                  tabIndex={0}
                  aria-label="Ordenar por empleado"
                >
                  <div className='flex items-center gap-1.5'>
                    <User className='w-3.5 h-3.5' />
                    <span>Empleado</span>
                    {renderSortIcon('empleado')}
                  </div>
                </th>
                <th 
                  className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:bg-surface-hover/80 transition-colors group select-none'
                  onClick={() => handleSort('cargo')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('cargo'); } }}
                  role="button"
                  tabIndex={0}
                  aria-label="Ordenar por cargo"
                >
                  <div className='flex items-center gap-1.5'>
                    <Briefcase className='w-3.5 h-3.5' />
                    <span>Cargo</span>
                    {renderSortIcon('cargo')}
                  </div>
                </th>
                <th 
                  className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center cursor-pointer hover:bg-surface-hover/80 transition-colors group select-none'
                  onClick={() => handleSort('edad')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('edad'); } }}
                  role="button"
                  tabIndex={0}
                  aria-label="Ordenar por edad o antigüedad"
                >
                  <div className='flex items-center justify-center gap-1.5'>
                    <Calendar className='w-3.5 h-3.5' />
                    <span>Edad / Antigüedad</span>
                    {renderSortIcon('edad')}
                  </div>
                </th>
                <th 
                  className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right cursor-pointer hover:bg-surface-hover/80 transition-colors group select-none'
                  onClick={() => handleSort('salario')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('salario'); } }}
                  role="button"
                  tabIndex={0}
                  aria-label="Ordenar por salario mensual"
                >
                  <div className='flex items-center justify-end gap-1.5'>
                    <DollarSign className='w-3.5 h-3.5' />
                    <span>Salario Mensual</span>
                    {renderSortIcon('salario')}
                  </div>
                </th>
                <th className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right'>
                  <div className='flex items-center justify-end gap-1.5'>
                    <Gift className='w-3.5 h-3.5' />
                    <span>Gratificación</span>
                  </div>
                </th>
                <th className='px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {sortedEmpleados.map((emp, index) => {
                return (
                  <tr
                    key={emp.EmpCodigo}
                    className='hover:bg-surface-hover/40 transition-colors animate-fade-in'
                    style={{ animationDelay: `${index * 40}ms` }}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-sm shadow-brand/15 flex-shrink-0'>
                          <User
                            className='w-4 h-4 text-white'
                            strokeWidth={2.5}
                          />
                        </div>
                        <div>
                          <div className='font-semibold text-foreground'>
                            {emp.EmpNombres} {emp.EmpApellidoPaterno}{' '}
                            {emp.EmpApellidoMaterno}
                          </div>
                          <div className='flex items-center gap-1 text-xs text-muted mt-0.5 font-mono'>
                            <Hash className='w-3 h-3' />
                            {emp.EmpCodigo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brand-light text-brand border border-brand/10'>
                        <Briefcase className='w-3 h-3' />
                        {emp.AreaNombre}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-center'>
                      <div className='font-medium text-foreground'>
                        {emp.EdadActual} años
                      </div>
                      <div className='text-xs text-muted mt-0.5'>
                        {emp.antiguedadExacta != null ? (
                          emp.antiguedadExacta
                        ) : (
                          <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-warning-light text-warning border border-warning/20'>
                            Pendiente · inicia {emp.EmpFechaIngreso
                              ? new Date(emp.EmpFechaIngreso + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right tabular-nums'>
                      <span className='inline-flex items-center gap-1 font-semibold text-success'>
                        <DollarSign className='w-3.5 h-3.5' />
                        {Number(emp.SalarioFinal).toFixed(2)}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right'>
                      <span className='inline-flex items-center gap-1 text-xs font-medium text-brand bg-brand-light px-2.5 py-1 rounded-full'>
                        <Gift className='w-3 h-3' />
                        S/. 300 Jul/Dic
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-center'>
                      <div className='flex flex-row md:flex-nowrap items-center justify-center gap-1'>
                        <button
                          onClick={() => {
                            setSelectedEmp(emp);
                            setIsModalOpen(true);
                          }}
                          className='inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-info bg-info-light border border-info/10 rounded-lg hover:bg-info/10 transition-colors'
                          title='Generar boleta de pago'
                          aria-label={`Generar boleta de pago para ${emp.EmpNombres}`}>
                          <FileText className='w-3.5 h-3.5' />
                          <span className='hidden sm:inline'>Boleta</span>
                          <span className='sm:hidden'>Bol.</span>
                        </button>
                        <Link
                          href={`/empleados/${emp.EmpCodigo}`}
                          className='inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-warning bg-warning-light border border-warning/10 rounded-lg hover:bg-warning/10 transition-colors'
                          title='Editar empleado'
                          aria-label={`Editar información de ${emp.EmpNombres}`}>
                          <Pencil className='w-3.5 h-3.5' />
                          <span className='hidden sm:inline'>Editar</span>
                          <span className='sm:hidden'>Ed.</span>
                        </Link>
                        <button
                          onClick={() => {
                            setDeletingEmp(emp);
                            setIsDeleteModalOpen(true);
                          }}
                          className='inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-danger bg-danger-light border border-danger/10 rounded-lg hover:bg-danger/10 transition-colors'
                          title='Eliminar empleado'
                          aria-label={`Eliminar a ${emp.EmpNombres} del sistema`}>
                          <Trash2 className='w-3.5 h-3.5' />
                          <span className='hidden sm:inline'>Eliminar</span>
                          <span className='sm:hidden'>Elim.</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {empleadosConCalculos.length === 0 && (
            <div className='py-16 text-center'>
              <div className='w-16 h-16 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center mb-4'>
                <User className='w-8 h-8 text-muted' />
              </div>
              <h3 className='text-sm font-semibold text-foreground'>
                Sin empleados
              </h3>
              <p className='text-sm text-muted mt-1'>
                Agrega tu primer empleado para comenzar.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedEmp && (
        <ModalGenerarBoleta
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          empleado={selectedEmp}
        />
      )}

      {deletingEmp && (
        <ModalConfirmDelete
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingEmp(null);
          }}
          onConfirm={handleDelete}
          empleado={deletingEmp}
        />
      )}
    </>
  );
}
