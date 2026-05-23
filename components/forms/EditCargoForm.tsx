"use client";

import React from 'react';
import toast from 'react-hot-toast';
import { modificarCargo } from '@/app/actions';
import { eliminarCargo } from '@/actions/cargos'; // Importamos la acción aquí arriba

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
    <>
      <tr className="hidden">
        <td>
          <form id={formId} onSubmit={handleSubmit}>
             <input type="hidden" name="areCodigo" value={cargo.AreaID} />
          </form>
        </td>
      </tr>
      
      <tr className="hover:bg-surface-hover/50 transition-colors group">
        <td className="px-6 py-4 font-mono text-muted text-xs whitespace-nowrap">
          {String(cargo.AreaID).padStart(2, '0')}
        </td>
        
        <td className="px-6 py-4">
          <input 
            form={formId}
            type="text" 
            name="nombre" 
            defaultValue={cargo.AreaNombre} 
            required
            aria-label={`Nombre de cargo para código ${cargo.AreaID}`}
            className="w-full max-w-[400px] px-3 py-1.5 bg-transparent border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm"
          />
        </td>
        
        <td className="px-6 py-4">
          <div className="relative w-full max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">S/.</span>
            <input 
              form={formId}
              type="number" 
              step="0.01"
              name="salario" 
              defaultValue={Number(cargo.AreaSalario)} 
              required
              aria-label={`Salario base mensual de cargo para código ${cargo.AreaID}`}
              className="w-full pl-9 pr-3 py-1.5 bg-transparent border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm tabular-nums"
            />
          </div>
        </td>
        
        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
          <button 
            form={formId}
            type="submit" 
            className="px-4 py-2 w-[120px] text-sm font-medium text-slate-900 bg-white hover:bg-gray-200 rounded-md transition-colors shadow-sm whitespace-nowrap"
          >
            Actualizar
          </button>
          {/* Botón de eliminar corregido para usar la acción importada */}
          <button
            onClick={async () => {
              if(confirm('¿Estás seguro de eliminar este cargo?')) {
                const result = await eliminarCargo(cargo.AreaID);
                if (result.success) {
                  toast.success(result.message);
                } else {
                  toast.error(result.message);
                }
              }
            }}
            type="button"
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors shadow-sm"
          >
            Eliminar
          </button>
        </td>
      </tr>
    </>
  );
}