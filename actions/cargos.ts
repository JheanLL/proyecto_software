'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mi_clave_secreta_super_segura_para_desarrollo',
);

async function obtenerUserIdDesdeJWT(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Sesión no encontrada');
  const { payload } = await jwtVerify(token, SECRET_KEY);
  return Number(payload.userId);
}

export async function crearCargo(formData: FormData): Promise<ActionResult> {
  const nombre = formData.get('nombre') as string;
  const salario = Number(formData.get('salario'));

  if (!nombre || nombre.length < 3)
    return { success: false, message: 'Nombre inválido.' };
  if (isNaN(salario) || salario <= 0)
    return { success: false, message: 'Salario inválido.' };

  let idUsuarioActual: number;
  try {
    idUsuarioActual = await obtenerUserIdDesdeJWT();
  } catch {
    return {
      success: false,
      message: 'Sesión expirada. Vuelve a iniciar sesión.',
    };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO AREA_TRABAJO (AreaNombre, AreaSalario) VALUES (?, ?)',
      [nombre, salario],
    );
    const FechaModificacion = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await connection.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorAnterior, HMValorNuevo, HMFechaModificacion, HMUserCodigo) VALUES (NULL, 'Creación de Área', 'Registro Nuevo', CONCAT(?, ' - S/. ', ?), ?, ?)`,
      [nombre, salario, FechaModificacion, idUsuarioActual],
    );

    await connection.commit();
    revalidatePath('/cargos');
    return { success: true, message: 'Cargo creado exitosamente' };
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear cargo:', error);
    return { success: false, message: 'Error al crear el cargo' };
  } finally {
    connection.release();
  }
}

export async function modificarCargo(
  formData: FormData,
): Promise<ActionResult> {
  const areaID = Number(formData.get('areCodigo'));
  const nuevoNombre = formData.get('nombre') as string;
  const nuevoSalario = Number(formData.get('salario'));

  if (!nuevoNombre || nuevoNombre.length < 3)
    return { success: false, message: 'Nombre inválido.' };
  if (isNaN(nuevoSalario) || nuevoSalario <= 0)
    return { success: false, message: 'Salario inválido.' };

  let idUsuarioActual: number;
  try {
    idUsuarioActual = await obtenerUserIdDesdeJWT();
  } catch {
    return {
      success: false,
      message: 'Sesión expirada. Vuelve a iniciar sesión.',
    };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [old]: any = await connection.query(
      'SELECT AreaNombre, AreaSalario FROM AREA_TRABAJO WHERE AreaID = ?',
      [areaID],
    );
    const valorAnterior = old[0]
      ? `${old[0].AreaNombre} - S/. ${old[0].AreaSalario}`
      : 'Desconocido';

    await connection.query(
      `UPDATE AREA_TRABAJO SET AreaNombre = ?, AreaSalario = ? WHERE AreaID = ?`,
      [nuevoNombre, nuevoSalario, areaID],
    );

    const FechaModificacion = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await connection.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorAnterior, HMValorNuevo, HMFechaModificacion, HMUserCodigo) VALUES (NULL, 'Modificación de Área', ?, CONCAT(?, ' - S/. ', ?), ?, ?)`,
      [
        valorAnterior,
        nuevoNombre,
        nuevoSalario,
        FechaModificacion,
        idUsuarioActual,
      ],
    );

    await connection.commit();
    revalidatePath('/cargos');
    revalidatePath('/');
    return { success: true, message: 'Cargo actualizado exitosamente' };
  } catch (error) {
    await connection.rollback();
    console.error('Error transaccional en modificarCargo:', error);
    return {
      success: false,
      message: 'Error al actualizar el cargo. Cambios revertidos.',
    };
  } finally {
    connection.release();
  }
}

export async function eliminarCargo(areaID: number): Promise<ActionResult> {
  let idUsuarioActual: number;
  try {
    idUsuarioActual = await obtenerUserIdDesdeJWT();
  } catch {
    return {
      success: false,
      message: 'Sesión expirada. Vuelve a iniciar sesión.',
    };
  }

  try {
    const [empleados]: any = await pool.query(
      'SELECT COUNT(*) as count FROM EMPLEADO WHERE AreaID = ? AND EmpActivo = 1',
      [areaID],
    );
    if (empleados[0].count > 0)
      return {
        success: false,
        message:
          'No se puede eliminar un cargo que tiene empleados activos asignados.',
      };

    await pool.query(`UPDATE AREA_TRABAJO SET AreaActivo = 0 WHERE AreaID = ?`, [
      areaID,
    ]);

    const FechaModificacion = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorAnterior, HMValorNuevo, HMFechaModificacion, HMUserCodigo) VALUES (NULL, 'Eliminación Lógica de Área', 'Activo', 'Inactivo', ?, ?)`,
      [FechaModificacion, idUsuarioActual],
    );

    revalidatePath('/cargos');
    return { success: true, message: 'Cargo eliminado exitosamente' };
  } catch (error) {
    console.error('Error al eliminar cargo:', error);
    return { success: false, message: 'Error al eliminar el cargo' };
  }
}
