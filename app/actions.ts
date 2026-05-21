"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// RF01: Agregar empleado
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
      `
      INSERT INTO T_Empleado (EmpCodigo, EmpDNI, EmpApePaterno, EmpApeMaterno, EmpNombres, EmpGenero, EmpCorreo, AreCodigo, EmpFechaNac)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        codigo,
        dni,
        apePaterno,
        apeMaterno,
        nombres,
        genero,
        correo,
        area,
        fechaNac,
      ],
    );

    // 2. Insertar en Condiciones Laborales (Por defecto asume fecha de ingreso HOY y contrato de 1 año)
    await pool.query(
      `
      INSERT INTO T_CondicionLaboral (EmpCodigo, ConFechaInicio, ConFechaFin, ConFechaIngreso) 
      VALUES (?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), CURDATE())
    `,
      [codigo],
    );
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error al guardar en la base de datos");
  }
}

// RF01 y RF02: Modificar salario y guardar auditoría
export async function modificarSalario(
  empCodigo: string,
  nuevoSalario: number,
) {
  try {
    // 1. Actualizar salario
    await pool.query(
      `
      UPDATE T_CondicionLaboral SET ConSalarioModificado = ? WHERE EmpCodigo = ?
    `,
      [nuevoSalario, empCodigo],
    );

    // 2. RF02: Registro de auditoría
    await pool.query(
      `
      INSERT INTO T_Auditoria (AudTablaAfectada, AudAccion, AudDetalle)
      VALUES ('T_CondicionLaboral', 'Modificación de Salario', CONCAT('Salario actualizado a ', ?, ' para el empleado ', ?))
    `,
      [nuevoSalario, empCodigo],
    );

    revalidatePath("/");
  } catch (error) {
    throw new Error("Error al modificar salario");
  }
}

// RF02: Actualizar información de cargos
export async function modificarCargo(formData: FormData) {
  const areCodigo = Number(formData.get('areCodigo'));
  const nuevoNombre = formData.get('nombre') as string;
  const nuevoSalario = Number(formData.get('salario'));

  try {
    await pool.query(`
      UPDATE T_Area SET AreNombre = ?, AreSalarioBase = ? WHERE AreCodigo = ?
    `, [nuevoNombre, nuevoSalario, areCodigo]);

    await pool.query(`
      INSERT INTO T_Auditoria (AudTablaAfectada, AudAccion, AudDetalle)
      VALUES ('T_Area', 'Modificación de Cargo', CONCAT('Cargo ID ', ?, ' actualizado a: ', ?, ' - S/. ', ?))
    `, [areCodigo, nuevoNombre, nuevoSalario]);

    revalidatePath('/cargos');
    revalidatePath('/'); // Recarga también la tabla principal por si cambió el sueldo base
  } catch (error) {
    throw new Error('Error al modificar el cargo');
  }
}