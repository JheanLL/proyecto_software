"use client";

import { useState, useEffect } from "react";
import { registrarBoleta } from "@/actions/boletas";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  empleado: {
    EmpCodigo: string;
    EmpNombres: string;
    EmpApellidoPaterno: string;
    SalarioFinal: number;
    EmpFechaIngreso: string | Date;
  };
}

export default function ModalGenerarBoleta({
  isOpen,
  onClose,
  empleado,
}: ModalProps) {
  const [total, setTotal] = useState(0);
  const [gratiCalculada, setGratiCalculada] = useState(0);

  useEffect(() => {
    if (!empleado || !empleado.EmpFechaIngreso) return;

    const hoy = new Date();
    const mesActual = hoy.getMonth(); // 0 es Enero, 6 es Julio, 11 es Diciembre
    let montoGratificacion = 0;

    // Se calcula la gratificación ÚNICAMENTE si el mes actual es Julio (6) o Diciembre (11)
    if (mesActual === 6 || mesActual === 11) {
      const fechaIngreso = new Date(empleado.EmpFechaIngreso);

      // Calculamos la diferencia total en meses
      let mesesTrabajados =
        (hoy.getFullYear() - fechaIngreso.getFullYear()) * 12 +
        (hoy.getMonth() - fechaIngreso.getMonth());

      // Restamos 1 mes si aún no ha completado el día exacto
      if (hoy.getDate() < fechaIngreso.getDate()) {
        mesesTrabajados--;
      }

      // El tope máximo es 6 meses
      const mesesComputables = Math.max(0, Math.min(6, mesesTrabajados));
      montoGratificacion = mesesComputables * 50;
    }

    setGratiCalculada(montoGratificacion);
    setTotal(Number(empleado.SalarioFinal) + montoGratificacion);
  }, [empleado?.SalarioFinal, empleado?.EmpFechaIngreso, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const result = await registrarBoleta(
      empleado.EmpCodigo,
      Number(empleado.SalarioFinal),
      gratiCalculada,
      total,
    );
    if (result.success) {
      window.location.href = `/api/boleta/${empleado.EmpCodigo}?total=${total}&gratificacion=${gratiCalculada}`;
      onClose();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-[var(--color-foreground)]">
          Generar Boleta de Pago
        </h2>
        <div className="space-y-2 mb-6 text-[var(--color-muted)]">
          <p>
            Empleado:{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {empleado.EmpNombres} {empleado.EmpApellidoPaterno}
            </span>
          </p>
          <p>
            Salario Base:{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              S/. {Number(empleado.SalarioFinal).toFixed(2)}
            </span>
          </p>
          <p>
            Gratificación:{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              S/. {gratiCalculada.toFixed(2)}
            </span>
          </p>
        </div>

        <div className="text-lg font-bold mb-6 text-[var(--color-foreground)] border-t border-[var(--color-border)] pt-4">
          Total a Pagar: S/. {total.toFixed(2)}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-surface-hover)] text-[var(--color-foreground)] rounded-lg hover:opacity-80 transition-opacity"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Confirmar y Descargar
          </button>
        </div>
      </div>
    </div>
  );
}
