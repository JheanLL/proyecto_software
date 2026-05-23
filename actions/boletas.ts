"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";

export async function registrarBoleta(
  empCodigo: string,
  salarioBase: number,
  gratificacion: number,
  totalPago: number,
  bonoRendimiento: number
): Promise<ActionResult> {
  try {
    // Verificar si ya existe una boleta para este empleado en el mes y año actual
    const [existing]: any = await pool.query(
      `SELECT ID FROM BOLETA_PAGO 
       WHERE EmpCodigo = ? AND MONTH(FechaBoleta) = MONTH(CURDATE()) AND YEAR(FechaBoleta) = YEAR(CURDATE())`,
      [empCodigo]
    );

    if (existing.length > 0) {
      // Actualizar boleta existente
      await pool.query(
        `UPDATE BOLETA_PAGO 
         SET SalarioBase = ?, Gratificacion = ?, BonoRendimiento = ?, TotalPago = ?
         WHERE ID = ?`,
        [salarioBase, gratificacion, bonoRendimiento, totalPago, existing[0].ID]
      );
    } else {
      // Insertar nueva boleta
      await pool.query(
        `INSERT INTO BOLETA_PAGO (EmpCodigo, FechaBoleta, SalarioBase, Gratificacion, BonoRendimiento, TotalPago) 
         VALUES (?, CURDATE(), ?, ?, ?, ?)`,
        [empCodigo, salarioBase, gratificacion, bonoRendimiento, totalPago]
      );
    }
    
    revalidatePath("/");
    return { success: true, message: "Boleta registrada exitosamente" };
  } catch (error) {
    console.error("Error al registrar boleta:", error);
    return { success: false, message: "Error al registrar la boleta" };
  }
}

export async function calcularGratificacion(): Promise<number> {
  const mesActual = new Date().getMonth() + 1; // 1-12
  return (mesActual === 7 || mesActual === 12) ? 300.00 : 0.00;
}
