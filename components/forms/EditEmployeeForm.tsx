"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { actualizarEmpleado } from "@/actions/empleados";

interface Area {
  AreaID: number;
  AreaNombre: string;
  AreaSalario: number;
}

interface EditEmployeeFormProps {
  empleado: any;
  areas: Area[];
}

export default function EditEmployeeForm({
  empleado,
  areas,
}: EditEmployeeFormProps) {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState(empleado.AreaID);

  const areaActual = areas.find((a) => a.AreaID === empleado.AreaID);
  const salarioInicial = empleado.EmpSalario ?? areaActual?.AreaSalario ?? "";

  const [salario, setSalario] = useState(salarioInicial);

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextAreaId = Number(e.target.value);
    setSelectedArea(nextAreaId);

    const areaData = areas.find((a) => a.AreaID === nextAreaId);
    if (areaData) {
      setSalario(areaData.AreaSalario);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // --- BLOQUE DE VALIDACIONES ---
    const dni = formData.get("dni") as string;
    const nombres = formData.get("nombres") as string;
    const apePaterno = formData.get("apePaterno") as string;
    const apeMaterno = formData.get("apeMaterno") as string;
    const correo = formData.get("correo") as string;
    const fechaNacStr = formData.get("fechaNac") as string;
    const contratoInicioStr = formData.get("contratoInicio") as string;
    const contratoFinStr = formData.get("contratoFin") as string;

    if (!/^\d{8}$/.test(dni)) {
      toast.error("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (
      !nameRegex.test(nombres) ||
      !nameRegex.test(apePaterno) ||
      !nameRegex.test(apeMaterno)
    ) {
      toast.error("Nombres y apellidos solo deben contener letras y espacios.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      toast.error("Formato de correo electrónico inválido.");
      return;
    }

    const fechaNac = new Date(fechaNacStr);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    if (edad < 18) {
      toast.error("El empleado debe ser mayor de edad.");
      return;
    }

    // Parseo seguro de fechas locales
    const [yearC, monthC, dayC] = contratoInicioStr.split("-").map(Number);
    const inicioContrato = new Date(yearC, monthC - 1, dayC);

    const [yearF, monthF, dayF] = contratoFinStr.split("-").map(Number);
    const finContrato = new Date(yearF, monthF - 1, dayF);

    if (inicioContrato.getDate() !== 1) {
      toast.error("El contrato debe iniciar el día 1 de un mes.");
      return;
    }

    if (finContrato <= inicioContrato) {
      toast.error(
        "La fecha de fin de contrato debe ser posterior a la fecha de inicio.",
      );
      return;
    }
    // ------------------------------

    const loadingToast = toast.loading("Actualizando información...");

    try {
      const result = await actualizarEmpleado(formData);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error("Error de red al guardar los cambios.", { id: loadingToast });
    }
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">
            Código
          </label>
          <input
            type="text"
            name="codigo"
            readOnly
            value={empleado.EmpCodigo}
            className="w-full px-3 py-2 bg-border/30 border border-border rounded-lg text-muted-foreground font-mono outline-none cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            DNI
          </label>
          <input
            type="text"
            name="dni"
            required
            defaultValue={empleado.EmpDNI}
            maxLength={8}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:border-brand focus:outline-none transition-all"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Nombres
          </label>
          <input
            type="text"
            name="nombres"
            required
            defaultValue={empleado.EmpNombres}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:border-brand focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Apellido Paterno
          </label>
          <input
            type="text"
            name="apePaterno"
            required
            defaultValue={empleado.EmpApellidoPaterno}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:border-brand focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Apellido Materno
          </label>
          <input
            type="text"
            name="apeMaterno"
            required
            defaultValue={empleado.EmpApellidoMaterno}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:border-brand focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Correo Electrónico
          </label>
          <input
            type="email"
            name="correo"
            required
            defaultValue={empleado.EmpCorreo}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:border-brand focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Género
          </label>
          <select
            name="genero"
            defaultValue={empleado.EmpGenero}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Cargo / Área
          </label>
          <select
            name="area"
            value={selectedArea}
            onChange={handleAreaChange}
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none"
          >
            {areas.map((area) => (
              <option key={area.AreaID} value={area.AreaID}>
                {area.AreaNombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Salario
          </label>
          <input
            type="number"
            step="0.01"
            name="salario"
            value={salario}
            onChange={(e) => setSalario(e.target.value)}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:border-brand focus:outline-none transition-all tabular-nums font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Fecha Nacimiento
          </label>
          <input
            type="date"
            name="fechaNac"
            defaultValue={formatDate(empleado.EmpFechaNacimiento)}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Inicio Contrato
          </label>
          <input
            type="date"
            name="contratoInicio"
            defaultValue={formatDate(empleado.EmpContratoInicio)}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Fin Contrato
          </label>
          <input
            type="date"
            name="contratoFin"
            defaultValue={formatDate(empleado.EmpContratoFin)}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/"
          className="px-4 py-2 text-sm bg-surface border border-border rounded-lg hover:bg-surface-hover text-foreground transition-colors"
        >
          Volver
        </Link>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}
