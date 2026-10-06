"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  CalendarDays,
  List,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit,
  Trash2,
  Stethoscope,
  UserCheck,
  XCircle,
  LayoutGrid,
  CheckCircle2,
  Check,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DOCTOR_ID, DOCTORA_ID } from "@/lib/constants"
import { FichaClinicaForm } from "./ficha-clinica-form"
import { ScheduleGrid } from "./schedule-grid"
import { getTodayGT, formatDateGT, formatTimeGT, formatDateTimeGT, isTodayGT } from "@/lib/date-utils"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  completed: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  cancelled: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Atendida",
  cancelled: "Cancelada",
}

type Appointment = {
  id: string
  patient_id: string
  doctor_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: string
  reason: string
  is_emergency: boolean
  notes: string | null
  patients: {
    id: string
    first_name: string
    last_name: string
    age?: number
    birth_date?: string
    phone?: string
    no_expediente?: string
  } | null
}

type Patient = {
  id: string
  first_name: string
  last_name: string
  age?: number
  birth_date?: string
  phone?: string
  no_expediente?: string
}

type Role = "admin" | "doctor" | "doctora" | "secretaria"

function PatientAutocomplete({
  patients,
  onSelect,
  placeholder = "Buscar paciente...",
  required = false,
  initialValue = "",
}: {
  patients: Patient[]
  onSelect: (patient: Patient | null, typedName: string) => void
  placeholder?: string
  required?: boolean
  initialValue?: string
}) {
  const [query, setQuery] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Patient | null>(null)

  const filtered = query
    ? patients.filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        return fullName.includes(query.toLowerCase())
      })
    : []

  const handleSelect = (patient: Patient) => {
    setSelected(patient)
    const name = `${patient.first_name} ${patient.last_name}`
    setQuery(name)
    setIsOpen(false)
    onSelect(patient, name)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery("")
    onSelect(null, "")
  }

  const handleChange = (val: string) => {
    setQuery(val)
    setSelected(null)
    setIsOpen(true)
    onSelect(null, val)
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="h-11 rounded-xl pr-10 text-base"
          required={required && !selected && !query}
        />
        {(selected || query) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            Limpiar
          </button>
        )}
      </div>
      {isOpen && query && filtered.length > 0 && (
        <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-md">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground cursor-pointer border-b border-border/40 last:border-0"
            >
              <span className="font-semibold text-foreground">{p.first_name} {p.last_name}</span>
              <span className="text-xs text-muted-foreground flex flex-wrap gap-x-3 pt-0.5">
                {p.phone && <span>📞 {p.phone}</span>}
                {p.age ? <span>🎂 {p.age} años</span> : p.birth_date ? <span>🎂 {new Date().getFullYear() - new Date(p.birth_date).getFullYear()} años</span> : null}
                <span>📁 #{p.no_expediente || p.id.substring(0, 6)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AppointmentsView({
  initialAppointments,
  patients,
  userRole,
  userDoctorId,
}: {
  initialAppointments: Appointment[]
  patients: Patient[]
  userRole: Role
  userDoctorId?: string
}) {
  const router = useRouter()
  const isAdmin = userRole === "admin"
  const isDoctor = userRole === "doctor" || userRole === "doctora"
  const canEdit = !isDoctor

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Ficha clínica state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  // Editing state
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  // New/Edit appointment form state
  const [patientId, setPatientId] = useState("")
  const [selectedPatientObj, setSelectedPatientObj] = useState<Patient | null>(null)
  const [debtorStatus, setDebtorStatus] = useState<{ isDebtor: boolean; totalDebt: number } | null>(null)
  const [doctorId, setDoctorId] = useState(DOCTOR_ID)
  const [date, setDate] = useState(getTodayGT())
  const [time, setTime] = useState("09:00")
  const [reason, setReason] = useState("")
  const [status, setStatus] = useState("pending")

  // Check debtor status when patient is selected
  useEffect(() => {
    if (!selectedPatientObj) {
      setDebtorStatus(null)
      return
    }

    async function checkDebts() {
      if (!selectedPatientObj) return
      const { data, error } = await supabase
        .from("debtors")
        .select("*")

      let records = data || []
      if (error || !data || data.length === 0) {
        const local = localStorage.getItem("debtors_records")
        if (local) {
          try { records = JSON.parse(local) } catch { records = [] }
        }
      }

      const pName = `${selectedPatientObj.first_name} ${selectedPatientObj.last_name}`.toLowerCase()
      const pending = records.filter(
        (r: any) =>
          r.status === "pendiente" &&
          (r.patient_id === selectedPatientObj.id ||
           (r.patient_name && pName.includes(r.patient_name.toLowerCase())) ||
           (r.patient_name && r.patient_name.toLowerCase().includes(selectedPatientObj.first_name.toLowerCase())))
      )

      if (pending.length > 0) {
        const total = pending.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)
        setDebtorStatus({ isDebtor: true, totalDebt: total })
      } else {
        setDebtorStatus({ isDebtor: false, totalDebt: 0 })
      }
    }

    checkDebts()
  }, [selectedPatientObj])

  // Emergency form state
  const [emergencyName, setEmergencyName] = useState("")
  const [emergencyReason, setEmergencyReason] = useState("")
  const [emergencyDoctorId, setEmergencyDoctorId] = useState(DOCTOR_ID)
  const [selectedEmergencyPatient, setSelectedEmergencyPatient] = useState<Patient | null>(null)

  // All appointments visible to the current user (filtered by doctor if doctor)
  const myAppointments = useMemo(() => {
    return isDoctor && userDoctorId
      ? appointments.filter((a) => a.doctor_id === userDoctorId)
      : appointments
  }, [isDoctor, userDoctorId, appointments])

  const doctorAppointments = useMemo(() => {
    return myAppointments.filter(
      (a) =>
        a.doctor_id === DOCTOR_ID &&
        isTodayGT(a.scheduled_at) &&
        !a.is_emergency &&
        a.status !== "completed" &&
        a.status !== "atendida" &&
        a.status !== "attended"
    )
  }, [myAppointments])

  const doctoraAppointments = useMemo(() => {
    return myAppointments.filter(
      (a) =>
        a.doctor_id === DOCTORA_ID &&
        isTodayGT(a.scheduled_at) &&
        !a.is_emergency &&
        a.status !== "completed" &&
        a.status !== "atendida" &&
        a.status !== "attended"
    )
  }, [myAppointments])

  const emergencyAppointments = useMemo(() => {
    return myAppointments.filter((a) => a.is_emergency)
  }, [myAppointments])

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !date || !time) return
    setLoading(true)
    const scheduledAt = `${date}T${time}:00`
    const durationMins = doctorId === DOCTOR_ID ? 30 : 45
    const { data, error } = await supabase.from("appointments").insert([
      {
        patient_id: patientId,
        doctor_id: doctorId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMins,
        status,
        reason,
        is_emergency: false,
      },
    ]).select("*, patients(id, first_name, last_name)")

    setLoading(false)
    if (!error && data?.[0]) {
      setAppointments([data[0], ...appointments])
      setDialogOpen(false)
      setPatientId(""); setSelectedPatientObj(null); setDate(getTodayGT()); setTime("09:00"); setReason(""); setStatus("pending")
      router.refresh()
    } else {
      alert("Error al guardar la cita: " + (error?.message || "intente nuevamente"))
    }
  }

  const handleOpenEdit = (a: Appointment) => {
    setEditingAppointment(a)
    setPatientId(a.patient_id || "")
    const matchedP = patients.find((p) => p.id === a.patient_id) || null
    setSelectedPatientObj(matchedP)
    setDoctorId(a.doctor_id || DOCTOR_ID)
    if (a.scheduled_at) {
      const parts = a.scheduled_at.split("T")
      setDate(parts[0])
      setTime(parts[1]?.substring(0, 5) || "09:00")
    }
    setReason(a.reason || "")
    setStatus(a.status || "pending")
    setEditDialogOpen(true)
  }

  const handleSaveEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAppointment) return
    setLoading(true)

    const scheduledAt = `${date}T${time}:00`
    const { error } = await supabase
      .from("appointments")
      .update({
        patient_id: patientId,
        doctor_id: doctorId,
        scheduled_at: scheduledAt,
        reason,
        status,
      })
      .eq("id", editingAppointment.id)

    setLoading(false)
    if (!error) {
      setAppointments(
        appointments.map((a) =>
          a.id === editingAppointment.id
            ? {
                ...a,
                patient_id: patientId,
                doctor_id: doctorId,
                scheduled_at: scheduledAt,
                reason,
                status,
                patients: patients.find((p) => p.id === patientId) || a.patients,
              }
            : a
        )
      )
      setEditDialogOpen(false)
      setEditingAppointment(null)
      router.refresh()
    } else {
      alert("Error al actualizar la cita: " + error.message)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setLoading(true)
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id)
    
    setLoading(false)
    if (!error) {
      setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
      router.refresh()
    } else {
      alert("Error al actualizar estado: " + error.message)
    }
  }

  // ACCIÓN PARA DOCTOR: CONFIRMAR CITA (REQUERIMIENTO 11)
  const handleConfirmAppointment = async (id: string, patientName: string) => {
    if (!confirm(`¿Confirmar la cita del paciente ${patientName}?`)) return
    setLoading(true)

    const { error } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", id)

    setLoading(false)
    if (!error) {
      setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a)))
      router.refresh()
    } else {
      alert("Error al confirmar la cita: " + error.message)
    }
  }

  // ACCIÓN PARA DOCTOR: MARCAR CITA COMO ATENDIDA (REQUERIMIENTO 7)
  const handleMarkAttended = async (id: string, patientName: string) => {
    if (!confirm(`¿Marcar como atendida la cita de ${patientName}? Se registrará la finalización de la consulta.`)) return
    setLoading(true)

    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "completed",
        attended_at: nowIso,
      })
      .eq("id", id)

    setLoading(false)
    if (!error) {
      setAppointments(
        appointments.map((a) => (a.id === id ? { ...a, status: "completed", attended_at: nowIso } : a))
      )
      router.refresh()
    } else {
      // Fallback if attended_at column isn't in DB schema yet
      const { error: retryError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", id)

      if (!retryError) {
        setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: "completed" } : a)))
        router.refresh()
      } else {
        alert("Error al marcar como atendida: " + (error?.message || retryError?.message || "Error"))
      }
    }
  }

  // ELIMINACIÓN REAL DE CITA EN SUPABASE (REQUERIMIENTO 3)
  const handleDeleteAppointment = async (id: string) => {
    setLoading(true)
    const { error } = await supabase.from("appointments").delete().eq("id", id)
    setLoading(false)

    if (!error) {
      // Remover de React state inmediatamente para que el horario quede disponible
      setAppointments((prev) => prev.filter((a) => a.id !== id))
      router.refresh()
    } else {
      alert("Error al eliminar cita de la base de datos: " + error.message)
    }
  }

  const handleAddEmergency = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const scheduledAt = `${getTodayGT()}T${formatTimeGT(new Date())}:00`
    const { data, error } = await supabase.from("appointments").insert([
      {
        patient_id: selectedEmergencyPatient ? selectedEmergencyPatient.id : null,
        doctor_id: emergencyDoctorId,
        scheduled_at: scheduledAt,
        duration_minutes: 30,
        status: "pending",
        reason: emergencyReason,
        is_emergency: true,
        notes: selectedEmergencyPatient ? null : emergencyName,
      },
    ]).select("*, patients(id, first_name, last_name)")

    setLoading(false)
    if (!error && data?.[0]) {
      setAppointments([data[0], ...appointments])
      setEmergencyDialogOpen(false)
      setEmergencyName(""); setEmergencyReason(""); setSelectedEmergencyPatient(null)
      router.refresh()
    } else {
      alert("Error al registrar emergencia: " + (error?.message || "intente nuevamente"))
    }
  }

  return (
    <div className="space-y-5">
      {/* Actions bar */}
      {canEdit && (
        <div className="flex flex-wrap gap-3 justify-end">
          {/* Emergency button */}
          <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold">
                <AlertCircle className="mr-2 h-4 w-4" />
                Paciente Emergencia
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Paciente de Emergencia
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmergency} className="space-y-4 pt-2">
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                  Se registrará un paciente <strong>sin cita previa</strong> con hora de llegada actual ({formatTimeGT(new Date())} hrs).
                </div>
                <div className="space-y-2">
                  <Label>Paciente (Búsqueda o Nuevo)</Label>
                  <PatientAutocomplete
                    key={emergencyDialogOpen ? "open" : "closed"}
                    patients={patients}
                    placeholder="Buscar o escribir nombre completo"
                    required={true}
                    onSelect={(patient, name) => {
                      setSelectedEmergencyPatient(patient)
                      setEmergencyName(name)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motivo / Síntoma</Label>
                  <Textarea
                    required
                    placeholder="Describe el motivo de la emergencia"
                    value={emergencyReason}
                    onChange={(e) => setEmergencyReason(e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Asignar a</Label>
                  <Select value={emergencyDoctorId} onValueChange={setEmergencyDoctorId}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DOCTOR_ID}>Dr. Médico</SelectItem>
                      <SelectItem value={DOCTORA_ID}>Dra. Médica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading} className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white px-6 font-bold">
                    {loading ? "Registrando..." : "Registrar Emergencia"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* New appointment */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                <Plus className="mr-2 h-4 w-4" />
                Agendar Cita
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Cita Médica</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddAppointment} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <PatientAutocomplete
                    key={dialogOpen ? "open" : "closed"}
                    patients={patients}
                    required={true}
                    onSelect={(patient) => {
                      setPatientId(patient ? patient.id : "")
                      setSelectedPatientObj(patient)
                    }}
                  />
                </div>

                {/* Patient Info Card & Debtor Status Badge */}
                {selectedPatientObj && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">
                        {selectedPatientObj.first_name} {selectedPatientObj.last_name}
                      </span>
                      {debtorStatus?.isDebtor ? (
                        <Badge className="bg-red-600 text-white font-semibold">
                          🔴 Deudor@ - Debe Q{debtorStatus.totalDebt.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 text-white font-semibold">
                          🟢 Al día (Sin Deuda)
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                      <div>
                        <strong>Expediente:</strong> #{selectedPatientObj.no_expediente || selectedPatientObj.id.substring(0, 6)}
                      </div>
                      <div>
                        <strong>Teléfono:</strong> {selectedPatientObj.phone || "—"}
                      </div>
                      <div>
                        <strong>Edad:</strong> {selectedPatientObj.age ? `${selectedPatientObj.age} años` : selectedPatientObj.birth_date || "—"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Médico Asignado</Label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DOCTOR_ID}>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-blue-500" />
                          Dr. Médico (Ciclos de 30 min)
                        </div>
                      </SelectItem>
                      <SelectItem value={DOCTORA_ID}>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-pink-500" />
                          Dra. Médica (Ciclos de 45 min)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-11 rounded-xl text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora (24 hrs)</Label>
                    <Input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-11 rounded-xl text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Input
                    placeholder="Motivo de la cita"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="h-11 rounded-xl text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="completed">Atendida</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-xl bg-primary px-6 text-primary-foreground font-bold hover:bg-primary/90"
                  >
                    {loading ? "Guardando..." : "Guardar Cita"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Emergency patients section */}
      {(canEdit || isDoctor) && emergencyAppointments.length > 0 && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 border-b border-red-200 px-5 py-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-red-700">
              Pacientes sin Cita / Emergencias ({emergencyAppointments.length})
            </h2>
          </div>
          <div className="divide-y divide-red-100">
            {emergencyAppointments.map((a) => (
              <div 
                key={a.id} 
                onClick={() => {
                  if (isDoctor && a.status !== "completed" && a.status !== "cancelled") {
                    setSelectedAppointment(a)
                  }
                }}
                className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${isDoctor && a.status !== "completed" && a.status !== "cancelled" ? "cursor-pointer hover:bg-red-100 transition-colors" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : a.notes || "Paciente sin nombre registrado"}
                    </p>
                    <p className="text-xs text-gray-600">{a.reason}</p>
                    <p className="mt-0.5 text-xs text-gray-500 font-medium">
                      Llegada: {formatTimeGT(a.scheduled_at)} hrs
                      {" · "}
                      {a.doctor_id === DOCTOR_ID ? "Dr. Médico" : "Dra. Médica"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="shrink-0 bg-red-100 text-red-700 border-red-200 border font-bold">
                    {a.status === "completed" ? "ATENDIDA" : "EMERGENCIA"}
                  </Badge>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("¿Eliminar este registro de emergencia?")) {
                          handleDeleteAppointment(a.id)
                        }
                      }}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda tabs by doctor */}
      <Tabs defaultValue={canEdit ? "horario" : isDoctor && userRole === "doctora" ? "doctora" : "doctor"} className="w-full">
        <TabsList className="rounded-xl bg-muted/50 p-1">
          {canEdit && (
            <TabsTrigger value="horario" className="rounded-lg text-sm gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              Horario por Espacios
            </TabsTrigger>
          )}
          {(!isDoctor || userRole === "doctor") && (
            <TabsTrigger value="doctor" className="rounded-lg text-sm gap-2">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              Dr. Médico
            </TabsTrigger>
          )}
          {(!isDoctor || userRole === "doctora") && (
            <TabsTrigger value="doctora" className="rounded-lg text-sm gap-2">
              <Stethoscope className="h-4 w-4 text-pink-500" />
              Dra. Médica
            </TabsTrigger>
          )}
          <TabsTrigger value="calendario" className="rounded-lg text-sm gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="lista" className="rounded-lg text-sm gap-2">
            <List className="h-4 w-4" />
            Todas las Citas
          </TabsTrigger>
        </TabsList>

        {/* Schedule Grid for Secretary & Admin with Real Deletion */}
        {canEdit && (
          <TabsContent value="horario" className="mt-4">
            <ScheduleGrid
              appointments={myAppointments}
              onBookSlot={(slotDate, slotTime, slotDoctorId) => {
                setDate(slotDate)
                setTime(slotTime)
                setDoctorId(slotDoctorId)
                setDialogOpen(true)
              }}
              onDeleteAppointment={handleDeleteAppointment}
            />
          </TabsContent>
        )}

        {/* Doctor tab */}
        <TabsContent value="doctor" className="mt-4 animate-fade-in-up">
          {isDoctor && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-900/60 px-4 py-2.5">
              <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Citas del Dr. Médico hoy — Presiona &quot;Confirmar Cita&quot; para confirmar asistencia o haz clic para abrir la ficha clínica.
              </span>
            </div>
          )}
          <AppointmentList 
            appointments={doctorAppointments} 
            doctorLabel="Dr. Médico" 
            doctorColor="blue" 
            isDoctor={isDoctor}
            isAdmin={isAdmin}
            isSecretaria={userRole === "secretaria" || userRole === "admin"}
            onSelect={(a) => setSelectedAppointment(a)}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteAppointment}
            onConfirm={handleConfirmAppointment}
            onMarkAttended={handleMarkAttended}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        {/* Doctora tab */}
        <TabsContent value="doctora" className="mt-4 animate-fade-in-up">
          {isDoctor && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-pink-50 border border-pink-100 dark:bg-pink-950/40 dark:border-pink-900/60 px-4 py-2.5">
              <UserCheck className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              <span className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                Citas de la Dra. Médica hoy — Presiona &quot;Confirmar Cita&quot; para confirmar asistencia o &quot;Atendido&quot; para finalizar la cita.
              </span>
            </div>
          )}
          <AppointmentList 
            appointments={doctoraAppointments} 
            doctorLabel="Dra. Médica" 
            doctorColor="pink" 
            isDoctor={isDoctor}
            isAdmin={isAdmin}
            isSecretaria={userRole === "secretaria" || userRole === "admin"}
            onSelect={(a) => setSelectedAppointment(a)}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteAppointment}
            onConfirm={handleConfirmAppointment}
            onMarkAttended={handleMarkAttended}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        {/* Calendar tab */}
        <TabsContent value="calendario" className="mt-4">
          <MiniCalendar 
            appointments={myAppointments.filter((a) => !a.is_emergency)} 
            onDayClick={(dayDate) => {
              if (canEdit) {
                setDate(dayDate);
                setDialogOpen(true);
              }
            }}
            onUpdateStatus={handleUpdateStatus}
            onEdit={handleOpenEdit}
            onConfirm={handleConfirmAppointment}
            onDelete={handleDeleteAppointment}
            canEdit={canEdit}
            isDoctor={isDoctor}
          />
        </TabsContent>

        {/* List tab */}
        <TabsContent value="lista" className="mt-4">
          <AppointmentList 
            appointments={myAppointments.filter((a) => !a.is_emergency)} 
            doctorLabel={isDoctor ? (userRole === "doctor" ? "Dr. Médico" : "Dra. Médica") : "Todos"} 
            doctorColor="blue" 
            isDoctor={isDoctor}
            isAdmin={isAdmin}
            isSecretaria={canEdit}
            onSelect={(a) => setSelectedAppointment(a)}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteAppointment}
            onConfirm={handleConfirmAppointment}
            onMarkAttended={handleMarkAttended}
            onUpdateStatus={handleUpdateStatus}
            showDoctorBadge={!isDoctor}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Appointment Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modificar Cita Existente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditAppointment} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <PatientAutocomplete
                key={editDialogOpen ? "open-edit" : "closed-edit"}
                patients={patients}
                initialValue={editingAppointment?.patients ? `${editingAppointment.patients.first_name} ${editingAppointment.patients.last_name}` : ""}
                onSelect={(patient) => {
                  if (patient) setPatientId(patient.id)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Médico Asignado</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DOCTOR_ID}>Dr. Médico</SelectItem>
                  <SelectItem value={DOCTORA_ID}>Dra. Médica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 rounded-xl text-base"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-11 rounded-xl text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                placeholder="Motivo de la cita"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="h-11 rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado de la Cita</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Atendida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleUpdateStatus(editingAppointment!.id, "cancelled")
                  setEditDialogOpen(false)
                }}
                className="h-11 rounded-xl border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Marcar Cancelada
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-xl bg-primary px-6 text-primary-foreground font-bold hover:bg-primary/90"
              >
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ficha Clínica Modal for Doctors */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 border-none bg-transparent shadow-none max-h-[95vh] overflow-y-auto">
          <DialogTitle className="sr-only">Ficha Clínica</DialogTitle>
          {selectedAppointment && (
            <FichaClinicaForm
              patient={
                selectedAppointment.patients || {
                  id: "00000000-0000-0000-0000-000000000000",
                  first_name: selectedAppointment.notes || "Paciente de Emergencia",
                  last_name: "",
                }
              }
              doctorId={selectedAppointment.doctor_id || DOCTOR_ID}
              appointmentId={selectedAppointment.id}
              onCancel={() => setSelectedAppointment(null)}
              onSuccess={() => {
                setSelectedAppointment(null)
                router.refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AppointmentList({
  appointments,
  doctorLabel,
  doctorColor,
  isDoctor,
  isAdmin,
  isSecretaria,
  onSelect,
  onEdit,
  onDelete,
  onConfirm,
  onMarkAttended,
  onUpdateStatus,
  showDoctorBadge = false,
}: {
  appointments: Appointment[]
  doctorLabel: string
  doctorColor: "blue" | "pink"
  isDoctor: boolean
  isAdmin: boolean
  isSecretaria: boolean
  onSelect: (a: Appointment) => void
  onEdit: (a: Appointment) => void
  onDelete: (id: string) => void
  onConfirm?: (id: string, name: string) => void
  onMarkAttended?: (id: string, name: string) => void
  onUpdateStatus: (id: string, status: string) => void
  showDoctorBadge?: boolean
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-400",
  }

  return (
    <div className="space-y-3 stagger-children">
      {appointments.map((a) => {
        const isClickable = isDoctor && a.status !== "completed" && a.status !== "cancelled"
        const patientFullName = a.patients
          ? `${a.patients.first_name} ${a.patients.last_name}`
          : "Paciente sin nombre"

        return (
          <div
            key={a.id}
            onClick={() => isClickable && onSelect(a)}
            className={`card-hover-lift flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${isClickable ? "cursor-pointer hover:border-primary/50" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[doctorColor]}`}>
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {patientFullName}
                </p>
                <p className="text-xs text-muted-foreground">{a.reason || "Consulta médica"}</p>
                <div className="mt-1 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {formatDateGT(a.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimeGT(a.scheduled_at)} hrs
                  </span>
                  {showDoctorBadge && (
                    <Badge variant="outline" className={`text-[10px] py-0 h-4 ${a.doctor_id === DOCTOR_ID ? 'text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900/60 dark:bg-blue-950/40' : 'text-pink-600 border-pink-200 bg-pink-50 dark:text-pink-400 dark:border-pink-900/60 dark:bg-pink-950/40'}`}>
                      {a.doctor_id === DOCTOR_ID ? "Dr. Médico" : "Dra. Médica"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
              {/* BOTÓN ÚNICO ATENDIDO PARA DOCTORES */}
              {isDoctor && a.status !== "completed" && a.status !== "atendida" && a.status !== "attended" && a.status !== "cancelled" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onMarkAttended?.(a.id, patientFullName)}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs gap-1 shadow-sm px-3"
                  title="Marcar cita como atendida"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Atendido
                </Button>
              )}

              {isSecretaria && (
                <div className="flex items-center gap-2">
                  <Select value={a.status} onValueChange={(val) => onUpdateStatus(a.id, val)}>
                    <SelectTrigger className={`h-8 text-xs border w-[130px] font-semibold ${STATUS_STYLES[a.status] || ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="completed">Atendida</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(a)}
                    className="h-8 rounded-lg text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                </div>
              )}

              {isDoctor && (
                <div className="flex items-center gap-2">
                  {a.patient_id && (
                    <Link href={`/pacientes/${a.patient_id}`}>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold"
                      >
                        Expediente
                      </Button>
                    </Link>
                  )}
                  <Badge
                    variant="secondary"
                    className={`shrink-0 border font-bold text-xs ${STATUS_STYLES[a.status] || ""}`}
                  >
                    {STATUS_LABELS[a.status] || a.status}
                  </Badge>
                </div>
              )}

              {/* ELIMINAR CITA DE BD (REQUERIMIENTO 3) */}
              {(isAdmin || isSecretaria) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`¿Eliminar la cita de ${patientFullName}? Se liberará el horario.`)) {
                      onDelete(a.id)
                    }
                  }}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  title="Eliminar cita"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No hay citas registradas para {doctorLabel}.</p>
        </div>
      )}
    </div>
  )
}

function MiniCalendar({ 
  appointments, 
  onDayClick,
  onUpdateStatus,
  onEdit,
  onConfirm,
  onDelete,
  canEdit,
  isDoctor,
}: { 
  appointments: Appointment[]
  onDayClick: (date: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onEdit: (a: Appointment) => void
  onConfirm?: (id: string, name: string) => void
  onDelete: (id: string) => void
  canEdit: boolean
  isDoctor: boolean
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date()
    if (today.getFullYear() === year && today.getMonth() === month) {
      return today.getDate()
    }
    return 1
  })

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]

  const appointmentsByDay: Record<number, Appointment[]> = {}
  appointments.forEach((a) => {
    if (!a.scheduled_at) return
    const [dPart] = a.scheduled_at.split("T")
    const [ay, am, ad] = dPart.split("-").map(Number)
    if (ay === year && am === month + 1) {
      if (!appointmentsByDay[ad]) appointmentsByDay[ad] = []
      appointmentsByDay[ad].push(a)
    }
  })

  const handleMonthChange = (newDate: Date) => {
    setCurrentMonth(newDate)
    const today = new Date()
    if (today.getFullYear() === newDate.getFullYear() && today.getMonth() === newDate.getMonth()) {
      setSelectedDay(today.getDate())
    } else {
      setSelectedDay(1)
    }
  }

  const prevMonth = () => handleMonthChange(new Date(year, month - 1))
  const nextMonth = () => handleMonthChange(new Date(year, month + 1))

  const todayDate = new Date()
  const isCurrentMonthToday = todayDate.getFullYear() === year && todayDate.getMonth() === month

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/50">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-base font-semibold text-card-foreground">
          {monthNames[month]} {year}
        </h3>
        <button onClick={nextMonth} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/50">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const hasApps = appointmentsByDay[day]
          const isToday = isCurrentMonthToday && day === todayDate.getDate()
          const isSelected = selectedDay === day
          return (
            <div
              key={day}
              onClick={() => {
                setSelectedDay(day);
              }}
              className={`relative flex h-12 flex-col items-center justify-center rounded-xl text-sm transition-colors cursor-pointer ${
                isToday
                  ? "bg-primary font-bold text-primary-foreground hover:bg-primary/90"
                  : isSelected
                    ? "ring-2 ring-primary bg-primary/5 font-semibold text-card-foreground"
                    : hasApps
                      ? "bg-primary/10 font-medium text-card-foreground hover:bg-primary/20"
                      : "text-card-foreground hover:bg-muted/40"
              }`}
            >
              {day}
              {hasApps && !isToday && (
                <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </div>
          )
        })}
      </div>

      {selectedDay !== null && (
        <div className="mt-6 space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-card-foreground">
              Citas del {selectedDay} de {monthNames[month]} ({appointmentsByDay[selectedDay]?.length || 0})
            </p>
            {canEdit && (
              <Button
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => {
                  const mStr = String(month + 1).padStart(2, "0")
                  const dStr = String(selectedDay).padStart(2, "0")
                  onDayClick(`${year}-${mStr}-${dStr}`);
                }}
              >
                <Plus className="mr-1.5 h-3 w-3" />
                Agregar Cita
              </Button>
            )}
          </div>

          {appointmentsByDay[selectedDay] && appointmentsByDay[selectedDay].length > 0 ? (
            <div className="space-y-2">
              {appointmentsByDay[selectedDay].map((a) => {
                const pName = a.patients
                  ? `${a.patients.first_name} ${a.patients.last_name}`
                  : "Paciente"
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {pName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeGT(a.scheduled_at)} hrs
                          {" · "}{a.doctor_id === DOCTOR_ID ? "Dr. Médico" : "Dra. Médica"}
                        </p>
                      </div>
                    </div>
                    
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                      {isDoctor && (a.status === "pending" || a.status === "pendiente") && (
                        <Button
                          size="sm"
                          onClick={() => onConfirm?.(a.id, pName)}
                          className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs px-2"
                        >
                          <Check className="h-3 w-3 mr-1" /> Confirmar
                        </Button>
                      )}

                      {canEdit ? (
                        <>
                          <Select value={a.status} onValueChange={(val) => onUpdateStatus(a.id, val)}>
                            <SelectTrigger className={`h-8 text-xs border w-[120px] font-semibold ${STATUS_STYLES[a.status] || ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="confirmed">Confirmada</SelectItem>
                              <SelectItem value="completed">Atendida</SelectItem>
                              <SelectItem value="cancelled">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(a)}
                            className="h-8 rounded-lg text-xs"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`¿Eliminar la cita de ${pName}?`)) onDelete(a.id)
                            }}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={`shrink-0 border font-bold text-xs ${STATUS_STYLES[a.status] || ""}`}
                        >
                          {STATUS_LABELS[a.status] || a.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No hay citas programadas para este día.</p>
          )}
        </div>
      )}
    </div>
  )
}
