"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, Clock, Stethoscope, ChevronLeft, ChevronRight, Users, Trash2 } from "lucide-react"
import { DOCTOR_ID, DOCTORA_ID } from "@/lib/constants"
import { getTodayGT, formatDateGT } from "@/lib/date-utils"

type Appointment = {
  id: string
  patient_id?: string
  doctor_id: string | null
  scheduled_at: string
  duration_minutes?: number
  status: string
  reason: string
  is_emergency?: boolean
  patients: {
    first_name: string
    last_name: string
    age?: number
    birth_date?: string
    phone?: string
  } | null
}

const DEFAULT_HOURS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
]

export function ScheduleGrid({
  appointments,
  onBookSlot,
  onDeleteAppointment,
}: {
  appointments: Appointment[]
  onBookSlot: (date: string, time: string, doctorId: string) => void
  onDeleteAppointment?: (id: string) => void
}) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayGT())

  // Editable time slots for each doctor — start with defaults
  const [doctorHours, setDoctorHours]   = useState<string[]>([...DEFAULT_HOURS])
  const [doctoraHours, setDoctoraHours] = useState<string[]>([...DEFAULT_HOURS])

  // New time inputs
  const [newDoctorTime, setNewDoctorTime]   = useState("")
  const [newDoctoraTime, setNewDoctoraTime] = useState("")

  // Edit-in-place state: { index, doctorKey, value }
  const [editSlot, setEditSlot] = useState<{ idx: number; col: "doctor" | "doctora"; val: string } | null>(null)

  const changeDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number)
    const dateObj = new Date(y, m - 1, d)
    dateObj.setDate(dateObj.getDate() + days)
    const nextY = dateObj.getFullYear()
    const nextM = String(dateObj.getMonth() + 1).padStart(2, "0")
    const nextD = String(dateObj.getDate()).padStart(2, "0")
    setSelectedDate(`${nextY}-${nextM}-${nextD}`)
  }

  const dayAppointments = appointments.filter((a) => {
    if (!a.scheduled_at) return false
    return a.scheduled_at.startsWith(selectedDate) && !a.is_emergency
  })

  const getSlotApps = (time: string, doctorId: string) =>
    dayAppointments.filter((a) => {
      const t = a.scheduled_at.split("T")[1]?.substring(0, 5)
      return a.doctor_id === doctorId && t === time
    })

  const addHour = (col: "doctor" | "doctora") => {
    const val = col === "doctor" ? newDoctorTime : newDoctoraTime
    if (!val) return
    if (col === "doctor") {
      if (!doctorHours.includes(val)) setDoctorHours([...doctorHours, val].sort())
      setNewDoctorTime("")
    } else {
      if (!doctoraHours.includes(val)) setDoctoraHours([...doctoraHours, val].sort())
      setNewDoctoraTime("")
    }
  }

  const removeHour = (col: "doctor" | "doctora", time: string) => {
    if (col === "doctor")   setDoctorHours(doctorHours.filter((h) => h !== time))
    else                    setDoctoraHours(doctoraHours.filter((h) => h !== time))
  }

  const saveEdit = () => {
    if (!editSlot) return
    const { idx, col, val } = editSlot
    if (!val) { setEditSlot(null); return }
    if (col === "doctor") {
      const next = [...doctorHours]
      next[idx] = val
      setDoctorHours(next.sort())
    } else {
      const next = [...doctoraHours]
      next[idx] = val
      setDoctoraHours(next.sort())
    }
    setEditSlot(null)
  }

  const SlotColumn = ({
    col,
    doctorId,
    hours,
  }: {
    col: "doctor" | "doctora"
    doctorId: string
    hours: string[]
  }) => {
    const newTime = col === "doctor" ? newDoctorTime : newDoctoraTime
    const title = col === "doctor" ? "Dr. Médico" : "Dra. Médica"

    return (
      <div className="flex-1 min-w-[300px]">
        {/* Doctor Header */}
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#e2ebd7]">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 px-2 rounded-md bg-[#e3f0d7] text-[#2d5d28] font-bold text-xs uppercase tracking-wider">
              {col === "doctor" ? "DR" : "DRA"}
            </span>
            <span className="font-bold text-sm text-[#194d32]">{title}</span>
          </div>

          {/* Add lapso */}
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={newTime}
              onChange={(e) => (col === "doctor" ? setNewDoctorTime(e.target.value) : setNewDoctoraTime(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && addHour(col)}
              className="h-7 w-20 px-1.5 text-xs font-semibold rounded-md border border-[#dfe8d5] bg-white text-[#2d5d28] focus:outline-none focus:ring-1 focus:ring-[#82b975]"
            />
            <button
              type="button"
              onClick={() => addHour(col)}
              className="h-7 px-2 text-xs font-bold rounded-md bg-[#eaf6e1] text-[#2e6328] hover:bg-[#d8eed0] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Lapso
            </button>
          </div>
        </div>

        {/* Slots List */}
        <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
          {hours.map((time, idx) => {
            const apps = getSlotApps(time, doctorId)
            const count = apps.length
            const isEditing = editSlot?.col === col && editSlot?.idx === idx

            return (
              <div
                key={`${col}-${time}`}
                className="rounded-xl border border-[#e4ecdc] bg-white p-2.5 shadow-2xs hover:border-[#ccdcb8] transition-all"
              >
                {/* Cabecera del lapso: Hora, Estado y Botones */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Time edit/view */}
                    {isEditing ? (
                      <input
                        type="time"
                        autoFocus
                        value={editSlot!.val}
                        onChange={(e) => setEditSlot({ ...editSlot!, val: e.target.value })}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit() }}
                        className="h-6 w-20 px-1 text-xs font-bold rounded border border-[#82b975] outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        title="Clic para editar hora"
                        onClick={() => setEditSlot({ col, idx, val: time })}
                        className="text-xs font-extrabold text-[#2d5d28] hover:text-[#184515] bg-[#f2f8ed] px-2 py-0.5 rounded-md hover:bg-[#e4f1dc] transition-colors cursor-pointer"
                      >
                        {time} hrs
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${count > 0 ? "bg-[#388e3c]" : "bg-[#81c784]"}`} />
                      <span className={`text-xs font-semibold ${count > 0 ? "text-[#2e6328]" : "text-[#789669]"}`}>
                        {count > 0 ? `${count} paciente${count !== 1 ? "s" : ""}` : "Disponible"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onBookSlot(selectedDate, time, doctorId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-[#20591b] bg-[#e6f4df] hover:bg-[#d6eed0] transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Agendar
                    </button>
                    <button
                      type="button"
                      title="Eliminar lapso de la grilla"
                      onClick={() => removeHour(col, time)}
                      className="p-1 rounded-md text-[#9bb18d] hover:text-[#c04e38] hover:bg-[#fdf0ec] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Patient list inside slot */}
                {count > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#edf4e6] space-y-1.5">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#f7faf4] border border-[#e8f1df]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                            <span className="font-bold text-xs text-[#194d32]">
                              {app.patients
                                ? `${app.patients.first_name} ${app.patients.last_name}`
                                : "Paciente"}
                            </span>
                            {app.reason && (
                              <span className="text-[11px] text-[#557b49] truncate max-w-[200px]">
                                — {app.reason}
                              </span>
                            )}
                          </div>
                          {app.patients && (
                            <div className="text-[10px] text-[#789669] flex items-center gap-3 mt-0.5 font-medium">
                              {app.patients.phone && <span>📞 {app.patients.phone}</span>}
                              {app.patients.age ? (
                                <span>{app.patients.age} años</span>
                              ) : app.patients.birth_date ? (
                                <span>{new Date().getFullYear() - new Date(app.patients.birth_date).getFullYear()} años</span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className="bg-[#e0eed5] text-[#2b5924] hover:bg-[#e0eed5] border-0 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 shadow-none">
                            {app.status}
                          </Badge>
                          <button
                            type="button"
                            title="Eliminar cita y liberar horario"
                            onClick={() => {
                              const pName = app.patients
                                ? `${app.patients.first_name} ${app.patients.last_name}`
                                : "este paciente"
                              if (confirm(`¿Está seguro de eliminar la cita de ${pName} a las ${time} hrs? El horario quedará disponible.`)) {
                                onDeleteAppointment?.(app.id)
                              }
                            }}
                            className="p-1 rounded-md text-[#9bb18d] hover:text-[#c04e38] hover:bg-[#fdf0ec] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {hours.length === 0 && (
            <p className="sr-agenda-empty">
              No hay lapsos configurados. Agrega uno arriba.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="sr-agenda animate-fade-in-up">
      {/* Barra superior / Toolbar */}
      <div className="sr-agenda-toolbar">
        <div>
          <h2>Grilla de Horarios</h2>
        </div>

        <div className="sr-agenda-datebar">
          <button
            type="button"
            onClick={() => changeDate(-1)}
            title="Día anterior"
          >
            <ChevronLeft />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            type="button"
            onClick={() => changeDate(1)}
            title="Día siguiente"
          >
            <ChevronRight />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(getTodayGT())}
            className="sr-agenda-today"
          >
            Hoy ({formatDateGT(getTodayGT())})
          </button>
        </div>
      </div>

      {/* Two columns */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-5 bg-[#fbfdf9]">
        <SlotColumn col="doctor"   doctorId={DOCTOR_ID}   hours={doctorHours} />
        <SlotColumn col="doctora"  doctorId={DOCTORA_ID}  hours={doctoraHours} />
      </div>

      {/* Footer */}
      <div className="sr-agenda-footer">
        <span>Clínica Médica Familiar San Rafael · Agenda Médica</span>
        <div className="sr-agenda-pagination">
          <span>{dayAppointments.length} cita{dayAppointments.length !== 1 ? "s" : ""} programada{dayAppointments.length !== 1 ? "s" : ""} para esta fecha</span>
        </div>
      </div>
    </div>
  )
}
