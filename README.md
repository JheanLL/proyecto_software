# Gestor de Empleados

Este es un proyecto construido con [Next.js](https://nextjs.org/) para la gestión eficiente de empleados, planillas y áreas de trabajo, utilizando un diseño moderno, alto rendimiento y una arquitectura escalable.

## 🚀 Tecnologías Principales
- **Framework:** Next.js (App Router)
- **Base de Datos:** MySQL alojado en [Aiven](https://aiven.io/)
- **Autenticación:** JWT con `jose` y encriptación de contraseñas con `bcryptjs`
- **Estilos:** TailwindCSS y Componentes UI personalizados

## 🛠️ Requisitos Previos
Asegúrate de tener instalado en tu máquina:
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- Git

## 📥 Clonación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/gestor_empleados.git
   cd gestor_empleados
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de la base de datos de Aiven y el secreto de JWT. El archivo debe verse similar a esto:
   ```env
   DB_HOST=mysql-xxxx-aiven.aivencloud.com
   DB_PORT=xxxx
   DB_USER=avnadmin
   DB_PASSWORD=tu_password_seguro
   DB_NAME=defaultdb
   JWT_SECRET=tu_clave_secreta_super_segura
   ```
   > **Nota:** La base de datos está alojada en Aiven y requiere SSL. El código ya está configurado para conectarse correctamente (`rejectUnauthorized: false`).

4. **Ejecutar el servidor en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Acceder a la aplicación:**
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔒 Seguridad y Escalabilidad
El proyecto cuenta con múltiples capas de seguridad y optimización:
- **Pool de conexiones Singleton** para prevenir la saturación de conexiones con la base de datos en desarrollo.
- **Transacciones SQL** completas para operaciones complejas, asegurando la consistencia de los datos.
- **Contraseñas hasheadas** de los usuarios en la base de datos con validaciones estrictas.
- **Cabeceras de Seguridad** (XSS Protection, No-sniff, etc.) en `next.config.ts`.
- **Modales y Tablas Accesibles (A11y)** con navegación por teclado y etiquetas ARIA integradas.

## 🤝 Contribución
Las contribuciones son bienvenidas. Asegúrate de probar cualquier cambio corriendo el entorno de desarrollo y verificando que la validación de TypeScript no falle.
