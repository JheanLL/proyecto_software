# AUDITORÍA TÉCNICA COMPLETA — gestor_empleados

---

## RESUMEN INICIAL

| Categoría | Cantidad |
|---|---|
| Archivos analizados | 22 archivos |
| Server Components (app router) | 5 (page.tsx, login, empleados/[codigo], empleados/nuevo, cargos, auditoria) |
| Client Components ("use client") | 8 (EmpleadosTable, ModalGenerarBoleta, ModalConfirmDelete, ModalConfirmCargo, EditEmployeeForm, EditCargoForm, NewCargoForm, FormSalario, Header, LogoutButton, ToastProvider, NewEmployeeForm) |
| Server Actions ("use server") | 4 (boletas.ts, empleados.ts, cargos.ts, auth.ts) |
| API Routes | 2 (informe/route.ts, boleta/[codigo]/route.ts) |
| Consultas SQL encontradas | 26 consultas en total |
| Funciones problemáticas | 12 identificadas |

---

## 1. ANÁLISIS DEL HALLAZGO PRINCIPAL: `calcularGratificacion`

### 🔍 Evidencia Directa

**Definición:** `actions/boletas.ts`, línea 73-82
```typescript
export async function calcularGratificacion(empCodigo: string, mesSimulado?: number): Promise<number> {
  const [rows]: any = await pool.query("SELECT EmpFechaIngreso FROM EMPLEADO WHERE EmpCodigo = ?", [empCodigo]);
  if (rows.length === 0) return 0.00;

  const fechaActual = new Date();
  const mesActual = mesSimulado || (fechaActual.getMonth() + 1);

  if (mesActual !== 7 && mesActual !== 12) return 0.00;
  return 300.00;
}
```

### ✅ Validación del hallazgo del usuario

| Afirmación | Verificación | Evidencia |
|---|---|---|
| Ejecuta una consulta SQL por empleado | ✅ **CONFIRMADO** | Línea 74: `pool.query("SELECT EmpFechaIngreso FROM EMPLEADO WHERE EmpCodigo = ?")` |
| Consulta `EmpFechaIngreso` pero ese dato ya viene en la consulta principal | ✅ **CONFIRMADO** | `app/page.tsx` línea 21: `e.EmpFechaIngreso` ya está en el SELECT principal |
| No utiliza realmente el valor obtenido de la consulta | ✅ **CONFIRMADO** | Solo usa `rows.length` para verificar existencia, nunca usa `rows[0].EmpFechaIngreso` |
| Depende solo del mes (julio/diciembre) y devuelve valor fijo 300.00 | ✅ **CONFIRMADO** | Línea 80-81: `if (mesActual !== 7 && mesActual !== 12) return 0.00; return 300.00;` |
| Genera patrón N+1 innecesario | ✅ **CONFIRMADO** | `app/page.tsx` líneas 31-58: `empleados.map(async (emp) => { calcularGratificacion(emp.EmpCodigo) })` |

### 📊 Impacto cuantificado del N+1

- Si hay **N empleados activos**:
  - Consulta principal: **1 query**
  - Consultas de gratificación: **N queries**
  - Total: **1 + N queries** (patrón N+1 clásico)
  - Con 100 empleados: 101 queries en lugar de 2
  - Con 1000 empleados: 1001 queries en lugar de 2

### 🔄 ¿Dónde se llama `calcularGratificacion`?

Solo en **1 lugar**: `app/page.tsx`, línea 33:
```typescript
const gratificacion = await calcularGratificacion(emp.EmpCodigo);
```

### 💡 Solución: Función pura (eliminar por completo `calcularGratificacion`)

La función `calcularGratificacion` puede ser reemplazada por cálculo inline (función pura):

```typescript
function calcularGratificacionPura(mes: number): number {
  return (mes === 7 || mes === 12) ? 300.00 : 0.00;
}
```

Esto:
- Elimina N queries (1 por empleado)
- Elimina la ida y vuelta a la BD por empleado
- No requiere acceso a datos del empleado (el usuario ya había observado que `EmpFechaIngreso` es irrelevante)
- **Impacto estimado**: Con 100 empleados → ~100 queries eliminadas por carga de página

---

## 2. PROBLEMAS DE SEGURIDAD

### 🔴 CRÍTICO: Contraseñas en texto plano — `actions/auth.ts`, línea 26

