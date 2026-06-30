import { Area, Empleado, BoletaPago, HistorialModificacion, Rol, Usuario } from '@/types';
import { toDateString } from '@/lib/dateUtils';

// En caso de que la DB cambie en el futuro, sólo ajusta cómo mapeas el row (any) a tus interfaces strictas de TypeScript.

export const mapArea = (row: any): Area => ({
  AreaID: Number(row.AreaID),
  AreaNombre: String(row.AreaNombre),
  AreaSalario: Number(row.AreaSalario),
  AreaActivo: Boolean(row.AreaActivo),
});

export const mapEmpleado = (row: any): Empleado => ({
  EmpCodigo: String(row.EmpCodigo),
  AreaID: Number(row.AreaID),
  EmpDNI: String(row.EmpDNI),
  EmpApellidoPaterno: String(row.EmpApellidoPaterno),
  EmpApellidoMaterno: String(row.EmpApellidoMaterno),
  EmpNombres: String(row.EmpNombres),
  EmpGenero: String(row.EmpGenero),
  EmpCorreo: String(row.EmpCorreo),
  EmpFechaNacimiento: toDateString(row.EmpFechaNacimiento),
  EmpFechaIngreso: toDateString(row.EmpFechaIngreso),
  EmpContratoInicio: toDateString(row.EmpContratoInicio),
  EmpContratoFin: toDateString(row.EmpContratoFin),
  EmpSalario: row.EmpSalario !== null && row.EmpSalario !== undefined ? Number(row.EmpSalario) : null,
  EmpActivo: Boolean(row.EmpActivo),
});

export const mapBoletaPago = (row: any): BoletaPago => ({
  BoletaID: Number(row.BoletaID),
  EmpCodigo: String(row.EmpCodigo),
  BoletaFecha: toDateString(row.BoletaFecha),
  BoletaSalarioBase: Number(row.BoletaSalarioBase),
  BoletaGratificacion: Number(row.BoletaGratificacion),
  BoletaTotalPago: Number(row.BoletaTotalPago),
});

export const mapHistorial = (row: any): HistorialModificacion => ({
  HMID: Number(row.HMID),
  EmpCodigo: row.EmpCodigo ? String(row.EmpCodigo) : null,
  HMCampoModificado: String(row.HMCampoModificado),
  HMValorAnterior: row.HMValorAnterior ? String(row.HMValorAnterior) : null,
  HMValorNuevo: String(row.HMValorNuevo),
  HMFechaModificacion: row.HMFechaModificacion ? String(row.HMFechaModificacion) : '',
  UserCodigo: Number(row.UserCodigo),
});

export const mapRol = (row: any): Rol => ({
  RolID: Number(row.RolID),
  RolNombre: String(row.RolNombre),
});

export const mapUsuario = (row: any): Usuario => ({
  UserCodigo: Number(row.UserCodigo),
  UserNombre: String(row.UserNombre),
  UserCorreo: String(row.UserCorreo),
  UserPassword: String(row.UserPassword),
  RolID: Number(row.RolID),
});
