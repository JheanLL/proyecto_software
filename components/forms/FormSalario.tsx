'use client';

import { useRef } from 'react';
import toast from 'react-hot-toast';

export default function FormSalario({ 
  empCodigo, 
  salarioActual, 
  modificarSalarioAction 
}: { 
  empCodigo: string, 
  salarioActual: number,
  modificarSalarioAction: (codigo: string, nuevoSalario: number) => Promise<{ success: boolean, message: string }>
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const nuevoSalario = parseFloat(formData.get('nuevoSalario') as string);

    // Validaciones
    if (isNaN(nuevoSalario) || nuevoSalario <= 0) {
      toast.error("El salario debe ser un número mayor a 0.");
      return;
    }
    if (nuevoSalario === salarioActual) {
      toast.error("El nuevo salario debe ser diferente al actual.");
      return;
    }

    // Toast de confirmación personalizado
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium text-sm">
          ¿Estás seguro de cambiar el salario a <b>S/. {nuevoSalario.toFixed(2)}</b>?
          <br />
          <span className="text-xs text-muted-foreground font-normal">Esta acción quedará registrada en auditoría.</span>
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
              const loadingToast = toast.loading('Actualizando salario...');
              try {
                const result = await modificarSalarioAction(empCodigo, nuevoSalario);
                if (result.success) {
                  toast.success(result.message, { id: loadingToast });
                  formRef.current?.reset();
                } else {
                  toast.error(result.message, { id: loadingToast });
                }
              } catch (error) {
                toast.error('Ocurrió un error inesperado', { id: loadingToast });
              }
            }}
            className="px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-md hover:bg-brand-hover transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: 'top-center',
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        
        <div className="flex-grow w-full">
          <label htmlFor="nuevoSalario" className="block text-sm font-medium text-foreground mb-1.5">
            Modificar Salario (S/.)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">
              S/.
            </span>
            <input 
              type="number" 
              name="nuevoSalario" 
              id="nuevoSalario"
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
