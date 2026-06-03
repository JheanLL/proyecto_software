export interface Area {
  AreaID: number;
  AreaNombre: string;
  AreaSalario: number;
  AreaActivo: boolean;
}

export interface Empleado {
  EmpCodigo: string;
  AreaID: number;
  EmpDNI: string;
  EmpApellidoPaterno: string;
  EmpApellidoMaterno: string;
  EmpNombres: string;
  EmpGenero: string;
  EmpCorreo: string;
  EmpFechaNacimiento: string;
  EmpFechaIngreso: string;
  EmpContratoInicio: string;
  EmpContratoFin: string;
  EmpSalario: number | null;
  EmpActivo: boolean;
}

export interface BoletaPago {
  BoletaID: number;
  EmpCodigo: string;
  BoletaFecha: string;
  BoletaSalarioBase: number;
  BoletaGratificacion: number;
  BoletaTotalPago: number;
}

export interface HistorialModificacion {
  HMID: number;
  HMEmpCodigo: string;
  HMCampoModificado: string;
  HMValorAnterior: string | null;
  HMValorNuevo: string;
  HMFechaModificacion: string;
  HMUserCodigo: number;
}

export interface Rol {
  RolID: number;
  RolNombre: string;
}

export interface Usuario {
  UserCodigo: number;
  UserNombre: string;
  UserCorreo: string;
  UserPassword: string;
  RolID: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
}