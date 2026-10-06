import { Users, CalendarDays, DollarSign, AlertTriangle, Stethoscope, CheckCircle2, Clock, XCircle, FileText } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { getTodayGT, formatDateGT, formatTimeGT, isTodayGT, isFutureGT } from "@/lib/date-utils"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()
  const isDoctor = currentUser?.role === "doctor" || currentUser?.role === "doctora"
  const doctorId = currentUser?.doctorId

  // Fetch real data from Supabase in parallel — 100% DB-driven
  let appointmentsQuery = supabase
    .from("appointments")
    .select("*, patients(id, first_name, last_name, phone, no_expediente)")
    .order("scheduled_at", { ascending: true })

  if (isDoctor && doctorId) {
    appointmentsQuery = appointmentsQuery.eq("doctor_id", doctorId)
  }

  let recordsQuery = supabase.from("medical_records").select("id, created_at, doctor_id")
  if (isDoctor && doctorId) {
    recordsQuery = recordsQuery.eq("doctor_id", doctorId)
  }

  const [patientsRes, appointmentsRes, recordsRes, salesRes, inventoryRes] = await Promise.all([
    supabase.from("patients").select("*").order("created_at", { ascending: false }),
    appointmentsQuery,
    recordsQuery,
    supabase.from("transactions").select("amount, type").eq("type", "income"),
    supabase.from("products").select("*"),
  ])

  const patients = patientsRes.data ?? []
  const appointments = appointmentsRes.data ?? []
  const medicalRecords = recordsRes.data ?? []
  const sales = salesRes.data ?? []
  const inventory = inventoryRes.data ?? []

  // Active / Inactive patients
  const activePatients = patients.filter((p: any) => (p.status || p.estado || "Activo") !== "Inactivo").length
  const inactivePatients = patients.length - activePatients

  // Today's appointments in Guatemala timezone (America/Guatemala)
  const todayAppointments = appointments.filter((a: any) => isTodayGT(a.scheduled_at))

  // Appointment counts by status
  const pendingCount = todayAppointments.filter((a: any) => {
    const st = (a.status || a.estado || "").toLowerCase()
    return st === "pending" || st === "pendiente"
  }).length

  const confirmedCount = todayAppointments.filter((a: any) => {
    const st = (a.status || a.estado || "").toLowerCase()
    return st === "confirmed" || st === "confirmada"
  }).length

  const completedCount = todayAppointments.filter((a: any) => {
    const st = (a.status || a.estado || "").toLowerCase()
    return st === "completed" || st === "atendida" || st === "attended"
  }).length

  const cancelledCount = todayAppointments.filter((a: any) => {
    const st = (a.status || a.estado || "").toLowerCase()
    return st === "cancelled" || st === "cancelada"
  }).length

  // Low stock inventory
  const lowStockItems = inventory.filter((i: any) => {
    const current = i.stock ?? i.cantidad ?? 0
    const minimum = i.min_stock ?? i.minimo ?? 5
    return current <= minimum
  })

  // PRÓXIMAS CITAS (REQUERIMIENTO 6):
  const upcomingAppointments = appointments
    .filter((a: any) => {
      const st = (a.status || a.estado || "pending").toLowerCase()
      const isActiveStatus = st === "pending" || st === "pendiente" || st === "confirmed" || st === "confirmada"
      if (!isActiveStatus) return false
      return isFutureGT(a.scheduled_at)
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.scheduled_at || 0).getTime()
      const timeB = new Date(b.scheduled_at || 0).getTime()
      return timeA - timeB
    })
    .slice(0, 8)

  const todayGT = getTodayGT()

  return (
    <div className="space-y-8">
      {/* Header with logo in crisp container */}
      <div className="animate-fade-in-down flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
        <div className="flex items-center gap-4">
          {/* Logo container with white backdrop & subtle glow */}
          <div className="relative h-14 w-14 rounded-2xl bg-white p-1.5 shadow-md shadow-black/5 ring-1 ring-border flex-shrink-0 transition-transform duration-300 hover:scale-105">
            <Image
              src="/logo.png"
              alt="Clínica San Rafael"
              fill
              className="object-contain p-0.5"
              sizes="56px"
              priority
            />
            <div className="absolute inset-0 rounded-2xl bg-white/40 blur-md -z-10" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl text-balance">
              Dashboard — Clínica San Rafael
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDoctor
                ? `Vista personalizada para ${currentUser?.displayName || "Médico"}`
                : "Panel general del sistema de gestión médica"}
              {" · "}
              <span className="font-semibold text-primary">
                Hoy: {formatDateGT(todayGT, { includeWeekday: true, monthFormat: "long" })}
              </span>
            </p>
          </div>
        </div>

        {isDoctor && (
          <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold py-1.5 px-3.5 self-start sm:self-auto shadow-sm">
            <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
            {currentUser?.displayName}
          </Badge>
        )}
      </div>

      {/* Main Stat Cards */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pacientes"
          value={patients.length}
          icon={Users}
          description={`${activePatients} activos · ${inactivePatients} inactivos`}
        />
        <StatCard
          title="Citas de Hoy"
          value={todayAppointments.length}
          icon={CalendarDays}
          description={`${confirmedCount} confirmadas · ${pendingCount} pendientes`}
        />
        <StatCard
          title="Consultas Realizadas"
          value={medicalRecords.length}
          icon={FileText}
          description={isDoctor ? "En tu expediente médico" : "Historial clínico total"}
        />
        <StatCard
          title={isDoctor ? "Citas Atendidas Hoy" : "Alertas Inventario"}
          value={isDoctor ? completedCount : lowStockItems.length}
          icon={isDoctor ? CheckCircle2 : AlertTriangle}
          description={isDoctor ? `${cancelledCount} canceladas hoy` : "Productos con stock bajo"}
          variant={isDoctor ? "default" : lowStockItems.length > 0 ? "warning" : "default"}
        />
      </div>

      {/* Citas de hoy: Desglose por estados */}
      <div className="stagger-children grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="group card-hover-lift rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 shadow-sm transition-all duration-300 dark:bg-amber-950/20 dark:border-amber-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase dark:text-amber-300">Pendientes</span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900 dark:text-amber-200 transition-colors duration-300 group-hover:text-amber-700">{pendingCount}</p>
          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Por atender hoy</span>
        </div>

        <div className="group card-hover-lift rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-sm transition-all duration-300 dark:bg-emerald-950/20 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase dark:text-emerald-300">Confirmadas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-200 transition-colors duration-300 group-hover:text-emerald-700">{confirmedCount}</p>
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Asistencia confirmada</span>
        </div>

        <div className="group card-hover-lift rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 shadow-sm transition-all duration-300 dark:bg-blue-950/20 dark:border-blue-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase dark:text-blue-300">Atendidas</span>
            <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-900 dark:text-blue-200 transition-colors duration-300 group-hover:text-blue-700">{completedCount}</p>
          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">Consulta finalizada</span>
        </div>

        <div className="group card-hover-lift rounded-2xl border border-red-200/80 bg-red-50/60 p-4 shadow-sm transition-all duration-300 dark:bg-red-950/20 dark:border-red-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 uppercase dark:text-red-300">Canceladas</span>
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-900 dark:text-red-200 transition-colors duration-300 group-hover:text-red-700">{cancelledCount}</p>
          <span className="text-[11px] font-medium text-red-700 dark:text-red-400">Canceladas de hoy</span>
        </div>
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent patients */}
        <div className="animate-fade-in-up rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
            <h2 className="text-base font-semibold text-card-foreground">
              Pacientes Registrados Recientemente
            </h2>
            <Link href="/pacientes" className="text-sm font-semibold text-primary hover:underline transition-colors duration-200 hover:text-primary/80">
              Ver todos ({patients.length})
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-5 py-3 text-left">Expediente</th>
                  <th className="px-5 py-3 text-left">Nombre</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients.slice(0, 6).map((p: any) => {
                  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Paciente"
                  const code = p.no_expediente || p.id.substring(0, 8).toUpperCase()
                  const status = p.status || p.estado || "Activo"

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-all duration-200 group">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-primary">#{code}</td>
                      <td className="px-5 py-3 font-medium text-card-foreground">{name}</td>
                      <td className="px-5 py-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold uppercase shadow-none ${
                            status === "Activo"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/pacientes/${p.id}`}>
                          <span className="text-xs font-bold text-primary hover:underline transition-all duration-200 group-hover:text-primary/80">Ver ficha</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No hay pacientes registrados en la base de datos aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="animate-fade-in-up rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
            <h2 className="text-base font-semibold text-card-foreground">
              Próximas Citas ({upcomingAppointments.length})
            </h2>
            <Link href="/citas" className="text-sm font-semibold text-primary hover:underline transition-colors duration-200 hover:text-primary/80">
              Ver agenda completa
            </Link>
          </div>
          <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
            {upcomingAppointments.map((a: any) => {
              const patientName = a.patients
                ? `${a.patients.first_name} ${a.patients.last_name}`
                : a.notes || "Paciente sin nombre"

              const status = a.status || a.estado || "pending"

              return (
                <div key={a.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-all duration-200">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-card-foreground">{patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDateGT(a.scheduled_at)} a las {formatTimeGT(a.scheduled_at)} hrs
                      {a.reason ? ` · ${a.reason}` : ""}
                    </p>
                  </div>
                  <AppointmentBadge estado={status} />
                </div>
              )
            })}
            {upcomingAppointments.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-medium">No hay próximas citas programadas</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Las nuevas citas agendadas para fechas u horas futuras aparecerán aquí.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && !isDoctor && (
        <div className="animate-fade-in-up rounded-2xl border border-destructive/30 bg-destructive/5 shadow-sm overflow-hidden" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 border-b border-destructive/20 px-5 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-base font-semibold text-card-foreground">
              Alertas de Inventario — {lowStockItems.length} producto{lowStockItems.length !== 1 ? "s" : ""} con stock bajo
            </h2>
          </div>
          <div className="divide-y divide-destructive/10">
            {lowStockItems.map((item: any) => {
              const itemName = item.nombre || item.name || "Producto"
              const current = item.stock ?? item.cantidad ?? 0
              const minimum = item.min_stock ?? item.minimo ?? 5
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-destructive/5 transition-colors duration-200">
                  <span className="text-sm font-medium text-card-foreground">{itemName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-mono">
                      {current} <span className="text-muted-foreground/60">/ {minimum} mín.</span>
                    </span>
                    <Badge variant="destructive" className="text-xs font-bold">Stock Bajo</Badge>
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
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    pendiente: "bg-amber-100 text-amber-800 border-amber-300",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300",
    confirmada: "bg-emerald-100 text-emerald-800 border-emerald-300",
    completed: "bg-blue-100 text-blue-800 border-blue-300",
    atendida: "bg-blue-100 text-blue-800 border-blue-300",
    attended: "bg-blue-100 text-blue-800 border-blue-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    cancelada: "bg-red-100 text-red-800 border-red-300",
  }
  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Atendida",
    attended: "Atendida",
    cancelled: "Cancelada",
  }
  return (
    <Badge variant="outline" className={`shrink-0 text-xs font-bold ${map[st] ?? "bg-secondary"}`}>
      {labels[st] ?? estado}
    </Badge>
  )
}
