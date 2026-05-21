'use client'; // Esto permite usar JavaScript en el navegador (para la alerta de confirmación)

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

    // Requerimiento de Usabilidad: Paso de confirmación
    const confirmado = window.confirm(`¿Estás seguro de cambiar el salario a S/. ${nuevoSalario.toFixed(2)}? \n\nEsta acción quedará registrada en la Auditoría.`);
    
    if (confirmado) {
      await modificarSalarioAction(empCodigo, nuevoSalario);
      alert('Salario modificado exitosamente.');
      formRef.current?.reset();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-4 p-4 border border-gray-200 rounded bg-gray-50">
      <h3 className="font-semibold text-gray-700 mb-2">Modificar Salario</h3>
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nuevo Salario (S/.)</label>
          <input 
            type="number" 
            name="nuevoSalario" 
            step="0.01" 
            required 
            defaultValue={salarioActual}
            className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition">
          Actualizar y Registrar
        </button>
      </div>
    </form>
  );
}