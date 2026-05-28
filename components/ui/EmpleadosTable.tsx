"use client";

import { useState } from "react";
import Link from "next/link";
import ModalGenerarBoleta from "@/components/ui/ModalGenerarBoleta";
import { eliminarEmpleado } from "@/actions/empleados";

export default function EmpleadosTable({ empleadosConCalculos }: { empleadosConCalculos: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  return (
    <>
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-surface-hover text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Empleado</th>
                <th className="px-6 py-4 font-semibold">Cargo</th>
                <th className="px-6 py-4 font-semibold text-center">Edad / Antigüedad Exacta</th>
                <th className="px-6 py-4 font-semibold text-right">Salario Mensual</th>
                <th className="px-6 py-4 font-semibold text-right">Gratificación</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {empleadosConCalculos.map((emp) => {
                return (
                  <tr
                    key={emp.EmpCodigo}
                    className="hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {emp.EmpNombres} {emp.EmpApellidoPaterno}
                      </div>
                      <div className="text-muted text-xs mt-0.5 font-mono">
                        {emp.EmpCodigo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand">
                        {emp.AreaNombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-foreground">{emp.EdadActual} años</div>
                      <div className="text-muted text-xs mt-0.5">{emp.antiguedadExacta}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums font-medium text-success">
                      S/. {Number(emp.SalarioFinal).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-muted text-xs">
                      <span className="text-brand font-medium">
                        S/. 300 en Julio y Dic.
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedEmp(emp); setIsModalOpen(true); }}
                          className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                        >
                          Generar Boleta
                        </button>
                        <Link
                          href={`/empleados/${emp.EmpCodigo}`}
                          className="px-3 py-1.5 text-xs font-medium text-warning bg-warning/10 rounded-md hover:bg-warning/20 transition-colors"
                        >
                          Editar
                        </Link>
                        <form action={async () => { await eliminarEmpleado(emp.EmpCodigo); }}>
                          <button
                            type="submit"
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedEmp && (
        <ModalGenerarBoleta
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          empleado={selectedEmp}
        />
      )}
    </>
  );
}