**Archivo:** `actions/auth.ts`
**Línea:** 26
**Código:**
```typescript
if (!user || password !== user.UserPassword) {
```
**Problema:** Las contraseñas se almacenan y comparan en **texto plano** (sin hash). Esto viola OWASP Top 10 y cualquier estándar de seguridad.
**Riesgo:** Si la BD es comprometida, todas las contraseñas quedan expuestas.
**Solución:** Usar `bcrypt` o `bcryptjs` para hashing y verificación.

### 🔴 CRÍTICO: API routes sin autenticación — `app/api/boleta/[codigo]/route.ts`, `app/api/informe/route.ts`

**Archivos:**
- `app/api/boleta/[codigo]/route.ts`
- `app/api/informe/route.ts`

**Problema:** Ambos endpoints GET no verifican autenticación ni autorización. Cualquier persona con la URL puede descargar boletas de pago e informes completos de RRHH.

**Código (boleta):** Líneas 5-9:
```typescript
export async function GET(request: NextRequest, { params }: ...) {
  const { codigo } = await params;
  // No hay verificación de token JWT
```

**Código (informe):** Líneas 5-6:
```typescript
export async function GET() {
  // No hay verificación de token JWT
```

### 🔴 CRÍTICO: API route confía en datos del cliente — `app/api/boleta/[codigo]/route.ts`, líneas 11-12

**Código:**
```typescript
const totalParam = parseFloat(searchParams.get("total") || "0");
const gratificacionParam = parseFloat(searchParams.get("gratificacion") || "0");
```

**Problema:** Los montos (`total` y `gratificacion`) vienen como query params desde el cliente y se usan directamente en la boleta descargable. Un usuario malicioso puede modificar estos valores.

Además, línea 50:
```typescript
worksheet.addRow(["Salario Base", total - gratificacion]);
```
Esto deriva el salario base como `total - gratificacion`, lo que significa que el cliente puede controlar indirectamente el valor que se muestra como salario base.

### 🟡 MEDIO: Fallback inseguro de JWT_SECRET — Múltiples archivos

**En `actions/auth.ts`, línea 14:** `process.env.JWT_SECRET || "mi_clave_secreta_super_segura_para_desarrollo"`

**En `actions/empleados.ts`, línea 10:** Mismo fallback.

**En `actions/cargos.ts`, línea 10:** Mismo fallback.

**Problema:** Hardcoding de secretos en el código fuente. Si el código se filtra (público en GitHub), cualquiera puede firmar JWTs válidos.

---

## 3. PROBLEMAS DE RENDIMIENTO

### 🔴 ALTA: Consulta N+1 en Dashboard — `app/page.tsx`, líneas 31-58

| Detalle | Valor |
|---|---|
| Archivo | `app/page.tsx` |
| Líneas | 31-58 |
| Problema | N+1 query: 1 consulta principal + N consultas individuales |
| Función culpable | `calcularGratificacion()` |
| Impacto con 100 empleados | ~99 consultas innecesarias |
| Esfuerzo de fix | 5 minutos (hacer función pura) |

### 🔴 ALTA: Subquery SQL CORELLACIONADA — `app/api/informe/route.ts`, línea 11

**Código:**
```sql
(SELECT COUNT(*) FROM BOLETA_PAGO WHERE EmpCodigo = e.EmpCodigo) AS TotalBoletas
```

**Problema:** Subquery correlacionada que se ejecuta **por cada fila** de empleados. Es un N+1 dentro de la misma SQL.

**Solución:** Reemplazar con LEFT JOIN y GROUP BY, o un COUNT con JOIN.

**Impacto:** Con 100 empleados, 1 query de empleados + 100 subqueries = 101 consultas en realidad (aunque en una sola llamada SQL, sigue siendo costoso).

### 🟡 MEDIA: Query innecesaria en informe — `app/api/informe/route.ts`, líneas 18-24

**Código:**
```sql
SELECT b.*, e.EmpNombres, e.EmpApellidoPaterno, e.EmpApellidoMaterno
FROM BOLETA_PAGO b JOIN EMPLEADO e ON b.EmpCodigo = e.EmpCodigo WHERE e.activo = 1
```

