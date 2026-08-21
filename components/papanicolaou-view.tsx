"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Filter, Trash2, FileCheck, Clock, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DOCTOR_ID, DOCTORA_ID } from "@/lib/constants"

export type PapanicolaouRecord = {
  id: string
  patient_id?: string
  patient_name: string
  date: string
  doctor_name: string
  status: "pendiente" | "realizado" | "en proceso" | "entregado"
  result_notes?: string
  created_at: string
}

type Patient = {
  id: string
  first_name: string
  last_name: string
  gender?: string
  sexo?: string
  genero?: string
}

function PatientAutocomplete({
  patients,
  onSelect,
  initialValue = "",
}: {
  patients: Patient[]
  onSelect: (patient: Patient | null, typedName: string) => void
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

  const handleChange = (val: string) => {
    setQuery(val)
    setSelected(null)
    setIsOpen(true)
    onSelect(null, val)
  }

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder="Buscar paciente (solo mujeres)..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="h-11 rounded-xl text-base"
        required
      />
      {isOpen && query && filtered.length > 0 && (
        <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-md">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              {p.first_name} {p.last_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const INITIAL_PP_MOCKS: PapanicolaouRecord[] = [
  {
    id: "pp-1",
    patient_name: "Maria Garcia Lopez",
    date: "2026-02-15",
    doctor_name: "Dra. Médica",
    status: "entregado",
    result_notes: "Resultado negativo para celulas atipicas. Control en 1 año.",
    created_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "pp-2",
    patient_name: "Ana Sofia Ruiz",
    date: "2026-02-20",
    doctor_name: "Dra. Médica",
    status: "en proceso",
    result_notes: "Muestra enviada a laboratorio central.",
    created_at: "2026-02-20T10:00:00Z",
  },
  {
    id: "pp-3",
    patient_name: "Lucia Fernanda Martinez",
    date: "2026-02-22",
    doctor_name: "Dr. Médico",
    status: "realizado",
    result_notes: "Muestra tomada satisfactoriamente.",
    created_at: "2026-02-22T10:00:00Z",
  },
]

const STATUS_CONFIG = {
  pendiente: {
    label: "Pendiente",
    style: "bg-amber-50 text-amber-700 border-amber-300",
    icon: Clock,
  },
  realizado: {
    label: "Realizado",
    style: "bg-blue-100 text-blue-700 border-blue-200",
    icon: FileCheck,
  },
  "en proceso": {
    label: "En proceso",
    style: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  entregado: {
    label: "Entregado",
    style: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
}

export function PapanicolaouView({
  patients = [],
  userRole = "secretaria",
}: {
  patients?: Patient[]
  userRole?: string
}) {
  // Solo pacientes femeninas. Si el campo de género está vacío se incluye por defecto, pero se excluyen hombres explícitamente.
  const femalePatients = patients.filter((p: any) => {
    const g = (p.gender || p.sexo || p.genero || "").toString().toLowerCase().trim()
    if (!g) return true
    if (g === "masculino" || g === "masc" || g === "m" || g === "male" || g === "hombre") return false
    return g === "femenino" || g === "fem" || g === "f" || g === "female" || g === "mujer"
  })

  const router = useRouter()
  const isAdmin = userRole === "admin"
  const [records, setRecords] = useState<PapanicolaouRecord[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientName, setPatientName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [doctorName, setDoctorName] = useState("Dra. Médica")
  const [status, setStatus] = useState<"pendiente" | "realizado" | "en proceso" | "entregado">("realizado")
  const [notes, setNotes] = useState("")

  // Load records from Supabase and merge with localStorage
  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from("papanicolaou_records")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setRecords(data)
      } else {
        if (error) console.error(error)
        setRecords([])
      }
    }
    loadData()

    window.addEventListener("papanicolaou_updated", loadData)
    return () => window.removeEventListener("papanicolaou_updated", loadData)
  }, [])

  const saveToState = (newRecords: PapanicolaouRecord[]) => {
    setRecords(newRecords)
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientName) return
    setLoading(true)

    const newRec: PapanicolaouRecord = {
      id: `pp-${Date.now()}`,
      patient_id: selectedPatient?.id,
      patient_name: patientName,
      date,
      doctor_name: doctorName,
      status,
      result_notes: notes,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("papanicolaou_records").insert([newRec]).select()

    setLoading(false)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    if (data && data.length > 0) {
      setRecords([data[0], ...records])
    } else {
      setRecords([newRec, ...records])
    }

    setDialogOpen(false)
    setPatientName("")
    setSelectedPatient(null)
    setNotes("")
    setStatus("realizado")
  }

  const handleUpdateStatus = async (id: string, newStatus: "realizado" | "en proceso" | "entregado") => {
    const { error } = await supabase.from("papanicolaou_records").update({ status: newStatus }).eq("id", id)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }
    const updated = records.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    saveToState(updated)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro de Papanicolaou?")) return
    const { error } = await supabase.from("papanicolaou_records").delete().eq("id", id)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }
    const updated = records.filter((r) => r.id !== id)
    saveToState(updated)
  }

  const filteredRecords = records.filter((r) => {
    const matchesSearch = r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.result_notes?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === "todos" || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, doctor o notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl pl-10 text-base"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="realizado">Realizado</SelectItem>
              <SelectItem value="en proceso">En proceso</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Papanicolaou
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Papanicolaou (PP)</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRecord} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Paciente</Label>
                <PatientAutocomplete
                  patients={femalePatients}
                  onSelect={(patient, name) => {
                    setSelectedPatient(patient)
                    setPatientName(name)
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Doctor / Doctora</Label>
                  <Select value={doctorName} onValueChange={setDoctorName}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dra. Médica">Dra. Médica</SelectItem>
                      <SelectItem value="Dr. Médico">Dr. Médico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado del Examen</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="realizado">Realizado</SelectItem>
                    <SelectItem value="en proceso">En proceso</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Resultados / Observaciones</Label>
                <Textarea
                  placeholder="Detalles de la muestra, hallazgos o resultados de laboratorio..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Guardando..." : "Guardar Registro"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table of Records */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Paciente</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Médico</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Estado (4 Estados)</th>
                <th className="hidden px-5 py-3 text-left font-medium text-muted-foreground md:table-cell">Observaciones</th>
                {isAdmin && <th className="px-5 py-3 text-center font-medium text-muted-foreground">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => {
                const conf = STATUS_CONFIG[r.status] || STATUS_CONFIG.realizado
                const Icon = conf.icon
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3 font-semibold text-card-foreground">
                      {r.patient_name}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(r.date).toLocaleDateString("es-GT")}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {r.doctor_name}
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        value={r.status}
                        onValueChange={(val: any) => handleUpdateStatus(r.id, val)}
                      >
                        <SelectTrigger className={`h-8 w-[140px] text-xs font-semibold border ${conf.style}`}>
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{conf.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="realizado">Realizado</SelectItem>
                          <SelectItem value="en proceso">En proceso</SelectItem>
                          <SelectItem value="entregado">Entregado</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="hidden max-w-xs truncate px-5 py-3 text-muted-foreground md:table-cell">
                      {r.result_notes || "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(r.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-10 text-center text-muted-foreground">
                    No se encontraron registros de Papanicolaou.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
