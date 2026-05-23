import pool from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Acción para asignar el bono
async function asignarBonoAction(formData: FormData) {
  "use server";
  const empCodigo = formData.get("empCodigo") as string;
  const monto = Number(formData.get("monto"));
  const mes = Number(formData.get("mes"));
  const anio = Number(formData.get("anio"));

  try {
    // Insertar en la tabla de bonos
    await pool.query(
      `INSERT INTO BONO_PRODUCTIVIDAD (EmpCodigo, Monto, Mes, Anio) VALUES (?, ?, ?, ?)`,
      [empCodigo, monto, mes, anio]
    );

    revalidatePath(`/empleados/${empCodigo}`);
    redirect(`/empleados/${empCodigo}`);
  } catch (error) {
    console.error("Error al asignar bono:", error);
  }
}

export default async function AsignarBonoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const [rows]: any = await pool.query(
    "SELECT EmpNombres, EmpApellidoPaterno FROM EMPLEADO WHERE EmpCodigo = ?",
    [codigo]
  );

  if (rows.length === 0) return redirect("/");
  const emp = rows[0];

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-xl mx-auto">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; Volver al tablero
        </Link>
        <h1 className="text-2xl font-bold mt-4">Asignar Bono de Productividad</h1>
        <p className="text-muted">
          Empleado: {emp.EmpNombres} {emp.EmpApellidoPaterno} ({codigo})
        </p>
      </div>

      <form action={asignarBonoAction} className="bg-surface border border-border p-6 rounded-xl">
        <input type="hidden" name="empCodigo" value={codigo} />
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Monto del Bono (S/.)</label>
          <input
            type="number"
            name="monto"
            defaultValue={300}
            className="w-full p-2 bg-surface border border-border rounded-md text-foreground"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Mes</label>
            <select name="mes" className="w-full p-2 bg-surface border border-border rounded-md text-foreground" required>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString('es-ES', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Año</label>
            <input
              type="number"
              name="anio"
              defaultValue={new Date().getFullYear()}
              className="w-full p-2 bg-surface border border-border rounded-md text-foreground"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
        >
          Confirmar Asignación de Bono
        </button>
      </form>
    </main>
  );
}
