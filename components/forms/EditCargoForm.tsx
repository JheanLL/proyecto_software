"use client";

import React from "react";
import toast from "react-hot-toast";
import { eliminarCargo, modificarCargo } from "@/actions/cargos";
import { Save, Trash2, Tags } from "lucide-react";

interface EditCargoFormProps {
  cargo: {
    AreaID: number;
    AreaNombre: string;
    AreaSalario: number | string;
  };
}

export default function EditCargoForm({ cargo }: EditCargoFormProps) {
  const formId = `edit-form-${cargo.AreaID}`;

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

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">
            ¿Actualizar cargo a <b>{nuevoNombre}</b> con{" "}
            <b>S/. {nuevoSalario.toFixed(2)}</b>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                toast.dismiss(t.id);
                const loadingToast = toast.loading("Actualizando cargo...");
                try {
                  const result = await modificarCargo(currentFormData);
                  if (result.success) {
                    toast.success(result.message, { id: loadingToast });
                  } else {
                    toast.error(result.message, { id: loadingToast });
                  }
                } catch (error) {
                  toast.error("Error al procesar la solicitud", {
                    id: loadingToast,
                  });
                }
              }}
              className="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
      },
    );
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
              onClick={async () => {
                if (confirm("¿Estás seguro de eliminar este cargo?")) {
                  const result = await eliminarCargo(cargo.AreaID);
                  if (result.success) {
                    toast.success(result.message);
                  } else {
                    toast.error(result.message);
                  }
                }
              }}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-danger bg-danger-light border border-danger/10 rounded-xl hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}