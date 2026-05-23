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
  };
  gratificacion: number;
}

export default function ModalGenerarBoleta({ isOpen, onClose, empleado, gratificacion }: ModalProps) {
  const [incluirBono, setIncluirBono] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const bono = incluirBono ? 300 : 0;
    setTotal(Number(empleado.SalarioFinal) + gratificacion + bono);
  }, [incluirBono, empleado.SalarioFinal, gratificacion]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const result = await registrarBoleta(
      empleado.EmpCodigo,
      Number(empleado.SalarioFinal),
      gratificacion,
      total,
      incluirBono ? 300 : 0
    );
    if (result.success) {
      window.location.href = `/api/boleta/${empleado.EmpCodigo}?total=${total}&gratificacion=${gratificacion}&bono=${incluirBono ? 300 : 0}`;
      onClose();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-[var(--color-foreground)]">Generar Boleta de Pago</h2>
        <div className="space-y-2 mb-6 text-[var(--color-muted)]">
          <p>Empleado: <span className="font-medium text-[var(--color-foreground)]">{empleado.EmpNombres} {empleado.EmpApellidoPaterno}</span></p>
          <p>Salario Base: <span className="font-medium text-[var(--color-foreground)]">S/. {Number(empleado.SalarioFinal).toFixed(2)}</span></p>
          <p>Gratificación: <span className="font-medium text-[var(--color-foreground)]">S/. {gratificacion.toFixed(2)}</span></p>
        </div>
        
        <label className="flex items-center gap-3 mb-6 cursor-pointer text-[var(--color-foreground)] hover:text-[var(--color-brand)] transition-colors">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
            checked={incluirBono} 
            onChange={(e) => setIncluirBono(e.target.checked)}
          />
          Asignar Bono de Productividad (S/. 300.00)
        </label>

        <div className="text-lg font-bold mb-6 text-[var(--color-foreground)] border-t border-[var(--color-border)] pt-4">
          Total a Pagar: S/. {total.toFixed(2)}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-[var(--color-surface-hover)] text-[var(--color-foreground)] rounded-lg hover:opacity-80 transition-opacity">Cancelar</button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg hover:opacity-90 transition-opacity">Confirmar y Descargar</button>
        </div>
      </div>
    </div>
  );
}
