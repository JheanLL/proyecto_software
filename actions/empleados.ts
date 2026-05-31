'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ActionResult } from '@/types';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mi_clave_secreta_super_segura_para_desarrollo',
);

function obtenerHoyPeru() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
}

async function obtenerUserIdDesdeJWT(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('Sesión no encontrada');
  const { payload } = await jwtVerify(token, SECRET_KEY);
  return Number(payload.userId);
}

export async function agregarEmpleado(
  formData: FormData,
): Promise<ActionResult> {
  const codigo = (formData.get('codigo') as string).trim();
  const dni = (formData.get('dni') as string).trim();
  const nombres = (formData.get('nombres') as string).trim();
  const apePaterno = (formData.get('apePaterno') as string).trim();
  const apeMaterno = (formData.get('apeMaterno') as string).trim();
  const genero = (formData.get('genero') as string).trim();
  const correo = (formData.get('correo') as string).trim();
  const area = Number(formData.get('area'));
  const fechaNac = formData.get('fechaNac') as string;
  const fechaIngreso = formData.get('fechaIngreso') as string;
  const contratoInicio = formData.get('contratoInicio') as string;
  const contratoFin = formData.get('contratoFin') as string;

  let idUsuarioActual: number;
  try {
    idUsuarioActual = await obtenerUserIdDesdeJWT();
  } catch {
    return {
      success: false,
      message: 'Sesión expirada. Vuelve a iniciar sesión.',
    };
  }

  // Validaciones
  const hoyStr = obtenerHoyPeru();
  if (!contratoInicio.endsWith('-01'))
    return {
      success: false,
      message: 'El contrato debe iniciar el día 1 de un mes.',
    };
  if (contratoInicio < hoyStr)
    return {
      success: false,
      message: 'La fecha de inicio no puede ser anterior a hoy.',
    };
  if (contratoFin <= contratoInicio)
    return {
      success: false,
      message: 'La fecha de fin debe ser posterior a la fecha de inicio.',
    };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [areaRows]: any = await connection.query(
      'SELECT AreaID, AreaSalario FROM AREA_TRABAJO WHERE AreaID = ? AND activo = 1',
      [area],
    );
    if (areaRows.length === 0) {
      await connection.rollback();
      connection.release();
      return {
        success: false,
        message: 'El cargo seleccionado no es válido o no está activo.',
      };
    }

    const salarioBase = areaRows[0].AreaSalario;

    await connection.query(
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
        salarioBase,
      ],
    );

    const FechaModificacion = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await connection.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorNuevo, HMFechaModificacion, HMUserCodigo) VALUES (?, 'Registro de Empleado', 'Nuevo Registro', ?, ?)`,
      [codigo, FechaModificacion, idUsuarioActual],
    );

    await connection.commit();
    revalidatePath('/');
    return { success: true, message: 'Empleado registrado exitosamente' };
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al guardar empleado:', error);
    if (error.code === 'ER_DUP_ENTRY')
      return {
        success: false,
        message: 'El código o DNI ya se encuentra registrado.',
      };
    return {
      success: false,
      message: 'Error al guardar el empleado en la base de datos.',
    };
  } finally {
    connection.release();
  }
}

export async function modificarSalario(
  empCodigo: string,
  nuevoSalario: number,
): Promise<ActionResult> {
  let idUsuarioActual: number;
  try {
    idUsuarioActual = await obtenerUserIdDesdeJWT();
  } catch {
    return {
      success: false,
      message: 'Sesión expirada. Vuelve a iniciar sesión.',
    };
  }

  if (isNaN(nuevoSalario) || nuevoSalario <= 0)
    return { success: false, message: 'Salario inválido.' };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows]: any = await connection.query(
      `SELECT EmpSalario FROM EMPLEADO WHERE EmpCodigo = ?`,
      [empCodigo],
    );
    const salarioAnterior = rows[0]?.EmpSalario;

    if (salarioAnterior !== null && Number(salarioAnterior) === nuevoSalario) {
      await connection.rollback();
      connection.release();
      return {
        success: false,
        message: 'El nuevo salario debe ser diferente al actual.',
      };
    }

    await connection.query(`UPDATE EMPLEADO SET EmpSalario = ? WHERE EmpCodigo = ?`, [
      nuevoSalario,
      empCodigo,
    ]);

    const FechaModificacion = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await connection.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorAnterior, HMValorNuevo, HMFechaModificacion, HMUserCodigo) VALUES (?, 'EmpSalario', ?, ?, ?, ?)`,
      [
        empCodigo,
        String(salarioAnterior || 'Sueldo Base'),
        String(nuevoSalario),
        FechaModificacion,
        idUsuarioActual,
      ],
    );

    await connection.commit();
    revalidatePath('/');
    return { success: true, message: 'Salario modificado exitosamente' };
  } catch (error) {
    await connection.rollback();
    console.error('Error al modificar salario:', error);
    return { success: false, message: 'Error al modificar el salario' };
  } finally {
    connection.release();
  }
}

