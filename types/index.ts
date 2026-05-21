export interface Area {
  AreaID: number;
  AreaNombre: string;
  AreaSalario: number;
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
}

export interface BoletaPago {
  BoletaID: number;
  EmpCodigo: string;
  FechaBoleta: string;
  SalarioBase: number;
  Gratificacion: number;
  TotalPago: number;
}

export interface HistorialModificacion {
  HMID: number;
  EmpCodigo: string | null;
  CampoModificado: string;
  ValorAnterior: string | null;
  ValorNuevo: string;
  FechaModificacion: string;
  UserCodigoHM: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
}
