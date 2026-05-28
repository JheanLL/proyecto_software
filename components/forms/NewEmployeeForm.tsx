"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { agregarEmpleado, obtenerProximoCodigo } from "@/actions/empleados";

interface Area {
  AreaID: number;
  AreaNombre: string;
}

interface NewEmployeeFormProps {
  areas: Area[];
}

export default function NewEmployeeForm({ areas }: NewEmployeeFormProps) {
  const router = useRouter();
  const [contratoInicio, setContratoInicio] = useState("");
  const [fechaHoy, setFechaHoy] = useState("");
  const [codigoAuto, setCodigoAuto] = useState("Cargando...");

  useEffect(() => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = hoy.getMonth();

    const yyyyHoy = hoy.getFullYear();
    const mmHoy = String(hoy.getMonth() + 1).padStart(2, "0");
    const ddHoy = String(hoy.getDate()).padStart(2, "0");
    setFechaHoy(`${yyyyHoy}-${mmHoy}-${ddHoy}`);

    const fechaValida =
      hoy.getDate() === 1
        ? new Date(year, month, 1)
        : new Date(year, month + 1, 1);

    const yyyy = fechaValida.getFullYear();
    const mm = String(fechaValida.getMonth() + 1).padStart(2, "0");
    const dd = String(fechaValida.getDate()).padStart(2, "0");
    setContratoInicio(`${yyyy}-${mm}-${dd}`);

    obtenerProximoCodigo().then((codigo) => setCodigoAuto(codigo));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const dni = formData.get("dni") as string;
    const nombres = formData.get("nombres") as string;
    const apePaterno = formData.get("apePaterno") as string;
    const apeMaterno = formData.get("apeMaterno") as string;
    const correo = formData.get("correo") as string;
    const fechaNac = new Date(formData.get("fechaNac") as string);
    const [yearC, monthC, dayC] = contratoInicio.split("-").map(Number);
    const inicioContrato = new Date(yearC, monthC - 1, dayC);
    const finContrato = new Date(formData.get("contratoFin") as string);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (!/^\d{8}$/.test(dni)) {
      toast.error("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    if (
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombres) ||
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apePaterno) ||
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apeMaterno)
    ) {
      toast.error("Nombres y apellidos solo deben contener letras y espacios.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      toast.error("Formato de correo electrónico inválido.");
      return;
    }

    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    if (edad < 18) {
      toast.error("El empleado debe ser mayor de edad.");
      return;
    }

    const inicioNormalizado = new Date(
      inicioContrato.getFullYear(),
      inicioContrato.getMonth(),
      inicioContrato.getDate(),
    );
    const hoyNormalizado = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
    );

    // 1. Validar que sea día 1
    if (inicioNormalizado.getDate() !== 1) {
      toast.error("El contrato debe iniciar el día 1 de un mes.");
      return;
    }

    // 2. Validar que sea futuro o igual a hoy (si hoy es día 1)
    if (hoyNormalizado.getDate() !== 1) {
      const primerDiaProximoMes = new Date(
        hoy.getFullYear(),
        hoy.getMonth() + 1,
        1,
      );
      // Permitimos que sea igual al primer día del próximo mes
      if (inicioNormalizado < primerDiaProximoMes) {
        toast.error(
          `La fecha de inicio debe ser el ${primerDiaProximoMes.getDate()} de ${primerDiaProximoMes.toLocaleString("es-ES", { month: "long" })} o después.`,
        );
        return;
      }
    } else {
      if (inicioNormalizado < hoyNormalizado) {
        toast.error("La fecha de inicio no puede ser anterior a hoy.");
        return;
      }
    }

    if (finContrato <= inicioContrato) {
      toast.error(
        "La fecha de fin de contrato debe ser posterior a la fecha de inicio.",
      );
      return;
    }

    const loadingToast = toast.loading("Registrando empleado...");

    try {
      const result = await agregarEmpleado(formData);
      if (result.success) {
        toast.success(result.message, { id: loadingToast });
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.message, { id: loadingToast });
      }
    } catch (error) {
      toast.error("Error al guardar el empleado.", { id: loadingToast });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-xl shadow-card p-6 md:p-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Código de Empleado
          </label>
          <input
            type="text"
            name="codigo"
            readOnly
            value={codigoAuto}
            className="w-full px-3 py-2 bg-border/30 border border-border rounded-lg text-muted-foreground font-mono shadow-sm outline-none cursor-not-allowed select-none"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            DNI
          </label>
          <input
            type="text"
            name="dni"
            required
            pattern="\d{8}"
            maxLength={8}
            placeholder="12345678"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nombres
          </label>
          <input
            type="text"
            name="nombres"
            required
            placeholder="Ej. Juan Carlos"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Apellido Paterno
          </label>
          <input
            type="text"
            name="apePaterno"
            required
            placeholder="Ej. Gómez"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Apellido Materno
          </label>
          <input
            type="text"
            name="apeMaterno"
            required
            placeholder="Ej. Quispe"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Género
          </label>
          <select
            name="genero"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground cursor-pointer focus:outline-none"
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            name="fechaNac"
            required
            defaultValue={fechaHoy}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground cursor-pointer focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Correo Electrónico
          </label>
          <input
            type="email"
            name="correo"
            required
            placeholder="juan@empresa.com"
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Área / Cargo Inicial
          </label>
          <select
            name="area"
            required
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground cursor-pointer focus:outline-none"
          >
            {areas.map((area) => (
              <option key={area.AreaID} value={area.AreaID}>
                {area.AreaNombre}
              </option>
            ))}
          </select>
        </div>
        <input type="hidden" name="fechaIngreso" value={contratoInicio} />
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Inicio del Contrato
          </label>
          <input
            type="date"
            name="contratoInicio"
            required
            value={contratoInicio}
            onChange={(e) => setContratoInicio(e.target.value)}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground cursor-pointer focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Fin del Contrato
          </label>
          <input
            type="date"
            name="contratoFin"
            required
            defaultValue={fechaHoy}
            className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-foreground cursor-pointer focus:outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
      </div>
      <hr className="my-8 border-border" />
      <div className="flex justify-end gap-3">
        <Link
          href="/"
          className="px-6 py-2.5 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors"
        >
          Guardar Empleado
        </button>
      </div>
    </form>
  );
}
