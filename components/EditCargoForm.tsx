"use client";

import React from 'react';
import toast from 'react-hot-toast';
import { modificarCargo } from '@/app/actions';

// Refactorizado con la estructura exacta de la tabla AREA_TRABAJO
interface EditCargoFormProps {
  cargo: {
    AreaID: number;
    AreaNombre: string;
    AreaSalario: number | string;
  };
}

export default function EditCargoForm({ cargo }: EditCargoFormProps) {
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Detenemos el envío nativo instantáneo
    
    // Capturamos el estado actual del formulario antes de que se pierda en el modal asíncrono
    const currentFormData = new FormData(e.currentTarget);
    const nuevoNombre = currentFormData.get('nombre') as string;
    const nuevoSalario = currentFormData.get('salario') as string;

    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-sm">
          ¿Actualizar cargo a <b>{nuevoNombre}</b> con <b>S/. {Number(nuevoSalario).toFixed(2)}</b>?
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-surface-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading('Actualizando cargo...');
              try {
                // Enviamos los datos capturados previamente
                const result = await modificarCargo(currentFormData);
                if (result.success) {
                  toast.success(result.message, { id: loadingToast });
                } else {
                  toast.error(result.message, { id: loadingToast });
                }
              } catch (error) {
                toast.error('Error al procesar la solicitud', { id: loadingToast });
              }
            }}
            className="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-md hover:bg-brand-hover transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center">
      {/* Campo oculto con el nuevo nombre de la llave primaria */}
      <input type="hidden" name="areCodigo" value={cargo.AreaID} />
      
      <div className="w-1/3 px-6 py-3">
        <input 
          type="text" 
          name="nombre" 
          defaultValue={cargo.AreaNombre} 
          required
          aria-label={`Nombre de cargo para código ${cargo.AreaID}`}
          className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
        />
      </div>
      
      <div className="w-1/3 px-6 py-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">S/.</span>
          <input 
            type="number" 
            step="0.01"
            name="salario" 
            defaultValue={Number(cargo.AreaSalario)} 
            required
            aria-label={`Salario base mensual de cargo para código ${cargo.AreaID}`}
            className="w-full pl-9 pr-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm tabular-nums"
          />
        </div>
      </div>
      
      <div className="w-1/3 px-6 py-3 flex justify-center">
        <button 
          type="submit" 
          className="w-full md:w-auto px-4 py-2 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-lg transition-colors shadow-sm whitespace-nowrap opacity-90 group-hover:opacity-100"
        >
          Actualizar
        </button>
      </div>
    </form>
  );
}