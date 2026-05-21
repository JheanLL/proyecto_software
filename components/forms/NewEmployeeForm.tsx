"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { agregarEmpleado, obtenerProximoCodigo } from '@/app/actions';

interface Area {
  AreaID: number;
  AreaNombre: string;
}

interface NewEmployeeFormProps {
  areas: Area[];
}

export default function NewEmployeeForm({ areas }: NewEmployeeFormProps) {
  const router = useRouter();
  const [fechaHoy, setFechaHoy] = useState("");
  const [codigoAuto, setCodigoAuto] = useState("Cargando...");

  useEffect(() => {
    // 1. Establecer fecha por defecto
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    setFechaHoy(`${yyyy}-${mm}-${dd}`);

    // 2. Traer el próximo código real de la Base de Datos
    obtenerProximoCodigo().then(codigo => setCodigoAuto(codigo));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const loadingToast = toast.loading("Registrando empleado...");
    const formData = new FormData(e.currentTarget);

    try {
      const result = await agregarEmpleado(formData);

      if (result.success) {
        toast.success(result.message, { id: loadingToast });
        router.push('/');
        router.refresh();
      } else {
        toast.error(result.message, { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el empleado.", { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl shadow-card p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CÓDIGO GENERADO: Visible, NO modificable y enviado de forma segura */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="codigo" className="block text-sm font-medium text-foreground mb-1.5">Código de Empleado</label>
          <input
            type="text"
            name="codigo"
            id="codigo"
            readOnly
            value={codigoAuto}
            className="w-full px-3 py-2 bg-border/30 border border-border rounded-lg text-muted-foreground font-mono shadow-sm outline-none cursor-not-allowed select-none"
          />
        </div>

        {/* DNI */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="dni" className="block text-sm font-medium text-foreground mb-1.5">DNI</label>
          <input
            type="text"
            name="dni"
            id="dni"
            required
            pattern="\d{8}"
            maxLength={8}
            placeholder="12345678"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>

        {/* Nombres */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="nombres" className="block text-sm font-medium text-foreground mb-1.5">Nombres</label>
          <input
            type="text"
            name="nombres"
            id="nombres"
            required
            placeholder="Ej. Juan Carlos"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>

        {/* Apellido Paterno */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="apePaterno" className="block text-sm font-medium text-foreground mb-1.5">Apellido Paterno</label>
          <input
            type="text"
            name="apePaterno"
            id="apePaterno"
            required
            placeholder="Ej. Gómez"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>

        {/* Apellido Materno */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="apeMaterno" className="block text-sm font-medium text-foreground mb-1.5">Apellido Materno</label>
          <input
            type="text"
            name="apeMaterno"
            id="apeMaterno"
            required
            placeholder="Ej. Quispe"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>

        {/* Género */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="genero" className="block text-sm font-medium text-foreground mb-1.5">Género</label>
          <select
            name="genero"
            id="genero"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground cursor-pointer focus:outline-none"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        {/* Fecha de Nacimiento */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="fechaNac" className="block text-sm font-medium text-foreground mb-1.5">Fecha de Nacimiento</label>
          <input
            type="date"
            name="fechaNac"
            id="fechaNac"
            required
            defaultValue={fechaHoy}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground cursor-pointer focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

        {/* Correo */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="correo" className="block text-sm font-medium text-foreground mb-1.5">Correo Electrónico</label>
          <input
            type="email"
            name="correo"
            id="correo"
            required
            placeholder="juan@empresa.com"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none"
          />
        </div>

        {/* Área / Cargo */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="area" className="block text-sm font-medium text-foreground mb-1.5">Área / Cargo Inicial</label>
          <select
            name="area"
            id="area"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground cursor-pointer focus:outline-none"
          >
            {areas.map(area => (
              <option key={area.AreaID} value={area.AreaID}>
                {area.AreaNombre}
              </option>
            ))}
          </select>
        </div>

        {/* Salario Opcional */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="salario" className="block text-sm font-medium text-foreground mb-1.5">Salario Personalizado (Opcional)</label>
          <input
            type="number"
            name="salario"
            id="salario"
            step="0.01"
            placeholder="Dejar vacío para usar base de área"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none"
          />
        </div>

        {/* Fecha de Ingreso */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="fechaIngreso" className="block text-sm font-medium text-foreground mb-1.5">Fecha de Ingreso</label>
          <input
            type="date"
            name="fechaIngreso"
            id="fechaIngreso"
            required
            defaultValue={fechaHoy}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground cursor-pointer focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

        {/* Inicio de Contrato */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="contratoInicio" className="block text-sm font-medium text-foreground mb-1.5">Inicio del Contrato</label>
          <input
            type="date"
            name="contratoInicio"
            id="contratoInicio"
            required
            defaultValue={fechaHoy}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground cursor-pointer focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

        {/* Fin de Contrato */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="contratoFin" className="block text-sm font-medium text-foreground mb-1.5">Fin del Contrato</label>
          <input
            type="date"
            name="contratoFin"
            id="contratoFin"
            required
            defaultValue={fechaHoy}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground cursor-pointer focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

      </div>

      <hr className="my-8 border-border" />

      <div className="flex justify-end gap-3">
        <Link href="/" className="px-6 py-2.5 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors">
          Cancelar
        </Link>
        <button type="submit" className="px-6 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors">
          Guardar Empleado
        </button>
      </div>
    </form>
  );
}