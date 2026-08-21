import { Users, CalendarDays, DollarSign, AlertTriangle } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { patients as mockPatients, appointments as mockAppointments, inventory as mockInventory } from "@/lib/data"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  // Fetch all data in parallel — silently ignore individual errors
  const [patientsRes, appointmentsRes, salesRes, inventoryRes] = await Promise.all([
    supabase.from("patients").select("*").order("created_at", { ascending: false }),
    supabase.from("appointments").select("*, patients(id, first_name, last_name)").order("scheduled_at", { ascending: false }),
    supabase.from("transactions").select("amount, type").eq("type", "income"),
    supabase.from("products").select("*"),
  ])

  // Use DB data when available, otherwise fall back to demo/mock data
  const dbPatients = patientsRes.data ?? []
  const dbAppointments = appointmentsRes.data ?? []
  const dbSales = salesRes.data ?? []
  const dbInventory = inventoryRes.data ?? []

  const patients    = dbPatients.length    > 0 ? dbPatients    : mockPatients
  const appointments = dbAppointments.length > 0 ? dbAppointments : mockAppointments
  const sales        = dbSales.length        > 0 ? dbSales        : []
  const inventory    = dbInventory.length    > 0 ? dbInventory    : mockInventory

  // Today in local YYYY-MM-DD format (avoids UTC timezone bug)
  const now   = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  // Filter today's appointments supporting both "scheduled_at" (DB) and "fecha" (mock)
  const todayAppointments = appointments.filter((a: any) => {
    const raw = a.scheduled_at ?? (a.fecha ? `${a.fecha}T00:00:00` : "")
    return raw.startsWith(today)
  })

  const confirmedToday = todayAppointments.filter((a: any) => {
    const st = (a.status ?? a.estado ?? "").toLowerCase()
    return st === "confirmed" || st === "confirmada" || st === "completed" || st === "atendida"
  }).length

  // Low stock — supports DB fields (stock / min_stock) AND mock fields (cantidad / minimo)
  const lowStockItems = inventory.filter((i: any) => {
    const current = i.stock    ?? i.cantidad ?? 0
    const minimum  = i.min_stock ?? i.minimo   ?? 5
    return current <= minimum
  })

  const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0)

  const digitalizedCount = patients.filter(
    (p: any) => p.digitalizado || p.digitalized
  ).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl text-balance">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenido al sistema de gestión de Clínica San Rafael
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pacientes"
          value={patients.length}
          icon={Users}
          description={`${digitalizedCount} expedientes digitalizados`}
        />
        <StatCard
          title="Citas de Hoy"
          value={todayAppointments.length}
          icon={CalendarDays}
          description={`${confirmedToday} confirmadas / atendidas`}
        />
        <StatCard
          title="Ventas Recientes"
          value={`Q${totalSales.toLocaleString("es-GT")}`}
          icon={DollarSign}
          description={`${sales.length} transacciones`}
        />
        <StatCard
          title="Alertas Inventario"
          value={lowStockItems.length}
          icon={AlertTriangle}
          description="Productos con stock bajo"
          variant="warning"
        />
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent patients */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-card-foreground">
              Pacientes Recientes
            </h2>
            <Link href="/pacientes" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Expediente</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {patients.slice(0, 6).map((p: any) => {
                  // Support both DB schema (first_name / last_name) and mock (nombre)
                  const name = p.first_name
                    ? `${p.first_name} ${p.last_name ?? ""}`.trim()
                    : (p.nombre ?? "Paciente")
                  const code = p.no_expediente ?? p.id ?? "-"
                  const codeDisplay = String(code).length > 12 ? String(code).substring(0, 8).toUpperCase() : code
                  const status = p.estado ?? p.status ?? "Activo"
                  return (
                    <tr key={p.id ?? name} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{codeDisplay}</td>
                      <td className="px-5 py-3 font-medium text-card-foreground">{name}</td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="default"
                          className={`text-xs ${
                            String(status).toLowerCase() === "inactivo"
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {status}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No hay pacientes registrados aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-card-foreground">
              Próximas Citas
            </h2>
            <Link href="/citas" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-border">
            {appointments.slice(0, 6).map((a: any) => {
              // Patient name from DB join or mock field
              const patientName = a.patients
                ? `${a.patients.first_name} ${a.patients.last_name ?? ""}`.trim()
                : (a.pacienteNombre ?? "Paciente")

              // Date/time — support both DB ISO and mock separate fecha+hora
              const rawDt = a.scheduled_at
                ?? (a.fecha ? `${a.fecha}T${a.hora ?? "00:00"}:00` : "")
              let displayDate = rawDt
              try {
                if (rawDt) {
                  const d = new Date(rawDt)
                  if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleDateString("es-GT", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                    })
                  }
                }
              } catch {}

              const motivo = a.reason ?? a.motivo ?? ""
              const status = a.status ?? a.estado ?? "pending"

              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">{patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {displayDate}{motivo ? ` · ${motivo}` : ""}
                    </p>
                  </div>
                  <AppointmentBadge estado={status} />
                </div>
              )
            })}
            {appointments.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No hay citas registradas aún
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-destructive/20 px-5 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-base font-semibold text-card-foreground">
              Alertas de Inventario — {lowStockItems.length} producto{lowStockItems.length !== 1 ? "s" : ""} con stock bajo
            </h2>
          </div>
          <div className="divide-y divide-destructive/10">
            {lowStockItems.map((item: any) => {
              const itemName    = item.nombre ?? item.name ?? "Producto"
              const current     = item.stock    ?? item.cantidad ?? 0
              const minimum     = item.min_stock ?? item.minimo   ?? 5
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-medium text-card-foreground">{itemName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-mono">
                      {current} <span className="text-muted-foreground/60">/ {minimum} mín.</span>
                    </span>
                    <Badge variant="destructive" className="text-xs">Stock Bajo</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function AppointmentBadge({ estado }: { estado: string }) {
  if (!estado) return null
  const st = estado.toLowerCase()
  const map: Record<string, string> = {
    pending:    "bg-amber-100 text-amber-700",
    pendiente:  "bg-amber-100 text-amber-700",
    confirmed:  "bg-primary/15 text-primary",
    confirmada: "bg-primary/15 text-primary",
    completed:  "bg-blue-100 text-blue-700",
    atendida:   "bg-blue-100 text-blue-700",
    cancelled:  "bg-destructive/15 text-destructive",
    cancelada:  "bg-destructive/15 text-destructive",
  }
  const labels: Record<string, string> = {
    pending: "Pendiente", confirmed: "Confirmada",
    completed: "Atendida", cancelled: "Cancelada",
  }
  return (
    <Badge variant="secondary" className={`shrink-0 text-xs ${map[st] ?? "bg-secondary"}`}>
      {labels[st] ?? estado}
    </Badge>
  )
}
