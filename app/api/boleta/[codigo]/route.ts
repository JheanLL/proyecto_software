import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params;
  const searchParams = request.nextUrl.searchParams;
  const total = parseFloat(searchParams.get("total") || "0");
  const gratificacion = parseFloat(searchParams.get("gratificacion") || "0");
  const bono = parseFloat(searchParams.get("bono") || "0");

  const [rows]: any = await pool.query(
    `SELECT e.EmpNombres, e.EmpApellidoPaterno, e.EmpDNI, a.AreaNombre 
     FROM EMPLEADO e 
     LEFT JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID 
     WHERE e.EmpCodigo = ?`,
    [codigo]
  );
  console.log("Query result for", codigo, ":", JSON.stringify(rows));

  const emp = rows[0];
  if (!emp) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Boleta");

  // Estilos
  const titleStyle = { font: { bold: true, size: 16 } };
  const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }, border: { bottom: { style: 'thin' } } };

  worksheet.mergeCells("A1:B1");
  worksheet.getCell("A1").value = "BOLETA DE PAGO DE HABERES";
  worksheet.getCell("A1").style = titleStyle as any;

  worksheet.getCell("A2").value = `Fecha: ${new Date().toLocaleDateString()}`;
  
  worksheet.addRow(["Nombres:", `${emp.EmpNombres} ${emp.EmpApellidoPaterno}`]);
  worksheet.addRow(["DNI:", emp.EmpDNI]);
  worksheet.addRow(["Cargo/Área:", emp.AreaNombre]);
  worksheet.addRow([]);

  const tableHeader = worksheet.addRow(["Concepto", "Monto (S/.)"]);
  tableHeader.eachCell((cell) => cell.style = headerStyle as any);

  worksheet.addRow(["Salario Base", total - gratificacion - bono]);
  if (gratificacion > 0) worksheet.addRow(["Gratificación", gratificacion]);
  if (bono > 0) worksheet.addRow(["Bono de Productividad", bono]);
  
  const totalRow = worksheet.addRow(["Neto a Pagar", total]);
  totalRow.font = { bold: true };

  worksheet.columns = [{ width: 30 }, { width: 20 }];
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Boleta_Pago_${emp.EmpDNI}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx"`,
    },
  });
}
