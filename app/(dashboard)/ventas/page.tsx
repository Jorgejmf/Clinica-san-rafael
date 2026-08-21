import { SalesView } from "@/components/sales-view"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function VentasPage() {
  const user = await getCurrentUser()
  const isDoctor = user?.role === "doctor" || user?.role === "doctora"

  // Fetch transactions, products, and patients in parallel
  const [
    { data: transactions },
    { data: products },
    { data: patients }
  ] = await Promise.all([
    supabase.from("transactions").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*").order("name", { ascending: true }),
    supabase.from("patients").select("*").order("first_name", { ascending: true })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl text-balance">
          Ventas, Gastos y Deudores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control de ingresos, egresos, medicamentos e historial de deudores de la clínica
          {isDoctor && <span className="ml-2 text-amber-600 font-medium">(Solo lectura)</span>}
        </p>
      </div>
      <SalesView
        initialTransactions={transactions || []}
        inventory={products || []}
        patients={patients || []}
        readOnly={isDoctor}
        userRole={user?.role || "secretaria"}
      />
    </div>
  )
}
