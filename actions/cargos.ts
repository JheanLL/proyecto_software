"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";

export async function crearCargo(formData: FormData): Promise<ActionResult> {
  const nombre = formData.get("nombre") as string;
  const salario = Number(formData.get("salario"));
  const idUsuarioActual = 1;

  if (!nombre || nombre.length < 3) return { success: false, message: "Nombre inválido." };
  if (isNaN(salario) || salario <= 0) return { success: false, message: "Salario inválido." };

  try {
    await pool.query("INSERT INTO AREA_TRABAJO (AreaNombre, AreaSalario) VALUES (?, ?)", [nombre, salario]);
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion) VALUES (NULL, 'Creación de Área', 'Registro Nuevo', CONCAT(?, ' - S/. ', ?), ?, NOW())`,
      [nombre, salario, idUsuarioActual]
    );

    revalidatePath("/cargos");
    return { success: true, message: "Cargo creado exitosamente" };
  } catch (error) {
    console.error("Error al crear cargo:", error);
    return { success: false, message: "Error al crear el cargo" };
  }
}

export async function modificarCargo(formData: FormData): Promise<ActionResult> {
  const areaID = Number(formData.get("areCodigo"));
  const nuevoNombre = formData.get("nombre") as string;
  const nuevoSalario = Number(formData.get("salario"));
  const idUsuarioActual = 1;

  if (!nuevoNombre || nuevoNombre.length < 3) return { success: false, message: "Nombre inválido." };
  if (isNaN(nuevoSalario) || nuevoSalario <= 0) return { success: false, message: "Salario inválido." };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [old]: any = await connection.query("SELECT AreaNombre, AreaSalario FROM AREA_TRABAJO WHERE AreaID = ?", [areaID]);
    const valorAnterior = old[0] ? `${old[0].AreaNombre} - S/. ${old[0].AreaSalario}` : "Desconocido";

    await connection.query(`UPDATE AREA_TRABAJO SET AreaNombre = ?, AreaSalario = ? WHERE AreaID = ?`, [nuevoNombre, nuevoSalario, areaID]);
    await connection.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion) VALUES (NULL, 'Modificación de Área', ?, CONCAT(?, ' - S/. ', ?), ?, NOW())`,
      [valorAnterior, nuevoNombre, nuevoSalario, idUsuarioActual]
    );

    await connection.commit();
    revalidatePath("/cargos");
    revalidatePath("/");
    return { success: true, message: "Cargo actualizado exitosamente" };
  } catch (error) {
    await connection.rollback();
    console.error("Error transaccional en modificarCargo:", error);
    return { success: false, message: "Error al actualizar el cargo. Cambios revertidos." };
  } finally {
    connection.release();
  }
}

export async function eliminarCargo(areaID: number): Promise<ActionResult> {
  const idUsuarioActual = 1;
  try {
    const [empleados]: any = await pool.query("SELECT COUNT(*) as count FROM EMPLEADO WHERE AreaID = ? AND activo = 1", [areaID]);
    if (empleados[0].count > 0) return { success: false, message: "No se puede eliminar un cargo que tiene empleados activos asignados." };

    await pool.query(`UPDATE AREA_TRABAJO SET activo = 0 WHERE AreaID = ?`, [areaID]);
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion) VALUES (NULL, 'Eliminación Lógica de Área', 'Activo', 'Inactivo', ?, NOW())`,
      [idUsuarioActual]
    );

    revalidatePath("/cargos");
    return { success: true, message: "Cargo eliminado exitosamente" };
  } catch (error) {
    console.error("Error al eliminar cargo:", error);
    return { success: false, message: "Error al eliminar el cargo" };
  }
}