import Link from "next/link"
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  CalendarCheck,
  CircleCheck,
  CircleX,
  CalendarHeart,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react"

import {
  formatDateGT,
  formatTimeGT,
} from "@/lib/date-utils"

type Patient = {
  id: string
  first_name?: string | null
  last_name?: string | null
  no_expediente?: string | null
  status?: string | null
  estado?: string | null
}

type Appointment = {
  id: string
  scheduled_at: string
  reason?: string | null
  patients?: {
    first_name?: string | null
    last_name?: string | null
  } | null
}

type DashboardOverviewProps = {
  patients: Patient[]
  activePatients: number
  inactivePatients: number

  todayAppointmentsCount: number
  totalConsultations: number

  pendingCount: number
  confirmedCount: number
  completedCount: number
  cancelledCount: number

  upcomingAppointments: Appointment[]
  appointmentsError?: boolean

  consultationsDescription?: string
}

function getPatientName(patient: {
  first_name?: string | null
  last_name?: string | null
}) {
  return (
    [patient.first_name, patient.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "Paciente sin nombre"
  )
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function DashboardOverview({
  patients,
  activePatients,
  inactivePatients,

  todayAppointmentsCount,
  totalConsultations,

  pendingCount,
  confirmedCount,
  completedCount,
  cancelledCount,

  upcomingAppointments,
  appointmentsError = false,

  consultationsDescription = "Historial clínico total",
}: DashboardOverviewProps) {
  const recentPatients = patients.slice(0, 6)

  const metrics = [
    {
      title: "Total pacientes",
      value: patients.length,
      description: `${activePatients} activos · ${inactivePatients} inactivos`,
      icon: Users,
    },
    {
      title: "Citas de hoy",
      value: todayAppointmentsCount,
      description: appointmentsError
        ? "No se pudieron cargar las citas"
        : `${confirmedCount} confirmadas · ${pendingCount} pendientes`,
      icon: CalendarDays,
    },
    {
      title: "Consultas realizadas",
      value: totalConsultations,
      description: consultationsDescription,
      icon: ClipboardCheck,
    },
  ]

  const appointmentStates = [
    {
      label: "Pendientes",
      value: pendingCount,
      icon: Clock3,
    },
    {
      label: "Confirmadas",
      value: confirmedCount,
      icon: CalendarCheck,
    },
    {
      label: "Atendidas",
      value: completedCount,
      icon: CircleCheck,
    },
    {
      label: "Canceladas",
      value: cancelledCount,
      icon: CircleX,
    },
  ]

  return (
    <section
      className="overview"
      aria-label="Resumen de atención"
    >
      <div className="overview-heading">
        <span className="overview-eyebrow">
          <span className="overview-dot" />
          Resumen de atención
        </span>
      </div>

      {/* Indicadores principales */}
      <div className="overview-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon

          const hasError =
            metric.title === "Citas de hoy" &&
            appointmentsError

          return (
            <article
              className="overview-metric"
              key={metric.title}
            >
              <div className="overview-metric-header">
                <span>{metric.title}</span>

                <span className="overview-metric-icon">
                  <Icon aria-hidden="true" />
                </span>
              </div>

              <div className="overview-value">
                {hasError ? "—" : metric.value}
              </div>

              <p className="overview-description">
                {metric.description}
              </p>
            </article>
          )
        })}
      </div>

      {/* Estados compactos, sin duplicar tarjetas */}
      <section
        className="overview-states"
        aria-label="Estados de las citas de hoy"
      >
        <div className="overview-states-title">
          Citas de hoy
          <small>Desglose por estado</small>
        </div>

        {appointmentStates.map((state) => {
          const Icon = state.icon

          return (
            <div
              className="overview-state"
              key={state.label}
            >
              <span className="overview-state-label">
                <Icon aria-hidden="true" />
                {state.label}
              </span>

              <strong>
                {appointmentsError ? "—" : state.value}
              </strong>
            </div>
          )
        })}
      </section>

      {/* Paneles con altura independiente */}
      <div className="overview-panels">
        <section className="overview-panel">
          <header className="overview-panel-header">
            <div>
              <h2>Pacientes recientes</h2>
              <p>Últimos expedientes registrados</p>
            </div>

            <Link
              href="/pacientes"
              className="overview-link"
            >
              Ver todos ({patients.length})
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </header>

          <div className="overview-table-wrap">
            <table className="overview-table">
              <thead>
                <tr>
                  <th scope="col">
                    Paciente / expediente
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>

              <tbody>
                {recentPatients.map((patient) => {
                  const name = getPatientName(patient)

                  const code =
                    patient.no_expediente ||
                    patient.id.slice(0, 8).toUpperCase()

                  const rawStatus =
                    patient.status ||
                    patient.estado ||
                    "Activo"

                  const inactive =
                    rawStatus.trim().toLowerCase() ===
                    "inactivo"

                  return (
                    <tr key={patient.id}>
                      <td>
                        <div className="overview-person">
                          <span
                            className="overview-avatar"
                            aria-hidden="true"
                          >
                            {getInitials(name)}
                          </span>

                          <div>
                            <div className="overview-person-name">
                              {name}
                            </div>

                            <div className="overview-code">
                              #{code}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`overview-badge ${inactive
                              ? "overview-badge-inactive"
                              : ""
                            }`}
                        >
                          {rawStatus}
                        </span>
                      </td>

                      <td>
                        <Link
                          href={`/pacientes/${encodeURIComponent(
                            patient.id
                          )}`}
                          className="overview-link"
                          aria-label={`Ver expediente de ${name}`}
                        >
                          Ver ficha
                          <ArrowUpRight aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}

                {recentPatients.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="overview-no-patients"
                    >
                      Todavía no hay pacientes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="overview-panel-footer">
            Mostrando {recentPatients.length} de{" "}
            {patients.length} pacientes
          </footer>
        </section>

        <section className="overview-panel">
          <header className="overview-panel-header">
            <h2>Próximas citas</h2>

            {!appointmentsError && (
              <span className="overview-badge">
                {upcomingAppointments.length}
              </span>
            )}
          </header>

          {appointmentsError ? (
            <div
              className="overview-empty"
              role="status"
            >
              <h3>No pudimos cargar las citas</h3>
              <p>
                Actualiza la página para volver a
                intentarlo.
              </p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="overview-empty">
              <div className="overview-empty-icon">
                <CalendarHeart aria-hidden="true" />
              </div>

              <h3>
                Sin próximas citas
                <br />
                programadas.
              </h3>

              <p>
                Las nuevas citas aparecerán aquí
                cuando se agenden.
              </p>

              <Link
                href="/citas"
                className="overview-agenda"
              >
                Ver agenda completa
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="overview-appointments">
              {upcomingAppointments.map((appointment) => {
                const patientName = appointment.patients
                  ? getPatientName(appointment.patients)
                  : "Paciente sin nombre"

                return (
                  <article
                    className="overview-appointment"
                    key={appointment.id}
                  >
                    <div className="overview-appointment-time">
                      {formatTimeGT(
                        appointment.scheduled_at
                      )}

                      <small>
                        {formatDateGT(
                          appointment.scheduled_at
                        )}
                      </small>
                    </div>

                    <div className="overview-appointment-info">
                      <strong>{patientName}</strong>

                      <p>
                        {appointment.reason ||
                          "Motivo no registrado"}
                      </p>
                    </div>
                  </article>
                )
              })}

              <Link
                href="/citas"
                className="overview-agenda"
              >
                Ver agenda completa
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