**Problema:** Se ejecuta **una segunda consulta completa** solo para obtener nombres de empleados adicionales. Esto podría haberse resuelto en la primera consulta o con un JOIN directamente. Los nombres de empleados ya están en `rows` (primera consulta).

### 🟡 MEDIA: timeout de conexión no configurado — `lib/db.ts`

**Código:**
```typescript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  // ...
  connectionLimit: 10,
  timezone: "Z",
});
```

**Problema:** No hay configuración de `waitForConnections`, `queueLimit`, ni timeout de conexión. Por defecto, si todas las conexiones están ocupadas, las queries pueden fallar silenciosamente.

---

## 4. PROBLEMAS DE ARQUITECTURA

### 🔴 ALTA: Código duplicado — `obtenerUserIdDesdeJWT` replicado en 3 archivos

| Archivo | Líneas | Código |
|---|---|---|
| `actions/empleados.ts` | 17-23 | `obtenerUserIdDesdeJWT()` |
| `actions/cargos.ts` | 13-19 | `obtenerUserIdDesdeJWT()` (idéntico) |

**Problema:** La misma función está definida 2 veces (exactamente igual). Debería estar en un archivo compartido (ej. `lib/auth.ts`).

### 🟡 MEDIA: Lógica de cálculo de antigüedad duplicada

**En `app/page.tsx`** (líneas 34-56): Cálculo inline de antigüedad con años, meses, días.
**En `app/api/informe/route.ts`** (líneas 180-185): Cálculo similar de antigüedad (años, meses).

**Problema:** La misma lógica está duplicada en Server Component y API Route. Si se necesita cambiar la fórmula, hay que actualizar ambos lugares.

### 🟡 MEDIA: Cálculo de gratificación duplicado

**En `actions/boletas.ts`:**
- Línea 16 (en `generarBoletasMes`): `const gratificacion = (mesActual === 6 || mesActual === 11) ? 300.0 : 0.0;`
- Líneas 73-82 (en `calcularGratificacion`): misma lógica pero con query SQL adicional.

**En `components/ui/ModalGenerarBoleta.tsx`** (líneas 37-61): Otro cálculo de gratificación completamente diferente (`mesesComputables * 50` en lugar de valor fijo 300).

**Problema:** Hay **3 implementaciones diferentes** de gratificación:
1. `generarBoletasMes` → valor fijo 300
2. `calcularGratificacion` → valor fijo 300 (con query innecesaria)
3. `ModalGenerarBoleta` → `mesesComputables * 50` (lógica diferente)

### 🟡 MEDIA: Manejo inconsistente del estado de carga — LogoutButton

**Archivo:** `components/ui/LogoutButton.tsx`
**Código:**
```typescript
const handleLogout = async () => {
  await logoutAction();
  window.location.href = "/login";
};
```

**Problema:** No hay estado de "cargando" ni feedback visual. Si `logoutAction` tarda, el usuario puede hacer clic múltiples veces.

---

## 5. PROBLEMAS DE TYPESCRIPT

### 🟡 MEDIA: Uso excesivo de `any`

| Archivo | Líneas | Código |
|---|---|---|
| `app/page.tsx` | 29 | `const empleados = rows as any[];` |
| `actions/empleados.ts` | 67, 110, 139, 298, etc. | `const [rows]: any = await pool.query(...)` |
| `actions/boletas.ts` | 23, 28, 54, 74, etc. | `const [rows]: any = await pool.query(...)` |
| `actions/cargos.ts` | 77, 110 | `const [old]: any = await pool.query(...)` |
| `app/api/informe/route.ts` | 6, 18 | `const [rows]: any = await pool.query(...)` |

**Problema:** Prácticamente todas las consultas SQL usan `as any[]` o `const [var]: any =`. Esto anula por completo el sistema de tipos de TypeScript. Cualquier error de nombre de columna se detectará solo en runtime.

### 🟡 MEDIA: `any[]` en props de componente — `EmpleadosTable.tsx`

**Archivo:** `components/ui/EmpleadosTable.tsx`, línea 24
```typescript
interface Props {
  empleadosConCalculos: any[];
}
```

**Problema:** Tipado perdido. `any[]` no provee ninguna seguridad de tipos.

---

## 6. PROBLEMAS DE LIMPIEZA Y CÓDIGO MUERTO

### 🟢 BAJA: `generarBoletasMes` duplica lógica de gratificación

