"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// RF01: Agregar empleado + Registro de Auditoría de Creación
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

  try {
    // 1. Insertar en tabla de Empleados
    await pool.query(
      `INSERT INTO T_Empleado (EmpCodigo, EmpDNI, EmpApePaterno, EmpApeMaterno, EmpNombres, EmpGenero, EmpCorreo, AreCodigo, EmpFechaNac)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, dni, apePaterno, apeMaterno, nombres, genero, correo, area, fechaNac]
    );

    // 2. Insertar en Condiciones Laborales
    await pool.query(
      `INSERT INTO T_CondicionLaboral (EmpCodigo, ConFechaIngreso) VALUES (?, CURDATE())`,
      [codigo]
    );

    // 3. Auditoría: Registrar Alta de Empleado
    await pool.query(
      `INSERT INTO T_Auditoria (AudTablaAfectada, AudAccion, AudDetalle)
       VALUES ('T_Empleado', 'Creación', CONCAT('Se registró al empleado: ', ?, ' ', ?, ' (', ?, ')'))`,
      [nombres, apePaterno, codigo]
    );

    revalidatePath("/");
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error al guardar en la base de datos");
  }
}

// RF01 y RF02: Modificar salario + Registro de Auditoría
export async function modificarSalario(empCodigo: string, nuevoSalario: number) {
  try {
    await pool.query(
      `UPDATE T_CondicionLaboral SET ConSalarioModificado = ? WHERE EmpCodigo = ?`,
      [nuevoSalario, empCodigo]
    );

    await pool.query(
      `INSERT INTO T_Auditoria (AudTablaAfectada, AudAccion, AudDetalle)
       VALUES ('T_CondicionLaboral', 'Modificación de Salario', CONCAT('Salario actualizado a S/. ', ?, ' para el empleado ', ?))`,
      [nuevoSalario, empCodigo]
    );

    revalidatePath("/");
  } catch (error) {
    throw new Error("Error al modificar salario");
  }
}

// RF02: Crear nuevo cargo + Registro de Auditoría
export async function crearCargo(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const salario = Number(formData.get('salario'));

  try {
    await pool.query(
      'INSERT INTO T_Area (AreNombre, AreSalarioBase) VALUES (?, ?)', 
      [nombre, salario]
    );
    
    await pool.query(
      `INSERT INTO T_Auditoria (AudTablaAfectada, AudAccion, AudDetalle)
       VALUES ('T_Area', 'Creación de Cargo', CONCAT('Se creó el cargo: ', ?, ' con salario base S/. ', ?))`,
      [nombre, salario]
    );

    revalidatePath('/cargos');
  } catch (error) {
    throw new Error('Error al crear el cargo');
  }
}

// RF02: Actualizar información de cargos + Registro de Auditoría
export async function modificarCargo(formData: FormData) {
  const areCodigo = Number(formData.get('areCodigo'));
  const nuevoNombre = formData.get('nombre') as string;
  const nuevoSalario = Number(formData.get('salario'));

  try {
    await pool.query(
      `UPDATE T_Area SET AreNombre = ?, AreSalarioBase = ? WHERE AreCodigo = ?`, 
      [nuevoNombre, nuevoSalario, areCodigo]
    );

    await pool.query(
      `INSERT INTO T_Auditoria (AudTablaAfectada, AudAccion, AudDetalle)
       VALUES ('T_Area', 'Modificación de Cargo', CONCAT('Cargo ID ', ?, ' actualizado a: ', ?, ' - S/. ', ?))`, 
      [areCodigo, nuevoNombre, nuevoSalario]
    );

    revalidatePath('/cargos');
    revalidatePath('/');
  } catch (error) {
    throw new Error('Error al modificar el cargo');
  }
}