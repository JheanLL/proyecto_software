/**
 * Función pura para calcular la gratificación según la legislación peruana.
 * 
 * La gratificación se paga en julio y diciembre.
 * El monto es proporcional a los meses trabajados en el semestre:
 *   - Cada mes completo trabajado equivale a S/50
 *   - Máximo: 6 meses (S/300)
 *   - Mínimo: 0 meses (S/0) en meses que no sean julio o diciembre
 * 
 * @param fechaIngreso - Fecha de ingreso del empleado
 * @param mesActual - Mes actual (1-12), por defecto el mes actual del sistema
 * @returns Monto de gratificación calculado
 */
export function calcularGratificacion(
  fechaIngreso: Date | string,
  mesActual?: number,
): number {
  const hoy = new Date();
  const mes = mesActual ?? hoy.getMonth(); // 0-indexed (enero=0)

  // La gratificación solo aplica en julio (6) y diciembre (11)
  if (mes !== 6 && mes !== 11) return 0;

  const ingreso = typeof fechaIngreso === "string" 
    ? new Date(fechaIngreso) 
    : fechaIngreso;

  // Calcular meses trabajados desde la fecha de ingreso
  let mesesTrabajados =
    (hoy.getFullYear() - ingreso.getFullYear()) * 12 +
    (hoy.getMonth() - ingreso.getMonth());

  // Si el día actual es menor al día de ingreso, el mes no está completo
  if (hoy.getDate() < ingreso.getDate()) {
    mesesTrabajados--;
  }

  // Máximo 6 meses computables por semestre
  const mesesComputables = Math.max(0, Math.min(6, mesesTrabajados));

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