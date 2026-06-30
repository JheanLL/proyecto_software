import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const searchParams = request.nextUrl.searchParams;
  const totalParam = parseFloat(searchParams.get('total') || '0');
  const gratificacionParam = parseFloat(
    searchParams.get('gratificacion') || '0',
  );

  // Traemos también la fecha de ingreso del empleado
  const [rows]: any = await pool.query(
    `SELECT e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno, e.EmpDNI, e.EmpFechaIngreso, a.AreaNombre 
     FROM EMPLEADO e 
     LEFT JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID 
     WHERE e.EmpCodigo = ?`,
    [codigo],
  );

  const emp = rows[0];
  if (!emp)
    return NextResponse.json(
      { error: 'Empleado no encontrado' },
      { status: 404 },
    );

  // Usamos los montos que vienen por parámetro desde el cliente (calculados en el Modal)
  const gratificacion = gratificacionParam;
  const total = totalParam;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Boleta');

  const titleStyle = { font: { bold: true, size: 16 } };
  const headerStyle = {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } },
    border: { bottom: { style: 'thin' } },
  };

  worksheet.mergeCells('A1:B1');
  worksheet.getCell('A1').value = 'BOLETA DE PAGO DE HABERES';
  worksheet.getCell('A1').style = titleStyle as any;

  worksheet.getCell('A2').value = `Fecha: ${new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  worksheet.addRow([
    'Nombres:',
    `${emp.EmpNombres} ${emp.EmpApellidoPaterno} ${emp.EmpApellidoMaterno}`,
  ]);
  worksheet.addRow(['DNI:', emp.EmpDNI]);
  worksheet.addRow(['Cargo/Área:', emp.AreaNombre]);
  worksheet.addRow([]);

  const tableHeader = worksheet.addRow(['Concepto', 'Monto (S/.)']);
  tableHeader.eachCell((cell) => (cell.style = headerStyle as any));

  worksheet.addRow(['Salario Base', total - gratificacion]);
  if (gratificacion > 0) worksheet.addRow(['Gratificación', gratificacion]);

  const totalRow = worksheet.addRow(['Neto a Pagar', total]);
  totalRow.font = { bold: true };

  worksheet.columns = [{ width: 45 }, { width: 20 }];
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Boleta_Pago_${emp.EmpDNI}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx"`,
    },
  });
}
