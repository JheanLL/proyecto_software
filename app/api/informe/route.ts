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

  const hoy = new Date();
  const workbook = new ExcelJS.Workbook();

  // ============================
  // HOJA 1: RESUMEN (Dashboard)
  // ============================
  const wsResumen = workbook.addWorksheet("Resumen");

  wsResumen.mergeCells("A1:F1");
  const titleResumen = wsResumen.getCell("A1");
  titleResumen.value = "INFORME GENERAL DE OPERACIONES Y RRHH";
  titleResumen.font = { bold: true, size: 18, color: { argb: "FF000080" } };
  titleResumen.alignment = { horizontal: "center", vertical: "middle" };
  wsResumen.getRow(1).height = 36;

  // Fecha de generación
  wsResumen.mergeCells("A2:F2");
  const fechaGen = wsResumen.getCell("A2");
  fechaGen.value = `Fecha de generación: ${hoy.toLocaleDateString("es-PE", { timeZone: "America/Lima" })}`;
  fechaGen.font = { italic: true, size: 11, color: { argb: "FF666666" } };
  fechaGen.alignment = { horizontal: "center" };

  // --- KPI Cards ---
  const totalEmpleados = rows.length;
  const totalBoletasEmitidas = boletas.length;
  const montoTotal = boletas.reduce((sum: number, b: any) => sum + Number(b.BoletaTotalPago), 0);
  const promedioPorEmpleado = totalEmpleados > 0 ? montoTotal / totalEmpleados : 0;

  // KPI Card 1: Total Empleados
  const kpiStartRow = 4;
  wsResumen.mergeCells(`A${kpiStartRow}:B${kpiStartRow + 1}`);
  const kpiEmpCell = wsResumen.getCell(`A${kpiStartRow}`);
  kpiEmpCell.value = "👥 Total Empleados";
  kpiEmpCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  kpiEmpCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E75B6" } };
  kpiEmpCell.alignment = { horizontal: "center", vertical: "middle" };
  kpiEmpCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  wsResumen.mergeCells(`A${kpiStartRow + 2}:B${kpiStartRow + 2}`);
  const kpiEmpVal = wsResumen.getCell(`A${kpiStartRow + 2}`);
  kpiEmpVal.value = totalEmpleados;
  kpiEmpVal.font = { bold: true, size: 26, color: { argb: "FF2E75B6" } };
  kpiEmpVal.alignment = { horizontal: "center", vertical: "middle" };
  kpiEmpVal.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  wsResumen.getRow(kpiStartRow).height = 28;
  wsResumen.getRow(kpiStartRow + 2).height = 42;

  // KPI Card 2: Total Boletas
  wsResumen.mergeCells(`C${kpiStartRow}:D${kpiStartRow + 1}`);
  const kpiBolCell = wsResumen.getCell(`C${kpiStartRow}`);
  kpiBolCell.value = "📄 Total Boletas Emitidas";
  kpiBolCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  kpiBolCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
  kpiBolCell.alignment = { horizontal: "center", vertical: "middle" };
  kpiBolCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  wsResumen.mergeCells(`C${kpiStartRow + 2}:D${kpiStartRow + 2}`);
  const kpiBolVal = wsResumen.getCell(`C${kpiStartRow + 2}`);
  kpiBolVal.value = totalBoletasEmitidas;
  kpiBolVal.font = { bold: true, size: 26, color: { argb: "FF00B050" } };
  kpiBolVal.alignment = { horizontal: "center", vertical: "middle" };
  kpiBolVal.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // KPI Card 3: Monto Total
  wsResumen.mergeCells(`E${kpiStartRow}:F${kpiStartRow + 1}`);
  const kpiMontoCell = wsResumen.getCell(`E${kpiStartRow}`);
  kpiMontoCell.value = "💰 Monto Total Pagado";
  kpiMontoCell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  kpiMontoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBF8F00" } };
  kpiMontoCell.alignment = { horizontal: "center", vertical: "middle" };
  kpiMontoCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  wsResumen.mergeCells(`E${kpiStartRow + 2}:F${kpiStartRow + 2}`);
  const kpiMontoVal = wsResumen.getCell(`E${kpiStartRow + 2}`);
  kpiMontoVal.value = `S/ ${montoTotal.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  kpiMontoVal.font = { bold: true, size: 18, color: { argb: "FFBF8F00" } };
  kpiMontoVal.alignment = { horizontal: "center", vertical: "middle" };
  kpiMontoVal.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // KPI Card 4: Promedio por Empleado
  wsResumen.mergeCells(`A${kpiStartRow + 4}:F${kpiStartRow + 4}`);
  const kpiPromCell = wsResumen.getCell(`A${kpiStartRow + 4}`);
  kpiPromCell.value = `📊 Promedio Pagado por Empleado: S/ ${promedioPorEmpleado.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  kpiPromCell.font = { bold: true, size: 13, color: { argb: "FF555555" } };
  kpiPromCell.alignment = { horizontal: "center", vertical: "middle" };
  kpiPromCell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
  wsResumen.getRow(kpiStartRow + 4).height = 32;

  // --- Instrucciones de navegación ---
  const navRow = kpiStartRow + 7;
  wsResumen.mergeCells(`A${navRow}:F${navRow}`);
  const navCell = wsResumen.getCell(`A${navRow}`);
  navCell.value = "Haga clic en los enlaces para navegar entre hojas";
  navCell.font = { italic: true, size: 10, color: { argb: "FF999999" } };
  navCell.alignment = { horizontal: "center" };

  wsResumen.mergeCells(`A${navRow + 1}:C${navRow + 1}`);
  const linkEmpleados = wsResumen.getCell(`A${navRow + 1}`);
  linkEmpleados.value = "📋 Ir a Informe de Empleados";
  linkEmpleados.font = { bold: true, size: 11, color: { argb: "FF2E75B6" }, underline: true };
  linkEmpleados.alignment = { horizontal: "center" };

