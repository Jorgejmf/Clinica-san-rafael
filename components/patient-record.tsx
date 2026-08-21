"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Plus,
  Printer,
  Stethoscope,
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { DOCTOR_ID } from "@/lib/constants"
import { FichaClinicaForm } from "./ficha-clinica-form"

type PatientRecordProps = {
  patient: any
  appointments: any[]
  medicalRecords: any[]
  userRole?: string
  userDoctorId?: string
}

export type PatientDocument = {
  id: string
  patient_id: string
  title: string
  type: "Examen" | "Ecografía" | "Laboratorio" | "Otro"
  file_name: string
  file_url: string
  created_at: string
}

export function PatientRecord({
  patient,
  appointments,
  medicalRecords,
  userRole = "secretaria",
  userDoctorId,
}: PatientRecordProps) {
  const router = useRouter()
  const isAdmin = userRole === "admin"
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [previewPdf, setPreviewPdf] = useState<PatientDocument | null>(null)

  // Medical Records State & Fallback Loader
  const [recordsList, setRecordsList] = useState<any[]>(medicalRecords || [])

  useEffect(() => {
    setRecordsList(medicalRecords || [])
  }, [medicalRecords])

  useEffect(() => {
    async function fetchRecords() {
      if (!patient?.id) return
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })

      if (!error && data && data.length > 0) {
        setRecordsList(data)
      } else {
        const local = localStorage.getItem(`medical_records_${patient.id}`) || localStorage.getItem("medical_records")
        if (local) {
          try {
            const parsed = JSON.parse(local)
            const filtered = Array.isArray(parsed) ? parsed.filter((r: any) => r.patient_id === patient.id) : []
            if (filtered.length > 0) setRecordsList(filtered)
          } catch {}
        }
      }
    }
    fetchRecords()
  }, [patient?.id])

  // PDF Document State
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [docTitle, setDocTitle] = useState("")
  const [docType, setDocType] = useState<"Examen" | "Ecografía" | "Laboratorio" | "Otro">("Examen")
  const [docFile, setDocFile] = useState<File | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const patientAge = patient.age
    ? `${patient.age} años`
    : patient.birth_date
      ? `${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} años`
      : "—"

  // Load patient PDFs
  useEffect(() => {
    async function loadPdfs() {
      const { data, error } = await supabase
        .from("patient_documents")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setDocuments(data)
      } else {
        if (error) console.error(error)
        setDocuments([])
      }
    }
    loadPdfs()
  }, [patient.id])

  const saveToStatePdfs = (docs: PatientDocument[]) => {
    setDocuments(docs)
  }

  const handleUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle || !docFile) return
    setLoadingPdf(true)

    try {
      const fileExt = docFile.name.split('.').pop()
      const filePath = `${patient.id}/${Date.now()}.${fileExt}`

      // 1. Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('clinical_documents')
        .upload(filePath, docFile, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Obtener la URL pública real HTTP
      const { data: urlData } = supabase.storage
        .from('clinical_documents')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const newDoc: PatientDocument = {
        id: `pdf-${Date.now()}`,
        patient_id: patient.id,
        title: docTitle,
        type: docType,
        file_name: docFile.name,
        file_url: publicUrl,
        created_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("patient_documents").insert([newDoc]).select()

      if (error) {
        throw error
      }
      
      if (data && data.length > 0) {
        setDocuments([data[0], ...documents])
      } else {
        setDocuments([newDoc, ...documents])
      }

      setPdfDialogOpen(false)
      setDocTitle("")
      setDocFile(null)
    } catch (error: any) {
      console.error(error)
      alert(error.message)
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleDeletePdf = async (id: string) => {
    if (!confirm("¿Eliminar este documento PDF?")) return
    const { error } = await supabase.from("patient_documents").delete().eq("id", id)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }
    const updated = documents.filter((d) => d.id !== id)
    saveToStatePdfs(updated)
  }

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={userRole === "doctor" || userRole === "doctora" ? "/citas" : "/pacientes"}>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl print:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Expediente #{patient.no_expediente || patient.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Badge className="status-active border">Activo</Badge>
          <Button variant="outline" size="sm" className="rounded-xl gap-2 text-muted-foreground" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Nueva Consulta
              </Button>
            </DialogTrigger>

            {/* DIALOG — Ficha Clínica tipo papel */}
            <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 border-none bg-transparent shadow-none max-h-[95vh] overflow-y-auto">
              <DialogTitle className="sr-only">Nueva Ficha Clínica</DialogTitle>
              {dialogOpen && (
                <FichaClinicaForm
                  patient={patient}
                  doctorId={userDoctorId || DOCTOR_ID}
                  onCancel={() => setDialogOpen(false)}
                  onSuccess={() => {
                    setDialogOpen(false)
                    router.refresh()
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Patient summary card */}
      <div className="rounded-2xl border border-primary/20 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 bg-primary px-5 py-2.5">
          <Stethoscope className="h-4 w-4 text-primary-foreground" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground">
            Datos del Paciente
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-5">
          <SummaryCell label="Nombre" value={`${patient.first_name} ${patient.last_name}`} />
          <SummaryCell label="Edad" value={patientAge} />
          <SummaryCell label="Teléfono" value={patient.phone || "—"} />
          <SummaryCell label="Dirección" value={patient.direccion || "—"} icon={<MapPin className="h-3 w-3 text-primary inline mr-1" />} />
          <SummaryCell
            label="No. Expediente"
            value={patient.no_expediente || patient.id.substring(0, 8).toUpperCase()}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="historial" className="w-full">
        <TabsList className="w-full justify-start rounded-xl bg-muted/50 p-1 overflow-x-auto print:hidden">
          <TabsTrigger value="historial" className="rounded-lg text-sm gap-2">
            <ClipboardList className="h-4 w-4" />
            Historial Clínico
          </TabsTrigger>
          <TabsTrigger value="pdf" className="rounded-lg text-sm gap-2">
            <FileText className="h-4 w-4" />
            Documentos & PDF ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="visitas" className="rounded-lg text-sm gap-2">
            <Calendar className="h-4 w-4" />
            Citas
          </TabsTrigger>
        </TabsList>

        {/* HISTORIAL TAB */}
        <TabsContent value="historial" className="mt-4 space-y-4 print:block print:!visible">
          {recordsList.length > 0 ? (
            recordsList.map((record) => (
              <ClinicalRecordCard key={record.id} record={record} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-card py-16 text-center">
              <ClipboardList className="h-10 w-10 text-primary/30 mb-3" />
              <p className="text-sm font-medium text-gray-500">Sin registros médicos</p>
              <p className="text-xs text-gray-400 mt-1">
                Presiona &quot;Nueva Consulta&quot; para registrar la primera ficha clínica.
              </p>
            </div>
          )}
        </TabsContent>

        {/* PDF TAB */}
        <TabsContent value="pdf" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-card-foreground">
              Exámenes y Ecografías (Archivos PDF)
            </h3>
            <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 bg-primary text-primary-foreground">
                  <Upload className="h-4 w-4" />
                  Agregar Documento PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Adjuntar Examen o Ecografía PDF
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadPdf} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Título / Descripción del Documento</Label>
                    <Input
                      placeholder="Ej: Ecografía abdominal, Hemograma..."
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select value={docType} onValueChange={(val: any) => setDocType(val)}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Examen">Examen de Laboratorio</SelectItem>
                        <SelectItem value="Ecografía">Ecografía / Ultrasonido</SelectItem>
                        <SelectItem value="Laboratorio">Estudio / Radiografía</SelectItem>
                        <SelectItem value="Otro">Otro Documento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Archivo PDF</Label>
                    <Input
                      type="file"
                      accept="application/pdf,image/*"
                      required
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={loadingPdf}
                      className="h-11 rounded-xl bg-primary px-6 text-primary-foreground"
                    >
                      {loadingPdf ? "Guardando..." : "Subir Documento"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-hover hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-card-foreground leading-tight">{doc.title}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] py-0 h-4">
                        {doc.type}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString("es-GT")}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPreviewPdf(doc)}
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                      title="Ver vista previa"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <a href={doc.file_url} download={doc.file_name || "documento.pdf"}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>

                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeletePdf(doc.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No hay exámenes ni ecografías adjuntas.</p>
                <p className="text-xs text-muted-foreground/70">Presiona &quot;Agregar Documento PDF&quot; para subir un archivo.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* VISITAS TAB */}
        <TabsContent value="visitas" className="mt-4 print:hidden">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Historial de Citas</h3>
            <div className="space-y-2">
              {appointments.length > 0 ? (
                appointments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{a.reason}</p>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {new Date(a.scheduled_at).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })}
                        {" "}
                        {new Date(a.scheduled_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                    <Badge variant="secondary">{a.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay visitas registradas
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* PDF PREVIEW MODAL */}
      <Dialog open={!!previewPdf} onOpenChange={(open) => !open && setPreviewPdf(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-4 flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              {previewPdf?.title} ({previewPdf?.type})
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full overflow-hidden rounded-xl border border-border mt-2">
            {previewPdf && (
              <iframe
                src={previewPdf.file_url}
                className="w-full h-full"
                title={previewPdf.title}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCell({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-card-foreground leading-tight truncate">{value}</p>
    </div>
  )
}

function ClinicalRecordCard({ record }: { record: any }) {
  const date = new Date(record.created_at)
  const hasVitals = record.respiracion || record.temperatura || record.pulso || record.presion_arterial || record.peso || record.talla

  return (
    <div className="rounded-2xl border border-primary/20 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between bg-primary px-5 py-2.5">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary-foreground" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground">
            Consulta Médica
          </span>
        </div>
        <span className="text-xs text-primary-foreground/80" suppressHydrationWarning>
          {date.toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })}
          {" · "}
          {date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: true })}
        </span>
      </div>

      <div className="bg-card">
        {hasVitals && (
          <div className="border-b border-border bg-primary/5 px-5 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              Signos Vitales
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {record.respiracion && <VitalDisplay label="Resp." value={record.respiracion} unit="rpm" />}
              {record.temperatura && <VitalDisplay label="Temp." value={record.temperatura} unit="°C" />}
              {record.pulso && <VitalDisplay label="Pulso" value={record.pulso} unit="lpm" />}
              {record.presion_arterial && <VitalDisplay label="P.A." value={record.presion_arterial} unit="mmHg" />}
              {record.peso && <VitalDisplay label="Peso" value={record.peso} unit="lbs" />}
              {record.talla && <VitalDisplay label="Talla" value={record.talla} unit="m" />}
            </div>
          </div>
        )}

        {(record.motivo_consulta || record.symptoms) && (
          <RecordSection
            label="Motivo de Consulta"
            value={record.motivo_consulta || record.symptoms}
          />
        )}

        {record.diagnosis && (
          <div className="border-b border-border bg-primary/5 px-5 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary font-bold">
              Diagnóstico
            </p>
            <p className="text-sm text-card-foreground whitespace-pre-wrap">{record.diagnosis}</p>
          </div>
        )}

        {(record.conducta_a_seguir || record.treatment) && (
          <RecordSection
            label="Conducta a Seguir"
            value={record.conducta_a_seguir || record.treatment}
          />
        )}

        {record.proxima_cita && (
          <div className="flex items-center gap-3 border-t border-border bg-primary/5 px-5 py-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Próxima Cita:</span>
            <span className="text-sm text-card-foreground font-medium">
              {new Date(record.proxima_cita).toLocaleDateString("es-GT", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function VitalDisplay({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-semibold text-primary uppercase">{label}</span>
      <span className="text-sm font-bold text-card-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground/70">{unit}</span>
    </div>
  )
}

function RecordSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border px-5 py-3 last:border-0">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">{label}</p>
      <p className="text-sm text-card-foreground whitespace-pre-wrap">{value}</p>
    </div>
  )
}
