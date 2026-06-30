/**
 * dateUtils.ts — fuente única de verdad para manejo de fechas.
 *
 * Filosofía:
 *   - mysql2 (con timezone:"Z") devuelve campos DATE/DATETIME como Date objects en UTC. ✓
 *   - Los formularios envían strings "YYYY-MM-DD". ✓
 *   - Todo se normaliza a UTC midnight y se opera con getUTC* para consistencia total.
 *   - "Hoy" se expresa en hora Peru como UTC midnight para poder comparar directamente.
 */

/**
 * Convierte un campo de fecha a Date UTC midnight.
 *  - Date object de mysql2 → ya está en UTC, se retorna tal cual.
 *  - String "YYYY-MM-DD" de formulario → se interpreta como UTC midnight.
 */
export function toUtcDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const [y, m, day] = (d as string).substring(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

/**
 * Retorna la fecha de hoy en zona horaria Peru como Date UTC midnight.
 * Así puede compararse directamente con cualquier Date UTC de la DB.
 */
export function hoyPeru(): Date {
  const s = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Calcula la edad exacta en años a partir de una fecha de nacimiento. */
export function calcularEdad(fechaNac: Date | string): number {
  const fn  = toUtcDate(fechaNac);
  const hoy = hoyPeru();
  let edad  = hoy.getUTCFullYear() - fn.getUTCFullYear();
  if (
    hoy.getUTCMonth() < fn.getUTCMonth() ||
    (hoy.getUTCMonth() === fn.getUTCMonth() && hoy.getUTCDate() < fn.getUTCDate())
  ) edad--;
  return edad;
}

/**
 * Calcula la antigüedad exacta en años, meses y días.
 * Devuelve null si la fecha de ingreso es futura.
 */
export function calcularAntiguedad(fechaIngreso: Date | string): string | null {
  const fi  = toUtcDate(fechaIngreso);
  const hoy = hoyPeru();
  if (fi > hoy) return null;

  let anios = hoy.getUTCFullYear() - fi.getUTCFullYear();
  let meses = hoy.getUTCMonth()    - fi.getUTCMonth();
  let dias  = hoy.getUTCDate()     - fi.getUTCDate();

  if (dias < 0) {
    meses--;
    dias += new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 0)).getUTCDate();
  }
  if (meses < 0) { anios--; meses += 12; }

  return `${anios} años, ${meses} meses, ${dias} días`;
}

/**
 * Formatea un campo DATE de la DB (Date object o string) a "YYYY-MM-DD".
 * Útil para comparar en el historial de auditoría.
 */
export function toDateString(d: Date | string | null | undefined): string {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d).substring(0, 10);
}
