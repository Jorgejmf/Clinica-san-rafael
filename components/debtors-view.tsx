"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, Filter, Trash2, CheckCircle, AlertCircle, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"

export type DebtorRecord = {
  id: string
  patient_id?: string
  patient_name: string
  amount: number
  date: string
  concept?: string
  status: "pendiente" | "pagado"
  created_at: string
}

type Patient = {
  id: string
  first_name: string
  last_name: string
}

function PatientAutocomplete({
  patients = [],
  onSelect,
}: {
  patients?: Patient[]
  onSelect: (patient: Patient | null, typedName: string) => void
}) {
  const [query, setQuery] = useState("")
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
        placeholder="Buscar paciente o escribir nombre..."
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

const INITIAL_DEBTORS_MOCKS: DebtorRecord[] = [
  {
    id: "deb-1",
    patient_name: "Jose Roberto Hernandez",
    amount: 350.0,
    date: "2026-02-18",
    concept: "Consulta general y medicamentos de hipertensión",
    status: "pendiente",
    created_at: "2026-02-18T10:00:00Z",
  },
  {
    id: "deb-2",
    patient_name: "Rosa Elena Vargas",
    amount: 500.0,
    date: "2026-02-10",
    concept: "Exámenes de laboratorio pendientes de pago",
    status: "pendiente",
    created_at: "2026-02-10T10:00:00Z",
  },
  {
    id: "deb-3",
    patient_name: "Fernando Jose Castillo",
    amount: 200.0,
    date: "2026-02-05",
    concept: "Inyectable y curación",
    status: "pagado",
    created_at: "2026-02-05T10:00:00Z",
  },
]

export function DebtorsView({
  patients = [],
  userRole = "secretaria",
  onAddTransaction,
}: {
  patients?: Patient[]
  userRole?: string
  onAddTransaction?: (amount: number, description: string) => void
}) {
  const isAdmin = userRole === "admin"
  const [debtors, setDebtors] = useState<DebtorRecord[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientName, setPatientName] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [concept, setConcept] = useState("")

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from("debtors")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setDebtors(data)
      } else {
        if (error) console.error(error)
        setDebtors([])
      }
    }
    loadData()
  }, [])

  const saveToState = (newDebtors: DebtorRecord[]) => {
    setDebtors(newDebtors)
  }

  const handleAddDebtor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientName || !amount) return
    setLoading(true)

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedPatient?.id || "")
    const newDeb: DebtorRecord = {
      id: `deb-${Date.now()}`,
      patient_id: isUuid ? selectedPatient?.id : undefined,
      patient_name: patientName,
      amount: parseFloat(amount),
      date,
      concept,
      status: "pendiente",
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("debtors").insert([newDeb]).select()
    
    if (error) {
      console.error(error)
      alert(error.message)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      const updated = [data[0], ...debtors.filter((d) => d.id !== data[0].id)]
      saveToState(updated)
    }

    setLoading(false)
    setDialogOpen(false)
    setPatientName("")
    setSelectedPatient(null)
    setAmount("")
    setConcept("")
  }

  const handleMarkAsPaid = async (debtor: DebtorRecord) => {
    if (!confirm(`¿Marcar deuda de Q${debtor.amount} de ${debtor.patient_name} como PAGADA?`)) return

    const { error } = await supabase.from("debtors").update({ status: "pagado" }).eq("id", debtor.id)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    const updated = debtors.map((d) => (d.id === debtor.id ? { ...d, status: "pagado" as const } : d))
    saveToState(updated)

    // Automatically trigger sale transaction if callback provided
    if (onAddTransaction) {
      onAddTransaction(debtor.amount, `[Pago Deuda] ${debtor.patient_name} - ${debtor.concept || 'Deuda cancelada'}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro de deudor?")) return
    const { error } = await supabase.from("debtors").delete().eq("id", id)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }
    const updated = debtors.filter((d) => d.id !== id)
    saveToState(updated)
  }

  const filteredDebtors = debtors.filter((d) => {
    const matchesSearch = d.patient_name.toLowerCase().includes(search.toLowerCase()) ||
                          d.concept?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === "todos" || d.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalPending = debtors
    .filter((d) => d.status === "pendiente")
    .reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar deudor por nombre o concepto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-xl pl-10 text-base"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-44">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las Deudas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="pagado">Pagadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Añadir Deudor
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-amber-700 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Registrar Persona con Deuda
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDebtor} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre de la Persona / Paciente</Label>
                <PatientAutocomplete
                  patients={patients}
                  onSelect={(patient, name) => {
                    setSelectedPatient(patient)
                    setPatientName(name)
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto (Q)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11 rounded-xl text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de la Deuda</Label>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Concepto / Motivo de la Deuda</Label>
                <Textarea
                  placeholder="Detalles de servicios, consulta o medicamentos pendientes..."
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-6"
                >
                  {loading ? "Guardando..." : "Registrar Deuda"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Total Banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Total Deudas Pendientes</p>
            <p className="text-xl font-bold text-amber-900">
              Q{totalPending.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <span className="text-xs text-amber-700 font-medium">
          {debtors.filter((d) => d.status === "pendiente").length} personas pendientes
        </span>
      </div>

      {/* Debtors Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Monto</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="hidden px-5 py-3 text-left font-medium text-muted-foreground sm:table-cell">Concepto</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Estado</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebtors.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-3 font-semibold text-card-foreground">
                    {d.patient_name}
                  </td>
                  <td className="px-5 py-3 font-bold text-amber-700">
                    Q{Number(d.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(d.date).toLocaleDateString("es-GT")}
                  </td>
                  <td className="hidden max-w-xs truncate px-5 py-3 text-muted-foreground sm:table-cell">
                    {d.concept || "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {d.status === "pendiente" ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">
                        Pendiente
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border">
                        Pagado
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {d.status === "pendiente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(d)}
                          className="h-8 text-xs rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Cobrar
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(d.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDebtors.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    No se encontraron registros de deudores.
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
