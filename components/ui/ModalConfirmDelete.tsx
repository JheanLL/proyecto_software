"use client";

import { Trash2, AlertTriangle, Loader2, X, User } from "lucide-react";
import { useState } from "react";

interface ModalConfirmDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  empleado: {
    EmpCodigo: string;
    EmpNombres: string;
    EmpApellidoPaterno: string;
    EmpApellidoMaterno: string;
  };
}

export default function ModalConfirmDelete({
  isOpen,
  onClose,
  onConfirm,
  empleado,
}: ModalConfirmDeleteProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
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
            <div className="w-9 h-9 rounded-xl gradient-danger flex items-center justify-center shadow-sm shadow-danger/20">
              <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Confirmar Eliminación
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
        <div className="flex items-center gap-3 p-3 bg-danger-light/30 rounded-xl mb-4 border border-danger/10">
          <div className="w-10 h-10 rounded-full gradient-danger flex items-center justify-center shadow-sm shadow-danger/15 flex-shrink-0">
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

        {/* Warning message */}
        <div className="p-4 bg-danger-light/20 rounded-xl border border-danger/20 mb-6">
          <p className="text-sm text-foreground">
            ¿Está seguro de eliminar a este empleado? Esta acción no se puede
            deshacer.
          </p>
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
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white gradient-danger rounded-xl shadow-lg shadow-danger/25 hover:shadow-danger/40 transition-all disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Sí, Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}