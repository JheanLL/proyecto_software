import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic'; // Evita problemas de caché estática

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.EmpCodigo, 
        e.EmpNombres, 
        e.EmpApellidoPaterno, 
        a.AreaNombre,
        TIMESTAMPDIFF(YEAR, e.EmpFechaNacimiento, CURDATE()) AS EdadActual,
        TIMESTAMPDIFF(YEAR, e.EmpFechaIngreso, CURDATE()) AS AntiguedadActual,
        e.EmpFechaIngreso,
        COALESCE(e.EmpSalario, a.AreaSalario) AS Salario
      FROM EMPLEADO e
      INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    `);

    const empleados = rows as any[];

    let sumaSalarios = 0;
    let sumaGratisJulio = 0;
    let sumaGratisDic = 0;
    let sumaTotalBeneficios = 0;

    const datosInforme = empleados.map(emp => {
      const edad = emp.EdadActual;
      const antiguedad = emp.AntiguedadActual;
      const salario = Number(emp.Salario);
      const fechaIngreso = new Date(emp.EmpFechaIngreso);
      const hoy = new Date();
      
      // ==========================================
      // ALGORITMO DE HISTÓRICO DE GRATIFICACIONES
      // ==========================================
      let pagosJulio = 0;
      let pagosDiciembre = 0;
      
      const mesIngreso = fechaIngreso.getMonth() + 1; // 1 a 12
      const anioIngreso = fechaIngreso.getFullYear();
      const mesActual = hoy.getMonth() + 1;
      const anioActual = hoy.getFullYear();

      // Recorremos todos los años desde que entró hasta hoy
      for (let anio = anioIngreso; anio <= anioActual; anio++) {
        // ¿Trabajó durante Julio en este año específico?
        const pasoJulio = (anio > anioIngreso || mesIngreso <= 7) && (anio < anioActual || mesActual >= 7);
        if (pasoJulio) pagosJulio++;

        // ¿Trabajó durante Diciembre en este año específico?
        const pasoDiciembre = (anio > anioIngreso || mesIngreso <= 12) && (anio < anioActual || mesActual >= 12);
        if (pasoDiciembre) pagosDiciembre++;
      }

      // Multiplicamos las veces que pasó por esas fechas por el monto normativo
      const totalGratisJulio = pagosJulio * 300.00;
      const totalGratisDiciembre = pagosDiciembre * 300.00;
      const totalBeneficiosHistorico = totalGratisJulio + totalGratisDiciembre;

      // Acumuladores globales para la fila final de Totales
      sumaSalarios += salario;
      sumaGratisJulio += totalGratisJulio;
      sumaGratisDic += totalGratisDiciembre;
      sumaTotalBeneficios += totalBeneficiosHistorico;

      return {
        'Código': emp.EmpCodigo,
        'Nombres y Apellidos': `${emp.EmpNombres} ${emp.EmpApellidoPaterno}`,
        'Cargo': emp.AreaNombre,
        'Edad Actual': `${edad} años`,
        'Antigüedad en Empresa': `${antiguedad} años`,
        'Salario Base Mensual': salario.toFixed(2),
        'Histórico Gratis (Julio)': totalGratisJulio.toFixed(2),
        'Histórico Gratis (Diciembre)': totalGratisDiciembre.toFixed(2),
        'Total Beneficios Acumulados': totalBeneficiosHistorico.toFixed(2)
      };
    });

    // AGREGAR FILA DE TOTALES GENERALES
    datosInforme.push({
      'Código': 'TOTALES',
      'Nombres y Apellidos': '',
      'Cargo': '',
      'Edad Actual': '',
      'Antigüedad en Empresa': '',
      'Salario Base Mensual': sumaSalarios.toFixed(2),
      'Histórico Gratis (Julio)': sumaGratisJulio.toFixed(2),
      'Histórico Gratis (Diciembre)': sumaGratisDic.toFixed(2),
      'Total Beneficios Acumulados': sumaTotalBeneficios.toFixed(2)
    });

    const worksheet = XLSX.utils.json_to_sheet(datosInforme);
    
    // Configuración estética de anchos de columna adaptada a los nuevos títulos
    worksheet['!cols'] = [
      { wch: 12 }, // Código
      { wch: 35 }, // Nombres y Apellidos
      { wch: 20 }, // Cargo
      { wch: 15 }, // Edad Actual
      { wch: 25 }, // Antigüedad
      { wch: 22 }, // Salario Base Mensual
      { wch: 26 }, // Histórico Gratis Julio
      { wch: 28 }, // Histórico Gratis Diciembre
      { wch: 30 }  // Total Beneficios Acumulados
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Operaciones RRHH');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

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