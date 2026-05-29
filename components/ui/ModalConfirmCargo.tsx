"use client";

import { Trash2, AlertTriangle, Save, CheckCircle, Loader2, X, Briefcase } from "lucide-react";
import { useState } from "react";

interface ModalConfirmCargoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  cargo: {
    AreaID: number;
    AreaNombre: string;
    AreaSalario?: number | string;
  };
  mode: "delete" | "update";
  /** Solo para modo update: muestra el nuevo nombre y salario */
  nuevoNombre?: string;
  nuevoSalario?: number;
}

export default function ModalConfirmCargo({
  isOpen,
  onClose,
  onConfirm,
  cargo,
  mode,
  nuevoNombre,
  nuevoSalario,
}: ModalConfirmCargoProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isDelete = mode === "delete";

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
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                isDelete
                  ? "gradient-danger shadow-danger/20"
                  : "gradient-brand shadow-brand/20"
              }`}
            >
              {isDelete ? (
                <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
              ) : (
                <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isDelete ? "Confirmar Eliminación" : "Confirmar Actualización"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cargo info */}
        <div
          className={`flex items-center gap-3 p-3 rounded-xl mb-4 border ${
            isDelete
              ? "bg-danger-light/30 border-danger/10"
              : "bg-brand-light/30 border-brand/10"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${
              isDelete
                ? "gradient-danger shadow-danger/15"
                : "gradient-brand shadow-brand/15"
            }`}
          >
            <Briefcase className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              {cargo.AreaNombre}
            </p>
            <p className="text-xs text-muted font-mono">
              ID: {String(cargo.AreaID).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Mensaje */}
        <div
          className={`p-4 rounded-xl border mb-6 ${
            isDelete
              ? "bg-danger-light/20 border-danger/20"
              : "bg-brand-light/20 border-brand/20"
          }`}
        >
          {isDelete ? (
            <p className="text-sm text-foreground">
              ¿Está seguro de eliminar el cargo <b>{cargo.AreaNombre}</b>? Esta
              acción no se puede deshacer.
            </p>
          ) : (
            <div>
              <p className="text-sm text-foreground mb-2">
                ¿Actualizar cargo de <b>{cargo.AreaNombre}</b> a{" "}
                <b>{nuevoNombre}</b>?
              </p>
              {nuevoSalario !== undefined && (
                <p className="text-sm text-muted">
                  Nuevo salario:{" "}
                  <span className="font-semibold text-success">
                    S/. {nuevoSalario.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          )}
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
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all disabled:opacity-70 ${
              isDelete
                ? "gradient-danger shadow-danger/25 hover:shadow-danger/40"
                : "gradient-brand shadow-brand/25 hover:shadow-brand/40"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isDelete ? "Eliminando..." : "Actualizando..."}
              </>
            ) : (
              <>
                {isDelete ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, Eliminar
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Sí, Actualizar
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}