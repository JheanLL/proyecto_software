"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// RF01: Agregar empleado + Historial
export async function agregarEmpleado(formData: FormData) {
  const codigo = formData.get("codigo") as string;
  const dni = formData.get("dni") as string;
  const nombres = formData.get("nombres") as string;
  const apePaterno = formData.get("apePaterno") as string;
  const apeMaterno = formData.get("apeMaterno") as string;
  const genero = formData.get("genero") as string;
  const correo = formData.get("correo") as string;
  const area = Number(formData.get("area"));
  const fechaNac = formData.get("fechaNac") as string;
  
  // Usuario temporal para la auditoría (hasta conectar la sesión JWT)
  const idUsuarioActual = 1; 

  try {
    // 1. Insertar Empleado (Las fechas de ingreso van directo aquí ahora)
    await pool.query(
      `INSERT INTO EMPLEADO (EmpCodigo, AreaID, EmpDNI, EmpApellidoPaterno, EmpApellidoMaterno, EmpNombres, EmpGenero, EmpCorreo, EmpFechaNacimiento, EmpFechaIngreso)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [codigo, area, dni, apePaterno, apeMaterno, nombres, genero, correo, fechaNac]
    );

    // 2. Historial: Alta de Empleado
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorNuevo, UserCodigoHM)
       VALUES (?, 'Alta de Empleado', 'Nuevo Registro', ?)`,
      [codigo, idUsuarioActual]
    );

    revalidatePath("/");
    return { success: true, message: "Empleado registrado exitosamente" };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, message: "Error al guardar el empleado" };
  }
}

// RF01 y RF02: Modificar salario + Historial
export async function modificarSalario(empCodigo: string, nuevoSalario: number) {
  const idUsuarioActual = 1;
  try {
    // Obtener salario anterior para el registro preciso
    const [rows]: any = await pool.query(`SELECT EmpSalario FROM EMPLEADO WHERE EmpCodigo = ?`, [empCodigo]);
    const salarioAnterior = rows[0]?.EmpSalario || 'Sueldo Base';

    await pool.query(
      `UPDATE EMPLEADO SET EmpSalario = ? WHERE EmpCodigo = ?`,
      [nuevoSalario, empCodigo]
    );

    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorAnterior, ValorNuevo, UserCodigoHM)
       VALUES (?, 'EmpSalario', ?, ?, ?)`,
      [empCodigo, String(salarioAnterior), String(nuevoSalario), idUsuarioActual]
    );

    revalidatePath("/");
    return { success: true, message: "Salario modificado exitosamente" };
  } catch (error) {
    console.error("Error al modificar salario:", error);
    return { success: false, message: "Error al modificar el salario" };
  }
}

// RF02: Crear nuevo cargo (Área)
export async function crearCargo(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const salario = Number(formData.get('salario'));
  const idUsuarioActual = 1;

  try {
    await pool.query(
      'INSERT INTO AREA_TRABAJO (AreaNombre, AreaSalario) VALUES (?, ?)', 
      [nombre, salario]
    );
    
    // Al ser un cambio global y no de un empleado específico, EmpCodigo queda como NULL
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (CampoModificado, ValorNuevo, UserCodigoHM)
       VALUES ('Creación de Área', CONCAT(?, ' - S/. ', ?), ?)`,
      [nombre, salario, idUsuarioActual]
    );

    revalidatePath('/cargos');
    return { success: true, message: "Cargo creado exitosamente" };
  } catch (error) {
    console.error("Error al crear cargo:", error);
    return { success: false, message: "Error al crear el cargo" };
  }
}

// RF02: Actualizar cargo (Área)
export async function modificarCargo(formData: FormData) {
  const areaID = Number(formData.get('areCodigo'));
  const nuevoNombre = formData.get('nombre') as string;
  const nuevoSalario = Number(formData.get('salario'));
  const idUsuarioActual = 1;

  try {
    await pool.query(
      `UPDATE AREA_TRABAJO SET AreaNombre = ?, AreaSalario = ? WHERE AreaID = ?`, 
      [nuevoNombre, nuevoSalario, areaID]
    );

    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (CampoModificado, ValorNuevo, UserCodigoHM)
       VALUES ('Modificación de Área', CONCAT(?, ' - S/. ', ?), ?)`, 
      [nuevoNombre, nuevoSalario, idUsuarioActual]
    );

    revalidatePath('/cargos');
    revalidatePath('/');
    return { success: true, message: "Cargo actualizado exitosamente" };
  } catch (error) {
    console.error("Error al modificar cargo:", error);
    return { success: false, message: "Error al modificar el cargo" };
  }
}