export async function eliminarEmpleado(
  empCodigo: string,
): Promise<ActionResult> {
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
    await connection.query(`UPDATE EMPLEADO SET activo = 0 WHERE EmpCodigo = ?`, [
      empCodigo,
    ]);

    const FechaModificacion = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    await connection.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorAnterior, HMValorNuevo, HMFechaModificacion, HMUserCodigo) VALUES (?, 'Eliminación Lógica', 'Activo', 'Inactivo', ?, ?)`,
      [empCodigo, FechaModificacion, idUsuarioActual],
    );

    await connection.commit();
    revalidatePath('/');
    return { success: true, message: 'Empleado eliminado exitosamente' };
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar empleado:', error);
    return { success: false, message: 'Error al eliminar el empleado' };
  } finally {
    connection.release();
  }
}

export async function obtenerProximoCodigo(): Promise<string> {
  try {
    const [rows]: any = await pool.query(
      'SELECT MAX(CAST(SUBSTRING(EmpCodigo, 4) AS UNSIGNED)) AS maxNum FROM EMPLEADO',
    );
    const maxNum = rows[0]?.maxNum;
    if (maxNum !== null && maxNum !== undefined)
      return `EMP${String(maxNum + 1).padStart(5, '0')}`;
    return 'EMP00001';
  } catch (error) {
    console.error('Error al obtener código:', error);
    return 'EMP00001';
  }
}

export async function actualizarEmpleado(
  formData: FormData,
): Promise<ActionResult> {
  const codigo = (formData.get('codigo') as string).trim();
  const dni = (formData.get('dni') as string).trim();
  const nombres = (formData.get('nombres') as string).trim();
  const apePaterno = (formData.get('apePaterno') as string).trim();
  const apeMaterno = (formData.get('apeMaterno') as string).trim();
  const genero = (formData.get('genero') as string).trim();
  const correo = (formData.get('correo') as string).trim();
  const areaId = Number(formData.get('area'));
  let salario = parseFloat((formData.get('salario') as string) || '0');

  // Si no viene salario (caso nuevo empleado), buscamos el salario del área
  if (isNaN(salario) || salario === 0) {
    const [areaRows]: any = await pool.query(
      'SELECT AreaSalario FROM AREA_TRABAJO WHERE AreaID = ?',
      [areaId],
    );
    salario = areaRows[0]?.AreaSalario || 0;
  }

  const fechaNac = formData.get('fechaNac') as string;
  const contratoInicio = formData.get('contratoInicio') as string;
  const contratoFin = formData.get('contratoFin') as string;

  // --- VALIDACIONES BACKEND ---
  if (!/^\d{8}$/.test(dni)) {
    return {
      success: false,
      message: 'El DNI debe tener exactamente 8 dígitos.',
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
      message: 'Nombres y apellidos solo deben contener letras.',
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return { success: false, message: 'Formato de correo inválido.' };
  }

  // Validación de Edad
  const hoy = new Date();
  const [yNac, mNac, dNac] = fechaNac.split('-').map(Number);
  const fn = new Date(yNac, mNac - 1, dNac);
  if (hoy.getFullYear() - fn.getFullYear() < 18) {
    return { success: false, message: 'El empleado debe ser mayor de edad.' };
  }

  // Validación de Contrato
  const [yI, mI, dI] = contratoInicio.split('-').map(Number);
  const inicio = new Date(yI, mI - 1, dI);

  const [yF, mF, dF] = contratoFin.split('-').map(Number);
  const fin = new Date(yF, mF - 1, dF);

  if (inicio.getDate() !== 1) {
    return {
      success: false,
      message: 'El contrato debe iniciar el día 1 del mes.',
    };
  }

  if (fin <= inicio) {
    return {
      success: false,
      message: 'La fecha de fin de contrato debe ser posterior a la de inicio.',
    };
  }
  // ----------------------------

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
    const [oldRows]: any = await connection.query(
      `SELECT e.AreaID, e.EmpSalario, a.AreaNombre 
       FROM EMPLEADO e 
       LEFT JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID 
       WHERE e.EmpCodigo = ?`,
      [codigo],
    );
    const anterior = oldRows[0];

    let nuevoNombreArea = 'Desconocido';
    if (anterior && Number(anterior.AreaID) !== areaId) {
      const [newAreaRows]: any = await connection.query(
        'SELECT AreaNombre FROM AREA_TRABAJO WHERE AreaID = ?',
        [areaId],
      );
      nuevoNombreArea = newAreaRows[0]?.AreaNombre || 'Desconocido';
    }

    await connection.query(
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

    const FechaModificacion = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    if (anterior) {
      if (Number(anterior.AreaID) !== areaId) {
        await connection.query(
          `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorAnterior, HMValorNuevo, HMFechaModificacion, HMUserCodigo)
           VALUES (?, 'Cambio de Cargo / Área', ?, ?, ?, ?)`,
          [
            codigo,
            anterior.AreaNombre || 'Sin Cargo',
            nuevoNombreArea,
            FechaModificacion,
            idUsuarioActual,
          ],
        );
      }

      const salarioAnteriorNumber = parseFloat(anterior.EmpSalario || '0');
      if (salarioAnteriorNumber !== salario) {
        const formattedOld = `S/. ${salarioAnteriorNumber.toFixed(2)}`;
        const formattedNew = `S/. ${salario.toFixed(2)}`;

        await connection.query(
          `INSERT INTO HISTORIAL_MODIFICACIONES (HMEmpCodigo, HMCampoModificado, HMValorAnterior, HMValorNuevo, HMFechaModificacion, HMUserCodigo)
           VALUES (?, 'Ajuste Salarial', ?, ?, ?, ?)`,
          [
            codigo,
            formattedOld,
            formattedNew,
            FechaModificacion,
            idUsuarioActual,
          ],
        );
      }
    }

    await connection.commit();
    revalidatePath('/');
    revalidatePath(`/empleados/${codigo}`);
    return {
      success: true,
      message: 'Información del empleado actualizada correctamente.',
    };
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al actualizar empleado:', error);
    return {
      success: false,
      message: 'Error al actualizar los datos en la base de datos.',
    };
  } finally {
    connection.release();
  }
}
