import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic'; // Evita problemas de caché estática

export async function GET() {
  try {
    // Consulta limpia apuntando al nuevo modelo unificado de base de datos
    const [rows] = await pool.query(`
      SELECT 
        e.EmpCodigo, 
        e.EmpNombres, 
        e.EmpApellidoPaterno, 
        a.AreaNombre,
        TIMESTAMPDIFF(YEAR, e.EmpFechaNacimiento, CURDATE()) AS EdadActual,
        e.EmpFechaIngreso,
        COALESCE(e.EmpSalario, a.AreaSalario) AS Salario
      FROM EMPLEADO e
      INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    `);

    const empleados = rows as any[];

    // Procesamiento y formateo JSON limpio para la exportación de la hoja
    const datosInforme = empleados.map(emp => {
      const edad = emp.EdadActual;
      const fechaIngreso = new Date(emp.EmpFechaIngreso);
      const hoy = new Date();
      const antiguedad = hoy.getFullYear() - fechaIngreso.getFullYear();
      const salario = Number(emp.Salario);
      const beneficios = 600.00; // S/. 300 Julio + S/. 300 Diciembre (Fijo por normativa)

      return {
        'Código': emp.EmpCodigo,
        'Nombres y Apellidos': `${emp.EmpNombres} ${emp.EmpApellidoPaterno}`,
        'Cargo': emp.AreaNombre,
        'Edad Actual': `${edad} años`,
        'Antigüedad en Empresa': `${antiguedad} años`,
        'Salario Base Mensual': salario.toFixed(2),
        'Beneficios (Julio + Dic)': beneficios.toFixed(2)
      };
    });

    // Generación física del libro de Excel binario
    const worksheet = XLSX.utils.json_to_sheet(datosInforme);
    
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

    // Stream de respuesta hacia el navegador del cliente para forzar descarga
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="Informe_General_Operaciones.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error("Error al generar Excel:", error);
    return NextResponse.json({ error: 'Error al generar Informe Excel' }, { status: 500 });
  }
}