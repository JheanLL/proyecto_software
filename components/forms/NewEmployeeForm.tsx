"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { agregarEmpleado, obtenerProximoCodigo } from "@/actions/empleados";
import { Hash, IdCard, User, Calendar, Mail, Briefcase, Users, Save, X, Loader2, ChevronDown } from "lucide-react";

interface Area { AreaID: number; AreaNombre: string; }
interface NewEmployeeFormProps { areas: Area[]; }

interface InputFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
  [key: string]: unknown;
}

const InputField = ({ icon: Icon, label, className, ...props }: InputFieldProps) => (
  <div className={className}>
    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
      <Icon className="w-3.5 h-3.5 text-muted" />
      {label}
    </label>
    <input
      className="w-full px-3.5 py-2.5 bg-base border border-border rounded-xl text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
      {...props}
    />
  </div>
);

function getDefaultFechas() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  const d = hoy.getDate();
  const esDia1 = d === 1;

  const inicio = new Date(y, esDia1 ? m : m + 1, 1);
  const fin = new Date(y, esDia1 ? m + 6 : m + 7, 1);

  const format = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return { inicio: format(inicio), fin: format(fin) };
}

function getDefaultFechaNac() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();
  const d = hoy.getDate();
  const hace18 = new Date(y - 18, m, d);
  return `${hace18.getFullYear()}-${String(hace18.getMonth() + 1).padStart(2, "0")}-${String(hace18.getDate()).padStart(2, "0")}`;
}

export default function NewEmployeeForm({ areas }: NewEmployeeFormProps) {
  const router = useRouter();
  const [codigoAuto, setCodigoAuto] = useState("Cargando...");
  const [submitting, setSubmitting] = useState(false);
  const [fechas, setFechas] = useState(getDefaultFechas);
  const [fechaNacDefault] = useState(getDefaultFechaNac);

  useEffect(() => {
    obtenerProximoCodigo().then(setCodigoAuto);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const dni = formData.get("dni") as string;
    const correo = formData.get("correo") as string;
    const inicioStr = formData.get("contratoInicio") as string;
    const finStr = formData.get("contratoFin") as string;

    if (!/^\d{8}$/.test(dni)) {
      toast.error("El DNI debe tener exactamente 8 dígitos.");
      setSubmitting(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      toast.error("Formato de correo inválido.");
      setSubmitting(false);
      return;
    }

    const fechaNac = new Date(formData.get("fechaNac") as string);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mesCumplido = hoy.getMonth() > fechaNac.getMonth() ||
      (hoy.getMonth() === fechaNac.getMonth() && hoy.getDate() >= fechaNac.getDate());
    if (!mesCumplido) edad--;
    if (edad < 18) {
      toast.error("El empleado debe ser mayor de edad.");
      setSubmitting(false);
      return;
    }

    if (!inicioStr.endsWith("-01")) {
      toast.error("El contrato debe iniciar obligatoriamente el día 1 del mes.");
      setSubmitting(false);
      return;
    }

    if (new Date(finStr) <= new Date(inicioStr)) {
      toast.error("El fin de contrato debe ser posterior al inicio.");
      setSubmitting(false);
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
    } catch {
      toast.error("Error al guardar el empleado.", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl shadow-card p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <Hash className="w-3.5 h-3.5 text-muted" /> Código de Empleado
          </label>
          <input
            type="text"
            name="codigo"
            readOnly
            value={codigoAuto}
            className="w-full px-3.5 py-2.5 bg-surface-hover border border-border rounded-xl text-muted font-mono outline-none cursor-not-allowed select-none"
          />
        </div>

        <InputField icon={IdCard} label="DNI" type="text" name="dni" required pattern="\d{8}" maxLength={8} placeholder="12345678" />
        <InputField icon={User} label="Nombres" type="text" name="nombres" required placeholder="Ej. Juan Carlos" />
        <InputField icon={User} label="Apellido Paterno" type="text" name="apePaterno" required placeholder="Ej. Gómez" />
        <InputField icon={User} label="Apellido Materno" type="text" name="apeMaterno" required placeholder="Ej. Quispe" />

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <Users className="w-3.5 h-3.5 text-muted" /> Género
          </label>
          <div className="relative">
            <select name="genero" required className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all appearance-none">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
        </div>

        {fechaNacDefault && (
          <InputField icon={Calendar} label="Fecha de Nacimiento" type="date" name="fechaNac" required defaultValue={fechaNacDefault} />
        )}

        <InputField icon={Mail} label="Correo Electrónico" type="email" name="correo" required placeholder="juan@empresa.com" />

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <Briefcase className="w-3.5 h-3.5 text-muted" /> Área / Cargo Inicial
          </label>
          <div className="relative">
            <select name="area" required className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all appearance-none">
              {areas.map((area) => (
                <option key={area.AreaID} value={area.AreaID}>{area.AreaNombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
        </div>

        <input type="hidden" name="fechaIngreso" value={fechas.inicio} />

        <InputField
          icon={Calendar}
          label="Inicio del Contrato"
          type="date"
          name="contratoInicio"
          required
          value={fechas.inicio}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFechas({ ...fechas, inicio: e.target.value })}
        />

        <InputField
          icon={Calendar}
          label="Fin del Contrato"
          type="date"
          name="contratoFin"
          required
          value={fechas.fin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFechas({ ...fechas, fin: e.target.value })}
        />
      </div>

      <hr className="my-8 border-border" />

      <div className="flex justify-end gap-3">
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors">
          <X className="w-4 h-4" /> Cancelar
        </Link>
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white gradient-brand rounded-xl shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" strokeWidth={2.5} /> Guardar Empleado</>}
        </button>
      </div>
    </form>
  );
}