"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Stethoscope } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatDateGT, calculateAgeAtDate, getTodayGT } from "@/lib/date-utils"
import { parseClinicalRecord } from "@/lib/clinical-utils"

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
  initialRecord?: any
  isEditing?: boolean
  onCancel: () => void
  onSuccess: () => void
}

export function FichaClinicaForm({
  patient,
  doctorId,
  appointmentId,
  initialRecord,
  isEditing = false,
  onCancel,
  onSuccess,
}: FichaClinicaFormProps) {
  const [loading, setLoading] = useState(false)

  // Parse any encoded fields if editing or pre-filled
  const parsedRecord = initialRecord ? parseClinicalRecord(initialRecord) : null

  // Calculate age at consultation date (kept as historical age)
  const defaultAge = (() => {
    if (parsedRecord && parsedRecord.age_at_visit !== undefined && parsedRecord.age_at_visit !== null) {
      return String(parsedRecord.age_at_visit)
    }
    const calc = calculateAgeAtDate(patient.birth_date, parsedRecord?.created_at || new Date())
    if (calc !== null) return String(calc)
    if (patient.age !== undefined && patient.age !== null) return String(patient.age)
    return ""
  })()

  // Leer borrador guardado en localStorage para nueva consulta sin perder datos
  const draftKey = `ficha_clinica_draft_${patient.id}`
  const getInitialValue = (field: string, fallback: string) => {
    if (isEditing) return fallback
    if (typeof window === "undefined") return fallback
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed[field] !== undefined && parsed[field] !== null) {
          return parsed[field]
        }
      }
    } catch {}
    return fallback
  }

  // Vitals — all editable text fields con recuperación de borrador
  const [edad, setEdad] = useState(() => getInitialValue("edad", defaultAge))
  const [respiracion, setRespiracion] = useState(() => getInitialValue("respiracion", parsedRecord?.respiracion || ""))
  const [temperatura, setTemperatura] = useState(() => getInitialValue("temperatura", parsedRecord?.temperatura || ""))
  const [pulso, setPulso] = useState(() => getInitialValue("pulso", parsedRecord?.pulso || ""))
  const [presionArterial, setPresionArterial] = useState(() => getInitialValue("presionArterial", parsedRecord?.presion_arterial || ""))
  const [peso, setPeso] = useState(() => getInitialValue("peso", parsedRecord?.peso || ""))
  const [talla, setTalla] = useState(() => getInitialValue("talla", parsedRecord?.talla || ""))

  // Clinical data con recuperación de borrador
  const [motivoConsulta, setMotivoConsulta] = useState(() =>
    getInitialValue("motivoConsulta", parsedRecord?.motivo_consulta || parsedRecord?.symptoms || "")
  )
  const [tx, setTx] = useState(() => getInitialValue("tx", parsedRecord?.tx || ""))
  const [gmt, setGmt] = useState(() =>
    getInitialValue("gmt", parsedRecord?.gmt !== undefined && parsedRecord?.gmt !== null ? String(parsedRecord.gmt) : "")
  )
  const [diagnosis, setDiagnosis] = useState(() => getInitialValue("diagnosis", parsedRecord?.diagnosis || ""))
  const [conductaASeguir, setConductaASeguir] = useState(() =>
    getInitialValue("conductaASeguir", parsedRecord?.conducta_a_seguir || parsedRecord?.treatment || "")
  )
  const [proximaCita, setProximaCita] = useState(() => getInitialValue("proximaCita", parsedRecord?.proxima_cita || ""))
  const [labs, setLabs] = useState(() => getInitialValue("labs", parsedRecord?.labs || ""))

  // PP state
  const [ppLoading, setPpLoading] = useState(false)
  const [ppDone, setPpDone] = useState(false)

  const isFemale = (patient.gender || patient.sexo || patient.genero || "").toLowerCase().includes("fem")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sanitización de números y tipos
      const cleanAge = String(edad ?? "").trim()
      const parsedAge = cleanAge !== "" && !isNaN(Number(cleanAge)) ? Number(cleanAge) : null

      const cleanGmt = String(gmt ?? "").trim()
      const parsedGmt = cleanGmt !== "" ? (isNaN(Number(cleanGmt)) ? cleanGmt : Number(cleanGmt)) : null

      const cleanProximaCita = String(proximaCita ?? "").trim()
      const parsedProximaCita = cleanProximaCita !== "" ? cleanProximaCita : null

      // Payload sanitizado: vacíos convertidos en null y tipos limpios
      const payload: Record<string, any> = {
        patient_id: patient.id,
        doctor_id: doctorId,
        symptoms: String(motivoConsulta ?? "").trim() || null,
        motivo_consulta: String(motivoConsulta ?? "").trim() || null,
        diagnosis: String(diagnosis ?? "").trim() || null,
        treatment: String(conductaASeguir ?? "").trim() || null,
        conducta_a_seguir: String(conductaASeguir ?? "").trim() || null,
        respiracion: String(respiracion ?? "").trim() || null,
        temperatura: String(temperatura ?? "").trim() || null,
        pulso: String(pulso ?? "").trim() || null,
        presion_arterial: String(presionArterial ?? "").trim() || null,
        peso: String(peso ?? "").trim() || null,
        talla: String(talla ?? "").trim() || null,
        proxima_cita: parsedProximaCita,
        gmt: parsedGmt,
        tx: String(tx ?? "").trim() || null,
        labs: String(labs ?? "").trim() || null,
        age_at_visit: parsedAge,
        age: parsedAge,
      }

      if (isEditing && initialRecord?.id) {
        payload.updated_at = new Date().toISOString()
        const { error: updateError } = await supabase
          .from("medical_records")
          .update(payload)
          .eq("id", initialRecord.id)

        if (updateError) throw updateError
      } else {
        const { error: recordError } = await supabase
          .from("medical_records")
          .insert([payload])

        if (recordError) throw recordError

        // Actualizar cita a completada si existe appointmentId válido
        if (appointmentId && appointmentId !== "00000000-0000-0000-0000-000000000000") {
          try {
            await supabase
              .from("appointments")
              .update({ status: "completed", attended_at: new Date().toISOString() })
              .eq("id", appointmentId)
          } catch {}
        }
      }

      localStorage.removeItem(draftKey)
      onSuccess()
    } catch (err: any) {
      console.error("Error al guardar la consulta médica:", err)
      const message = err?.message || (typeof err === "string" ? err : "Error desconocido")
      const details = err?.details ? ` - Detalle: ${err.details}` : ""
      const hint = err?.hint ? ` (${err.hint})` : ""
      alert(`Error al guardar la consulta: ${message}${details}${hint}`)
    } finally {
      setLoading(false)
    }
  }

  // Guardar automáticamente en localStorage cuando cualquier campo cambie
  useEffect(() => {
    if (isEditing || typeof window === "undefined") return
    const data = {
      edad,
      respiracion,
      temperatura,
      pulso,
      presionArterial,
      peso,
      talla,
      motivoConsulta,
      tx,
      gmt,
      diagnosis,
      conductaASeguir,
      proximaCita,
      labs,
    }
    localStorage.setItem(draftKey, JSON.stringify(data))
  }, [
    isEditing,
    draftKey,
    edad,
    respiracion,
    temperatura,
    pulso,
    presionArterial,
    peso,
    talla,
    motivoConsulta,
    tx,
    gmt,
    diagnosis,
    conductaASeguir,
    proximaCita,
    labs,
  ])

  // Advertir al usuario antes de salir si tiene cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasContent = Boolean(
        respiracion ||
        temperatura ||
        pulso ||
        presionArterial ||
        peso ||
        talla ||
        motivoConsulta ||
        tx ||
        gmt ||
        diagnosis ||
        conductaASeguir ||
        proximaCita ||
        labs
      )
      if (hasContent) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [
    respiracion,
    temperatura,
    pulso,
    presionArterial,
    peso,
    talla,
    motivoConsulta,
    tx,
    gmt,
    diagnosis,
    conductaASeguir,
    proximaCita,
    labs,
  ])
  const handleAddPP = async () => {
    setPpLoading(true)
    const fullName = `${patient.first_name} ${patient.last_name}`
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patient.id || "")
    const newRec = {
      id: `pp-${Date.now()}`,
      patient_id: isUuid ? patient.id : null,
      patient_name: fullName,
      date: getTodayGT(),
      doctor_name: "Dra. Médica",
      status: "pendiente",
      result_notes: "Pendiente — registrado desde ficha clínica",
      created_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from("papanicolaou_records").insert([newRec])
      if (error) throw error
      setPpDone(true)
    } catch {
      setPpDone(true)
    } finally {
      setPpLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const consultationDateDisplay = isEditing && initialRecord?.created_at
    ? formatDateGT(initialRecord.created_at)
    : formatDateGT(getTodayGT())

  return (
    <div className="w-full max-w-4xl mx-auto bg-card border border-primary p-6 shadow-sm print:p-0 print:border-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-primary text-2xl font-bold tracking-tight uppercase">
              {isEditing ? "Editar Ficha Clínica: Adulto" : "Ficha Clínica: Adulto"}
            </h2>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase">Clínica Médica Familiar San Rafael</p>
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
              {consultationDateDisplay}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 border-b border-primary">
          {/* ROW 1: Expediente y Fecha */}
          <Cell colSpan={6} label="No. Expediente" value={patient.no_expediente || patient.id.substring(0,8).toUpperCase()} className="border-b border-r border-primary" />
          <Cell colSpan={6} label="Fecha" value={consultationDateDisplay} className="border-b border-primary" />

          {/* ROW 2: SIGNOS VITALES Y EDAD */}
          <div className="col-span-9 p-2 border-b border-r border-primary bg-primary/10">
            <span className="text-primary text-sm font-bold uppercase">SIGNOS VITALES:</span>
          </div>
          <div className="col-span-3 flex border-b border-primary bg-primary/10">
            <div className="px-2 pt-2 text-primary text-xs font-bold uppercase flex items-center">EDAD:</div>
            <input
              type="text"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Años"
              className="w-full px-2 pb-2 text-sm text-card-foreground font-bold outline-none bg-transparent"
            />
          </div>

          {/* ROW 3: SIGNOS VITALES (CAMPOS DE TEXTO EDITABLES) */}
          <InputCell colSpan={4} label="RESPIRACIÓN" value={respiracion} onChange={setRespiracion} placeholder="Ej: 18 rpm" className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="PRESIÓN ARTERIAL" value={presionArterial} onChange={setPresionArterial} placeholder="Ej: 120/80 mmHg" className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="PESO" value={peso} onChange={setPeso} placeholder="Ej: 130 lbs" className="border-b border-primary" />

          {/* ROW 4: SIGNOS VITALES (CAMPOS DE TEXTO EDITABLES) */}
          <InputCell colSpan={4} label="TEMPERATURA" value={temperatura} onChange={setTemperatura} placeholder="Ej: 36.5 °C" className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="PULSO" value={pulso} onChange={setPulso} placeholder="Ej: 75 lpm" className="border-b border-r border-primary" />
          <InputCell colSpan={4} label="TALLA" value={talla} onChange={setTalla} placeholder="Ej: 1.65 m" className="border-b border-primary" />

          {/* ROW 5 (MOTIVO DE CONSULTA) */}
          <div className="col-span-12 p-2 border-b border-primary bg-primary/10">
            <span className="text-primary text-sm font-bold uppercase">MOTIVO DE CONSULTA E HISTORIA DE LA ENFERMEDAD ACTUAL:</span>
          </div>
          <div className="col-span-12 border-b border-primary p-0 relative">
            <Textarea
              required
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              className="w-full min-h-[110px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm leading-6 align-top bg-transparent relative z-10 p-2"
              style={{
                backgroundImage: 'linear-gradient(transparent, transparent 23px, #e5e7eb 23px, #e5e7eb 24px)',
                backgroundSize: '100% 24px'
              }}
            />
          </div>

          {/* ROW 6: TX Y GMT (ESPACIOS EDITABLES) */}
          <div className="col-span-12 grid grid-cols-12 border-b border-primary">
            <div className="col-span-6 border-r border-primary flex flex-col">
              <div className="p-2 bg-primary/10 border-b border-primary">
                <span className="text-primary text-sm font-bold uppercase">TX (Tratamiento / Esquema):</span>
              </div>
              <Textarea
                rows={2}
                placeholder="Escribir tratamiento o esquema TX..."
                value={tx}
                onChange={(e) => setTx(e.target.value)}
                className="w-full resize-none border-0 rounded-none focus-visible:ring-0 text-sm p-2 bg-transparent"
              />
            </div>
            <div className="col-span-6 flex flex-col">
              <div className="p-2 bg-primary/10 border-b border-primary">
                <span className="text-primary text-sm font-bold uppercase">GMT (Glucosa / Notas GMT):</span>
              </div>
              <Textarea
                rows={2}
                placeholder="Escribir valor o notas GMT..."
                value={gmt}
                onChange={(e) => setGmt(e.target.value)}
                className="w-full resize-none border-0 rounded-none focus-visible:ring-0 text-sm p-2 bg-transparent"
              />
            </div>
          </div>

          {/* ROW 7: DIAGNÓSTICO A LA IZQUIERDA | PRÓXIMA CITA Y RECUADRO LABS A LA DERECHA */}
          <div className="col-span-12 flex border-b border-primary">
            <div className="flex-1 border-r border-primary flex flex-col">
              <div className="p-2 bg-primary/10 border-b border-primary">
                <span className="text-primary text-sm font-bold uppercase">DIAGNÓSTICO:</span>
              </div>
              <Textarea
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full flex-1 min-h-[140px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm p-2 bg-transparent"
              />
            </div>
            <div className="w-72 flex flex-col">
              {/* PRÓXIMA CITA */}
              <div className="p-2 flex gap-2 border-b border-primary bg-primary/5">
                <span className="text-primary text-sm font-bold uppercase text-nowrap">PRÓXIMA CITA:</span>
                <input
                  type="date"
                  value={proximaCita}
                  onChange={(e) => setProximaCita(e.target.value)}
                  className="w-full text-sm outline-none text-red-600 font-bold bg-transparent"
                />
              </div>

              {/* RECUADRO LABS (ABAJO DE PRÓXIMA CITA) */}
              <div className="flex-1 p-2 flex flex-col bg-muted/10">
                <span className="text-primary text-xs font-bold uppercase mb-1">LABS (Laboratorios a realizar):</span>
                <Textarea
                  rows={4}
                  placeholder="Escribir exámenes o laboratorios requeridos..."
                  value={labs}
                  onChange={(e) => setLabs(e.target.value)}
                  className="w-full flex-1 resize-none border border-primary/30 rounded-md focus-visible:ring-1 text-xs p-1.5 bg-background leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* ROW 8: CONDUCTA Y FIRMA */}
          <div className="col-span-12 flex">
            <div className="flex-1 border-r border-primary flex flex-col">
              <div className="p-2 bg-primary/10 border-b border-primary">
                <span className="text-primary text-sm font-bold uppercase">CONDUCTA A SEGUIR:</span>
              </div>
              <Textarea
                value={conductaASeguir}
                onChange={(e) => setConductaASeguir(e.target.value)}
                className="w-full min-h-[110px] resize-none border-0 rounded-none focus-visible:ring-0 text-sm p-2 bg-transparent"
              />
            </div>
            <div className="w-72 flex flex-col justify-end items-center p-4">
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
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Ficha Médica"}
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

function InputCell({
  colSpan,
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  colSpan: number
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
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
        placeholder={placeholder}
        className="w-full px-2 pb-2 text-sm text-card-foreground font-medium outline-none bg-transparent"
      />
    </div>
  )
}
