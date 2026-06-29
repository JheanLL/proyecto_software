import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "mi_clave_secreta_super_segura_para_desarrollo"
);

export async function proxy(request: NextRequest) {
  // Obtener la cookie
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Definir qué rutas no requieren login (El setup de la BD y la pantalla de login)
  const isPublicPath = pathname === '/login' || pathname.startsWith('/api/setup');

  // Si NO hay token y trata de entrar al dashboard -> Patada al Login
  // IMPORTANTE: Solo redirigir peticiones GET para no romper las Server Actions (POST) con E394.
  if (!token && !isPublicPath && request.method === 'GET') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si SÍ hay token, vamos a verificar que sea válido y no haya sido manipulado
  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      
      // Si el token es válido y trata de entrar a la pantalla de login, lo mandamos al dashboard
      // IMPORTANTE: Solo redirigir peticiones GET. Las peticiones POST (Server Actions) 
      // no deben ser redirigidas por el middleware porque romperían la respuesta JSON con un E394.
      if (isPublicPath && pathname === '/login' && request.method === 'GET') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Si el token expiró o es falso, lo borramos
      // IMPORTANTE: Solo redirigir si es GET. Para POST (Server Actions), usar next() con la cookie borrada.
      if (request.method === 'GET') {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
      } else {
        const response = NextResponse.next();
        response.cookies.delete('auth_token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas se activa este vigilante
export const config = {
  matcher: [
    // Se activa en TODAS las rutas excepto api, _next, favicon y extensiones de imagen (.png, .jpg, .jpeg)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$).*)',
  ],
};