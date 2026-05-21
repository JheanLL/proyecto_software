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

  const salarioInput = formData.get("salario") as string;
  const salario = salarioInput ? parseFloat(salarioInput) : null;

  const idUsuarioActual = 1;

  try {
    await pool.query(
      `INSERT INTO EMPLEADO (
        EmpCodigo, AreaID, EmpDNI, EmpApellidoPaterno, EmpApellidoMaterno, 
        EmpNombres, EmpGenero, EmpCorreo, EmpFechaNacimiento, 
        EmpFechaIngreso, EmpContratoInicio, EmpContratoFin, EmpSalario
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        salario,
      ],
    );

    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorNuevo, UserCodigoHM)
       VALUES (?, 'Registro de Empleado', 'Nuevo Registro', ?)`,
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
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM)
       VALUES (?, 'EmpSalario', ?, ?, ?)`,
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
