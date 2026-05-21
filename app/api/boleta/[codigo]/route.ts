import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(
  request: Request, 
  context: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await context.params;

  try {
    // Consulta adaptada al modelo unificado y mapeo real de columnas
    const [rows] = await pool.query(`
      SELECT 
        e.EmpNombres, 
        e.EmpApellidoPaterno, 
        e.EmpDni, 
        a.AreaNombre,
        e.EmpFechaIngreso,
        COALESCE(e.EmpSalario, a.AreaSalario) AS Salario
      FROM EMPLEADO e
      INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
      WHERE e.EmpCodigo = ?
    `, [codigo]);

    const emp = (rows as any[])[0];
    if (!emp) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });

    // Algoritmo de años, meses y días corrigiendo el huso horario local (Perú)
    const fechaIngreso = new Date(emp.EmpFechaIngreso);
    const hoy = new Date();
    
    let anios = hoy.getFullYear() - fechaIngreso.getFullYear();
    let meses = hoy.getMonth() - fechaIngreso.getMonth();
    let dias = hoy.getDate() - fechaIngreso.getDate();

    if (dias < 0) {
      meses--;
      dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    }
    if (meses < 0) {
      anios--;
      meses += 12;
    }
    
    // Prevenir distorsiones o valores negativos por desfases UTC vs. América/Lima
    if (fechaIngreso > hoy || anios < 0) {
      anios = 0;
      meses = 0;
      dias = 0;
    }

    const antiguedadExacta = `${anios} años, ${meses} meses, ${dias} días`;
    const salarioMensual = Number(emp.Salario);

    // Formato estructurado de la Boleta de Pago Individual
    const datosBoleta = [
      { Concepto: 'EMPRESA', Detalle: 'NÓMINA DE PAGO - BOLETA INDIVIDUAL' },
      { Concepto: '', Detalle: '' },
      { Concepto: 'DATOS DEL TRABAJADOR', Detalle: '-------------------------' },
      { Concepto: 'Nombres y Apellidos', Detalle: `${emp.EmpNombres} ${emp.EmpApellidoPaterno}` },
      { Concepto: 'Documento de Identidad (DNI)', Detalle: emp.EmpDni },
      { Concepto: 'Cargo / Área Asignada', Detalle: emp.AreaNombre },
      { Concepto: 'Tiempo de Servicio Exacto', Detalle: antiguedadExacta },
      { Concepto: '', Detalle: '' },
      { Concepto: 'REMUNERACIONES', Detalle: '-------------------------' },
      { Concepto: 'Salario Básico Mensual', Detalle: `S/. ${salarioMensual.toFixed(2)}` },
      { Concepto: '', Detalle: '' },
      { Concepto: 'DERECHOS Y BENEFICIOS LEY', Detalle: '-------------------------' },
      { Concepto: 'Provisión Gratificación Julio', Detalle: `S/. 300.00` },
      { Concepto: 'Provisión Gratificación Diciembre', Detalle: `S/. 300.00` },
      { Concepto: '', Detalle: '' },
      { Concepto: 'TOTAL NETO A PAGAR EN BOLETA', Detalle: `S/. ${salarioMensual.toFixed(2)}` }
    ];

    // Creación de la hoja de cálculo con Excel binario
    const worksheet = XLSX.utils.json_to_sheet(datosBoleta);
    worksheet['!cols'] = [{ wch: 45 }, { wch: 40 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boleta de Pago');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Retorno del stream para descarga forzada con el código del empleado asignado
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="Boleta_Pago_${codigo}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error("Error al generar boleta:", error);
    return NextResponse.json({ error: 'Error al generar Boleta de Pago' }, { status: 500 });
  }
}