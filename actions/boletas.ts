"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";

export async function generarBoletasMes(): Promise<ActionResult> {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const fechaBoleta = `${yyyy}-${mm}-01`;

  const mesActual = hoy.getMonth();
  const gratificacion = mesActual === 6 || mesActual === 11 ? 300.0 : 0.0;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existentes]: any = await connection.query(
      "SELECT COUNT(*) as count FROM BOLETA_PAGO WHERE DATE_FORMAT(FechaBoleta, '%Y-%m') = ?",
      [`${yyyy}-${mm}`],
    );

    if (existentes[0].count > 0) {
      return {
        success: false,
        message: `La planilla de ${yyyy}-${mm} ya fue procesada previamente.`,
      };
    }

    const [empleados]: any = await connection.query(`
      SELECT e.EmpCodigo, COALESCE(e.EmpSalario, a.AreaSalario) AS Salario
      FROM EMPLEADO e
      INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    `);

    if (empleados.length === 0) {
      return {
        success: false,
        message: "No hay empleados registrados para generar boletas.",
      };
    }

    for (const emp of empleados) {
      const salarioBase = Number(emp.Salario);
      const totalPago = salarioBase + gratificacion;

      await connection.query(
        `INSERT INTO BOLETA_PAGO (EmpCodigo, FechaBoleta, SalarioBase, Gratificacion, TotalPago)
         VALUES (?, ?, ?, ?, ?)`,
        [emp.EmpCodigo, fechaBoleta, salarioBase, gratificacion, totalPago],
      );
    }

    await connection.commit();
    revalidatePath("/boletas");
    return {
      success: true,
      message: `Planilla de ${yyyy}-${mm} generada con éxito para ${empleados.length} empleados.`,
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar planilla:", error);
    return {
      success: false,
      message: "Error interno al procesar la planilla mensual.",
    };
  } finally {
    connection.release();
  }
}
