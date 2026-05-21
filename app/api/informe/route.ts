import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic'; // Evita que Vercel cachee este archivo

export async function GET() {
  try {
    // 1. Consultamos TODOS los empleados con los datos exigidos en el RF02
    const [rows] = await pool.query(`
      SELECT e.EmpCodigo, e.EmpNombres, e.EmpApePaterno, a.AreNombre,
      TIMESTAMPDIFF(YEAR, e.EmpFechaNac, CURDATE()) AS EdadActual,
      c.ConFechaIngreso,
      COALESCE(c.ConSalarioModificado, a.AreSalarioBase) AS Salario
      FROM T_Empleado e
      INNER JOIN T_Area a ON e.AreCodigo = a.AreCodigo
      INNER JOIN T_CondicionLaboral c ON e.EmpCodigo = c.EmpCodigo
    `);

    const empleados = rows as any[];

    // 2. Procesamos los cálculos exactos que pide el requerimiento
    const datosInforme = empleados.map(emp => {
      const edad = emp.EdadActual;
      const fechaIngreso = new Date(emp.ConFechaIngreso);
      const hoy = new Date();
      const antiguedad = hoy.getFullYear() - fechaIngreso.getFullYear();
      const salario = Number(emp.Salario);
      const beneficios = 600.00; // S/. 300 Julio + S/. 300 Diciembre

      return {
        'Código': emp.EmpCodigo,
        'Nombres y Apellidos': `${emp.EmpNombres} ${emp.EmpApePaterno}`,
        'Cargo': emp.AreNombre,
        'Edad Actual': `${edad} años`,
        'Antigüedad en Empresa': `${antiguedad} años`,
        'Salario Base Mensual': salario.toFixed(2),
        'Beneficios (Julio + Dic)': beneficios.toFixed(2)
      };
    });

    // 3. Generamos el Excel
    const worksheet = XLSX.utils.json_to_sheet(datosInforme);
    
    // Damos un ancho profesional a las columnas
    worksheet['!cols'] = [
      { wch: 12 }, // Código
      { wch: 35 }, // Nombres
      { wch: 20 }, // Cargo
      { wch: 15 }, // Edad
      { wch: 25 }, // Antigüedad
      { wch: 20 }, // Salario
      { wch: 25 }  // Beneficios
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Operaciones RRHH');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // 4. Forzamos la descarga del archivo en el navegador
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="Informe_General_Operaciones.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error al generar Informe Excel' }, { status: 500 });
  }
}