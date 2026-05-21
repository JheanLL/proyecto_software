import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // 1. Desactivar la verificación de llaves foráneas para permitir el borrado
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");

    // 2. Eliminar todas las tablas antiguas y nuevas sin restricciones
    await pool.query(
      "DROP TABLE IF EXISTS T_Auditoria, T_Empleado, T_Area, T_CondicionLaboral;",
    );
    await pool.query(
      "DROP TABLE IF EXISTS BOLETA_PAGO, HISTORIAL_MODIFICACIONES, EMPLEADO, AREA_TRABAJO, USUARIO, ROL;",
    );

    // 3. Volver a activar la verificación
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
    // 3. Crear Tabla ROL
    await pool.query(`
      CREATE TABLE ROL (
        RolID INT AUTO_INCREMENT PRIMARY KEY,
        RolNombre VARCHAR(45) NOT NULL
      );
    `);

    // 4. Crear Tabla USUARIO
    await pool.query(`
      CREATE TABLE USUARIO (
        UserCodigo INT AUTO_INCREMENT PRIMARY KEY,
        UserNombre VARCHAR(45) NOT NULL,
        UserCorreo VARCHAR(80) NOT NULL UNIQUE,
        UserPassword VARCHAR(255) NOT NULL,
        RolID INT,
        FOREIGN KEY (RolID) REFERENCES ROL(RolID)
      );
    `);

    // 5. Crear Tabla AREA_TRABAJO
    await pool.query(`
      CREATE TABLE AREA_TRABAJO (
        AreaID INT AUTO_INCREMENT PRIMARY KEY,
        AreaNombre VARCHAR(45) NOT NULL,
        AreaSalario DECIMAL(10,2) NOT NULL
      );
    `);

    // 6. Crear Tabla EMPLEADO
    await pool.query(`
      CREATE TABLE EMPLEADO (
        EmpCodigo VARCHAR(8) PRIMARY KEY,
        AreaID INT,
        EmpDNI CHAR(8) NOT NULL UNIQUE,
        EmpApellidoPaterno VARCHAR(45) NOT NULL,
        EmpApellidoMaterno VARCHAR(45) NOT NULL,
        EmpNombres VARCHAR(45) NOT NULL,
        EmpGenero VARCHAR(10),
        EmpCorreo VARCHAR(80),
        EmpFechaNacimiento DATE,
        EmpFechaIngreso DATE,
        EmpContratoInicio DATE,
        EmpContratoFin DATE,
        EmpSalario DECIMAL(10,2),
        FOREIGN KEY (AreaID) REFERENCES AREA_TRABAJO(AreaID)
      );
    `);

    // 7. Crear Tabla HISTORIAL_MODIFICACIONES
    await pool.query(`
      CREATE TABLE HISTORIAL_MODIFICACIONES (
        HistorialID INT AUTO_INCREMENT PRIMARY KEY,
        EmpCodigo VARCHAR(8),
        CampoModificado VARCHAR(45),
        ValorAnterior VARCHAR(45),
        ValorNuevo VARCHAR(45),
        FechaModificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        UserCodigoHM INT,
        FOREIGN KEY (EmpCodigo) REFERENCES EMPLEADO(EmpCodigo),
        FOREIGN KEY (UserCodigoHM) REFERENCES USUARIO(UserCodigo)
      );
    `);

    // 8. Crear Tabla BOLETA_PAGO
    await pool.query(`
      CREATE TABLE BOLETA_PAGO (
        BoletaID INT AUTO_INCREMENT PRIMARY KEY,
        EmpCodigo VARCHAR(8),
        FechaBoleta DATE,
        SalarioBase DECIMAL(10,2),
        Gratificacion DECIMAL(10,2),
        TotalPago DECIMAL(10,2),
        FOREIGN KEY (EmpCodigo) REFERENCES EMPLEADO(EmpCodigo)
      );
    `);

    // ==========================================
    // INSERCIÓN DE DATOS POR DEFECTO
    // ==========================================

    // Insertar Roles
    await pool.query(
      `INSERT INTO ROL (RolNombre) VALUES ('Administrador'), ('Recursos Humanos');`,
    );

    // Insertar Usuario Admin (Contraseña temporal sin encriptar para probar el login primero)
    await pool.query(`
      INSERT INTO USUARIO (UserNombre, UserCorreo, UserPassword, RolID) 
      VALUES ('Admin', 'admin@empresa.com', '123456', 1);
    `);

    // Insertar Áreas de Trabajo con sus salarios
    await pool.query(`
      INSERT INTO AREA_TRABAJO (AreaNombre, AreaSalario) VALUES 
      ('Practicante', 1300.00),
      ('Secretaria', 1600.00),
      ('Soporte TI', 1900.00),
      ('Analista TI', 2200.00),
      ('Gerente de TI', 2500.00);
    `);

    return NextResponse.json({
      message:
        "¡Base de datos recreada con el nuevo diagrama relacional exitosamente!",
    });
  } catch (error) {
    console.error("Error detallado:", error);
    return NextResponse.json(
      { error: "Error actualizando la base de datos.", details: error },
      { status: 500 },
    );
  }
}
