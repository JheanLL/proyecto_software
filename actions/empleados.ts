"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "mi_clave_secreta_super_segura_para_desarrollo",
);

function obtenerHoyPeru() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}

export async function agregarEmpleado(
  formData: FormData,
): Promise<ActionResult> {
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

  // Validaciones
  const hoyStr = obtenerHoyPeru();
  if (!contratoInicio.endsWith("-01"))
    return {
      success: false,
      message: "El contrato debe iniciar el día 1 de un mes.",
    };
  if (contratoInicio < hoyStr)
    return {
      success: false,
      message: "La fecha de inicio no puede ser anterior a hoy.",
    };
  if (contratoFin <= contratoInicio)
    return {
      success: false,
      message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    };

  try {
    const [areaRows]: any = await pool.query(
      "SELECT AreaID FROM AREA_TRABAJO WHERE AreaID = ? AND activo = 1",
      [area],
    );
    if (areaRows.length === 0)
      return {
        success: false,
        message: "El cargo seleccionado no es válido o no está activo.",
      };

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
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorNuevo, UserCodigoHM, FechaModificacion) VALUES (?, 'Registro de Empleado', 'Nuevo Registro', ?, NOW())`,
      [codigo, idUsuarioActual],
    );

    revalidatePath("/");
    return { success: true, message: "Empleado registrado exitosamente" };
  } catch (error: any) {
    console.error("Error al guardar empleado:", error);
    if (error.code === "ER_DUP_ENTRY")
      return {
        success: false,
        message: "El código o DNI ya se encuentra registrado.",
      };
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
  if (isNaN(nuevoSalario) || nuevoSalario <= 0)
    return { success: false, message: "Salario inválido." };

  try {
    const [rows]: any = await pool.query(
      `SELECT EmpSalario FROM EMPLEADO WHERE EmpCodigo = ?`,
      [empCodigo],
    );
    const salarioAnterior = rows[0]?.EmpSalario;

    if (salarioAnterior !== null && Number(salarioAnterior) === nuevoSalario) {
      return {
        success: false,
        message: "El nuevo salario debe ser diferente al actual.",
      };
    }

    await pool.query(`UPDATE EMPLEADO SET EmpSalario = ? WHERE EmpCodigo = ?`, [
      nuevoSalario,
      empCodigo,
    ]);
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion) VALUES (?, 'EmpSalario', ?, ?, ?, NOW())`,
      [
        empCodigo,
        String(salarioAnterior || "Sueldo Base"),
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

export async function eliminarEmpleado(
  empCodigo: string,
): Promise<ActionResult> {
  const idUsuarioActual = 1;
  try {
    await pool.query(`UPDATE EMPLEADO SET activo = 0 WHERE EmpCodigo = ?`, [
      empCodigo,
    ]);
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion) VALUES (?, 'Eliminación Lógica', 'Activo', 'Inactivo', ?, NOW())`,
      [empCodigo, idUsuarioActual],
    );
    revalidatePath("/");
    return { success: true, message: "Empleado eliminado exitosamente" };
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    return { success: false, message: "Error al eliminar el empleado" };
  }
}

export async function obtenerProximoCodigo(): Promise<string> {
  try {
    const [rows]: any = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(EmpCodigo, 4) AS UNSIGNED)) AS maxNum FROM EMPLEADO",
    );
    const maxNum = rows[0]?.maxNum;
    if (maxNum !== null && maxNum !== undefined)
      return `EMP${String(maxNum + 1).padStart(5, "0")}`;
    return "EMP00001";
  } catch (error) {
    console.error("Error al obtener código:", error);
    return "EMP00001";
  }
}

export async function actualizarEmpleado(
  formData: FormData,
): Promise<ActionResult> {
  const codigo = formData.get("codigo") as string;
  const dni = formData.get("dni") as string;
  const nombres = formData.get("nombres") as string;
  const apePaterno = formData.get("apePaterno") as string;
  const apeMaterno = formData.get("apeMaterno") as string;
  const genero = formData.get("genero") as string;
  const correo = formData.get("correo") as string;
  const areaId = Number(formData.get("area"));
  const salario = parseFloat((formData.get("salario") as string) || "0");
  const fechaNac = formData.get("fechaNac") as string;
  const contratoInicio = formData.get("contratoInicio") as string;
  const contratoFin = formData.get("contratoFin") as string;

  // --- VALIDACIONES BACKEND ---
  if (!/^\d{8}$/.test(dni)) {
    return {
      success: false,
      message: "El DNI debe tener exactamente 8 dígitos.",
    };
  }

  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (
    !nameRegex.test(nombres) ||
    !nameRegex.test(apePaterno) ||
    !nameRegex.test(apeMaterno)
  ) {
    return {
      success: false,
      message: "Nombres y apellidos solo deben contener letras.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { success: false, message: "Formato de correo inválido." };
  }

  // Validación de Edad
  const hoy = new Date();
  const [yNac, mNac, dNac] = fechaNac.split("-").map(Number);
  const fn = new Date(yNac, mNac - 1, dNac);
  if (hoy.getFullYear() - fn.getFullYear() < 18) {
    return { success: false, message: "El empleado debe ser mayor de edad." };
  }

  // Validación de Contrato
  const [yI, mI, dI] = contratoInicio.split("-").map(Number);
  const inicio = new Date(yI, mI - 1, dI);

  const [yF, mF, dF] = contratoFin.split("-").map(Number);
  const fin = new Date(yF, mF - 1, dF);

  if (inicio.getDate() !== 1) {
    return {
      success: false,
      message: "El contrato debe iniciar el día 1 del mes.",
    };
  }

  if (fin <= inicio) {
    return {
      success: false,
      message: "La fecha de fin de contrato debe ser posterior a la de inicio.",
    };
  }
  // ----------------------------

  // EXTRAER EL USUARIO DESDE EL JWT
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return {
      success: false,
      message: "Acceso denegado: Sesión no encontrada.",
    };
  }

  let idUsuarioActual: number;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    idUsuarioActual = Number(payload.userId);
  } catch (error) {
    return {
      success: false,
      message: "Acceso denegado: Sesión expirada o inválida.",
    };
  }

  try {
    const [oldRows]: any = await pool.query(
      `SELECT e.AreaID, e.EmpSalario, a.AreaNombre 
       FROM EMPLEADO e 
       LEFT JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID 
       WHERE e.EmpCodigo = ?`,
      [codigo],
    );
    const anterior = oldRows[0];

    let nuevoNombreArea = "Desconocido";
    if (anterior && Number(anterior.AreaID) !== areaId) {
      const [newAreaRows]: any = await pool.query(
        "SELECT AreaNombre FROM AREA_TRABAJO WHERE AreaID = ?",
        [areaId],
      );
      nuevoNombreArea = newAreaRows[0]?.AreaNombre || "Desconocido";
    }

    await pool.query(
      `UPDATE EMPLEADO SET 
        AreaID = ?, EmpDNI = ?, EmpApellidoPaterno = ?, EmpApellidoMaterno = ?, 
        EmpNombres = ?, EmpGenero = ?, EmpCorreo = ?, EmpFechaNacimiento = ?, 
        EmpContratoInicio = ?, EmpContratoFin = ?, EmpSalario = ?
       WHERE EmpCodigo = ?`,
      [
        areaId,
        dni,
        apePaterno,
        apeMaterno,
        nombres,
        genero,
        correo,
        fechaNac,
        contratoInicio,
        contratoFin,
        salario,
        codigo,
      ],
    );

    if (anterior) {
      if (Number(anterior.AreaID) !== areaId) {
        await pool.query(
          `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion)
           VALUES (?, 'Cambio de Cargo / Área', ?, ?, ?, NOW())`,
          [
            codigo,
            anterior.AreaNombre || "Sin Cargo",
            nuevoNombreArea,
            idUsuarioActual,
          ],
        );
      }

      const salarioAnteriorNumber = parseFloat(anterior.EmpSalario || "0");
      if (salarioAnteriorNumber !== salario) {
        const formattedOld = `S/. ${salarioAnteriorNumber.toFixed(2)}`;
        const formattedNew = `S/. ${salario.toFixed(2)}`;

        await pool.query(
          `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM, FechaModificacion)
           VALUES (?, 'Ajuste Salarial', ?, ?, ?, NOW())`,
          [codigo, formattedOld, formattedNew, idUsuarioActual],
        );
      }
    }

    revalidatePath("/");
    revalidatePath(`/empleados/${codigo}`);
    return {
      success: true,
      message: "Información del empleado actualizada correctamente.",
    };
  } catch (error: any) {
    console.error("Error al actualizar empleado:", error);
    return {
      success: false,
      message: "Error al actualizar los datos en la base de datos.",
    };
  }
}
