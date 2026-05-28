import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import pool from "@/lib/db";

export async function GET() {
  const [rows]: any = await pool.query(`
    SELECT 
      e.EmpCodigo, e.EmpDNI, e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno, a.AreaNombre,
      e.EmpFechaNacimiento, e.EmpFechaIngreso,
      COALESCE(e.EmpSalario, a.AreaSalario) AS SalarioBase,
      (SELECT COUNT(*) FROM BOLETA_PAGO WHERE EmpCodigo = e.EmpCodigo) AS TotalBoletas
    FROM EMPLEADO e
    INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    WHERE e.activo = 1
  `);

  const [boletas]: any = await pool.query(`
    SELECT b.BoletaID, b.EmpCodigo, b.BoletaFechaBoleta, b.BoletaSalarioBase, b.BoletaGratificacion, b.BoletaTotalPago, e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno
    FROM BOLETA_PAGO b
    JOIN EMPLEADO e ON b.EmpCodigo = e.EmpCodigo
    WHERE e.activo = 1
    ORDER BY b.BoletaFechaBoleta DESC
  `);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Informe");
  const worksheetDetalle = workbook.addWorksheet("Detalle de Boletas");

  worksheet.mergeCells("A1:H1");
  worksheet.getCell("A1").value = "INFORME GENERAL DE OPERACIONES Y RRHH";
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  const headers = [
    "Código",
    "DNI",
    "Nombres y Apellidos",
    "Área/Cargo",
    "Edad",
    "Antigüedad",
    "Salario Base",
    "Boletas Generadas",
  ];
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000080" },
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { horizontal: "center" };
  });
  worksheet.views = [{ state: "frozen", ySplit: 2 }];

  const hoy = new Date();

  rows.forEach((emp: any, index: number) => {
    const fechaNac = new Date(emp.EmpFechaNacimiento);
    const edad = hoy.getFullYear() - fechaNac.getUTCFullYear();

    const fechaIngreso = new Date(emp.EmpFechaIngreso);

    let totalMeses =
      (hoy.getFullYear() - fechaIngreso.getUTCFullYear()) * 12 +
      (hoy.getMonth() - fechaIngreso.getUTCMonth());

    if (totalMeses < 0) {
      totalMeses = 0;
    }

    const anios = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;

    const row = worksheet.addRow([
      emp.EmpCodigo,
      emp.EmpDNI,
      `${emp.EmpNombres} ${emp.EmpApellidoPaterno} ${emp.EmpApellidoMaterno}`,
      emp.AreaNombre,
      edad,
      `${anios} años, ${meses} meses`,
      emp.SalarioBase,
      emp.TotalBoletas || 0,
    ]);

    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F0F0" },
        };
      });
    }
  });

  const headersDetalle = [
    "ID Boleta",
    "Código Empleado",
    "Nombres",
    "Fecha",
    "Salario Base",
    "Gratificación",
    "Total Pago",
  ];
  const headerRowDetalle = worksheetDetalle.addRow(headersDetalle);
  headerRowDetalle.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000080" },
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  });

  boletas.forEach((b: any) => {
    worksheetDetalle.addRow([
      b.BoletaID,
      b.EmpCodigo,
      `${b.EmpNombres} ${b.EmpApellidoPaterno} ${b.EmpApellidoMaterno}`,
      new Date(b.BoletaFechaBoleta).toLocaleDateString("es-PE", { timeZone: "UTC" }),
      b.BoletaSalarioBase,
      b.BoletaGratificacion,
      b.BoletaTotalPago,
    ]);
  });

  worksheet.columns = [
    { width: 12 },  // Código
    { width: 15 },  // DNI
    { width: 45 },  // Nombres y Apellidos
    { width: 20 },  // Área/Cargo
    { width: 8 },   // Edad
    { width: 18 },  // Antigüedad
    { width: 15 },  // Salario Base
    { width: 18 },  // Boletas Generadas
  ];
  worksheetDetalle.columns = [
    { width: 12 },  // ID Boleta
    { width: 16 },  // Código Empleado
    { width: 45 },  // Nombres
    { width: 15 },  // Fecha
    { width: 15 },  // Salario Base
    { width: 15 },  // Gratificación
    { width: 15 },  // Total Pago
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Informe_Operaciones_${hoy.toISOString().split("T")[0]}.xlsx"`,
    },
  });
}