**Archivo:** `actions/boletas.ts`, líneas 11-16 vs 73-82
**Problema:** `generarBoletasMes` usa cálculo inline (línea 16) en lugar de llamar a `calcularGratificacion`. Inconsistencia.

### 🟢 BAJA: Comentario desactualizado — `app/api/boleta/[codigo]/route.ts`, línea 14

```typescript
// Traemos también la fecha de ingreso del empleado
```
**Problema:** `EmpFechaIngreso` se selecciona pero nunca se usa en el endpoint.

### 🟢 BAJA: `FormSalario.tsx` — componente no utilizado en ningún Server Component

**Archivo:** `components/forms/FormSalario.tsx`
**Problema:** Este componente existe y está completo, pero no se importa en ninguna página actual. Es código muerto o potencialmente para uso futuro. **HIPÓTESIS: NO CONFIRMADO** — Podría usarse en un modal de cambio rápido de salario no implementado aún.

### 🟢 BAJA: Logo.tsx — componente no encontrado en uso

**Archivo:** `components/ui/Logo.tsx` (listado en files pero no verificado su uso)
**Problema:** Existe pero no parece estar importado en ningún archivo visible. **HIPÓTESIS: NO CONFIRMADO**.

---

## 7. PROBLEMAS DE NEXT.JS APP ROUTER

### 🟡 MEDIA: `searchParams` no manejado correctamente en API

**Archivo:** `app/api/boleta/[codigo]/route.ts`, líneas 11-12
```typescript
const totalParam = parseFloat(searchParams.get("total") || "0");
const gratificacionParam = parseFloat(searchParams.get("gratificacion") || "0");
```

**Problema:** Los montos financieros vienen como searchParams desde el cliente (ver ModalGenerarBoleta línea 75). Esto es una vulnerabilidad de integridad de datos.

### 🟢 BAJA: `params` como Promise en Next.js 15 — `app/empleados/[codigo]/page.tsx`, línea 12

```typescript
params: Promise<{ codigo: string }>
```

**Problema:** Correctamente implementado como Promise para Next.js 15, pero no hay validación de que `codigo` exista o tenga formato válido.

### 🟢 BAJA: `export const dynamic = "force-dynamic"` en dashboard — `app/page.tsx`, línea 13

**Problema:** Correcto para datos en tiempo real, pero con la refactorización de `calcularGratificacion` a función pura, aún se beneficiaría de caché parcial.

---

## 8. PROBLEMAS DE BASE DE DATOS

### 🟡 MEDIA: `SELECT *` en empleados — `app/empleados/[codigo]/page.tsx`, línea 17

```typescript
"SELECT * FROM EMPLEADO WHERE EmpCodigo = ? AND activo = 1",
```

**Problema:** `SELECT *` trae todas las columnas cuando solo se necesitan unas pocas. Además, si la tabla cambia (nuevas columnas), este query puede traer datos sensibles inesperadamente.

### 🟡 MEDIA: Conversión de tipo innecesaria — Múltiples lugares

En `actions/empleados.ts`, línea 145:
```typescript
if (salarioAnterior !== null && Number(salarioAnterior) === nuevoSalario) {
```

**Problema:** `salarioAnterior` ya debería ser number si se definió correctamente el tipo en la BD. El `Number()` es defensivo pero revela tipado débil.

---

## 9. PROBLEMAS DE TURBOPACK Y BUNDLE

### 🟡 MEDIA: `lucide-react` importada por componentes individuales — Todos los client components

**Problema:** Aunque no es severo, las importaciones nombradas de `lucide-react` son correctas y tree-shakeables. Sin embargo, `react-hot-toast` se usa en múltiples Client Components.

### 🟢 BAJA: `exceljs` es una dependencia pesada

**Archivo:** `package.json`, `app/api/*/route.ts`
**Problema:** `exceljs` es ~2MB minificada. Se carga en las API routes, lo cual es aceptable, pero si alguna vez se necesita en el cliente, sería problemático. Actualmente solo se usa en server-side API routes (correcto).

---

## TABLA COMPLETA DE HALLAZGOS

