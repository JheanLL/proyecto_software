import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Crear la tabla de Auditoría
    await pool.query(`
      CREATE TABLE IF NOT EXISTS T_Auditoria (
          AudCodigo INT AUTO_INCREMENT PRIMARY KEY,
          AudTablaAfectada VARCHAR(50) NOT NULL,
          AudAccion VARCHAR(50) NOT NULL,
          AudDetalle TEXT NOT NULL,
          AudFecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Actualizar los nombres de las áreas según el RF02
    await pool.query(`UPDATE T_Area SET AreNombre = 'Practicante', AreSalarioBase = 1300.00 WHERE AreCodigo = 1;`);
    await pool.query(`UPDATE T_Area SET AreNombre = 'Secretaria', AreSalarioBase = 1600.00 WHERE AreCodigo = 2;`);
    await pool.query(`UPDATE T_Area SET AreNombre = 'Soporte TI', AreSalarioBase = 1900.00 WHERE AreCodigo = 3;`);
    await pool.query(`UPDATE T_Area SET AreNombre = 'Analista TI', AreSalarioBase = 2200.00 WHERE AreCodigo = 4;`);
    await pool.query(`UPDATE T_Area SET AreNombre = 'Gerente de TI', AreSalarioBase = 2500.00 WHERE AreCodigo = 5;`);

    return NextResponse.json({ message: '¡Tabla de Auditoría creada y cargos actualizados!' });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error actualizando la base de datos.' }, { status: 500 });
  }
}