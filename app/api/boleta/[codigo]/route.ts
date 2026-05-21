import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: Request, { params }: { params: { codigo: string } }) {
  const codigo = params.codigo;

  try {
    const [rows] = await pool.query(`
      SELECT e.EmpNombres, e.EmpApePaterno, e.EmpDNI, a.AreNombre,
      COALESCE(c.ConSalarioModificado, a.AreSalarioBase) AS Salario
      FROM T_Empleado e
      INNER JOIN T_Area a ON e.AreCodigo = a.AreCodigo
      INNER JOIN T_CondicionLaboral c ON e.EmpCodigo = c.EmpCodigo
      WHERE e.EmpCodigo = ?
    `, [codigo]);

    const emp = (rows as any[])[0];
    if (!emp) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });

    // RF01: Precisión de cálculos a 2 decimales
    const salario = Number(emp.Salario);
    const gratificacion = 300.00;
    const total = salario + gratificacion;

    // Estructurar datos para el Excel
    const datosBoleta = [
      { Concepto: 'Nombres', Detalle: `${emp.EmpNombres} ${emp.EmpApePaterno}` },
      { Concepto: 'DNI', Detalle: emp.EmpDNI },
      { Concepto: 'Cargo', Detalle: emp.AreNombre },
      { Concepto: 'Salario Básico', Detalle: salario.toFixed(2) },
      { Concepto: 'Gratificación Fija', Detalle: gratificacion.toFixed(2) },
      { Concepto: 'TOTAL A PAGAR', Detalle: total.toFixed(2) }
    ];

    // Crear el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(datosBoleta);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boleta de Pago');

    // Convertir a buffer binario
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Enviar archivo al navegador
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="Boleta_${codigo}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error al generar Excel' }, { status: 500 });
  }
}