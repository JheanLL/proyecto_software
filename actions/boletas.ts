'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { calcularGratificacion as calcularGrati } from '@/lib/gratificacion';

function obtenerHoyPeru() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

export async function generarBoletasMes(): Promise<ActionResult> {
  const hoyStr = obtenerHoyPeru();
  const [yyyy, mm] = hoyStr.split('-');
  const fechaBoleta = `${yyyy}-${mm}-01`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existentes]: any = await connection.query(
      "SELECT COUNT(*) as count FROM BOLETA_PAGO WHERE DATE_FORMAT(BoletaFecha, '%Y-%m') = ?",
      [`${yyyy}-${mm}`],
    );
    if (existentes[0].count > 0)
      return {
        success: false,
        message: `La planilla de ${yyyy}-${mm} ya fue procesada.`,
      };

    const [empleados]: any = await connection.query(
      `SELECT e.EmpCodigo, e.EmpFechaIngreso, COALESCE(e.EmpSalario, a.AreaSalario) AS Salario FROM EMPLEADO e INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID WHERE e.EmpActivo = 1`,
    );
    if (empleados.length === 0)
      return {
        success: false,
        message: 'No hay empleados registrados para generar boletas.',
      };

    for (const emp of empleados) {
      const salarioBase = Number(emp.Salario);
      const gratificacion = calcularGrati(emp.EmpFechaIngreso);
      const totalPago = salarioBase + gratificacion;
      await connection.query(
        `INSERT INTO BOLETA_PAGO (EmpCodigo, BoletaFecha, BoletaSalarioBase, BoletaGratificacion, BoletaTotalPago) VALUES (?, ?, ?, ?, ?)`,
        [emp.EmpCodigo, fechaBoleta, salarioBase, gratificacion, totalPago],
      );
    }

    await connection.commit();
    revalidatePath('/boletas');
    return {
      success: true,
      message: `Planilla de ${yyyy}-${mm} generada para ${empleados.length} empleados.`,
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error al procesar planilla:', error);
    return {
      success: false,
      message: 'Error interno al procesar la planilla.',
    };
  } finally {
    connection.release();
  }
}

export async function registrarBoleta(
  empCodigo: string,
  salarioBase: number,
  gratificacion: number,
  totalPago: number,
): Promise<ActionResult> {
  try {
    const [existing]: any = await pool.query(
      `SELECT BoletaID FROM BOLETA_PAGO WHERE EmpCodigo = ? AND MONTH(BoletaFecha) = MONTH(CURDATE()) AND YEAR(BoletaFecha) = YEAR(CURDATE())`,
      [empCodigo],
    );

    if (existing.length > 0) {
      await pool.query(
        `UPDATE BOLETA_PAGO SET BoletaSalarioBase = ?, BoletaGratificacion = ?, BoletaTotalPago = ? WHERE BoletaID = ?`,
        [salarioBase, gratificacion, totalPago, existing[0].BoletaID],
      );
    } else {
      await pool.query(
        `INSERT INTO BOLETA_PAGO (EmpCodigo, BoletaFecha, BoletaSalarioBase, BoletaGratificacion, BoletaTotalPago) VALUES (?, CURDATE(), ?, ?, ?)`,
        [empCodigo, salarioBase, gratificacion, totalPago],
      );
    }

    revalidatePath('/');
    return { success: true, message: 'Boleta registrada exitosamente' };
  } catch (error) {
    console.error('Error al registrar boleta:', error);
    return { success: false, message: 'Error al registrar la boleta' };
  }
}
