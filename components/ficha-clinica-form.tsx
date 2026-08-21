"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Stethoscope } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Patient = {
  id: string
  first_name: string
  last_name: string
  age?: number
  birth_date?: string
  phone?: string
  no_expediente?: string
  gender?: string
  sexo?: string
  genero?: string
}

type FichaClinicaFormProps = {
  patient: Patient
  doctorId: string
  appointmentId?: string
  onCancel: () => void
  onSuccess: () => void
}

export function FichaClinicaForm({
  patient,
  doctorId,
  appointmentId,
  onCancel,
  onSuccess,
}: FichaClinicaFormProps) {
  const [loading, setLoading] = useState(false)

  // Vitals
  const [respiracion, setRespiracion] = useState("")
  const [temperatura, setTemperatura] = useState("")
  const [pulso, setPulso] = useState("")
  const [presionArterial, setPresionArterial] = useState("")
  const [peso, setPeso] = useState("")
  const [talla, setTalla] = useState("")

  // Clinical data
  const [motivoConsulta, setMotivoConsulta] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [conductaASeguir, setConductaASeguir] = useState("")
  const [proximaCita, setProximaCita] = useState("")

  // PP state
  const [ppLoading, setPpLoading] = useState(false)
  const [ppDone, setPpDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Insert clinical record
      const { error: recordError } = await supabase.from("medical_records").insert([
        {
          patient_id: patient.id,
          doctor_id: doctorId,
          symptoms: motivoConsulta,
          motivo_consulta: motivoConsulta,
          diagnosis,
          treatment: conductaASeguir,
          conducta_a_seguir: conductaASeguir,
          respiracion,
          temperatura,
          pulso,
          presion_arterial: presionArterial,
          peso,
          talla,
          proxima_cita: proximaCita || null,
        },
      ])

      if (recordError) throw recordError

      // 2. Update appointment status to 'completed' (revisado) if appointmentId is provided
      if (appointmentId) {
        const { error: apptError } = await supabase
          .from("appointments")
          .update({ status: "completed" })
          .eq("id", appointmentId)
          
        if (apptError) throw apptError
      }

      onSuccess()
    } catch (err) {
      if (err instanceof Error) {
        alert("Error al guardar: " + err.message)
      } else {
        alert("Error al guardar: " + String(err))
      }
    } finally {
      setLoading(false)
    }
  }

  // PP button handler — only shown for female patients
  const handleAddPP = async () => {
    setPpLoading(true)
    const fullName = `${patient.first_name} ${patient.last_name}`
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patient.id || "")
    const newRec = {
      id: `pp-${Date.now()}`,
      patient_id: isUuid ? patient.id : null,
      patient_name: fullName,
      date: new Date().toISOString().split("T")[0],
      doctor_name: "Dra. Médica",
      status: "pendiente",
      result_notes: "Pendiente — registrado desde ficha clínica",
      created_at: new Date().toISOString(),
    }

    // Always update local storage first so UI has immediate access
    try {
      const local = localStorage.getItem("papanicolaou_records")
      const existing = local ? JSON.parse(local) : []
      const updated = [newRec, ...existing.filter((r: any) => r.id !== newRec.id)]
      localStorage.setItem("papanicolaou_records", JSON.stringify(updated))
    } catch {}

    // Insert to Supabase database
    await supabase.from("papanicolaou_records").insert([newRec])

    window.dispatchEvent(new Event("papanicolaou_updated"))

    setPpLoading(false)
    setPpDone(true)
  }

  // Determine gender from patient data (check any known fields)
  const isFemale = (() => {
    const g = (patient.gender || patient.sexo || patient.genero || "").toString().toLowerCase().trim()
    if (g) {
      if (g === "masculino" || g === "masc" || g === "m" || g === "male" || g === "hombre") return false
      return g.includes("fem") || g === "f" || g === "mujer"
    }
    return false // hide button if gender unknown
  })()

  const patientAge = patient.age
    ? patient.age
    : patient.birth_date
      ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
      : ""

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-card rounded-xl shadow-lg overflow-hidden border border-primary">
      {/* HEADER */}
      <div className="flex justify-between items-end p-4 border-b border-primary">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-primary text-2xl font-bold tracking-tight uppercase">Ficha Clínica: Adulto</h2>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase">Clínica Médica Familiar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* PP Button — only for female patients */}
          {isFemale && (
            <button
              type="button"
              onClick={handleAddPP}
              disabled={ppLoading || ppDone}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase transition-all print:hidden ${
                ppDone
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 cursor-default"
                  : "border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
              title="Agregar a lista de Papanicolaou con estado Pendiente"
            >
              {ppDone ? "✓ PP Pendiente Agregado" : ppLoading ? "Agregando..." : "PP"}
            </button>
          )}
          <div className="flex items-center gap-2 border border-primary px-3 py-1">
            <span className="text-primary text-sm font-semibold uppercase">Fecha:</span>
            <span className="text-card-foreground font-medium text-sm w-32 text-center">
              {new Date().toLocaleDateString("es-GT")}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 border-b border-primary">
          {/* ROW 1 */}
          <Cell colSpan={6} label="No. Expediente" value={patient.no_expediente || patient.id.substring(0,8).toUpperCase()} className="border-b border-r border-primary" />
          <Cell colSpan={6} label="Fecha" value={new Date().toLocaleDateString("es-GT")} className="border-b border-primary" />

          {/* ROW 2 */}
          <div className="col-span-9 p-2 border-b border-r border-primary bg-primary/10">
            <span className="text-primary text-sm font-bold uppercase">SIGNOS VITALES:</span>
          </div>
          <Cell colSpan={3} label="EDAD" value={`${patientAge}`} className="border-b border-primary bg-primary/10" />

          {/* ROW 3 */}
          <InputCell colSpan={4} label="RESPIRACIÓN" value={respiracion} onChange={setRespiracion} className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="PRESIÓN ARTERIAL" value={presionArterial} onChange={setPresionArterial} className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="PESO (lbs)" value={peso} onChange={setPeso} className="border-b border-primary" />

          {/* ROW 4 */}
          <InputCell colSpan={4} label="TEMPERATURA" value={temperatura} onChange={setTemperatura} className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="PULSO" value={pulso} onChange={setPulso} className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="TALLA (m)" value={talla} onChange={setTalla} className="border-b border-primary" />

          {/* ROW 5 (MOTIVO) */}
          <div className="col-span-12 p-2 border-b border-primary bg-primary/10">
            <span className="text-primary text-sm font-bold uppercase">MOTIVO DE CONSULTA E HISTORIA DE LA ENFERMEDAD ACTUAL:</span>
          </div>
          <div className="col-span-12 border-b border-primary p-0 relative">
            <Textarea
              required
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              className="w-full min-h-[120px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm leading-6 align-top bg-transparent relative z-10 p-2"
              style={{
                backgroundImage: 'linear-gradient(transparent, transparent 23px, #e5e7eb 23px, #e5e7eb 24px)',
                backgroundSize: '100% 24px'
              }}
            />
          </div>

          {/* ROW 6 (DIAGNÓSTICO) */}
          <div className="col-span-12 flex border-b border-primary">
            <div className="flex-1 border-r border-primary">
              <div className="p-2 bg-primary/10 border-b border-primary">
                <span className="text-primary text-sm font-bold uppercase">DIAGNÓSTICO:</span>
              </div>
              <Textarea
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full min-h-[100px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm p-2 bg-transparent"
              />
            </div>
            <div className="w-64">
              <div className="p-2 flex gap-2 border-b border-primary">
                <span className="text-primary text-sm font-bold uppercase text-nowrap">PRÓXIMA CITA:</span>
                <input
                  type="date"
                  value={proximaCita}
                  onChange={(e) => setProximaCita(e.target.value)}
                  className="w-full text-sm outline-none text-red-600 font-bold bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* ROW 7 (CONDUCTA Y FIRMA) */}
          <div className="col-span-12 flex">
            <div className="flex-1 border-r border-primary">
              <div className="p-2 bg-primary/10 border-b border-primary">
                <span className="text-primary text-sm font-bold uppercase">CONDUCTA A SEGUIR:</span>
              </div>
              <Textarea
                value={conductaASeguir}
                onChange={(e) => setConductaASeguir(e.target.value)}
                className="w-full min-h-[120px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm p-2 bg-transparent"
              />
            </div>
            <div className="w-64 flex flex-col justify-end items-center p-4">
              <div className="w-full border-b border-primary mb-2" />
              <span className="text-primary text-sm font-semibold uppercase">Firma</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 p-4 bg-muted/30 border-t border-primary print:hidden">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            Imprimir
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? "Guardando..." : "Guardar Ficha Médica"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Cell({ colSpan, label, value, className }: { colSpan: number; label: string; value: string; className?: string }) {
  const spanClass = {
    3: "col-span-3",
    4: "col-span-4",
    6: "col-span-6",
    9: "col-span-9",
    12: "col-span-12",
  }[colSpan] || "col-span-12"

  return (
    <div className={`${spanClass} p-2 flex gap-2 ${className}`}>
      <span className="text-primary text-sm font-bold uppercase">{label}:</span>
      <span className="text-card-foreground text-sm font-medium">{value}</span>
    </div>
  )
}

function InputCell({ colSpan, label, value, onChange, className }: { colSpan: number; label: string; value: string; onChange: (v: string) => void; className?: string }) {
  const spanClass = {
    3: "col-span-3",
    4: "col-span-4",
    6: "col-span-6",
    9: "col-span-9",
    12: "col-span-12",
  }[colSpan] || "col-span-12"

  return (
    <div className={`${spanClass} flex flex-col ${className}`}>
      <div className="px-2 pt-2 text-primary text-xs font-bold uppercase">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 pb-2 text-sm text-card-foreground font-medium outline-none bg-transparent"
      />
    </div>
  )
}
