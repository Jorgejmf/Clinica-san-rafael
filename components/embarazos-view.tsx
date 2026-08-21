"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Printer, HeartPulse, User, Calendar, FileSpreadsheet, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { supabase } from "@/lib/supabase"

type Patient = {
  id: string
  first_name: string
  last_name: string
  age?: number
  birth_date?: string
  gender?: string
  sexo?: string
  genero?: string
}

function PatientAutocomplete({
  patients,
  onSelect,
  placeholder = "Buscar paciente...",
  initialValue = "",
}: {
  patients: Patient[]
  onSelect: (patient: Patient | null) => void
  placeholder?: string
  initialValue?: string
}) {
  const [query, setQuery] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (initialValue) setQuery(initialValue)
  }, [initialValue])

  const filtered = useMemo(() => {
    return query
      ? patients.filter((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        return fullName.includes(query.toLowerCase())
      })
      : patients
  }, [patients, query])

  const handleSelect = (patient: Patient) => {
    const name = `${patient.first_name} ${patient.last_name}`
    setQuery(name)
    setIsOpen(false)
    onSelect(patient)
  }

  const handleClear = () => {
    setQuery("")
    onSelect(null)
  }

  return (
    <div className="relative w-[260px]">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="h-10 rounded-xl pr-8 text-sm font-semibold bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold"
          >
            ✕
          </button>
        )}
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-md">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-left hover:bg-accent hover:text-accent-foreground cursor-pointer font-medium"
            >
              {p.first_name} {p.last_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type PregnancyControl = {
  id: string
  fecha: string
  semanas: string
  pesoLbs: string
  gmt: string
  ta: string
  infeccion: "Sí" | "No"
  movimientosFetales: "Presente" | "Ausente" | "No aplica"
  posicionFetal: string
}

type PregnancyRecord = {
  id: string
  patient_id: string
  patient_name: string
  created_at: string
  controls: PregnancyControl[]
}

const FETAL_POSITIONS = [
  "Cefálica",
  "Podálica / Pélvica",
  "Transversa",
  "Oblicua",
  "Cefálica Dorso Izquierdo",
  "Cefálica Dorso Derecho",
  "No evaluable"
]

const createEmptyPregnancyControl = (): PregnancyControl => ({
  id: `ctrl-${Date.now()}`,
  fecha: new Date().toISOString().split("T")[0],
  semanas: "0",
  pesoLbs: "0",
  gmt: "0",
  ta: "120/80",
  infeccion: "No",
  movimientosFetales: "No aplica",
  posicionFetal: "No evaluable",
})

export function EmbarazosView({
  patients = [],
  userRole = "doctora",
}: {
  patients?: Patient[]
  userRole?: string
}) {
  // Solo pacientes femeninas. Si el campo de género está vacío se incluye por defecto.
  const femalePatients = patients.filter((p: any) => {
    const g = (p.gender || p.sexo || p.genero || "").toString().toLowerCase().trim()
    if (!g) return true  // sin dato de género → incluir
    // excluir explícitamente masculino
    if (g === "masculino" || g === "masc" || g === "m" || g === "male" || g === "hombre") return false
    // incluir femenino en cualquier variante
    return g === "femenino" || g === "fem" || g === "f" || g === "female" || g === "mujer"
  })

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    femalePatients.length > 0 ? femalePatients[0] : null
  )
  const [records, setRecords] = useState<PregnancyRecord[]>([])
  const [controls, setControls] = useState<PregnancyControl[]>([])

  // Load patient records
  useEffect(() => {
    if (!selectedPatient) return
    async function loadData() {
      const { data, error } = await supabase
        .from("pregnancy_records")
        .select("*")
        .eq("patient_id", selectedPatient!.id)

      if (!error && data && data.length > 0 && data[0].controls && data[0].controls.length > 0) {
        setControls(data[0].controls)
      } else {
        const local = localStorage.getItem(`pregnancy_${selectedPatient!.id}`)
        if (local) {
          try {
            const parsed = JSON.parse(local)
            setControls(parsed.length > 0 ? parsed : [createEmptyPregnancyControl()])
          } catch {
            setControls([createEmptyPregnancyControl()])
          }
        } else {
          setControls([createEmptyPregnancyControl()])
        }
      }
    }
    loadData()
  }, [selectedPatient])

  const saveControls = (newControls: PregnancyControl[]) => {
    setControls(newControls)
    if (selectedPatient) {
      localStorage.setItem(`pregnancy_${selectedPatient.id}`, JSON.stringify(newControls))
      supabase.from("pregnancy_records").upsert({
        id: `preg-${selectedPatient.id}`,
        patient_id: selectedPatient.id,
        patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        controls: newControls,
        updated_at: new Date().toISOString(),
      })
    }
  }

  const handleAddColumn = () => {
    const lastWeeks = controls.length > 0 ? parseInt(controls[controls.length - 1].semanas || "0") + 2 : 1
    const newControl: PregnancyControl = {
      id: `ctrl-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      semanas: lastWeeks.toString(),
      pesoLbs: controls.length > 0 ? controls[controls.length - 1].pesoLbs : "",
      gmt: "",
      ta: "120/80",
      infeccion: "No",
      movimientosFetales: "Presente",
      posicionFetal: "Cefálica",
    }
    const updated = [...controls, newControl]
    saveControls(updated)
  }

  const handleRemoveColumn = (id: string) => {
    if (controls.length <= 1) {
      alert("Debe mantener al menos una columna de control.")
      return
    }
    const updated = controls.filter((c) => c.id !== id)
    saveControls(updated)
  }

  const handleUpdateControl = (id: string, field: keyof PregnancyControl, val: string) => {
    const updated = controls.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    saveControls(updated)
  }

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Chunk controls into blocks of 4 for print/PDF layout so no columns are clipped
  const CHUNK_SIZE = 4
  const controlChunks: PregnancyControl[][] = []
  for (let i = 0; i < controls.length; i += CHUNK_SIZE) {
    controlChunks.push(controls.slice(i, i + CHUNK_SIZE))
  }

  const handleDownloadCSV = () => {
    if (!selectedPatient) return
    let csv = "\uFEFF"
    csv += `Control Obstétrico: ${selectedPatient.first_name} ${selectedPatient.last_name}\n`
    csv += `Expediente: #${selectedPatient.id}\n\n`

    const headers = ["Parámetro / Fila", ...controls.map((c, i) => `"Control #${i + 1} (${c.fecha})"`)]
    csv += headers.join(",") + "\n"

    csv += ["1. Semanas (Gestación)", ...controls.map((c) => c.semanas)].join(",") + "\n"
    csv += ["2. Peso (lbs)", ...controls.map((c) => c.pesoLbs)].join(",") + "\n"
    csv += ["3. GMT (Glucemia)", ...controls.map((c) => c.gmt)].join(",") + "\n"
    csv += ["4. TA (Tensión Arterial)", ...controls.map((c) => `"${c.ta}"`)].join(",") + "\n"
    csv += ["5. Infección", ...controls.map((c) => `"${c.infeccion}"`)].join(",") + "\n"
    csv += ["6. Movimientos Fetales", ...controls.map((c) => `"${c.movimientosFetales}"`)].join(",") + "\n"
    csv += ["7. Posición Fetal", ...controls.map((c) => `"${c.posicionFetal}"`)].join(",") + "\n"

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Control_Obstetrico_${selectedPatient.first_name}_${selectedPatient.last_name}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadPDF = async () => {
    if (!selectedPatient) return
    const reportEl = document.getElementById("printable-embarazos-report")
    if (!reportEl) return

    setIsGeneratingPDF(true)
    reportEl.classList.remove("hidden")
    reportEl.classList.add("block")

    try {
      const canvas = await html2canvas(reportEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft >= 10) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`Control_Obstetrico_${selectedPatient.first_name}_${selectedPatient.last_name}.pdf`)
    } catch (err) {
      console.error("Error al generar el PDF:", err)
      window.print()
    } finally {
      reportEl.classList.remove("block")
      reportEl.classList.add("hidden")
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-5 rounded-2xl border border-border shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Control Obstétrico y Embarazos
            </h2>
            <p className="text-xs text-muted-foreground">
              Seguimiento semanal de controles gestacionales
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <PatientAutocomplete
              patients={femalePatients}
              placeholder="Buscar paciente (solo mujeres)..."
              initialValue={selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : ""}
              onSelect={(patient) => {
                if (patient) setSelectedPatient(patient)
              }}
            />
          </div>

          <Button
            onClick={handleAddColumn}
            className="h-10 rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Columna
          </Button>

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-10 rounded-xl gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Tabla
          </Button>
        </div>
      </div>

      {/* Patient Header printable badge */}
      {selectedPatient && (
        <div className="bg-pink-50/60 border border-pink-200 rounded-2xl p-4 flex items-center justify-between print:hidden">
          <div>
            <h3 className="font-bold text-pink-950 text-base">
              Paciente: {selectedPatient.first_name} {selectedPatient.last_name}
            </h3>
            <p className="text-xs text-pink-700">
              Expediente: #{selectedPatient.id.substring(0, 8).toUpperCase()} | Edad: {selectedPatient.age || "—"} años
            </p>
          </div>
          <Badge className="bg-pink-600 text-white font-medium">Control Gestacional</Badge>
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs print:hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-left">
              <th className="p-3 font-bold text-foreground w-[220px] min-w-[200px] border-r border-border uppercase text-xs tracking-wider">
                Parámetro / Fila
              </th>
              {controls.map((ctrl, idx) => (
                <th key={ctrl.id} className="p-3 min-w-[160px] text-center border-r border-border bg-pink-50/30">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-pink-900 text-xs">
                      Control #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(ctrl.id)}
                      className="text-gray-400 hover:text-red-600 print:hidden"
                      title="Eliminar columna"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input
                    type="date"
                    value={ctrl.fecha}
                    onChange={(e) => handleUpdateControl(ctrl.id, "fecha", e.target.value)}
                    className="h-8 text-xs text-center rounded-lg bg-white"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* ROW 1: Semanas */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                1. Semanas (Gestación)
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Input
                    type="number"
                    min="1"
                    max="45"
                    placeholder="Semanas"
                    value={ctrl.semanas}
                    onChange={(e) => handleUpdateControl(ctrl.id, "semanas", e.target.value)}
                    className="h-9 text-center font-bold rounded-xl"
                  />
                </td>
              ))}
            </tr>

            {/* ROW 2: Peso (lbs) */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                2. Peso (lbs)
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="lbs"
                    value={ctrl.pesoLbs}
                    onChange={(e) => handleUpdateControl(ctrl.id, "pesoLbs", e.target.value)}
                    className="h-9 text-center font-semibold rounded-xl"
                  />
                </td>
              ))}
            </tr>

            {/* ROW 3: GMT */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                3. GMT (Glucemia)
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="mg/dL"
                    value={ctrl.gmt}
                    onChange={(e) => handleUpdateControl(ctrl.id, "gmt", e.target.value)}
                    className="h-9 text-center rounded-xl"
                  />
                </td>
              ))}
            </tr>

            {/* ROW 4: TA */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                4. TA (Tensión Arterial)
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Input
                    type="text"
                    placeholder="Ej: 120/80"
                    value={ctrl.ta}
                    onChange={(e) => handleUpdateControl(ctrl.id, "ta", e.target.value)}
                    className="h-9 text-center font-mono text-xs rounded-xl"
                  />
                </td>
              ))}
            </tr>

            {/* ROW 5: Infección */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                5. Infección
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Select
                    value={ctrl.infeccion}
                    onValueChange={(val) => handleUpdateControl(ctrl.id, "infeccion", val as any)}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sí">Sí</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              ))}
            </tr>

            {/* ROW 6: Movimientos Fetales */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                6. Movimientos Fetales
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Select
                    value={ctrl.movimientosFetales}
                    onValueChange={(val) => handleUpdateControl(ctrl.id, "movimientosFetales", val as any)}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presente">Presente</SelectItem>
                      <SelectItem value="Ausente">Ausente</SelectItem>
                      <SelectItem value="No aplica">No aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              ))}
            </tr>

            {/* ROW 7: Posición Fetal */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                7. Posición Fetal
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Select
                    value={ctrl.posicionFetal}
                    onValueChange={(val) => handleUpdateControl(ctrl.id, "posicionFetal", val)}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FETAL_POSITIONS.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* REPORTES PARA IMPRESIÓN Y DESCARGA PDF (tablas divididas por bloques de 4 para no cortar columnas) */}
      <div id="printable-embarazos-report" className="hidden print:block p-4 space-y-6 bg-white text-black">
        {selectedPatient && (
          <div className="border-2 border-pink-600 rounded-xl p-4 bg-pink-50/50 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-pink-950 uppercase tracking-tight">
                Control Obstétrico: {selectedPatient.first_name} {selectedPatient.last_name}
              </h1>
              <p className="text-xs text-pink-800 font-semibold mt-0.5">
                Clínica Médica San Rafael | Expediente: #{selectedPatient.id.substring(0, 8).toUpperCase()} | Edad: {selectedPatient.age || "—"} años
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-pink-700 text-white font-bold text-xs px-3 py-1 rounded-lg uppercase tracking-wider">
                Control Gestacional
              </span>
              <p className="text-[10px] text-gray-500 mt-1">Impreso: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Bloques de tablas para que no se corten columnas horizontalmente */}
        {controlChunks.map((chunk, chunkIdx) => (
          <div key={chunkIdx} className="mb-6 break-inside-avoid print-card">
            <div className="text-xs font-bold text-pink-950 mb-2 flex items-center justify-between border-b border-pink-200 pb-1">
              <span>Seguimiento de Embarazo — Controles {chunkIdx * CHUNK_SIZE + 1} a {chunkIdx * CHUNK_SIZE + chunk.length} (de {controls.length})</span>
              <span className="text-[10px] text-pink-700 font-semibold">Bloque {chunkIdx + 1}</span>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-pink-100/80 border-b border-slate-300">
                  <th className="p-2.5 font-bold text-slate-900 text-left w-[210px] border-r border-slate-300 uppercase text-[11px]">
                    Parámetro / Fila
                  </th>
                  {chunk.map((ctrl, i) => (
                    <th key={ctrl.id} className="p-2.5 font-bold text-pink-950 text-center border-r border-slate-300">
                      Control #{chunkIdx * CHUNK_SIZE + i + 1}
                      <div className="text-[11px] font-semibold text-pink-700 mt-0.5">{ctrl.fecha}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">1. Semanas (Gestación)</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-bold border-r border-slate-300">{c.semanas} sem</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">2. Peso (lbs)</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-semibold border-r border-slate-300">{c.pesoLbs} lbs</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">3. GMT (Glucemia)</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-semibold border-r border-slate-300">{c.gmt || "—"}</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">4. TA (Tensión Arterial)</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-mono font-bold border-r border-slate-300">{c.ta}</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">5. Infección</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-semibold border-r border-slate-300">{c.infeccion}</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">6. Movimientos Fetales</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-semibold border-r border-slate-300">{c.movimientosFetales}</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">7. Posición Fetal</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-bold border-r border-slate-300">{c.posicionFetal}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Estilos de impresión: distribución inteligente multi-hoja */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 6mm; }
          body { background: white !important; color: black !important;
                 -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden, [class*='print:hidden'] { display: none !important; }
          .overflow-x-auto { overflow: visible !important; width: 100% !important; }
          table { width: 100% !important; border-collapse: collapse !important; font-size: 8.5pt !important; table-layout: auto !important; page-break-inside: auto !important; }
          thead { display: table-header-group !important; }
          tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          th, td { padding: 3px 5px !important; border: 1px solid #cbd5e1 !important; font-size: 8.5pt !important; word-wrap: break-word !important; }
          input[type='text'], input[type='number'], input[type='date'] {
            border: none !important; background: transparent !important;
            box-shadow: none !important; font-size: 8.5pt !important;
            padding: 0 !important; width: 100% !important; text-align: center !important;
          }
          .space-y-6 > * + * { margin-top: 0.75rem !important; }
        }
      `}</style>
    </div>
  )
}
