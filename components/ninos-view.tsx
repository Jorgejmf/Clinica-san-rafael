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
import { Plus, Trash2, Printer, Baby, LineChart as ChartIcon, User, FileSpreadsheet, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { supabase } from "@/lib/supabase"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

type Patient = {
  id: string
  first_name: string
  last_name: string
  age?: number
  birth_date?: string
}

function PatientAutocomplete({
  patients,
  onSelect,
  placeholder = "Buscar niño/a...",
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
    setQuery(`${patient.first_name} ${patient.last_name}`)
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
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="h-10 rounded-xl pr-8 text-sm font-semibold bg-white"
        />
        {query && (
          <button type="button" onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold">
            ✕
          </button>
        )}
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-md">
          {filtered.map((p) => (
            <button key={p.id} type="button" onMouseDown={() => handleSelect(p)}
              className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-left hover:bg-accent hover:text-accent-foreground cursor-pointer font-medium">
              {p.first_name} {p.last_name} {p.age !== undefined ? `(${p.age}a)` : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type ChildControl = {
  id: string
  fecha: string
  edadMeses: number
  pesoLbs: number
  tallaCm: number
  nutricionTipo: "Normo peso" | "Bajo peso" | "Sobrepeso"
  nutricionGrado: "Leve" | "Moderado" | "Severo" | "N/A"
  tallaTipo: "Talla normal" | "Retardo de crecimiento"
  tallaGrado: "Leve" | "Moderado" | "Severo" | "N/A"
}

// WHO / CDC Standard Normal Reference Percentile Curve (P50 Average Standard)
const STANDARD_GROWTH_REFERENCE = [
  { edadMeses: 0, pesoNormalLbs: 7.3, tallaNormalCm: 50 },
  { edadMeses: 3, pesoNormalLbs: 14.1, tallaNormalCm: 61 },
  { edadMeses: 6, pesoNormalLbs: 17.5, tallaNormalCm: 67 },
  { edadMeses: 9, pesoNormalLbs: 19.8, tallaNormalCm: 71 },
  { edadMeses: 12, pesoNormalLbs: 21.8, tallaNormalCm: 75 },
  { edadMeses: 18, pesoNormalLbs: 24.5, tallaNormalCm: 82 },
  { edadMeses: 24, pesoNormalLbs: 27.5, tallaNormalCm: 87 },
  { edadMeses: 36, pesoNormalLbs: 31.5, tallaNormalCm: 96 },
  { edadMeses: 48, pesoNormalLbs: 36.0, tallaNormalCm: 103 },
  { edadMeses: 60, pesoNormalLbs: 40.5, tallaNormalCm: 110 },
]

export function NinosView({
  patients = [],
  userRole = "doctora",
}: {
  patients?: Patient[]
  userRole?: string
}) {
  // Filter children from DB (age <= 12 or with recent birth_date)
  const childPatients = patients.filter((p) => {
    if (p.age !== undefined && p.age !== null) {
      return p.age <= 12
    }
    if (p.birth_date) {
      const birthYear = new Date(p.birth_date).getFullYear()
      const currentYear = new Date().getFullYear()
      if (birthYear) {
        return currentYear - birthYear <= 12
      }
    }
    return true // fallback to display if age unknown
  })

  const createEmptyChildControl = (): ChildControl => ({
    id: `cctrl-${Date.now()}`,
    fecha: new Date().toISOString().split("T")[0],
    edadMeses: 0,
    pesoLbs: 0,
    tallaCm: 0,
    nutricionTipo: "Normo peso",
    nutricionGrado: "N/A",
    tallaTipo: "Talla normal",
    tallaGrado: "N/A",
  })

  const [selectedChild, setSelectedChild] = useState<Patient | null>(
    childPatients.length > 0 ? childPatients[0] : null
  )

  const [controls, setControls] = useState<ChildControl[]>([])

  // Load child controls
  useEffect(() => {
    if (!selectedChild) return
    async function loadData() {
      const { data, error } = await supabase
        .from("pediatric_records")
        .select("*")
        .eq("patient_id", selectedChild!.id)

      if (!error && data && data.length > 0 && data[0].controls && data[0].controls.length > 0) {
        setControls(data[0].controls)
      } else {
        const local = localStorage.getItem(`pediatric_${selectedChild!.id}`)
        if (local) {
          try {
            const parsed = JSON.parse(local)
            setControls(parsed.length > 0 ? parsed : [createEmptyChildControl()])
          } catch {
            setControls([createEmptyChildControl()])
          }
        } else {
          setControls([createEmptyChildControl()])
        }
      }
    }
    loadData()
  }, [selectedChild])

  const saveControls = (newControls: ChildControl[]) => {
    setControls(newControls)
    if (selectedChild) {
      localStorage.setItem(`pediatric_${selectedChild.id}`, JSON.stringify(newControls))
      supabase.from("pediatric_records").upsert({
        id: `ped-${selectedChild.id}`,
        patient_id: selectedChild.id,
        patient_name: `${selectedChild.first_name} ${selectedChild.last_name}`,
        controls: newControls,
        updated_at: new Date().toISOString(),
      })
    }
  }

  const handleAddColumn = () => {
    const lastAge = controls.length > 0 ? controls[controls.length - 1].edadMeses + 3 : 6
    const newControl: ChildControl = {
      id: `cctrl-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      edadMeses: lastAge,
      pesoLbs: controls.length > 0 ? controls[controls.length - 1].pesoLbs + 2 : 15,
      tallaCm: controls.length > 0 ? controls[controls.length - 1].tallaCm + 3 : 65,
      nutricionTipo: "Normo peso",
      nutricionGrado: "N/A",
      tallaTipo: "Talla normal",
      tallaGrado: "N/A",
    }
    saveControls([...controls, newControl])
  }

  const handleRemoveColumn = (id: string) => {
    if (controls.length <= 1) {
      alert("Debe mantener al menos un registro de control.")
      return
    }
    saveControls(controls.filter((c) => c.id !== id))
  }

  const handleUpdateControl = (id: string, field: keyof ChildControl, val: any) => {
    const updated = controls.map((c) => {
      if (c.id !== id) return c
      const next = { ...c, [field]: val }
      // Auto adjust grades if main classification changes
      if (field === "nutricionTipo" && val === "Normo peso") {
        next.nutricionGrado = "N/A"
      }
      if (field === "tallaTipo" && val === "Talla normal") {
      next.tallaGrado = "N/A"
      }
      return next
    })
    saveControls(updated)
  }

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Chunk controls into blocks of 4 for print and PDF layout so no columns are clipped
  const CHUNK_SIZE = 4
  const controlChunks: ChildControl[][] = []
  for (let i = 0; i < controls.length; i += CHUNK_SIZE) {
    controlChunks.push(controls.slice(i, i + CHUNK_SIZE))
  }

  const handleDownloadCSV = () => {
    if (!selectedChild) return
    let csv = "\uFEFF"
    csv += `Ficha Pediátrica: ${selectedChild.first_name} ${selectedChild.last_name}\n`
    csv += `Expediente: #${selectedChild.id}\n\n`

    const headers = ["Parámetro / Evaluación", ...controls.map((c, i) => `"Visita #${i + 1} (${c.fecha})"`)]
    csv += headers.join(",") + "\n"

    csv += ["1. Edad (meses)", ...controls.map((c) => c.edadMeses)].join(",") + "\n"
    csv += ["2. Peso (lbs)", ...controls.map((c) => c.pesoLbs)].join(",") + "\n"
    csv += ["3. Talla (cm)", ...controls.map((c) => c.tallaCm)].join(",") + "\n"
    csv += ["4. Valoración Nutricional", ...controls.map((c) => `"${c.nutricionTipo} (${c.nutricionGrado})"` )].join(",") + "\n"
    csv += ["5. Evaluación Estatura", ...controls.map((c) => `"${c.tallaTipo} (${c.tallaGrado})"` )].join(",") + "\n"

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Control_Pediatrico_${selectedChild.first_name}_${selectedChild.last_name}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadPDF = async () => {
    if (!selectedChild) return
    const reportEl = document.getElementById("printable-ninos-report")
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

      pdf.save(`Control_Pediatrico_${selectedChild.first_name}_${selectedChild.last_name}.pdf`)
    } catch (err) {
      console.error("Error al generar el PDF:", err)
      window.print()
    } finally {
      reportEl.classList.remove("block")
      reportEl.classList.add("hidden")
      setIsGeneratingPDF(false)
    }
  }

  // Generate chart data comparing child's points with WHO reference standard
  const chartData = STANDARD_GROWTH_REFERENCE.map((ref) => {
    const childMatch = controls.find((c) => Math.abs(c.edadMeses - ref.edadMeses) <= 1.5)
    return {
      edadMeses: `${ref.edadMeses} m`,
      "Peso Niño (lbs)": childMatch ? childMatch.pesoLbs : null,
      "Talla Niño (cm)": childMatch ? childMatch.tallaCm : null,
      "Peso Normal Estándar (lbs)": ref.pesoNormalLbs,
      "Talla Normal Estándar (cm)": ref.tallaNormalCm,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-5 rounded-2xl border border-border shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Baby className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Control Pediátrico de Niños y Curva de Crecimiento
            </h2>
            <p className="text-xs text-muted-foreground">
              Evaluación nutricional y crecimiento de niños de la base de datos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <PatientAutocomplete
              patients={childPatients}
              placeholder="Buscar niño/a..."
              initialValue={selectedChild ? `${selectedChild.first_name} ${selectedChild.last_name}` : ""}
              onSelect={(patient) => { if (patient) setSelectedChild(patient) }}
            />
          </div>

          <Button
            onClick={handleAddColumn}
            className="h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-2"
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
            Imprimir
          </Button>
        </div>
      </div>

      {/* Child Badge Header */}
      {selectedChild && (
        <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 flex items-center justify-between print:hidden">
          <div>
            <h3 className="font-bold text-purple-950 text-base">
              Niño: {selectedChild.first_name} {selectedChild.last_name}
            </h3>
            <p className="text-xs text-purple-700">
              Expediente: #{selectedChild.id.substring(0, 8).toUpperCase()} | Edad: {selectedChild.age || "—"} años
            </p>
          </div>
          <Badge className="bg-purple-600 text-white font-medium">Ficha Pediátrica</Badge>
        </div>
      )}

      {/* Pediatric Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs print:hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-left">
              <th className="p-3 font-bold text-foreground w-[240px] min-w-[220px] border-r border-border uppercase text-xs tracking-wider">
                Parámetro / Evaluación
              </th>
              {controls.map((ctrl, idx) => (
                <th key={ctrl.id} className="p-3 min-w-[180px] text-center border-r border-border bg-purple-50/30">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-purple-900 text-xs">
                      Visita #{idx + 1}
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
            {/* ROW 1: Edad */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                1. Edad (en meses)
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Input
                    type="number"
                    min="0"
                    max="144"
                    value={ctrl.edadMeses}
                    onChange={(e) => handleUpdateControl(ctrl.id, "edadMeses", parseFloat(e.target.value) || 0)}
                    className="h-9 text-center font-bold rounded-xl"
                  />
                </td>
              ))}
            </tr>

            {/* ROW 2: Peso (libras) */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                2. Peso (en libras)
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ctrl.pesoLbs}
                    onChange={(e) => handleUpdateControl(ctrl.id, "pesoLbs", parseFloat(e.target.value) || 0)}
                    className="h-9 text-center font-semibold rounded-xl"
                  />
                </td>
              ))}
            </tr>

            {/* ROW 3: Talla (centímetros) */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                3. Talla (en centímetros)
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={ctrl.tallaCm}
                    onChange={(e) => handleUpdateControl(ctrl.id, "tallaCm", parseFloat(e.target.value) || 0)}
                    className="h-9 text-center font-semibold rounded-xl"
                  />
                </td>
              ))}
            </tr>

            {/* ROW 4: Valoración Nutricional */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                4. Valoración Nutricional
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border space-y-1.5">
                  <Select
                    value={ctrl.nutricionTipo}
                    onValueChange={(val) => handleUpdateControl(ctrl.id, "nutricionTipo", val as any)}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normo peso">Normo peso</SelectItem>
                      <SelectItem value="Bajo peso">Bajo peso</SelectItem>
                      <SelectItem value="Sobrepeso">Sobrepeso</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sub-level select for Normo peso, Bajo peso & Sobrepeso */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">Grado:</span>
                    <Select
                      value={ctrl.nutricionGrado}
                      onValueChange={(val) => handleUpdateControl(ctrl.id, "nutricionGrado", val as any)}
                    >
                      <SelectTrigger className="h-7 rounded-lg text-[11px] bg-purple-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">Sin grado (N/A)</SelectItem>
                        <SelectItem value="Leve">Leve</SelectItem>
                        <SelectItem value="Moderado">Moderado</SelectItem>
                        <SelectItem value="Severo">Severo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
              ))}
            </tr>

            {/* ROW 5: Estatura / Talla */}
            <tr>
              <td className="p-3 font-semibold text-foreground bg-muted/20 border-r border-border">
                5. Evaluación de Estatura / Talla
              </td>
              {controls.map((ctrl) => (
                <td key={ctrl.id} className="p-2 border-r border-border space-y-1.5">
                  <Select
                    value={ctrl.tallaTipo}
                    onValueChange={(val) => handleUpdateControl(ctrl.id, "tallaTipo", val as any)}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Talla normal">Talla normal</SelectItem>
                      <SelectItem value="Retardo de crecimiento">Retardo de crecimiento</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sub-level select for Retardo de crecimiento */}
                  {ctrl.tallaTipo === "Retardo de crecimiento" && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-red-600 font-medium">Grado retardo:</span>
                      <Select
                        value={ctrl.tallaGrado}
                        onValueChange={(val) => handleUpdateControl(ctrl.id, "tallaGrado", val as any)}
                      >
                        <SelectTrigger className="h-7 rounded-lg text-[11px] bg-red-50 text-red-700 border-red-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Leve">Leve</SelectItem>
                          <SelectItem value="Moderado">Moderado</SelectItem>
                          <SelectItem value="Severo">Severo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Growth Curve Chart Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <ChartIcon className="h-5 w-5 text-purple-600" />
            <span>Curva de Crecimiento Comparativa (Niño vs Norma Estándar OMS)</span>
          </div>
          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
            Comparativa integrada (Peso y Talla)
          </Badge>
        </div>

        <div className="h-[380px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="edadMeses"
                label={{ value: "Edad (meses)", position: "insideBottom", offset: -10 }}
              />
              <YAxis yAxisId="left" label={{ value: "Peso (lbs)", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: "Talla (cm)", angle: 90, position: "insideRight" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb" }}
              />
              <Legend verticalAlign="top" height={36} />

              {/* Child's actual weight & height curves */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Peso Niño (lbs)"
                stroke="#9333ea"
                strokeWidth={3}
                dot={{ r: 6, fill: "#9333ea" }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Talla Niño (cm)"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 6, fill: "#2563eb" }}
                connectNulls
              />

              {/* WHO Reference standard curves */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Peso Normal Estándar (lbs)"
                stroke="#c084fc"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Talla Normal Estándar (cm)"
                stroke="#60a5fa"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* REPORTES PARA IMPRESIÓN Y DESCARGA PDF (tablas divididas por bloques de 4 para no cortar columnas) */}
      <div id="printable-ninos-report" className="hidden print:block p-4 space-y-6 bg-white text-black">
        {selectedChild && (
          <div className="border-2 border-purple-600 rounded-xl p-4 bg-purple-50/50 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-purple-950 uppercase tracking-tight">
                Control Pediátrico: {selectedChild.first_name} {selectedChild.last_name}
              </h1>
              <p className="text-xs text-purple-800 font-semibold mt-0.5">
                Clínica Médica San Rafael | Expediente: #{selectedChild.id.substring(0, 8).toUpperCase()} | Edad: {selectedChild.age || "—"} años
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-purple-700 text-white font-bold text-xs px-3 py-1 rounded-lg uppercase tracking-wider">
                Ficha Pediátrica
              </span>
              <p className="text-[10px] text-gray-500 mt-1">Impreso: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Bloques de tablas para que no se corten columnas horizontalmente */}
        {controlChunks.map((chunk, chunkIdx) => (
          <div key={chunkIdx} className="mb-6 break-inside-avoid print-card">
            <div className="text-xs font-bold text-purple-950 mb-2 flex items-center justify-between border-b border-purple-200 pb-1">
              <span>Evaluaciones Pediátricas — Visitas {chunkIdx * CHUNK_SIZE + 1} a {chunkIdx * CHUNK_SIZE + chunk.length} (de {controls.length})</span>
              <span className="text-[10px] text-purple-700 font-semibold">Bloque {chunkIdx + 1}</span>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-purple-100/80 border-b border-slate-300">
                  <th className="p-2.5 font-bold text-slate-900 text-left w-[210px] border-r border-slate-300 uppercase text-[11px]">
                    Parámetro / Evaluación
                  </th>
                  {chunk.map((ctrl, i) => (
                    <th key={ctrl.id} className="p-2.5 font-bold text-purple-950 text-center border-r border-slate-300">
                      Visita #{chunkIdx * CHUNK_SIZE + i + 1}
                      <div className="text-[11px] font-semibold text-purple-700 mt-0.5">{ctrl.fecha}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">1. Edad (meses)</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-bold border-r border-slate-300">{c.edadMeses} m</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">2. Peso (lbs)</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-semibold border-r border-slate-300">{c.pesoLbs} lbs</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">3. Talla (cm)</td>
                  {chunk.map(c => <td key={c.id} className="p-2 text-center font-semibold border-r border-slate-300">{c.tallaCm} cm</td>)}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">4. Valoración Nutricional</td>
                  {chunk.map(c => (
                    <td key={c.id} className="p-2 text-center border-r border-slate-300">
                      <div className="font-bold text-slate-900">{c.nutricionTipo}</div>
                      {c.nutricionGrado !== "N/A" && <div className="text-[10px] text-purple-700 font-medium">Grado: {c.nutricionGrado}</div>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-800 bg-slate-50 border-r border-slate-300">5. Evaluación Estatura</td>
                  {chunk.map(c => (
                    <td key={c.id} className="p-2 text-center border-r border-slate-300">
                      <div className="font-bold text-slate-900">{c.tallaTipo}</div>
                      {c.tallaGrado !== "N/A" && <div className="text-[10px] text-red-700 font-medium">Grado: {c.tallaGrado}</div>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Gráfica de Crecimiento para reporte imprimible */}
        <div className="break-inside-avoid border border-slate-300 rounded-xl p-4 bg-white mt-4">
          <h4 className="font-bold text-sm text-purple-950 mb-3 border-b border-slate-200 pb-1">
            Curva de Crecimiento Comparativa (Niño vs Norma Estándar OMS)
          </h4>
          <div className="h-[240px] w-full chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="edadMeses" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Legend verticalAlign="top" height={30} />
                <Line yAxisId="left" type="monotone" dataKey="Peso Niño (lbs)" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="Talla Niño (cm)" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                <Line yAxisId="left" type="monotone" dataKey="Peso Normal Estándar (lbs)" stroke="#c084fc" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="Talla Normal Estándar (cm)" stroke="#60a5fa" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
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
          .print-card, .chart-wrapper { break-inside: avoid !important; page-break-inside: avoid !important; }
          .chart-wrapper { height: 220px !important; max-height: 240px !important; }
          .space-y-6 > * + * { margin-top: 0.75rem !important; }
        }
      `}</style>
    </div>
  )
}
