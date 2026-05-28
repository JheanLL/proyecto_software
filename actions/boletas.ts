"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";

function obtenerHoyPeru() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

export async function generarBoletasMes(): Promise<ActionResult> {
  const hoyStr = obtenerHoyPeru();
  const [yyyy, mm] = hoyStr.split("-");
  const fechaBoleta = `${yyyy}-${mm}-01`;
  const mesActual = parseInt(mm) - 1; 
  const gratificacion = (mesActual === 6 || mesActual === 11) ? 300.0 : 0.0;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [existentes]: any = await connection.query(
      "SELECT COUNT(*) as count FROM BOLETA_PAGO WHERE DATE_FORMAT(BoletaFechaBoleta, '%Y-%m') = ?", 
      [`${yyyy}-${mm}`]
    );
    if (existentes[0].count > 0) return { success: false, message: `La planilla de ${yyyy}-${mm} ya fue procesada.` };
    
    const [empleados]: any = await connection.query(`SELECT e.EmpCodigo, COALESCE(e.EmpSalario, a.AreaSalario) AS Salario FROM EMPLEADO e INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID WHERE e.activo = 1`);
    if (empleados.length === 0) return { success: false, message: "No hay empleados registrados para generar boletas." };
    
    for (const emp of empleados) {
      const salarioBase = Number(emp.Salario);
      const totalPago = salarioBase + gratificacion;
      const boletaId = `BOL-${emp.EmpCodigo}-${yyyy}${mm}`;
      await connection.query(
        `INSERT INTO BOLETA_PAGO (BoletaID, EmpCodigo, BoletaFechaBoleta, BoletaSalarioBase, BoletaGratificacion, BoletaTotalPago) VALUES (?, ?, ?, ?, ?, ?)`, 
        [boletaId, emp.EmpCodigo, fechaBoleta, salarioBase, gratificacion, totalPago]
      );
    }
    
    await connection.commit();
    revalidatePath("/boletas");
    return { success: true, message: `Planilla de ${yyyy}-${mm} generada para ${empleados.length} empleados.` };
  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar planilla:", error);
    return { success: false, message: "Error interno al procesar la planilla." };
  } finally {
    connection.release();
  }
}

export async function registrarBoleta(empCodigo: string, salarioBase: number, gratificacion: number, totalPago: number): Promise<ActionResult> {
  try {
    const boletaId = `BOL-${empCodigo}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const [existing]: any = await pool.query(
      `SELECT BoletaID FROM BOLETA_PAGO WHERE EmpCodigo = ? AND MONTH(BoletaFechaBoleta) = MONTH(CURDATE()) AND YEAR(BoletaFechaBoleta) = YEAR(CURDATE())`,
      [empCodigo]
    );

    if (existing.length > 0) {
      await pool.query(`UPDATE BOLETA_PAGO SET BoletaSalarioBase = ?, BoletaGratificacion = ?, BoletaTotalPago = ? WHERE BoletaID = ?`, [salarioBase, gratificacion, totalPago, existing[0].BoletaID]);
    } else {
      await pool.query(`INSERT INTO BOLETA_PAGO (BoletaID, EmpCodigo, BoletaFechaBoleta, BoletaSalarioBase, BoletaGratificacion, BoletaTotalPago) VALUES (?, ?, CURDATE(), ?, ?, ?)`, [boletaId, empCodigo, salarioBase, gratificacion, totalPago]);
    }
    
    revalidatePath("/");
    return { success: true, message: "Boleta registrada exitosamente" };
  } catch (error) {
    console.error("Error al registrar boleta:", error);
    return { success: false, message: "Error al registrar la boleta" };
  }
}

export async function calcularGratificacion(empCodigo: string, mesSimulado?: number): Promise<number> {
  const [rows]: any = await pool.query("SELECT EmpFechaIngreso FROM EMPLEADO WHERE EmpCodigo = ?", [empCodigo]);
  if (rows.length === 0) return 0.00;

  const fechaActual = new Date();
  const mesActual = mesSimulado || (fechaActual.getMonth() + 1);

  if (mesActual !== 7 && mesActual !== 12) return 0.00;
  return 300.00;
}