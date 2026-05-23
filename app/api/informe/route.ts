import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import pool from "@/lib/db";

export async function GET() {
  const [rows]: any = await pool.query(`
    SELECT 
      e.EmpCodigo, e.EmpDNI, e.EmpNombres, e.EmpApellidoPaterno, a.AreaNombre,
      e.EmpFechaNacimiento, e.EmpFechaIngreso,
      COALESCE(e.EmpSalario, a.AreaSalario) AS SalarioBase,
      (SELECT COUNT(*) FROM BOLETA_PAGO WHERE EmpCodigo = e.EmpCodigo) AS TotalBoletas
    FROM EMPLEADO e
    INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    WHERE e.activo = 1
  `);

const [boletas]: any = await pool.query(`
    SELECT b.*, e.EmpNombres, e.EmpApellidoPaterno 
    FROM BOLETA_PAGO b
    JOIN EMPLEADO e ON b.EmpCodigo = e.EmpCodigo
    WHERE e.activo = 1
    ORDER BY b.FechaBoleta DESC
  `);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Informe");
  const worksheetDetalle = workbook.addWorksheet("Detalle de Boletas");

  worksheet.mergeCells("A1:H1");
  worksheet.getCell("A1").value = "INFORME GENERAL DE OPERACIONES Y RRHH";
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = { horizontal: 'center' };

  const headers = ["Código", "DNI", "Nombres y Apellidos", "Área/Cargo", "Edad", "Antigüedad", "Salario Base", "Boletas Generadas"];
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000080' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center' };
  });
  worksheet.views = [{ state: 'frozen', ySplit: 2 }];

  rows.forEach((emp: any, index: number) => {
    const fechaNac = new Date(emp.EmpFechaNacimiento);
    const edad = new Date().getFullYear() - fechaNac.getFullYear();
    
    const fechaIngreso = new Date(emp.EmpFechaIngreso);
    const hoy = new Date();
    let anios = hoy.getFullYear() - fechaIngreso.getFullYear();
    let meses = hoy.getMonth() - fechaIngreso.getMonth();
    if (meses < 0) { anios--; meses += 12; }
    
    const row = worksheet.addRow([
      emp.EmpCodigo,
      emp.EmpDNI,
      `${emp.EmpNombres} ${emp.EmpApellidoPaterno}`,
      emp.AreaNombre,
      edad,
      `${anios} años, ${meses} meses`,
      emp.SalarioBase,
      emp.TotalBoletas || 0
    ]);

    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      });
    }
  });

  const headersDetalle = ["ID Boleta", "Código Empleado", "Nombres", "Fecha", "Salario Base", "Gratificación", "Bono Rendimiento", "Total Pago"];
  const headerRowDetalle = worksheetDetalle.addRow(headersDetalle);
  headerRowDetalle.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000080' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });

  boletas.forEach((b: any) => {
    worksheetDetalle.addRow([
      b.ID,
      b.EmpCodigo,
      `${b.EmpNombres} ${b.EmpApellidoPaterno}`,
      new Date(b.FechaBoleta).toLocaleDateString(),
      b.SalarioBase,
      b.Gratificacion,
      b.BonoRendimiento || 0,
      b.TotalPago
    ]);
  });

  worksheet.columns.forEach((col) => col.width = 20);
  worksheetDetalle.columns.forEach((col) => col.width = 20);

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Informe_Operaciones_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
