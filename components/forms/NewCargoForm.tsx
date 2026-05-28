"use client";

import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { crearCargo } from '@/actions/cargos';

export default function NewCargoForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Evitamos la propagación nativa descontrolada
    
    // Capturamos el FormData de forma síncrona desde el target actual del formulario
    const currentFormData = new FormData(e.currentTarget);
    const nombre = currentFormData.get("nombre") as string;
    const salario = parseFloat(currentFormData.get("salario") as string);

    // Validaciones
    if (nombre.length < 3) {
      toast.error("El nombre del cargo debe tener al menos 3 caracteres.");
      return;
    }
    if (isNaN(salario) || salario <= 0) {
      toast.error("El salario debe ser un número positivo.");
      return;
    }

    const loadingToast = toast.loading('Creando cargo...');
    
    try {
      const result = await crearCargo(currentFormData);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
        formRef.current?.reset();
      } else {
        toast.error(result.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error('Error al procesar la solicitud', { id: loadingToast });
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-card p-6 mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Agregar Nuevo Cargo</h2>
      
      {/* Cambiado action={handleSubmit} por onSubmit={handleSubmit} para asegurar persistencia del DOM */}
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
        
        <div className="w-full md:w-2/5">
          <label htmlFor="nombre-cargo" className="block text-sm font-medium text-foreground mb-1.5">Nombre del Cargo / Área</label>
          <input 
            type="text" 
            name="nombre" 
            id="nombre-cargo"
            required
            placeholder="Ej. Diseñador UX"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>
        
        <div className="w-full md:w-2/5">
          <label htmlFor="salario-cargo" className="block text-sm font-medium text-foreground mb-1.5">Salario Base Mensual</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">S/.</span>
            <input 
              type="number" 
              step="0.01"
              name="salario" 
              id="salario-cargo"
              required
              placeholder="2000.00"
              className="w-full pl-9 pr-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm tabular-nums"
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/5">
          <button type="submit" className="w-full px-4 py-2.5 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors shadow-sm">
            + Crear Cargo
          </button>
        </div>

      </form>
    </div>
  );
}
