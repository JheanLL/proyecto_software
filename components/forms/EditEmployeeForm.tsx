"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { actualizarEmpleado } from "@/actions/empleados";
import {
  Hash,
  IdCard,
  User,
  Mail,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  ChevronDown,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface Area {
  AreaID: number;
  AreaNombre: string;
  AreaSalario: number;
}

interface EditEmployeeFormProps {
  empleado: unknown;
  areas: Area[];
}

export default function EditEmployeeForm({
  empleado,
  areas,
}: EditEmployeeFormProps) {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState(empleado.AreaID);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

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
      setSubmitting(false);
      return;
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (
      !nameRegex.test(nombres) ||
      !nameRegex.test(apePaterno) ||
      !nameRegex.test(apeMaterno)
    ) {
      toast.error(
        "Nombres y apellidos solo deben contener letras y espacios.",
      );
      setSubmitting(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      toast.error("Formato de correo electrónico inválido.");
      setSubmitting(false);
      return;
    }

    const fechaNac = new Date(fechaNacStr);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    if (edad < 18) {
      toast.error("El empleado debe ser mayor de edad.");
      setSubmitting(false);
      return;
    }

    const [yearC, monthC, dayC] = contratoInicioStr.split("-").map(Number);
    const inicioContrato = new Date(yearC, monthC - 1, dayC);

    const [yearF, monthF, dayF] = contratoFinStr.split("-").map(Number);
    const finContrato = new Date(yearF, monthF - 1, dayF);

    if (inicioContrato.getDate() !== 1) {
      toast.error("El contrato debe iniciar el día 1 de un mes.");
      setSubmitting(false);
      return;
    }

    if (finContrato <= inicioContrato) {
      toast.error(
        "La fecha de fin de contrato debe ser posterior a la fecha de inicio.",
      );
      setSubmitting(false);
      return;
    }

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
      toast.error("Error de red al guardar los cambios.", {
        id: loadingToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: unknown) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  const InputField = ({
    icon: Icon,
    label,
    ...props
  }: {
    icon: React.ElementType;
    label: string;
    [key: string]: unknown;
  }) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <input
        className="w-full px-3 py-2 bg-base border border-border rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all [&::-webkit-calendar-picker-indicator]:invert y :cursor-pointer"
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Hash className="w-3 h-3" />
            Código
          </label>
          <input
            type="text"
            name="codigo"
            readOnly
            value={empleado.EmpCodigo}
            className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-muted font-mono outline-none cursor-not-allowed"
          />
        </div>

        <InputField
          icon={IdCard}
          label="DNI"
          type="text"
          name="dni"
          required
          defaultValue={empleado.EmpDNI}
          maxLength={8}
        />

        <div className="col-span-2">
          <InputField
            icon={User}
            label="Nombres"
            type="text"
            name="nombres"
            required
            defaultValue={empleado.EmpNombres}
          />
        </div>

        <InputField
          icon={User}
          label="Apellido Paterno"
          type="text"
          name="apePaterno"
          required
          defaultValue={empleado.EmpApellidoPaterno}
        />

        <InputField
          icon={User}
          label="Apellido Materno"
          type="text"
          name="apeMaterno"
          required
          defaultValue={empleado.EmpApellidoMaterno}
        />

        <InputField
          icon={Mail}
          label="Correo Electrónico"
          type="email"
          name="correo"
          required
          defaultValue={empleado.EmpCorreo}
        />

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Users className="w-3 h-3" />
            Género
          </label>
          <div className="relative">
            <select
              name="genero"
              defaultValue={empleado.EmpGenero}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all appearance-none"
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <Briefcase className="w-3 h-3" />
            Cargo / Área
          </label>
          <div className="relative">
            <select
              name="area"
              value={selectedArea}
              onChange={handleAreaChange}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all appearance-none"
            >
              {areas.map((area) => (
                <option key={area.AreaID} value={area.AreaID}>
                  {area.AreaNombre}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-1.5">
            <DollarSign className="w-3 h-3" />
            Salario
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs font-semibold">
              S/.
            </span>
            <input
              type="number"
              step="0.01"
              name="salario"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-base border border-border rounded-lg text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all tabular-nums"
            />
          </div>
        </div>

        <InputField
          icon={Calendar}
          label="Fecha Nacimiento"
          type="date"
          name="fechaNac"
          defaultValue={formatDate(empleado.EmpFechaNacimiento)}
        />

        <InputField
          icon={Calendar}
          label="Inicio Contrato"
          type="date"
          name="contratoInicio"
          defaultValue={formatDate(empleado.EmpContratoInicio)}
        />

        <InputField
          icon={Calendar}
          label="Fin Contrato"
          type="date"
          name="contratoFin"
          defaultValue={formatDate(empleado.EmpContratoFin)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-surface border border-border rounded-lg hover:bg-surface-hover text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold gradient-brand text-white rounded-lg shadow-sm shadow-brand/25 hover:shadow-md hover:shadow-brand/30 transition-all disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" strokeWidth={2.5} />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </form>
  );
}