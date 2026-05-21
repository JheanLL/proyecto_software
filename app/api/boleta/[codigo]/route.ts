import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(
  request: Request, 
  context: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await context.params;

  try {
    const [rows] = await pool.query(`
      SELECT e.EmpNombres, e.EmpApePaterno, e.EmpDNI, a.AreNombre,
      c.ConFechaIngreso,
      COALESCE(c.ConSalarioModificado, a.AreSalarioBase) AS Salario
      FROM T_Empleado e
      INNER JOIN T_Area a ON e.AreCodigo = a.AreCodigo
      INNER JOIN T_CondicionLaboral c ON e.EmpCodigo = c.EmpCodigo
      WHERE e.EmpCodigo = ?
    `, [codigo]);

    const emp = (rows as any[])[0];
    if (!emp) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });

    // Algoritmo de años, meses y días
    const fechaIngreso = new Date(emp.ConFechaIngreso);
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
    
    // CORRECCIÓN: Prevenir negativos por la diferencia de zona horaria (UTC vs Perú)
    if (fechaIngreso > hoy || anios < 0) {
      anios = 0;
      meses = 0;
      dias = 0;
    }

    const antiguedadExacta = `${anios} años, ${meses} meses, ${dias} días`;
    const salarioMensual = Number(emp.Salario);

    // Formato de Boleta de Pago Empresarial
    const datosBoleta = [
      { Concepto: 'EMPRESA', Detalle: 'NÓMINA DE PAGO - BOLETA INDIVIDUAL' },
      { Concepto: '', Detalle: '' },
      { Concepto: 'DATOS DEL TRABAJADOR', Detalle: '-------------------------' },
      { Concepto: 'Nombres y Apellidos', Detalle: `${emp.EmpNombres} ${emp.EmpApePaterno}` },
      { Concepto: 'Documento de Identidad (DNI)', Detalle: emp.EmpDNI },
      { Concepto: 'Cargo Asignado', Detalle: emp.AreNombre },
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

    const worksheet = XLSX.utils.json_to_sheet(datosBoleta);
    worksheet['!cols'] = [{ wch: 45 }, { wch: 40 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boleta de Pago');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="Boleta_Pago_${codigo}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error al generar Boleta' }, { status: 500 });
  }
}