| Prioridad | Archivo | Problema | Evidencia | Impacto | Esfuerzo |
|---|---|---|---|---|---|
| 🔴 CRÍTICO | `actions/auth.ts:26` | Contraseñas en texto plano | `password !== user.UserPassword` | Datos expuestos | 1h |
| 🔴 CRÍTICO | `app/api/boleta/[codigo]/route.ts` | API sin autenticación | Sin verificación JWT | Exposición de datos RRHH | 2h |
| 🔴 CRÍTICO | `app/api/informe/route.ts` | API sin autenticación | Sin verificación JWT | Exposición de datos RRHH | 2h |
| 🔴 CRÍTICO | `app/api/boleta/[codigo]/route.ts:11-12` | Datos del cliente no validados | `searchParams.get("total")` usado directamente | Fraude en montos de boleta | 3h |
| 🔴 ALTA | `app/page.tsx:31-58` | Patrón N+1 en Dashboard | `calcularGratificacion` por empleado | ~99 queries extra con 100 emp. | 5min |
| 🔴 ALTA | `app/api/informe/route.ts:11` | Subquery correlacionada | `(SELECT COUNT(*) FROM BOLETA_PAGO WHERE ...)` | N+1 en SQL por empleado | 30min |
| 🔴 ALTA | `actions/empleados.ts:17, actions/cargos.ts:13` | Código duplicado JWT | `obtenerUserIdDesdeJWT()` idéntico en 2 archivos | Violación DRY, mant. difícil | 15min |
| 🟡 MEDIA | `actions/boletas.ts:73-82` | Función no utiliza dato consultado | `SELECT EmpFechaIngreso` pero nunca usa `rows[0]` | Query innecesaria por llamado | 5min |
| 🟡 MEDIA | `actions/boletas.ts:16,73, ModalGenerarBoleta.tsx:44-56` | 3 implementaciones de gratificación diferentes | 300 fijo vs mesesComputables*50 | Inconsistencia de negocio | 30min |
| 🟡 MEDIA | `app/empleados/[codigo]/page.tsx:17` | SELECT * en EMPLEADO | `SELECT * FROM EMPLEADO` | Datos innecesarios, posible filtración | 5min |
| 🟡 MEDIA | Múltiples archivos | Uso excesivo de `any` en queries | `const [rows]: any = await pool.query(...)` | Tipado anulado, bugs runtime | 4h refactor |
| 🟡 MEDIA | `components/ui/EmpleadosTable.tsx:24` | Props tipados como `any[]` | `empleadosConCalculos: any[]` | Sin seguridad de tipos | 15min |
| 🟡 MEDIA | `actions/auth.ts, empleados.ts, cargos.ts` | JWT_SECRET hardcodeado en 3 archivos | `process.env.JWT_SECRET || "mi_clave_secreta_..."` | Riesgo de seguridad | 10min |
| 🟡 MEDIA | `app/page.tsx:34-56` vs `app/api/informe/route.ts:180-185` | Lógica de antigüedad duplicada | Cálculo de años/meses en 2 lugares | Mantenimiento duplicado | 20min |
| 🟢 BAJA | `components/forms/FormSalario.tsx` | Componente no utilizado aparentemente | No se importa en ninguna página | Código muerto | Verificar |
| 🟢 BAJA | `components/ui/Logo.tsx` | Componente no utilizado aparentemente | No se importa en ninguna página visible | Código muerto | Verificar |
| 🟢 BAJA | `app/api/boleta/[codigo]/route.ts:14` | Comentario desactualizado | "Traemos también la fecha de ingreso" pero no se usa | Confusión | 1min |
| 🟢 BAJA | `lib/db.ts` | Timeout de conexión no configurado | Falta `waitForConnections`, `queueLimit` | Posibles errores en alta concurrencia | 5min |

---

## TOP 10 PROBLEMAS MÁS IMPORTANTES

1. **🔴 CRÍTICO: Contraseñas en texto plano** — `actions/auth.ts:26` — SECURITY
2. **🔴 CRÍTICO: API routes sin autenticación** — `app/api/boleta/[codigo]/route.ts`, `app/api/informe/route.ts` — SECURITY
3. **🔴 CRÍTICO: Datos financieros confiados al cliente** — `app/api/boleta/[codigo]/route.ts:11-12` — SECURITY
4. **🔴 ALTA: Patrón N+1 en Dashboard** — `app/page.tsx:31-58` — PERFORMANCE
5. **🔴 ALTA: Subquery correlacionada en informe** — `app/api/informe/route.ts:11` — PERFORMANCE
6. **🔴 ALTA: Código duplicado JWT en 2 Server Actions** — `actions/empleados.ts:17, actions/cargos.ts:13` — ARCHITECTURE
7. **🟡 MEDIA: 3 implementaciones diferentes de gratificación** — INCONSISTENCIA DE NEGOCIO
8. **🟡 MEDIA: Uso masivo de `any` en todo el proyecto** — TYPE SAFETY
9. **🟡 MEDIA: SELECT * en perfil de empleado** — `app/empleados/[codigo]/page.tsx:17` — DATABASE
10. **🟡 MEDIA: JWT_SECRET hardcodeado con fallback** — SECURITY

