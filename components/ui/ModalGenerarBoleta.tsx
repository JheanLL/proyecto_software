"use client";

import { useState, useEffect } from "react";
import { registrarBoleta } from "@/actions/boletas";
import {
  X,
  User,
  DollarSign,
  Gift,
  FileText,
  Loader2,
  ReceiptText,
} from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  empleado: {
    EmpCodigo: string;
    EmpNombres: string;
    EmpApellidoPaterno: string;
    EmpApellidoMaterno: string;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!empleado || !empleado.EmpFechaIngreso) return;

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    let montoGratificacion = 0;

    if (mesActual === 6 || mesActual === 11) {
      const fechaIngreso = new Date(empleado.EmpFechaIngreso);

      let mesesTrabajados =
        (hoy.getFullYear() - fechaIngreso.getFullYear()) * 12 +
        (hoy.getMonth() - fechaIngreso.getMonth());

      if (hoy.getDate() < fechaIngreso.getDate()) {
        mesesTrabajados--;
      }

      const mesesComputables = Math.max(0, Math.min(6, mesesTrabajados));
      montoGratificacion = mesesComputables * 50;
    }

    setGratiCalculada(montoGratificacion);
    setTotal(Number(empleado.SalarioFinal) + montoGratificacion);
  }, [empleado?.SalarioFinal, empleado?.EmpFechaIngreso, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    const result = await registrarBoleta(
      empleado.EmpCodigo,
      Number(empleado.SalarioFinal),
      gratiCalculada,
      total,
    );
    setLoading(false);
    if (result.success) {
      window.location.href = `/api/boleta/${empleado.EmpCodigo}?total=${total}&gratificacion=${gratiCalculada}`;
      onClose();
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay con blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-6 animate-fade-in-up z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-sm shadow-brand/20">
              <ReceiptText className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Generar Boleta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee info */}
        <div className="flex items-center gap-3 p-3 bg-surface-hover/50 rounded-xl mb-5 border border-border/50">
          <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center shadow-sm shadow-brand/15 flex-shrink-0">
            <User className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              {empleado.EmpNombres} {empleado.EmpApellidoPaterno}{" "}
              {empleado.EmpApellidoMaterno}
            </p>
            <p className="text-xs text-muted font-mono">{empleado.EmpCodigo}</p>
          </div>
        </div>

        {/* Detalles */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between py-2 px-3 bg-surface-hover/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted">
              <DollarSign className="w-4 h-4" />
              Salario Base
            </div>
            <span className="font-semibold text-foreground text-sm">
              S/. {Number(empleado.SalarioFinal).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-surface-hover/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Gift className="w-4 h-4" />
              Gratificación
            </div>
            <span className="font-semibold text-warning text-sm">
              S/. {gratiCalculada.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-brand-light rounded-xl border border-brand/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              <ReceiptText className="w-4 h-4" />
              Total a Pagar
            </div>
            <span className="text-lg font-bold text-brand">
              S/. {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-foreground bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white gradient-brand rounded-xl shadow-lg shadow-brand/25 hover:shadow-brand/40 transition-all disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Confirmar y Descargar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}