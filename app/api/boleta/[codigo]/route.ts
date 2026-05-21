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
    
    if (fechaIngreso > hoy || anios < 0) {
      anios = 0;
      meses = 0;
      dias = 0;
    }

    const antiguedadExacta = `${anios} años, ${meses} meses, ${dias} días`;
    const salarioMensual = Number(emp.Salario);

    // ==========================================
    // LÓGICA DINÁMICA DE GRATIFICACIÓN
    // ==========================================
    const mesActual = hoy.getMonth(); // Enero es 0, Julio es 6, Diciembre es 11
    let montoGratificacion = 0;
    let nombreGratificacion = '';

    if (mesActual === 6) {
      montoGratificacion = 300.00;
      nombreGratificacion = 'Gratificación Fiestas Patrias (Julio)';
    } else if (mesActual === 11) {
      montoGratificacion = 300.00;
      nombreGratificacion = 'Gratificación Navidad (Diciembre)';
    }

    const totalNetoPagar = salarioMensual + montoGratificacion;

    // ==========================================
    // CONSTRUCCIÓN DEL EXCEL
    // ==========================================
    const datosBoleta: any[] = [
      { Concepto: 'EMPRESA', Detalle: 'NÓMINA DE PAGO - BOLETA INDIVIDUAL' },
      { Concepto: '', Detalle: '' },
      { Concepto: 'DATOS DEL TRABAJADOR', Detalle: '-------------------------' },
      { Concepto: 'Nombres y Apellidos', Detalle: `${emp.EmpNombres} ${emp.EmpApellidoPaterno}` },
      { Concepto: 'Documento de Identidad (DNI)', Detalle: emp.EmpDni },
      { Concepto: 'Cargo / Área Asignada', Detalle: emp.AreaNombre },
      { Concepto: 'Tiempo de Servicio Exacto', Detalle: antiguedadExacta },
      { Concepto: '', Detalle: '' },
      { Concepto: 'REMUNERACIONES Y BENEFICIOS', Detalle: '-------------------------' },
      { Concepto: 'Salario Básico Mensual', Detalle: `S/. ${salarioMensual.toFixed(2)}` }
    ];

    // Solo se agrega la fila de gratificación si corresponde al mes actual
    if (montoGratificacion > 0) {
      datosBoleta.push({ 
        Concepto: nombreGratificacion, 
        Detalle: `S/. ${montoGratificacion.toFixed(2)}` 
      });
    }

    // Fila final con la suma total real
    datosBoleta.push(
      { Concepto: '', Detalle: '' },
      { Concepto: 'TOTAL NETO A PAGAR EN BOLETA', Detalle: `S/. ${totalNetoPagar.toFixed(2)}` }
    );

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
    console.error("Error al generar boleta:", error);
    return NextResponse.json({ error: 'Error al generar Boleta de Pago' }, { status: 500 });
  }
}