---

## QUICK WINS (mejoras de < 30 minutos)

| # | Tarea | Archivos | Tiempo |
|---|---|---|---|
| 1 | ✅ Eliminar `calcularGratificacion` y reemplazar por función pura inline en `app/page.tsx` | `actions/boletas.ts`, `app/page.tsx` | 5 min |
| 2 | ✅ Eliminar query SQL de `calcularGratificacion` (la función entera es innecesaria) | `actions/boletas.ts` | 5 min |
| 3 | ✅ Reemplazar `SELECT *` por columnas específicas en `app/empleados/[codigo]/page.tsx` | `app/empleados/[codigo]/page.tsx` | 5 min |
| 4 | ✅ Crear `lib/auth.ts` con `obtenerUserIdDesdeJWT` compartido | Nuevo archivo + modificar 2 actions | 15 min |
| 5 | ✅ Agregar `waitForConnections: true` y timeouts en `lib/db.ts` | `lib/db.ts` | 5 min |
| 6 | ✅ Eliminar comentario desactualizado en `app/api/boleta/[codigo]/route.ts:14` | `app/api/boleta/[codigo]/route.ts` | 1 min |
| 7 | ✅ Centralizar lógica de gratificación en una función pura compartida | Nuevo archivo `lib/gratificacion.ts` | 15 min |

---

## REFACTORS RECOMENDADOS

### Refactor 1: Sistema de autenticación (Prioridad: CRÍTICA)
- Hash de contraseñas con bcrypt
- Middleware de autenticación para API routes
- Extraer lógica JWT a `lib/auth.ts`

### Refactor 2: Eliminar patrón N+1 del Dashboard (Prioridad: ALTA)
- Reemplazar `calcularGratificacion` por función pura inline
- Calcular gratificación directamente en el map sin consultas SQL

### Refactor 3: Unificar lógica de gratificación (Prioridad: MEDIA)
- Crear `lib/gratificacion.ts` con función pura y documentación del negocio
- Asegurar que `generarBoletasMes` y `ModalGenerarBoleta` usen la misma función

### Refactor 4: Tipado fuerte (Prioridad: MEDIA)
- Crear interfaz tipo `EmpleadoRow` para resultados de consultas SQL
- Eliminar uso de `any` en todas las queries

---

## PROBLEMAS CRÍTICOS (deben resolverse antes de producción)

1. **Contraseñas en texto plano** — Viola GDPR, Ley de Protección de Datos Personales.
2. **API routes sin autenticación** — Cualquier persona con la URL puede descargar toda la nómina.
3. **Datos financieros desde el cliente** — Un empleado malicioso puede manipular su boleta.

---

## PROBLEMAS QUE APARECERÍAN AL ESCALAR A MILES DE REGISTROS

| Problema | Escenario | Impacto Estimado |
|---|---|---|
| N+1 de `calcularGratificacion` | 5000 empleados activos → Dashboard | 5001 queries en lugar de 2 → Timeout (~5s+ solo en queries) |
| Subquery correlacionada en informe | 5000 empleados → Descarga de informe | 5000 subqueries → Excel tarda minutos en generarse |
| Sin `waitForConnections` en pool | 500 usuarios concurrentes | Queries fallan cuando se agotan las 10 conexiones |
| Código duplicado JWT | Equipo de 3+ desarrolladores | Bugs por actualizar solo 1 de las 2 copias |
| `any` en tipos | Cualquier cambio en esquema BD | Errores silenciosos en runtime, difícil depuración |

---

*Auditoría completada el 31 de mayo de 2026.*
*Archivos analizados: 22 | Hallazgos: 18 | Quick Wins disponibles: 7 | Críticos: 3*