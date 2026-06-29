'use server';

import pool from '@/lib/db';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // 1. Clave secreta con fallback seguro dentro del try/catch
    const secret =
      process.env.JWT_SECRET || 'mi_clave_secreta_super_segura_para_desarrollo';
    const SECRET_KEY = new TextEncoder().encode(secret);

    // 2. Buscar al usuario
    const [rows]: any = await pool.query(
      'SELECT UserCodigo, UserNombre, UserPassword, RolID FROM USUARIO WHERE UserCorreo = ?',
      [email],
    );

    const user = rows[0];

    // 3. Validar existencia y contraseña
    if (!user) {
      return { success: false, message: 'Correo o contraseña incorrectos' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.UserPassword);
    if (!isPasswordValid) {
      return { success: false, message: 'Correo o contraseña incorrectos' };
    }

    // 4. Crear el Token JWT
    const token = await new SignJWT({
      userId: user.UserCodigo,
      userName: user.UserNombre,
      roleId: user.RolID,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(SECRET_KEY);

    // 5. Guardar el token en la Cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
  // Redirigir fuera del bloque try/catch (ya que redirect arroja un error interno en Next.js)
  redirect('/');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
