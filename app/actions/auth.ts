"use server";

import pool from "@/lib/db";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

// Clave secreta para firmar los tokens (En producción esto va en tu archivo .env)
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "mi_clave_secreta_super_segura_para_desarrollo"
);

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    // 1. Buscar al usuario en la base de datos
    const [rows]: any = await pool.query(
      "SELECT UserCodigo, UserNombre, UserPassword, RolID FROM USUARIO WHERE UserCorreo = ?",
      [email]
    );
    
    const user = rows[0];

    if (!user) {
      return { success: false, message: "Correo o contraseña incorrectos" };
    }

    // 2. Validar contraseña
    // Nota: Por ahora comparamos texto plano porque así lo insertamos en el script inicial.
    // En el futuro, instalaremos bcrypt y usaremos: await bcrypt.compare(password, user.UserPassword)
    if (password !== user.UserPassword) {
      return { success: false, message: "Correo o contraseña incorrectos" };
    }

    // 3. Crear el Token JWT con los datos del usuario
    const token = await new SignJWT({
      userId: user.UserCodigo,
      userName: user.UserNombre,
      roleId: user.RolID,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h") // La sesión durará 8 horas
      .sign(SECRET_KEY);

    // 4. Guardar el token en una Cookie de alta seguridad (Next.js 15 exige el await)
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 horas en segundos
      path: "/",
    });

    return { success: true, message: "Login exitoso" };
  } catch (error) {
    console.error("Error en login:", error);
    return { success: false, message: "Error interno del servidor" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}