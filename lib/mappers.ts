import { Area, Empleado, BoletaPago, HistorialModificacion, Rol, Usuario } from '@/types';

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
  EmpFechaNacimiento: row.EmpFechaNacimiento ? new Date(row.EmpFechaNacimiento).toISOString().split('T')[0] : '',
  EmpFechaIngreso: row.EmpFechaIngreso ? new Date(row.EmpFechaIngreso).toISOString().split('T')[0] : '',
  EmpContratoInicio: row.EmpContratoInicio ? new Date(row.EmpContratoInicio).toISOString().split('T')[0] : '',
  EmpContratoFin: row.EmpContratoFin ? new Date(row.EmpContratoFin).toISOString().split('T')[0] : '',
  EmpSalario: row.EmpSalario !== null && row.EmpSalario !== undefined ? Number(row.EmpSalario) : null,
  EmpActivo: Boolean(row.EmpActivo),
});

export const mapBoletaPago = (row: any): BoletaPago => ({
  BoletaID: Number(row.BoletaID),
  EmpCodigo: String(row.EmpCodigo),
  BoletaFecha: row.BoletaFecha ? new Date(row.BoletaFecha).toISOString().split('T')[0] : '',
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
  HMFechaModificacion: row.HMFechaModificacion ? new Date(row.HMFechaModificacion).toISOString() : '',
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
