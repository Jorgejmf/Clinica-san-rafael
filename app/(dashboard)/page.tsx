import { Plus } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { getTodayGT, formatDateGT, formatTimeGT, isTodayGT } from "@/lib/date-utils"
import { MotivationalMessage } from "@/components/motivational-message"
import { DashboardOverview } from "@/components/dashboard-overview"
import { InventoryAlertSummary } from "@/components/inventory-alert-summary"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()
  const isDoctor = currentUser?.role === "doctor" || currentUser?.role === "doctora"
  const doctorId = currentUser?.doctorId

  // Fetch real data from Supabase in parallel — 100% DB-driven
  let appointmentsQuery = supabase
    .from("appointments")
    .select("*, patients(id, first_name, last_name, phone, no_expediente, birth_date, age)")
    .order("scheduled_at", { ascending: true })

  if (isDoctor && doctorId) {
    appointmentsQuery = appointmentsQuery.eq("doctor_id", doctorId)
  }

  let recordsQuery = supabase.from("medical_records").select("id, created_at, doctor_id")
  if (isDoctor && doctorId) {
    recordsQuery = recordsQuery.eq("doctor_id", doctorId)
  }

  const [patientsRes, appointmentsRes, recordsRes, inventoryRes] = await Promise.all([
    supabase.from("patients").select("*").order("created_at", { ascending: false }),
    appointmentsQuery,
    recordsQuery,
    supabase.from("products").select("*"),
  ])

  const patients = patientsRes.data ?? []
  const appointments = appointmentsRes.data ?? []
  const medicalRecords = recordsRes.data ?? []
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

  // Upcoming appointments list
  const now = Date.now()
  const upcomingAppointments = appointments
    .filter((a: any) => {
      const st = (a.status || a.estado || "pending").toLowerCase()
      const isActiveStatus = st === "pending" || st === "pendiente" || st === "confirmed" || st === "confirmada"
      const scheduledTime = Date.parse(a.scheduled_at || "")
      return isActiveStatus && Number.isFinite(scheduledTime) && scheduledTime >= now
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.scheduled_at || 0).getTime()
      const timeB = new Date(b.scheduled_at || 0).getTime()
      return timeA - timeB
    })
    .slice(0, 8)

  const todayGT = getTodayGT()
  const rawDate = formatDateGT(todayGT, { includeWeekday: true, monthFormat: "long" })
  const cleanDate = rawDate
    .replace(/,/g, "")
    .replace(/ de \d{4}$/, "")
    .trim()
  const displayDate = cleanDate.charAt(0).toUpperCase() + cleanDate.slice(1)

  // Logic for Next Appointment Card
  const nextAppointmentError =
    Boolean(appointmentsRes.error) ||
    Boolean(isDoctor && !doctorId)

  const nextAppointment = nextAppointmentError
    ? null
    : appointments
        .filter((appointment: any) => {
          const status = String(
            appointment.status || appointment.estado || ""
          )
            .trim()
            .toLowerCase()

          const scheduledTime = Date.parse(
            appointment.scheduled_at || ""
          )

          return (
            ["pending", "pendiente", "confirmed", "confirmada"].includes(status) &&
            Number.isFinite(scheduledTime) &&
            scheduledTime >= now
          )
        })
        .sort(
          (a: any, b: any) =>
            Date.parse(a.scheduled_at) -
            Date.parse(b.scheduled_at)
        )[0] ?? null

  const nextPatient = nextAppointment?.patients

  const nextPatientName = [
    nextPatient?.first_name,
    nextPatient?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || (nextAppointment?.notes || "Paciente sin nombre registrado")

  const nextPatientInitials = nextPatientName
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()

  const nextPatientHref = nextPatient?.id
    ? `/pacientes/${encodeURIComponent(nextPatient.id)}`
    : (nextAppointment ? "/citas" : null)

  // Personalized greeting based on role
  let userGreeting = "Buen día, equipo."
  if (currentUser?.role === "doctor") {
    userGreeting = "Bienvenido, Doctor."
  } else if (currentUser?.role === "doctora") {
    userGreeting = "Bienvenida, Doctora."
  } else if (currentUser?.role === "admin") {
    userGreeting = "Bienvenido, Administrador."
  } else if (currentUser?.role === "secretaria") {
    userGreeting = "Bienvenida, Secretaría."
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. BREADCRUMB */}
      <div className="topbar">
        <div className="breadcrumb">
          <span>Mi clínica</span>
          <span>/</span>
          <strong>Resumen general</strong>
        </div>
      </div>

      {/* 2. PAGE HEADING */}
      <div className="page-heading">
        <div>
          <h1 className="page-title">{userGreeting}</h1>
          <p className="subtitle">
            {displayDate}
          </p>
        </div>

        <Link href="/citas" className="button-primary">
          <Plus className="h-4 w-4 stroke-[2.8]" />
          <span>Citas</span>
        </Link>
      </div>

      {/* 3. HERO BANNER CARD */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-status">
            <span className="status-dot" aria-hidden="true" />
            SAN RAFAEL · GESTIÓN CLÍNICA
          </div>

          <MotivationalMessage />
        </div>

        <div className="hero-footer">
          <div className="team" aria-hidden="true">
            <span>SR</span>
            <span>SR</span>
            <span>SR</span>
          </div>
          <p className="m-0 font-medium">Personas al centro. Todo conectado.</p>
        </div>

        {/* Ilustración 3D y órbitas */}
        <div className="art" aria-hidden="true">
          <div className="orbit" />
          <div className="orbit" />
          <div className="orbit" />
          <div className="orbit-dashed" />

          <div className="cross-float">
            <div className="medical-cross" />
          </div>

          <div className="sphere" />
        </div>
      </section>

      {/* 4. PRÓXIMA CONSULTA */}
      <section className="next-card">
        <p className="next-label">Tu próxima consulta</p>

        {nextAppointmentError ? (
          <div className="next-empty" role="status">
            <h3>No pudimos cargar la próxima consulta</h3>
            <p>Actualiza la página para volver a intentarlo.</p>
          </div>
        ) : nextAppointment ? (
          <>
            {nextPatientHref && (
              <Link
                href={nextPatientHref}
                className="next-arrow"
                aria-label={`Abrir expediente de ${nextPatientName}`}
              >
                <span aria-hidden="true">↗</span>
              </Link>
            )}

            <div className="appointment-info">
              <div className="appointment-time">
                {formatTimeGT(nextAppointment.scheduled_at)}
                <small>
                  {isTodayGT(nextAppointment.scheduled_at)
                    ? "hoy"
                    : formatDateGT(nextAppointment.scheduled_at)}
                </small>
              </div>

              <div className="patient">
                <div className="patient-avatar" aria-hidden="true">
                  {nextPatientInitials}
                </div>

                <div>
                  <strong>{nextPatientName}</strong>
                  <p>
                    {nextAppointment.reason || "Motivo de consulta no registrado"}
                  </p>
                </div>
              </div>
            </div>

            {nextPatientHref ? (
              <Link
                href={nextPatientHref}
                className="button-primary open-record"
              >
                <span>Abrir expediente</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <p className="next-description">
                Esta cita no tiene un expediente disponible.
              </p>
            )}
          </>
        ) : (
          <div className="next-empty">
            <span className="next-empty-icon" aria-hidden="true">
              ✓
            </span>

            <h3>No hay consultas pendientes</h3>

            <p>
              Cuando registres una cita pendiente con fecha futura, aparecerá aquí.
            </p>

            <Link
              href="/citas"
              className="button-primary open-record"
            >
              <span>Ir a citas</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>

      {/* 5. RESUMEN DE ATENCIÓN (DASHBOARD OVERVIEW) */}
      <DashboardOverview
        patients={patients}
        activePatients={activePatients}
        inactivePatients={inactivePatients}
        todayAppointmentsCount={todayAppointments.length}
        totalConsultations={medicalRecords.length}
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
        upcomingAppointments={upcomingAppointments}
        appointmentsError={Boolean(appointmentsRes.error)}
        consultationsDescription={isDoctor ? "En tu expediente médico" : "Historial clínico total"}
      />

      {/* Resumen compacto de alertas de inventario */}
      {!isDoctor && (
        <InventoryAlertSummary
          lowStockItems={lowStockItems}
          hasError={Boolean(inventoryRes.error)}
        />
      )}
    </div>
  )
}

