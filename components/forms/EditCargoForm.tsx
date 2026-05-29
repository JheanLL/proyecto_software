"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { eliminarCargo, modificarCargo } from "@/actions/cargos";
import { Save, Trash2, Tags } from "lucide-react";
import ModalConfirmCargo from "@/components/ui/ModalConfirmCargo";

interface EditCargoFormProps {
  cargo: {
    AreaID: number;
    AreaNombre: string;
    AreaSalario: number | string;
  };
}

export default function EditCargoForm({ cargo }: EditCargoFormProps) {
  const formId = `edit-form-${cargo.AreaID}`;
  const [mounted, setMounted] = useState(false);

  // Modal para actualizar
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    formData: FormData;
    nuevoNombre: string;
    nuevoSalario: number;
  } | null>(null);

  // Modal para eliminar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentFormData = new FormData(e.currentTarget);
    const nuevoNombre = currentFormData.get("nombre") as string;
    const nuevoSalario = parseFloat(currentFormData.get("salario") as string);

    if (nuevoNombre.length < 3) {
      toast.error("El nombre del cargo debe tener al menos 3 caracteres.");
      return;
    }
    if (isNaN(nuevoSalario) || nuevoSalario <= 0) {
      toast.error("El salario debe ser un número positivo.");
      return;
    }

    // Abrir modal de confirmación en lugar del toast
    setPendingUpdate({ formData: currentFormData, nuevoNombre, nuevoSalario });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateConfirm = async () => {
    if (!pendingUpdate) return;
    const loadingToast = toast.loading("Actualizando cargo...");
    try {
      const result = await modificarCargo(pendingUpdate.formData);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
      } else {
        toast.error(result.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud", { id: loadingToast });
    }
    setIsUpdateModalOpen(false);
    setPendingUpdate(null);
  };

  const handleDeleteConfirm = async () => {
    const loadingToast = toast.loading("Eliminando cargo...");
    try {
      const result = await eliminarCargo(cargo.AreaID);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
      } else {
        toast.error(result.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud", { id: loadingToast });
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <tr className="hidden">
        <td>
          <form id={formId} onSubmit={handleSubmit}>
            <input type="hidden" name="areCodigo" value={cargo.AreaID} />
          </form>
        </td>
      </tr>

      <tr className="hover:bg-surface-hover/40 transition-colors group">
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-muted">
            <Tags className="w-3 h-3" />
            {String(cargo.AreaID).padStart(2, "0")}
          </span>
        </td>

        <td className="px-6 py-4">
          <input
            form={formId}
            type="text"
            name="nombre"
            defaultValue={cargo.AreaNombre}
            required
            aria-label={`Nombre de cargo para código ${cargo.AreaID}`}
            className="w-full max-w-[400px] px-3 py-2 bg-base border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </td>

        <td className="px-6 py-4">
          <div className="relative w-full max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">
              S/.
            </span>
            <input
              form={formId}
              type="number"
              step="0.01"
              name="salario"
              defaultValue={Number(cargo.AreaSalario)}
              required
              aria-label={`Salario base mensual de cargo para código ${cargo.AreaID}`}
              className="w-full pl-10 pr-3 py-2 bg-base border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all tabular-nums"
            />
          </div>
        </td>

        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              form={formId}
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 font-medium text-sm bg-brand text-white rounded-xl hover:bg-brand-hover transition-all shadow-sm hover:shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              Actualizar
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-danger bg-danger-light border border-danger/10 rounded-xl hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
        </td>
      </tr>

      {/* Modales renderizados con portal fuera del <tbody> */}
      {mounted &&
        createPortal(
          <>
            {/* Modal de confirmación para actualizar */}
            {pendingUpdate && (
              <ModalConfirmCargo
                isOpen={isUpdateModalOpen}
                onClose={() => {
                  setIsUpdateModalOpen(false);
                  setPendingUpdate(null);
                }}
                onConfirm={handleUpdateConfirm}
                cargo={cargo}
                mode="update"
                nuevoNombre={pendingUpdate.nuevoNombre}
                nuevoSalario={pendingUpdate.nuevoSalario}
              />
            )}

            {/* Modal de confirmación para eliminar */}
            <ModalConfirmCargo
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={handleDeleteConfirm}
              cargo={cargo}
              mode="delete"
            />
          </>,
          document.body,
        )}
    </>
  );
}