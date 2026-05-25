"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";

export async function agregarEmpleado(formData: FormData): Promise<ActionResult> {
  const codigo = formData.get("codigo") as string;
  const dni = formData.get("dni") as string;
  const nombres = formData.get("nombres") as string;
  const apePaterno = formData.get("apePaterno") as string;
  const apeMaterno = formData.get("apeMaterno") as string;
  const genero = formData.get("genero") as string;
  const correo = formData.get("correo") as string;
  const area = Number(formData.get("area"));
  const fechaNac = formData.get("fechaNac") as string;

  const fechaIngreso = formData.get("fechaIngreso") as string;
  const contratoInicio = formData.get("contratoInicio") as string;
  const contratoFin = formData.get("contratoFin") as string;

  const idUsuarioActual = 1;

  try {
    // Validar que el área esté activa
    const [areaRows]: any = await pool.query(
      "SELECT AreaID FROM AREA_TRABAJO WHERE AreaID = ? AND activo = 1",
      [area]
    );
    if (areaRows.length === 0) {
      return { success: false, message: "El cargo seleccionado no es válido o no está activo." };
    }

    await pool.query(
      `INSERT INTO EMPLEADO (
        EmpCodigo, AreaID, EmpDNI, EmpApellidoPaterno, EmpApellidoMaterno, 
        EmpNombres, EmpGenero, EmpCorreo, EmpFechaNacimiento, 
        EmpFechaIngreso, EmpContratoInicio, EmpContratoFin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        area,
        dni,
        apePaterno,
        apeMaterno,
        nombres,
        genero,
        correo,
        fechaNac,
        fechaIngreso,
        contratoInicio,
        contratoFin,
      ],
    );

    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorNuevo, UserCodigoHM, FechaModificacion)
       VALUES (?, 'Registro de Empleado', 'Nuevo Registro', ?, NOW())`,
      [codigo, idUsuarioActual],
    );

    revalidatePath("/");
    return { success: true, message: "Empleado registrado exitosamente" };
  } catch (error: any) {
    console.error("Error al guardar empleado:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return {
        success: false,
        message: "El código o DNI ya se encuentra registrado.",
      };
    }
    return {
      success: false,
      message: "Error al guardar el empleado en la base de datos.",
    };
  }
}

export async function modificarSalario(
  empCodigo: string,
  nuevoSalario: number,
): Promise<ActionResult> {
  const idUsuarioActual = 1;
  try {
    const [rows]: any = await pool.query(
      `SELECT EmpSalario FROM EMPLEADO WHERE EmpCodigo = ?`,
      [empCodigo],
    );
    const salarioAnterior = rows[0]?.EmpSalario || "Sueldo Base";

    await pool.query(`UPDATE EMPLEADO SET EmpSalario = ? WHERE EmpCodigo = ?`, [
      nuevoSalario,
      empCodigo,
    ]);

    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion)
       VALUES (?, 'EmpSalario', ?, ?, ?, NOW())`,
      [
        empCodigo,
        String(salarioAnterior),
        String(nuevoSalario),
        idUsuarioActual,
      ],
    );

    revalidatePath("/");
    return { success: true, message: "Salario modificado exitosamente" };
  } catch (error) {
    console.error("Error al modificar salario:", error);
    return { success: false, message: "Error al modificar el salario" };
  }
}

export async function eliminarEmpleado(empCodigo: string): Promise<ActionResult> {
  const idUsuarioActual = 1;
  try {
    await pool.query(`UPDATE EMPLEADO SET activo = 0 WHERE EmpCodigo = ?`, [
      empCodigo,
    ]);
    
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion)
       VALUES (?, 'Eliminación Lógica', 'Activo', 'Inactivo', ?, NOW())`,
      [empCodigo, idUsuarioActual],
    );

    revalidatePath("/");
    return { success: true, message: "Empleado eliminado exitosamente" };
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    return { success: false, message: "Error al eliminar el empleado" };
  }
}

export async function asignarBono(
  empCodigo: string,
  monto: number,
  mes: number,
  anio: number,
): Promise<ActionResult> {
  try {
    await pool.query(
      `INSERT INTO BONO_PRODUCTIVIDAD (EmpCodigo, Monto, Mes, Anio) VALUES (?, ?, ?, ?)`,
      [empCodigo, monto, mes, anio],
    );
    revalidatePath("/");
    return { success: true, message: "Bono asignado exitosamente" };
  } catch (error) {
    console.error("Error al asignar bono:", error);
    return { success: false, message: "Error al asignar el bono" };
  }
}

export async function obtenerProximoCodigo(): Promise<string> {
  try {
    const [rows]: any = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(EmpCodigo, 4) AS UNSIGNED)) AS maxNum FROM EMPLEADO",
    );

    const maxNum = rows[0]?.maxNum;

    if (maxNum !== null && maxNum !== undefined) {
      return `EMP${String(maxNum + 1).padStart(5, "0")}`;
    }

    return "EMP00001";
  } catch (error) {
    console.error("Error al obtener código:", error);
    return "EMP00001";
  }
}
