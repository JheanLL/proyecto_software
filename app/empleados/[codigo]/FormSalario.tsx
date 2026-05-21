'use client';

import { useRef } from 'react';

export default function FormSalario({ 
  empCodigo, 
  salarioActual, 
  modificarSalarioAction 
}: { 
  empCodigo: string, 
  salarioActual: number,
  modificarSalarioAction: (codigo: string, nuevoSalario: number) => Promise<void>
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const nuevoSalario = Number(formData.get('nuevoSalario'));

    const confirmado = window.confirm(`¿Estás seguro de cambiar el salario a S/. ${nuevoSalario.toFixed(2)}? \n\nEsta acción quedará registrada en la Auditoría.`);
    
    if (confirmado) {
      await modificarSalarioAction(empCodigo, nuevoSalario);
      alert('Salario modificado exitosamente.');
      formRef.current?.reset();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        
        <div className="flex-grow w-full">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Modificar Salario (S/.)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">
              S/.
            </span>
            <input 
              type="number" 
              name="nuevoSalario" 
              step="0.01" 
              required 
              defaultValue={salarioActual}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm tabular-nums"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="w-full md:w-auto px-6 py-2.5 text-sm font-medium text-background bg-foreground hover:bg-foreground/90 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          Actualizar y Registrar
        </button>

      </div>
      <p className="text-xs text-muted mt-3">
        * Cualquier cambio generará un registro inmutable en el módulo de auditoría según la normativa de la empresa.
      </p>
    </form>
  );
}