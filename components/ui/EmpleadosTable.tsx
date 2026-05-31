"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalGenerarBoleta from "@/components/ui/ModalGenerarBoleta";
import ModalConfirmDelete from "@/components/ui/ModalConfirmDelete";
import { eliminarEmpleado } from "@/actions/empleados";
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
} from "lucide-react";

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

  const handleDelete = async () => {
    if (!deletingEmp) return;
    await eliminarEmpleado(deletingEmp.EmpCodigo);
    setIsDeleteModalOpen(false);
    setDeletingEmp(null);
    router.refresh();
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-surface-hover/70 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Empleado
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Cargo
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Edad / Antigüedad
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Salario Mensual
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Gift className="w-3.5 h-3.5" />
                    Gratificación
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {empleadosConCalculos.map((emp, index) => {
                return (
                  <tr
                    key={emp.EmpCodigo}
                    className="hover:bg-surface-hover/40 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-sm shadow-brand/15 flex-shrink-0">
                          <User className="w-4 h-4 text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {emp.EmpNombres} {emp.EmpApellidoPaterno}{" "}
                            {emp.EmpApellidoMaterno}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted mt-0.5 font-mono">
                            <Hash className="w-3 h-3" />
                            {emp.EmpCodigo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brand-light text-brand border border-brand/10">
                        <Briefcase className="w-3 h-3" />
                        {emp.AreaNombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="font-medium text-foreground">
                        {emp.EdadActual} años
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {emp.antiguedadExacta}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 font-semibold text-success">
                        <DollarSign className="w-3.5 h-3.5" />
                        {Number(emp.SalarioFinal).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-brand-light px-2.5 py-1 rounded-full">
                        <Gift className="w-3 h-3" />
                        S/. 300 Jul/Dic
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-row md:flex-nowrap items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedEmp(emp);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-info bg-info-light border border-info/10 rounded-lg hover:bg-info/10 transition-colors"
                          title="Generar boleta de pago"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Boleta</span>
                          <span className="sm:hidden">Bol.</span>
                        </button>
                        <Link
                          href={`/empleados/${emp.EmpCodigo}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-warning bg-warning-light border border-warning/10 rounded-lg hover:bg-warning/10 transition-colors"
                          title="Editar empleado"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Editar</span>
                          <span className="sm:hidden">Ed.</span>
                        </Link>
                        <button
                          onClick={() => {
                            setDeletingEmp(emp);
                            setIsDeleteModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-danger bg-danger-light border border-danger/10 rounded-lg hover:bg-danger/10 transition-colors"
                          title="Eliminar empleado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Eliminar</span>
                          <span className="sm:hidden">Elim.</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {empleadosConCalculos.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Sin empleados
              </h3>
              <p className="text-sm text-muted mt-1">
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