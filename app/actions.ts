"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

// RF01: Agregar empleado + Historial (Actualizado con las nuevas fechas de contrato)
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
  
  // CAPTURA DE LOS NUEVOS CAMPOS DEL FORMULARIO
  const fechaIngreso = formData.get("fechaIngreso") as string;
  const contratoInicio = formData.get("contratoInicio") as string;
  const contratoFin = formData.get("contratoFin") as string;
  
  // Salario opcional: si está vacío se envía NULL para heredar el sueldo base del área
  const salarioInput = formData.get("salario") as string;
  const salario = salarioInput ? parseFloat(salarioInput) : null;
  
  // Usuario temporal para la auditoría (hasta conectar la sesión JWT)
  const idUsuarioActual = 1; 

  try {
    // 1. Insertar Empleado con la estructura completa de fechas de la base de datos
    await pool.query(
      `INSERT INTO EMPLEADO (
        EmpCodigo, AreaID, EmpDNI, EmpApellidoPaterno, EmpApellidoMaterno, 
        EmpNombres, EmpGenero, EmpCorreo, EmpFechaNacimiento, 
        EmpFechaIngreso, EmpContratoInicio, EmpContratoFin, EmpSalario
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo, area, dni, apePaterno, apeMaterno, 
        nombres, genero, correo, fechaNac, 
        fechaIngreso, contratoInicio, contratoFin, salario
      ]
    );

    // 2. Historial: Alta de Empleado
    await pool.query(
      `INSERT INTO HISTORIAL_MODIFICACIONES (EmpCodigo, CampoModificado, ValorNuevo, UserCodigoHM)
       VALUES (?, 'Registro de Empleado', 'Nuevo Registro', ?)`,
      [codigo, idUsuarioActual]
    );

    revalidatePath("/");
    return { success: true, message: "Empleado registrado exitosamente" };
  } catch (error: any) {
    console.error("Error al guardar empleado:", error);
    
    // Control de llaves duplicadas para mejorar la experiencia del cliente (Toast)
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, message: "El código o DNI ya se encuentra registrado." };
    }
    return { success: false, message: "Error al guardar el empleado en la base de datos." };
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

// Función para obtener el próximo código correlativo (Informativo para el Form)
// REEMPLAZA ESTA FUNCIÓN EN TU ARCHIVO DE ACCIONES
export async function obtenerProximoCodigo() {
  try {
    // Extrae el texto desde la posición 4, lo convierte a entero y busca el Máximo Real
    const [rows]: any = await pool.query(
      "SELECT MAX(CAST(SUBSTRING(EmpCodigo, 4) AS UNSIGNED)) AS maxNum FROM EMPLEADO"
    );

    const maxNum = rows[0]?.maxNum;

    // Si existe un número máximo (ej: 2), le suma 1 y rellena con ceros (ej: EMP00003)
    if (maxNum !== null && maxNum !== undefined) {
      return `EMP${String(maxNum + 1).padStart(5, '0')}`;
    }
    
    return "EMP00001"; // Si la tabla está vacía
  } catch (error) {
    console.error("Error al obtener código:", error);
    return "EMP00001";
  }
}

// Acción para procesar y cerrar la planilla del mes actual masivamente
export async function generarBoletasMes() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const fechaBoleta = `${yyyy}-${mm}-01`; // Estandarizamos al primer día del mes

  const mesActual = hoy.getMonth(); // 6 = Julio, 11 = Diciembre
  const gratificacion = (mesActual === 6 || mesActual === 11) ? 300.00 : 0.00;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Validar si ya se procesó este mes y año para evitar duplicidad
    const [existentes]: any = await connection.query(
      "SELECT COUNT(*) as count FROM BOLETA_PAGO WHERE DATE_FORMAT(FechaBoleta, '%Y-%m') = ?",
      [`${yyyy}-${mm}`]
    );

    if (existentes[0].count > 0) {
      return { success: false, message: `La planilla de ${yyyy}-${mm} ya fue procesada previamente.` };
    }

    // 2. Traer todos los empleados con sus salarios reales calculados
    const [empleados]: any = await connection.query(`
      SELECT e.EmpCodigo, COALESCE(e.EmpSalario, a.AreaSalario) AS Salario
      FROM EMPLEADO e
      INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    `);

    if (empleados.length === 0) {
      return { success: false, message: "No hay empleados registrados para generar boletas." };
    }

    // 3. Insertar la boleta correspondiente para cada empleado de la planilla
    for (const emp of empleados) {
      const salarioBase = Number(emp.Salario);
      const totalPago = salarioBase + gratificacion;

      await connection.query(
        `INSERT INTO BOLETA_PAGO (EmpCodigo, FechaBoleta, SalarioBase, Gratificacion, TotalPago)
         VALUES (?, ?, ?, ?, ?)`,
        [emp.EmpCodigo, fechaBoleta, salarioBase, gratificacion, totalPago]
      );
    }

    await connection.commit();
    revalidatePath("/boletas");
    return { success: true, message: `Planilla de ${yyyy}-${mm} generada con éxito para ${empleados.length} empleados.` };
  } catch (error) {
    await connection.rollback();
    console.error("Error al procesar planilla:", error);
    return { success: false, message: "Error interno al procesar la planilla mensual." };
  } finally {
    connection.release();
  }
}