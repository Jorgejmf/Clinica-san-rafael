import { InventoryView } from "@/components/inventory-view"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function InventarioPage() {
  const user = await getCurrentUser()
  const isDoctor = user?.role === "doctor" || user?.role === "doctora"

  const { data: inventory } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl text-balance">
          Inventario
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control de productos, medicamentos y precios de venta
          {isDoctor && <span className="ml-2 text-amber-600 font-medium">(Solo lectura)</span>}
        </p>
      </div>
      <InventoryView
        initialInventory={inventory || []}
        readOnly={isDoctor}
        userRole={user?.role || "secretaria"}
      />
    </div>
  )
}
