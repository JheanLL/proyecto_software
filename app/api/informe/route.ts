import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import pool from '@/lib/db';

export async function GET() {
  const [rows]: any = await pool.query(`
    SELECT 
      e.EmpCodigo, e.EmpDNI, e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno, a.AreaNombre,
      e.EmpFechaNacimiento, e.EmpFechaIngreso,
      COALESCE(e.EmpSalario, a.AreaSalario) AS SalarioBase,
      e.activo,
      (SELECT COUNT(*) FROM BOLETA_PAGO WHERE EmpCodigo = e.EmpCodigo) AS TotalBoletas
    FROM EMPLEADO e
    INNER JOIN AREA_TRABAJO a ON e.AreaID = a.AreaID
    ORDER BY e.activo DESC, e.EmpCodigo DESC
  `);

  const [boletas]: any = await pool.query(`
    SELECT b.BoletaID, b.EmpCodigo, b.BoletaFechaBoleta, b.BoletaSalarioBase, b.BoletaGratificacion, b.BoletaTotalPago, e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno, e.activo
    FROM BOLETA_PAGO b
    JOIN EMPLEADO e ON b.EmpCodigo = e.EmpCodigo
    ORDER BY e.activo DESC, e.EmpCodigo DESC, b.BoletaFechaBoleta DESC
  `);

  // Filtrar solo activos para KPIs del Resumen
  const activeRows = rows.filter((r: any) => r.activo === 1);
  const activeBoletas = boletas.filter((b: any) => b.activo === 1);

  const hoy = new Date();
  const workbook = new ExcelJS.Workbook();

  // ============================
  // HOJA 1: RESUMEN
  // ============================
  const wsResumen = workbook.addWorksheet('Resumen');
  (wsResumen as any).tabColor = { argb: 'FF2E75B6' };

  wsResumen.mergeCells('A1:F1');
  wsResumen.getCell('A1').value = 'INFORME GENERAL DE OPERACIONES Y RRHH';
  wsResumen.getCell('A1').font = {
    bold: true,
    size: 18,
    color: { argb: 'FF000080' },
  };
  wsResumen.getCell('A1').alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  wsResumen.getRow(1).height = 36;

  wsResumen.mergeCells('A2:F2');
  wsResumen.getCell('A2').value =
    `Fecha: ${hoy.toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}`;
  wsResumen.getCell('A2').font = {
    italic: true,
    size: 11,
    color: { argb: 'FF666666' },
  };
  wsResumen.getCell('A2').alignment = { horizontal: 'center' };

  const totalEmpleados = activeRows.length;
  const totalBoletasEmitidas = activeBoletas.length;
  const montoTotal = activeBoletas.reduce(
    (s: number, b: any) => s + Number(b.BoletaTotalPago),
    0,
  );
  const promedio = totalEmpleados > 0 ? montoTotal / totalEmpleados : 0;

  // KPI Cards
  const kpi = 4;
  const card = (
    col: string,
    title: string,
    val: string | number,
    color: string,
  ) => {
    const col2 = String.fromCharCode(col.charCodeAt(0) + 1);
    wsResumen.mergeCells(`${col}${kpi}:${col2}${kpi + 1}`);
    const c = wsResumen.getCell(`${col}${kpi}`);
    c.value = title;
    c.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    wsResumen.mergeCells(`${col}${kpi + 2}:${col2}${kpi + 2}`);
    const v = wsResumen.getCell(`${col}${kpi + 2}`);
    v.value = val;
    v.font = {
      bold: true,
      size: col === 'E' ? 16 : 26,
      color: { argb: color },
    };
    v.alignment = { horizontal: 'center', vertical: 'middle' };
    v.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  };
  card('A', '👥 Total Empleados', totalEmpleados, 'FF2E75B6');
  card('C', '📄 Total Boletas Emitidas', totalBoletasEmitidas, 'FF00B050');
  card(
    'E',
    '💰 Monto Total Pagado',
    `S/ ${montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    'FFBF8F00',
  );
  wsResumen.getRow(kpi).height = 28;
  wsResumen.getRow(kpi + 2).height = 42;

  wsResumen.mergeCells(`A${kpi + 4}:F${kpi + 4}`);
  wsResumen.getCell(`A${kpi + 4}`).value =
    `📊 Promedio Pagado por Empleado: S/ ${promedio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  wsResumen.getCell(`A${kpi + 4}`).font = {
    bold: true,
    size: 13,
    color: { argb: 'FF555555' },
  };
  wsResumen.getCell(`A${kpi + 4}`).alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  wsResumen.getCell(`A${kpi + 4}`).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  wsResumen.getRow(kpi + 4).height = 32;

  // Navegación
  const nav = kpi + 7;
  wsResumen.mergeCells(`A${nav}:F${nav}`);
  wsResumen.getCell(`A${nav}`).value =
    'Haga clic en los enlaces para navegar entre hojas';
  wsResumen.getCell(`A${nav}`).font = {
    italic: true,
    size: 10,
    color: { argb: 'FF999999' },
  };
  wsResumen.getCell(`A${nav}`).alignment = { horizontal: 'center' };

  wsResumen.mergeCells(`A${nav + 1}:C${nav + 1}`);
  wsResumen.getCell(`A${nav + 1}`).value = {
    text: '📋 Ir a Informe de Empleados',
    hyperlink: "#'Informe de Empleados'!A1",
  };
  wsResumen.getCell(`A${nav + 1}`).font = {
    bold: true,
    size: 11,
    color: { argb: 'FF2E75B6' },
    underline: true,
  };
  wsResumen.getCell(`A${nav + 1}`).alignment = { horizontal: 'center' };

  wsResumen.mergeCells(`D${nav + 1}:F${nav + 1}`);
  wsResumen.getCell(`D${nav + 1}`).value = {
    text: '📑 Ir a Detalle de Boletas',
    hyperlink: "#'Detalle de Boletas'!A1",
  };
  wsResumen.getCell(`D${nav + 1}`).font = {
    bold: true,
    size: 11,
    color: { argb: 'FFBF8F00' },
    underline: true,
  };
  wsResumen.getCell(`D${nav + 1}`).alignment = { horizontal: 'center' };

  // Ranking top 15
  const rk = nav + 4;
  wsResumen.mergeCells(`A${rk}:F${rk}`);
  wsResumen.getCell(`A${rk}`).value = '📊 TOP EMPLEADOS POR BOLETAS GENERADAS';
  wsResumen.getCell(`A${rk}`).font = {
    bold: true,
    size: 13,
    color: { argb: 'FFFFFFFF' },
  };
  wsResumen.getCell(`A${rk}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E75B6' },
  };
  wsResumen.getCell(`A${rk}`).alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  wsResumen.getCell(`A${rk}`).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  wsResumen.getRow(rk).height = 30;

  ['#', 'Código', 'Empleado', 'Área', 'Total Boletas', 'Barra'].forEach(
    (h, i) => {
      wsResumen.getCell(rk + 1, i + 1).value = h;
      wsResumen.getCell(rk + 1, i + 1).font = {
        bold: true,
        size: 10,
        color: { argb: 'FF2E75B6' },
      };
      wsResumen.getCell(rk + 1, i + 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD6E4F0' },
      };
      wsResumen.getCell(rk + 1, i + 1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      wsResumen.getCell(rk + 1, i + 1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    },
  );
  wsResumen.getRow(rk + 1).height = 24;

  const top = [...activeRows]
    .sort((a: any, b: any) => (b.TotalBoletas || 0) - (a.TotalBoletas || 0))
    .slice(0, 15);
  const maxB = top.length > 0 ? top[0].TotalBoletas || 1 : 1;

  top.forEach((emp: any, i: number) => {
    const nr = rk + 2 + i;
    const tb = emp.TotalBoletas || 0;
    const bl = Math.round((tb / maxB) * 20);
    wsResumen.getCell(`A${nr}`).value = i + 1;
    wsResumen.getCell(`A${nr}`).alignment = { horizontal: 'center' };
    wsResumen.getCell(`A${nr}`).font = { bold: true, size: 10 };
    wsResumen.getCell(`B${nr}`).value = {
      text: emp.EmpCodigo,
      hyperlink: "#'Informe de Empleados'!A1",
    };
    wsResumen.getCell(`B${nr}`).font = {
      size: 10,
      color: { argb: 'FF2E75B6' },
      underline: true,
    };
    wsResumen.getCell(`C${nr}`).value =
      `${emp.EmpNombres} ${emp.EmpApellidoPaterno}`;
    wsResumen.getCell(`D${nr}`).value = emp.AreaNombre;
    wsResumen.getCell(`E${nr}`).value = tb;
    wsResumen.getCell(`E${nr}`).alignment = { horizontal: 'center' };
    wsResumen.getCell(`E${nr}`).font = { bold: true, size: 11 };
    wsResumen.getCell(`F${nr}`).value = '█'.repeat(bl) + '░'.repeat(20 - bl);
    wsResumen.getCell(`F${nr}`).font = {
      size: 9,
      color: { argb: i < 3 ? 'FF2E75B6' : 'FF888888' },
    };
    const fc = i % 2 === 0 ? 'FFF5F8FC' : 'FFFFFFFF';
    for (let c = 1; c <= 6; c++) {
      wsResumen.getCell(nr, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fc },
      };
      wsResumen.getCell(nr, c).border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    }
  });

  wsResumen.columns = [
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
  ];
  wsResumen.views = [{ state: 'frozen', ySplit: 3 }];

  // ============================
  // HOJA 2: INFORME DE EMPLEADOS
  // ============================
  const wsInf = workbook.addWorksheet('Informe de Empleados');
  (wsInf as any).tabColor = { argb: 'FF000080' };

  wsInf.mergeCells('A1:H1');
  wsInf.getCell('A1').value = 'LISTA DE EMPLEADOS';
  wsInf.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: 'FF000080' },
  };
  wsInf.getCell('A1').alignment = { horizontal: 'center' };

  wsInf.mergeCells('A2:H2');
  wsInf.getCell('A2').value = {
    text: '⬅ Volver al Resumen',
    hyperlink: "#'Resumen'!A1",
  };
  wsInf.getCell('A2').font = {
    bold: true,
    size: 10,
    color: { argb: 'FF2E75B6' },
    underline: true,
  };
  wsInf.getCell('A2').alignment = { horizontal: 'left' };

  [
    'Código',
    'DNI',
    'Nombres y Apellidos',
    'Área/Cargo',
    'Edad',
    'Antigüedad',
    'Salario Base',
    'Boletas Generadas',
  ].forEach((h, i) => {
    wsInf.getCell(3, i + 1).value = h;
    wsInf.getCell(3, i + 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000080' },
    };
    wsInf.getCell(3, i + 1).font = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11,
    };
    wsInf.getCell(3, i + 1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    wsInf.getCell(3, i + 1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  wsInf.getRow(3).height = 32;

  const ds = 4;
  const codigoRowMap: Record<string, number> = {};

  rows.forEach((emp: any, idx: number) => {
    const rn = ds + idx;
    codigoRowMap[emp.EmpCodigo] = rn;

    const fn = new Date(emp.EmpFechaNacimiento);
    const ed = hoy.getFullYear() - fn.getUTCFullYear();
    const fi = new Date(emp.EmpFechaIngreso);
    let tm =
      (hoy.getFullYear() - fi.getUTCFullYear()) * 12 +
      (hoy.getMonth() - fi.getUTCMonth());
    if (tm < 0) tm = 0;
    const a = Math.floor(tm / 12);
    const m = tm % 12;

    const isInactive = emp.activo === 0;
    const inactiveStyle = isInactive ? { argb: 'FF999999' } : { argb: 'FF2E75B6' };

    wsInf.getCell(rn, 1).value = {
      text: emp.EmpCodigo + (isInactive ? ' (Inactivo)' : ''),
      hyperlink: `#'Informe de Empleados'!A${rn}`,
    };
    wsInf.getCell(rn, 1).font = {
      color: inactiveStyle,
      underline: true,
      size: 11,
      italic: isInactive,
    };
    wsInf.getCell(rn, 1).alignment = { horizontal: 'left' };

    wsInf.getCell(rn, 2).value = emp.EmpDNI;
    wsInf.getCell(rn, 2).alignment = { horizontal: 'left' };
    if (isInactive) wsInf.getCell(rn, 2).font = { color: { argb: 'FF999999' }, italic: true };
    wsInf.getCell(rn, 3).value =
      `${emp.EmpNombres} ${emp.EmpApellidoPaterno} ${emp.EmpApellidoMaterno}`;
    if (isInactive) wsInf.getCell(rn, 3).font = { color: { argb: 'FF999999' }, italic: true, strike: true };
    wsInf.getCell(rn, 4).value = emp.AreaNombre;
    if (isInactive) wsInf.getCell(rn, 4).font = { color: { argb: 'FF999999' }, italic: true };
    wsInf.getCell(rn, 5).value = ed;
    wsInf.getCell(rn, 5).alignment = { horizontal: 'center' };
    if (isInactive) wsInf.getCell(rn, 5).font = { color: { argb: 'FF999999' }, italic: true };
    wsInf.getCell(rn, 6).value = `${a} años, ${m} meses`;
    wsInf.getCell(rn, 6).alignment = { horizontal: 'center' };
    if (isInactive) wsInf.getCell(rn, 6).font = { color: { argb: 'FF999999' }, italic: true };
    wsInf.getCell(rn, 7).value = Number(emp.SalarioBase);
    wsInf.getCell(rn, 7).numFmt = '"S/"#,##0.00';
    if (isInactive) wsInf.getCell(rn, 7).font = { color: { argb: 'FF999999' }, italic: true };

    // Total Boletas → se llenará después con el hipervínculo a la primera boleta
    wsInf.getCell(rn, 8).value = String(emp.TotalBoletas || 0);
    wsInf.getCell(rn, 8).font = {
      color: inactiveStyle,
      underline: true,
      size: 11,
      bold: true,
      italic: isInactive,
    };
    wsInf.getCell(rn, 8).alignment = { horizontal: 'center' };

    for (let c = 1; c <= 8; c++) {
      wsInf.getCell(rn, c).border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      };
      if (isInactive) {
        wsInf.getCell(rn, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }
    }
  });

  const de = ds + rows.length - 1;
  wsInf.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: de, column: 8 },
  };
  wsInf.views = [{ state: 'frozen', ySplit: 3 }];
  wsInf.columns = [
    { width: 14 },
    { width: 15 },
    { width: 48 },
    { width: 22 },
    { width: 10 },
    { width: 20 },
    { width: 18 },
    { width: 20 },
  ];

  // ============================
  // HOJA 3: DETALLE DE BOLETAS
  // ============================
  const wsDet = workbook.addWorksheet('Detalle de Boletas');
  (wsDet as any).tabColor = { argb: 'FF00B050' };

  wsDet.mergeCells('A1:G1');
  wsDet.getCell('A1').value = 'DETALLE DE BOLETAS DE PAGO';
  wsDet.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: 'FF000080' },
  };
  wsDet.getCell('A1').alignment = { horizontal: 'center' };

  wsDet.mergeCells('A2:G2');
  wsDet.getCell('A2').value = {
    text: '⬅ Volver al Resumen',
    hyperlink: "#'Resumen'!A1",
  };
  wsDet.getCell('A2').font = {
    bold: true,
    size: 10,
    color: { argb: 'FF2E75B6' },
    underline: true,
  };
  wsDet.getCell('A2').alignment = { horizontal: 'left' };

  [
    'ID Boleta',
    'Código Empleado',
    'Nombres',
    'Fecha',
    'Salario Base',
    'Gratificación',
    'Total Pago',
  ].forEach((h, i) => {
    wsDet.getCell(3, i + 1).value = h;
    wsDet.getCell(3, i + 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000080' },
    };
    wsDet.getCell(3, i + 1).font = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11,
    };
    wsDet.getCell(3, i + 1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    wsDet.getCell(3, i + 1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  wsDet.getRow(3).height = 28;

  const dd = 4;
  // Mapa: EmpCodigo → primera fila en Detalle de Boletas
  const primerBoletaRow: Record<string, number> = {};

  // Determinar dónde empiezan las boletas de inactivos para pintar el separador
  const primerInactivoIdx = boletas.findIndex((b: any) => b.activo === 0);

  boletas.forEach((b: any, idx: number) => {
    const rn = dd + idx;
    const isInactive = b.activo === 0;

    // Pintar separador visual antes del primer inactivo
    if (primerInactivoIdx !== -1 && idx === primerInactivoIdx) {
      wsDet.mergeCells(`A${rn}:G${rn}`);
      wsDet.getCell(`A${rn}`).value = '── EMPLEADOS INACTIVOS / ELIMINADOS ──';
      wsDet.getCell(`A${rn}`).font = {
        bold: true,
        size: 10,
        color: { argb: 'FF888888' },
        italic: true,
      };
      wsDet.getCell(`A${rn}`).alignment = { horizontal: 'center', vertical: 'middle' };
      wsDet.getCell(`A${rn}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' },
      };
      for (let c = 1; c <= 7; c++) {
        wsDet.getCell(rn, c).border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        };
      }
      wsDet.getRow(rn).height = 26;
      return; // Saltar esta fila (es el separador, no una boleta)
    }

    // Ajustar índice real considerando el separador
    // Si ya pasamos el separador, el índice de boleta real es idx-1
    const boletaIdx = primerInactivoIdx !== -1 && idx > primerInactivoIdx ? idx - 1 : idx;

    // Registrar primera ocurrencia de cada código
    if (!(b.EmpCodigo in primerBoletaRow)) {
      primerBoletaRow[b.EmpCodigo] = rn;
    }

    wsDet.getCell(rn, 1).value = `#${String(b.BoletaID).padStart(3, '0')}`;
    wsDet.getCell(rn, 1).alignment = { horizontal: 'left' };
    if (isInactive) wsDet.getCell(rn, 1).font = { color: { argb: 'FF999999' }, italic: true };

    const empRow = codigoRowMap[b.EmpCodigo];
    if (empRow) {
      wsDet.getCell(rn, 2).value = {
        text: b.EmpCodigo + (isInactive ? ' (Inactivo)' : ''),
        hyperlink: `#'Informe de Empleados'!A${empRow}`,
        tooltip: `Ver empleado ${b.EmpCodigo}`,
      };
      wsDet.getCell(rn, 2).font = {
        color: isInactive ? { argb: 'FF999999' } : { argb: 'FF2E75B6' },
        underline: true,
        size: 11,
        italic: isInactive,
      };
    } else {
      wsDet.getCell(rn, 2).value = b.EmpCodigo + (isInactive ? ' (Inactivo)' : '');
      wsDet.getCell(rn, 2).font = { size: 11, color: isInactive ? { argb: 'FF999999' } : undefined, italic: isInactive };
    }
    wsDet.getCell(rn, 2).alignment = { horizontal: 'left' };

    wsDet.getCell(rn, 3).value = `${b.EmpNombres} ${b.EmpApellidoPaterno}`;
    if (isInactive) wsDet.getCell(rn, 3).font = { color: { argb: 'FF999999' }, italic: true, strike: true };
    wsDet.getCell(rn, 4).value = new Date(b.BoletaFechaBoleta);
    wsDet.getCell(rn, 4).numFmt = 'DD/MM/YYYY';
    wsDet.getCell(rn, 4).alignment = { horizontal: 'center' };
    if (isInactive) wsDet.getCell(rn, 4).font = { color: { argb: 'FF999999' }, italic: true };
    wsDet.getCell(rn, 5).value = Number(b.BoletaSalarioBase);
    wsDet.getCell(rn, 5).numFmt = '"S/"#,##0.00';
    if (isInactive) wsDet.getCell(rn, 5).font = { color: { argb: 'FF999999' }, italic: true };
    wsDet.getCell(rn, 6).value = Number(b.BoletaGratificacion);
    wsDet.getCell(rn, 6).numFmt = '"S/"#,##0.00';
    if (isInactive) wsDet.getCell(rn, 6).font = { color: { argb: 'FF999999' }, italic: true };
    wsDet.getCell(rn, 7).value = Number(b.BoletaTotalPago);
    wsDet.getCell(rn, 7).numFmt = '"S/"#,##0.00';
    if (isInactive) wsDet.getCell(rn, 7).font = { color: { argb: 'FF999999' }, italic: true };

    for (let c = 1; c <= 7; c++) {
      wsDet.getCell(rn, c).border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      };
      if (isInactive) {
        wsDet.getCell(rn, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }
    }
  });

  // Calcular el fin real de la tabla considerando el separador
  const hasSeparator = primerInactivoIdx !== -1;
  const totalRows = boletas.length + (hasSeparator ? 1 : 0);
  const detEnd = dd + totalRows - 1;

  if (totalRows > 0) {
    wsDet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: detEnd, column: 7 },
    };
  }
  wsDet.views = [{ state: 'frozen', ySplit: 3 }];
  wsDet.columns = [
    { width: 14 },
    { width: 16 },
    { width: 48 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  // ============================
  // CORREGIR HIPERVÍNCULOS: Total Boletas → primera boleta del empleado
  // ============================
  rows.forEach((emp: any, idx: number) => {
    const isInactive = emp.activo === 0;
    const inactiveStyle = isInactive ? { argb: 'FF999999' } : { argb: 'FF2E75B6' };
    const infRow = ds + idx;
    const primera = primerBoletaRow[emp.EmpCodigo];
    if (primera) {
      wsInf.getCell(infRow, 8).value = {
        text: String(emp.TotalBoletas || 0),
        hyperlink: `#'Detalle de Boletas'!A${primera}`,
        tooltip: `Ver boletas de ${emp.EmpCodigo} (${emp.TotalBoletas || 0} boletas)`,
      };
      wsInf.getCell(infRow, 8).font = {
        color: inactiveStyle,
        underline: true,
        size: 11,
        bold: true,
        italic: isInactive,
      };
      wsInf.getCell(infRow, 8).alignment = { horizontal: 'center' };
    }
  });

  // ============================
  // GENERAR Y RESPONDER
  // ============================
  const buffer = await workbook.xlsx.writeBuffer();
  const fechaStr = hoy.toISOString().split('T')[0];
  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Informe_General_${fechaStr}.xlsx"`,
    },
  });
}
