"use client";

import React, { useRef } from "react";
import toast from "react-hot-toast";
import { crearCargo } from "@/actions/cargos";
import { Plus, Tags } from "lucide-react";

export default function NewCargoForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentFormData = new FormData(e.currentTarget);
    const nombre = currentFormData.get("nombre") as string;
    const salario = parseFloat(currentFormData.get("salario") as string);

    if (nombre.length < 3) {
      toast.error("El nombre del cargo debe tener al menos 3 caracteres.");
      return;
    }
    if (isNaN(salario) || salario <= 0) {
      toast.error("El salario debe ser un número positivo.");
      return;
    }

    const loadingToast = toast.loading("Creando cargo...");

    try {
      const result = await crearCargo(currentFormData);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
        formRef.current?.reset();
      } else {
        toast.error(result.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud", { id: loadingToast });
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-6 mb-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-success-light flex items-center justify-center">
          <Tags className="w-4 h-4 text-success" strokeWidth={2.5} />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Agregar Nuevo Cargo
        </h2>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 md:flex-row md:items-end"
      >
        <div className="w-full md:w-2/5 min-w-[200px]">
          <label
            htmlFor="nombre-cargo"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Nombre del Cargo / Área
          </label>
          <input
            type="text"
            name="nombre"
            id="nombre-cargo"
            required
            placeholder="Ej. Diseñador UX"
            className="w-full px-3 py-2.5 bg-base border border-border rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </div>

        <div className="w-full md:w-2/5 min-w-[200px]">
          <label
            htmlFor="salario-cargo"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Salario Base Mensual
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">
              S/.
            </span>
            <input
              type="number"
              step="0.01"
              name="salario"
              id="salario-cargo"
              required
              placeholder="2000.00"
              className="w-full pl-10 pr-3 py-2.5 bg-base border border-border rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all tabular-nums"
            />
          </div>
        </div>

        <div className="w-full md:w-1/5 min-w-[140px]">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-success hover:bg-success/90 rounded-xl transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            Crear Cargo
          </button>
        </div>
      </form>
    </div>
  );
}