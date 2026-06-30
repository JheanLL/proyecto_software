/**
 * Función pura para calcular la gratificación según la legislación peruana.
 * 
 * La gratificación se paga en julio y diciembre.
 * Cada gratificación corresponde a un semestre específico:
 *   - Julio: se computan los meses de enero a junio (6 meses)
 *   - Diciembre: se computan los meses de julio a diciembre (diciembre se cuenta por adelantado)
 * 
 * Un mes es computable si el empleado ingresó en o antes del primer día de ese mes.
 * Cada mes completo trabajado equivale a S/50 (máximo 6 meses = S/300).
 * 
 * @param fechaIngreso - Fecha de ingreso del empleado
 * @param mesActual - Mes actual (0-indexed: enero=0), por defecto el mes actual del sistema
 * @returns Monto de gratificación calculado
 */
import { toUtcDate, hoyPeru } from '@/lib/dateUtils';

export function calcularGratificacion(
  fechaIngreso: Date | string,
  mesActual?: number,
): number {
  const hoy = new Date();
  const mes = mesActual ?? hoy.getMonth();

  // La gratificación solo aplica en julio (6) y diciembre (11)
  if (mes !== 6 && mes !== 11) return 0;

  const ingreso = toUtcDate(fechaIngreso);
  const anio = hoyPeru().getUTCFullYear();

  const inicioSemestre = mes === 6 ? 0 : 6;
  const finSemestre = mes === 6 ? 5 : 11;

  let mesesComputables = 0;

  for (let m = inicioSemestre; m <= finSemestre; m++) {
    const primerDiaMes = new Date(Date.UTC(anio, m, 1));
    if (ingreso <= primerDiaMes) mesesComputables++;
  }

  // S/50 por mes completo trabajado
  return mesesComputables * 50;
}

/**
 * Versión simplificada cuando solo se necesita saber si el mes tiene gratificación.
 * Útil para cuando no se requiere calcular el monto exacto.
 */
export function esMesGratificacion(mes: number): boolean {
  return mes === 6 || mes === 11;
}