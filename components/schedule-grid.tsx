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
    color,
  }: {
    col: "doctor" | "doctora"
    doctorId: string
    hours: string[]
    color: "blue" | "pink"
  }) => {
    const c = {
      blue: {
        border: "border-blue-200",
        bg: "bg-blue-50/20",
        titleText: "text-blue-700",
        iconColor: "text-blue-600",
        timeBg: "bg-blue-50",
        timeText: "text-blue-700",
        timeBorder: "border-blue-200/50",
        slotBusy: "border-blue-300 bg-blue-100/90 text-blue-900",
        slotFree: "border-blue-200/60 bg-white hover:border-blue-300",
        addBorder: "border-blue-300",
        addText: "text-blue-700",
        addHover: "hover:bg-blue-600 hover:text-white",
        badgeBg: "bg-blue-600",
        innerBorder: "border-blue-200",
        innerBg: "bg-white/80",
        innerText: "text-blue-950",
        innerDetail: "text-muted-foreground",
        sepBorder: "border-blue-200/60",
        userIcon: "text-blue-600",
        userText: "text-blue-800",
        bookBtn: "border-blue-400 text-blue-700 hover:bg-blue-600 hover:text-white",
        inputBorder: "border-blue-300",
      },
      pink: {
        border: "border-pink-200",
        bg: "bg-pink-50/20",
        titleText: "text-pink-700",
        iconColor: "text-pink-600",
        timeBg: "bg-pink-50",
        timeText: "text-pink-700",
        timeBorder: "border-pink-200/50",
        slotBusy: "border-pink-300 bg-pink-100/90 text-pink-900",
        slotFree: "border-pink-200/60 bg-white hover:border-pink-300",
        addBorder: "border-pink-300",
        addText: "text-pink-700",
        addHover: "hover:bg-pink-600 hover:text-white",
        badgeBg: "bg-pink-600",
        innerBorder: "border-pink-200",
        innerBg: "bg-white/80",
        innerText: "text-pink-950",
        innerDetail: "text-muted-foreground",
        sepBorder: "border-pink-200/60",
        userIcon: "text-pink-600",
        userText: "text-pink-800",
        bookBtn: "border-pink-400 text-pink-700 hover:bg-pink-600 hover:text-white",
        inputBorder: "border-pink-300",
      },
    }[color]

    const newTime = col === "doctor" ? newDoctorTime : newDoctoraTime
    const setNewTime = col === "doctor" ? setNewDoctorTime : setNewDoctoraTime
    const title = col === "doctor" ? "Dr. Médico" : "Dra. Médica"

    return (
      <div className={`space-y-3 rounded-xl border ${c.border} ${c.bg} p-4`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${c.border} pb-2`}>
          <div className={`flex items-center gap-2 ${c.titleText} font-bold text-sm`}>
            <Stethoscope className={`h-4 w-4 ${c.iconColor}`} />
            <span>{title}</span>
          </div>
          {/* Add lapso */}
          <div className="flex items-center gap-1">
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHour(col)}
              className={`h-7 w-24 text-xs rounded-lg bg-white ${c.inputBorder}`}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => addHour(col)}
              className={`h-7 text-xs rounded-lg ${c.addBorder} ${c.addText} bg-white ${c.addHover} px-2`}
            >
              <Plus className="h-3 w-3 mr-0.5" /> Lapso
            </Button>
          </div>
        </div>

        {/* Slots */}
        <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
          {hours.map((time, idx) => {
            const apps = getSlotApps(time, doctorId)
            const count = apps.length
            const isEditing = editSlot?.col === col && editSlot?.idx === idx

            return (
              <div
                key={`${col}-${time}`}
                className={`flex flex-col gap-2 rounded-xl border p-3 transition-all text-xs ${
                  count > 0 ? c.slotBusy : c.slotFree
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Time badge — click to edit */}
                    {isEditing ? (
                      <input
                        type="time"
                        autoFocus
                        value={editSlot!.val}
                        onChange={(e) => setEditSlot({ ...editSlot!, val: e.target.value })}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit() }}
                        className={`font-mono font-bold text-xs ${c.timeText} ${c.timeBg} px-2 py-1 rounded-md border ${c.timeBorder} w-24 outline-none`}
                      />
                    ) : (
                      <button
                        type="button"
                        title="Clic para editar hora"
                        onClick={() => setEditSlot({ col, idx, val: time })}
                        className={`font-mono font-bold text-xs ${c.timeText} ${c.timeBg} px-2 py-1 rounded-md border ${c.timeBorder} hover:opacity-80`}
                      >
                        {time} hrs ✏️
                      </button>
                    )}

                    {count > 0 ? (
                      <span className={`flex items-center gap-1 font-bold ${c.userText}`}>
                        <Users className={`h-3.5 w-3.5 ${c.userIcon}`} />
                        {count} paciente{count !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Disponible</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onBookSlot(selectedDate, time, doctorId)}
                      className={`h-7 text-xs rounded-lg bg-white ${c.bookBtn} font-semibold`}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Agendar
                    </Button>
                    <button
                      type="button"
                      title="Eliminar lapso de la grilla"
                      onClick={() => removeHour(col, time)}
                      className="text-muted-foreground/50 hover:text-destructive p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Patient list in this slot with real deletion (Requerimiento 3) */}
                {count > 0 && (
                  <div className={`space-y-1.5 pt-1 border-t ${c.sepBorder}`}>
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className={`flex items-center justify-between ${c.innerBg} p-2 rounded-lg border ${c.innerBorder}`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold ${c.innerText}`}>
                              {app.patients
                                ? `${app.patients.first_name} ${app.patients.last_name}`
                                : "Paciente"}
                            </span>
                            {app.reason && (
                              <span className={`text-[11px] ${c.innerDetail} truncate`}>
                                — {app.reason}
                              </span>
                            )}
                          </div>
                          {app.patients && (
                            <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2.5 pt-0.5 font-medium">
                              {app.patients.phone && <span>📞 {app.patients.phone}</span>}
                              {app.patients.age ? (
                                <span>🎂 {app.patients.age} años</span>
                              ) : app.patients.birth_date ? (
                                <span>🎂 {new Date().getFullYear() - new Date(app.patients.birth_date).getFullYear()} años</span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className={`${c.badgeBg} text-white text-[9px] uppercase px-1.5 py-0.5`}>
                            {app.status}
                          </Badge>

                          {/* Botón de eliminación real de la cita (Requerimiento 3) */}
                          <button
                            type="button"
                            title="Eliminar cita de este paciente y liberar horario"
                            onClick={() => {
                              const pName = app.patients
                                ? `${app.patients.first_name} ${app.patients.last_name}`
                                : "este paciente"
                              if (confirm(`¿Está seguro de eliminar la cita de ${pName} a las ${time} hrs? El horario quedará disponible.`)) {
                                onDeleteAppointment?.(app.id)
                              }
                            }}
                            className="text-muted-foreground/60 hover:text-destructive p-1 rounded-md transition-colors"
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
            <p className="text-center text-xs text-muted-foreground py-6">
              No hay lapsos. Agrega uno con el botón de arriba.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Date Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-card-foreground">Grilla de Horarios</h3>
            <p className="text-xs text-muted-foreground">
              Múltiples pacientes por lapso · Horario en hora de Guatemala · Eliminación y liberación directa de cupos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-9 w-9 rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 bg-muted/20">
            <Calendar className="h-4 w-4 text-primary" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-7 border-none bg-transparent p-0 text-sm font-semibold focus-visible:ring-0"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="h-9 w-9 rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(getTodayGT())}
            className="h-9 text-xs rounded-xl"
          >
            Hoy ({formatDateGT(getTodayGT())})
          </Button>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SlotColumn col="doctor"   doctorId={DOCTOR_ID}   hours={doctorHours}   color="blue" />
        <SlotColumn col="doctora"  doctorId={DOCTORA_ID}  hours={doctoraHours}  color="pink" />
      </div>
    </div>
  )
}
