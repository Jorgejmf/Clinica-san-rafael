"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Edit,
  Activity,
  UserCheck,
  UserX,
  History,
  Columns2,
  ExternalLink,
  FlaskConical,
  UserCog,
  Save,
  X,
  Phone,
  Mail,
  HeartPulse,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { DOCTOR_ID } from "@/lib/constants"
import { FichaClinicaForm } from "./ficha-clinica-form"
import { formatDateGT, formatDateTimeGT, calculateAgeAtDate } from "@/lib/date-utils"
import { parseClinicalRecord } from "@/lib/clinical-utils"

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
  file_name?: string | null
  file_url: string
  description?: string | null
  created_at: string
}

export function PatientRecord({
  patient: initialPatient,
  appointments,
  medicalRecords,
  userRole = "secretaria",
  userDoctorId,
}: PatientRecordProps) {
  const router = useRouter()
  const isAdmin = userRole === "admin"
  const canEditClinical = userRole === "admin" || userRole === "doctor" || userRole === "doctora"
  const canEditPatientData = userRole === "admin" || userRole === "secretaria" || userRole === "doctor" || userRole === "doctora"

  // Patient live state
  const [patient, setPatient] = useState<any>(initialPatient)
  const [patientStatus, setPatientStatus] = useState<string>(initialPatient.status || initialPatient.estado || "Activo")
  const [statusLoading, setStatusLoading] = useState(false)

  // Edit Patient Personal Data Modal State
  const [editPatientOpen, setEditPatientOpen] = useState(false)
  const [savingPatient, setSavingPatient] = useState(false)
  const [editFirstName, setEditFirstName] = useState(patient.first_name || "")
  const [editLastName, setEditLastName] = useState(patient.last_name || "")
  const [editBirthDate, setEditBirthDate] = useState(patient.birth_date || "")
  const [editGender, setEditGender] = useState(patient.gender || patient.sexo || "Femenino")
  const [editPhone, setEditPhone] = useState(patient.phone || "")
  const [editDireccion, setEditDireccion] = useState(patient.direccion || patient.address || "")
  const [editEmail, setEditEmail] = useState(patient.email || "")
  const [editAlergias, setEditAlergias] = useState(patient.alergias || patient.allergies || "")
  const [editNotes, setEditNotes] = useState(patient.notes || "")
  const [editStatus, setEditStatus] = useState(patient.status || patient.estado || "Activo")

  // Sync state if initialPatient changes
  useEffect(() => {
    setPatient(initialPatient)
    setPatientStatus(initialPatient.status || initialPatient.estado || "Activo")
  }, [initialPatient])

  // Open Edit Patient Modal with current values
  const handleOpenEditPatient = () => {
    setEditFirstName(patient.first_name || patient.nombre || "")
    setEditLastName(patient.last_name || patient.apellido || "")
    setEditBirthDate(patient.birth_date ? patient.birth_date.split("T")[0] : "")
    setEditGender(patient.gender || "Femenino")
    setEditPhone(patient.phone || "")
    setEditDireccion(patient.address || patient.direccion || "")
    setEditEmail(patient.email || "")
    setEditAlergias(patient.alergias || patient.allergies || "")
    setEditNotes(patient.notes || patient.emergency_contact || "")
    setEditStatus(patient.status || patient.estado || "Activo")
    setEditPatientOpen(true)
  }

  // Save Patient Personal Data to Supabase
  const handleSavePatientData = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPatient(true)

    const cleanFirstName = String(editFirstName ?? '').trim()
    const cleanLastName = String(editLastName ?? '').trim()
    const cleanPhone = String(editPhone ?? '').trim() || null
    const cleanAddress = String(editDireccion ?? '').trim() || null
    const cleanEmail = String(editEmail ?? '').trim() || null
    const cleanAllergies = String(editAlergias ?? '').trim() || null
    const cleanNotes = String(editNotes ?? '').trim() || null

    const updatedData: Record<string, any> = {
      first_name: cleanFirstName || null,
      last_name: cleanLastName || null,
      birth_date: editBirthDate || null,
      gender: editGender || "Femenino",
      phone: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      direccion: cleanAddress,
      allergies: cleanAllergies,
      alergias: cleanAllergies,
      notes: cleanNotes,
      status: editStatus || "Activo",
      estado: editStatus || "Activo",
      updated_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase
        .from("patients")
        .update(updatedData)
        .eq("id", patient.id)

      if (error) throw error

      setPatient((prev: any) => ({
        ...prev,
        ...updatedData,
      }))
      setPatientStatus(editStatus || "Activo")
      setEditPatientOpen(false)
      router.refresh()
    } catch (err: any) {
      alert("Error al guardar los datos del paciente: " + (err?.message || "Error"))
    } finally {
      setSavingPatient(false)
    }
  }

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [previewPdf, setPreviewPdf] = useState<PatientDocument | null>(null)

  // Medical Records State & Fallback Loader
  const [recordsList, setRecordsList] = useState<any[]>((medicalRecords || []).map(parseClinicalRecord))

  useEffect(() => {
    setRecordsList((medicalRecords || []).map(parseClinicalRecord))
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
        setRecordsList(data.map(parseClinicalRecord))
      } else {
        const local = localStorage.getItem(`medical_records_${patient.id}`) || localStorage.getItem("medical_records")
        if (local) {
          try {
            const parsed = JSON.parse(local)
            const filtered = Array.isArray(parsed) ? parsed.filter((r: any) => r.patient_id === patient.id) : []
            if (filtered.length > 0) setRecordsList(filtered.map(parseClinicalRecord))
          } catch {}
        }
      }
    }
    fetchRecords()
  }, [patient?.id])

  // Document & Exam State
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [docMode, setDocMode] = useState<"text" | "file">("text")
  const [docTitle, setDocTitle] = useState("")
  const [docType, setDocType] = useState<"Examen" | "Ecografía" | "Laboratorio" | "Otro">("Examen")
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0])
  const [docTextResults, setDocTextResults] = useState("")
  const [docFile, setDocFile] = useState<File | null>(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [viewingTextDoc, setViewingTextDoc] = useState<PatientDocument | null>(null)

  const patientCurrentAge = (() => {
    const calc = calculateAgeAtDate(patient.birth_date, new Date())
    if (calc !== null) return `${calc} años`
    if (patient.age !== undefined && patient.age !== null) return `${patient.age} años`
    return "—"
  })()

  // Load patient documents & exams
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

  // Toggle Patient Status (Activo / Inactivo)
  const handleToggleStatus = async (newStatus: "Activo" | "Inactivo") => {
    if (newStatus === patientStatus) return
    const msg =
      newStatus === "Inactivo"
        ? `¿Desactivar al paciente ${patient.first_name} ${patient.last_name}? Su expediente e historial se conservarán intactos.`
        : `¿Reactivar al paciente ${patient.first_name} ${patient.last_name}?`

    if (!confirm(msg)) return
    setStatusLoading(true)

    try {
      const { error } = await supabase
        .from("patients")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", patient.id)

      if (error) throw error

      setPatientStatus(newStatus)
      setPatient((prev: any) => ({ ...prev, status: newStatus }))
      router.refresh()
    } catch (err: any) {
      alert("Error al actualizar estado del paciente: " + err.message)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docTitle.trim()) return
    setLoadingPdf(true)

    try {
      const createdDate = docDate ? new Date(docDate + "T12:00:00Z").toISOString() : new Date().toISOString()

      if (docMode === "file") {
        if (!docFile) {
          alert("Por favor seleccione un archivo PDF o imagen.")
          setLoadingPdf(false)
          return
        }

        const fileExt = docFile.name.split(".").pop()
        const filePath = `${patient.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("clinical_documents")
          .upload(filePath, docFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from("clinical_documents")
          .getPublicUrl(filePath)

        const publicUrl = urlData.publicUrl

        const newDoc: PatientDocument = {
          id: `pdf-${Date.now()}`,
          patient_id: patient.id,
          title: docTitle.trim(),
          type: docType,
          file_name: docFile.name,
          file_url: publicUrl,
          description: null,
          created_at: createdDate,
        }

        const { data, error } = await supabase.from("patient_documents").insert([newDoc]).select()
        if (error) throw error

        setDocuments([data && data.length > 0 ? data[0] : newDoc, ...documents])
      } else {
        // Transcribed text exam
        if (!docTextResults.trim()) {
          alert("Por favor escriba los resultados del examen.")
          setLoadingPdf(false)
          return
        }

        const newDoc: PatientDocument = {
          id: `doc-txt-${Date.now()}`,
          patient_id: patient.id,
          title: docTitle.trim(),
          type: docType,
          file_name: "Transcripción directa",
          file_url: "",
          description: docTextResults.trim(),
          created_at: createdDate,
        }

        const { data, error } = await supabase.from("patient_documents").insert([newDoc]).select()
        if (error) throw error

        setDocuments([data && data.length > 0 ? data[0] : newDoc, ...documents])
      }

      setPdfDialogOpen(false)
      setDocTitle("")
      setDocTextResults("")
      setDocFile(null)
      setDocDate(new Date().toISOString().split("T")[0])
    } catch (error: any) {
      alert("Error al guardar examen: " + error.message)
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleDeletePdf = async (id: string) => {
    if (!confirm("¿Eliminar este registro de examen?")) return
    const { error } = await supabase.from("patient_documents").delete().eq("id", id)
    if (error) {
      alert(error.message)
      return
    }
    setDocuments(documents.filter((d) => d.id !== id))
  }

  const reloadRecords = async () => {
    const { data } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
    if (data) setRecordsList(data.map(parseClinicalRecord))
    router.refresh()
  }

  // Open Exam / Document in New Tab (Requerimiento 11)
  const handleOpenExamInNewTab = (fileUrl: string) => {
    if (!fileUrl) {
      alert("La URL del documento no está disponible.")
      return
    }
    const newWindow = window.open(fileUrl, "_blank", "noopener,noreferrer")
    if (newWindow) {
      newWindow.opener = null
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. STICKY TOP BAR CON DATOS PRINCIPALES DEL PACIENTE */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 bg-card/95 backdrop-blur-md border-b border-primary/20 px-4 py-3 shadow-md md:-mx-8 md:-mt-8 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={userRole === "doctor" || userRole === "doctora" ? "/citas" : "/pacientes"}>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0 print:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-foreground truncate">
                  {patient.first_name} {patient.last_name}
                </h1>
                <Badge
                  className={`text-[10px] font-bold uppercase transition-all ${
                    patientStatus === "Activo"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {patientStatus === "Activo" ? <UserCheck className="h-3 w-3 mr-1 inline" /> : <UserX className="h-3 w-3 mr-1 inline" />}
                  {patientStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
                <span className="font-mono font-semibold text-primary">
                  Expediente #{patient.no_expediente || patient.id.substring(0, 8).toUpperCase()}
                </span>
                <span>• Edad actual: <strong className="text-foreground">{patientCurrentAge}</strong></span>
                <span>• Tel: <strong className="text-foreground">{patient.phone || "Sin teléfono"}</strong></span>
                {patient.direccion && (
                  <span className="hidden lg:inline truncate max-w-xs">
                    • <MapPin className="h-3 w-3 text-primary inline mr-0.5" /> {patient.direccion}
                  </span>
                )}
                {/* Indicador de Alergias en barra superior */}
                {(() => {
                  const rawAllergies = patient.alergias || patient.allergies || ""
                  const clean = rawAllergies.trim()
                  const lower = clean.toLowerCase()
                  const isNone =
                    lower === "ninguna" ||
                    lower === "niega" ||
                    lower === "sin alergias" ||
                    lower === "no" ||
                    lower === "no conocidas" ||
                    lower === "niega alergias"

                  if (clean && !isNone) {
                    return (
                      <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 font-bold text-[10px] backdrop-blur-sm">
                        ⚠️ Alergias: {clean}
                      </Badge>
                    )
                  } else if (clean && isNone) {
                    return (
                      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] backdrop-blur-sm">
                        ✓ Sin alergias
                      </Badge>
                    )
                  } else {
                    return (
                      <span className="text-[11px] text-muted-foreground italic">
                        • Alergias: Sin registrar
                      </span>
                    )
                  }
                })()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden self-end md:self-auto">
            {/* BOTÓN EDITAR DATOS PERSONALES DEL PACIENTE (REQUERIMIENTO 8) */}
            {canEditPatientData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditPatient}
                className="h-9 rounded-xl gap-1.5 text-xs font-bold border-primary/30 text-primary hover:bg-primary/10"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar Datos
              </Button>
            )}

            {/* Selector Activo / Inactivo */}
            <Select
              value={patientStatus}
              onValueChange={(val: "Activo" | "Inactivo") => handleToggleStatus(val)}
              disabled={statusLoading}
            >
              <SelectTrigger className="h-9 w-28 text-xs font-bold rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">🟢 Activo</SelectItem>
                <SelectItem value="Inactivo">⚪ Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl gap-1.5 text-xs text-muted-foreground"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>

            {/* NUEVA CONSULTA (DISEÑO DIVIDIDO 50/50) */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 rounded-xl gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Consulta
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-[98vw] md:max-w-7xl w-[98vw] p-0 border-none bg-transparent shadow-none max-h-[95vh] overflow-y-auto">
                <DialogTitle className="sr-only">Nueva Consulta: {patient.first_name} {patient.last_name}</DialogTitle>
                {dialogOpen && (
                  <div className="bg-background rounded-2xl p-4 md:p-6 shadow-2xl border border-primary/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Columns2 className="h-5 w-5 text-primary" />
                        <div>
                          <h2 className="text-base font-bold text-foreground">
                            Nueva Consulta: {patient.first_name} {patient.last_name}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Escribe la nueva consulta a la izquierda mientras revisas el historial clínico a la derecha sin perder cambios.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* COLUMNA 1: FORMULARIO NUEVA CONSULTA (50%) */}
                      <div className="w-full">
                        <FichaClinicaForm
                          patient={patient}
                          doctorId={userDoctorId || DOCTOR_ID}
                          onCancel={() => setDialogOpen(false)}
                          onPatientUpdate={(updated) => setPatient((prev: any) => ({ ...prev, ...updated }))}
                          onSuccess={() => {
                            setDialogOpen(false)
                            reloadRecords()
                          }}
                        />
                      </div>

                      {/* COLUMNA 2: EXPEDIENTE CLÍNICO LATERAL (50%) */}
                      <div className="w-full space-y-4 max-h-[80vh] overflow-y-auto pr-1 border-t lg:border-t-0 lg:border-l lg:border-border lg:pl-6">
                        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20">
                          <History className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            Historial Médico del Paciente ({recordsList.length} consultas)
                          </span>
                        </div>

                        {recordsList.length > 0 ? (
                          recordsList.map((rec) => (
                            <ClinicalRecordCard
                              key={rec.id}
                              record={rec}
                              patient={patient}
                              canEdit={false}
                            />
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
                            Sin consultas médicas anteriores registradas.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* 2. RESUMEN DEL PACIENTE */}
      <div className="rounded-2xl border border-primary/25 bg-card/85 backdrop-blur-xl shadow-lg overflow-hidden transition-all">
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/95 to-emerald-500/90 text-primary-foreground px-5 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Expediente Clínico del Paciente
            </span>
          </div>
          <span className="text-xs text-primary-foreground/90 font-medium">
            Fecha de Registro: {formatDateGT(patient.created_at)}
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCell label="Nombre Completo" value={`${patient.first_name} ${patient.last_name}`} />
          <SummaryCell label="Edad Actual" value={patientCurrentAge} />
          <SummaryCell label="Teléfono" value={patient.phone || "Sin teléfono"} />
          <SummaryCell label="Dirección" value={patient.direccion || patient.address || "—"} icon={<MapPin className="h-3 w-3 text-primary inline mr-1" />} />
          <SummaryCell
            label="Alergias Conocidas"
            value={(() => {
              const raw = patient.alergias || patient.allergies || ""
              const clean = raw.trim()
              const lower = clean.toLowerCase()
              const isNone =
                lower === "ninguna" ||
                lower === "niega" ||
                lower === "sin alergias" ||
                lower === "no" ||
                lower === "no conocidas" ||
                lower === "niega alergias"
              if (clean && !isNone) return `⚠️ ${clean}`
              if (clean && isNone) return "Sin alergias conocidas"
              return "Sin registrar"
            })()}
          />
          <SummaryCell
            label="No. Expediente"
            value={patient.no_expediente || patient.id.substring(0, 8).toUpperCase()}
          />
        </div>
      </div>

      {/* 3. TABS PRINCIPALES */}
      <Tabs defaultValue="historial" className="w-full">
        <TabsList className="w-full justify-start rounded-xl bg-muted/50 p-1 overflow-x-auto print:hidden">
          <TabsTrigger value="historial" className="rounded-lg text-sm gap-2">
            <ClipboardList className="h-4 w-4" />
            Historial Clínico ({recordsList.length})
          </TabsTrigger>
          <TabsTrigger value="pdf" className="rounded-lg text-sm gap-2">
            <FileText className="h-4 w-4" />
            Documentos & Exámenes ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="visitas" className="rounded-lg text-sm gap-2">
            <Calendar className="h-4 w-4" />
            Citas Programadas
          </TabsTrigger>
        </TabsList>

        {/* HISTORIAL TAB */}
        <TabsContent value="historial" className="mt-4 space-y-4 print:block print:!visible">
          {recordsList.length > 0 ? (
            recordsList.map((record) => (
              <ClinicalRecordCard
                key={record.id}
                record={record}
                patient={patient}
                canEdit={canEditClinical}
                onEditClick={() => setEditingRecord(record)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-card py-16 text-center">
              <ClipboardList className="h-10 w-10 text-primary/30 mb-3" />
              <p className="text-sm font-medium text-foreground">Sin registros médicos previos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Presiona &quot;Nueva Consulta&quot; para registrar la primera ficha clínica.
              </p>
            </div>
          )}
        </TabsContent>

        {/* PDF TAB (DOCUMENTOS & EXÁMENES - REQUERIMIENTOS 4 & 11) */}
        <TabsContent value="pdf" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">
                Exámenes, Laboratorios y Ecografías del Paciente
              </h3>
              <p className="text-xs text-muted-foreground">
                Resultados transcritos en texto y archivos PDF/imágenes adjuntos
              </p>
            </div>
            <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 bg-primary text-primary-foreground font-semibold">
                  <Upload className="h-4 w-4" />
                  Agregar Examen
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Registrar Examen de Paciente
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSaveDoc} className="space-y-4 pt-2">
                  {/* Selector de Modo: Transcribir Texto vs Adjuntar Archivo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Método de Registro</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={docMode === "text" ? "default" : "outline"}
                        onClick={() => setDocMode("text")}
                        className="rounded-xl h-10 text-xs gap-1.5 font-bold"
                      >
                        <FileText className="h-4 w-4" />
                        Transcribir Resultados (Texto)
                      </Button>
                      <Button
                        type="button"
                        variant={docMode === "file" ? "default" : "outline"}
                        onClick={() => setDocMode("file")}
                        className="rounded-xl h-10 text-xs gap-1.5 font-bold"
                      >
                        <Upload className="h-4 w-4" />
                        Adjuntar Archivo (PDF / Imagen)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Identificación / Nombre del Examen *</Label>
                    <Input
                      placeholder="Ej: Hematología completa, Química sanguínea, Ecografía..."
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Tipo de Examen</Label>
                      <Select value={docType} onValueChange={(val: any) => setDocType(val)}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Examen">Examen de Laboratorio</SelectItem>
                          <SelectItem value="Ecografía">Ecografía / Ultrasonido</SelectItem>
                          <SelectItem value="Laboratorio">Estudio / Radiografía</SelectItem>
                          <SelectItem value="Otro">Otro Examen / Documento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Fecha del Examen</Label>
                      <Input
                        type="date"
                        required
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  {docMode === "text" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Resultados Transcritos del Examen *</Label>
                      <Textarea
                        rows={6}
                        placeholder="Escriba los resultados, valores de laboratorio, parámetros e interpretaciones..."
                        required
                        value={docTextResults}
                        onChange={(e) => setDocTextResults(e.target.value)}
                        className="rounded-xl text-sm leading-relaxed p-3 bg-card"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Archivo PDF o Imagen *</Label>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        required
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPdfDialogOpen(false)}
                      className="rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loadingPdf}
                      className="h-11 rounded-xl bg-primary px-6 text-primary-foreground font-bold"
                    >
                      {loadingPdf ? "Guardando..." : docMode === "text" ? "Guardar Resultados" : "Subir Archivo"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const isTranscribed = Boolean(doc.description && !doc.file_url)

              return (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-hover hover:border-primary/50"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            isTranscribed
                              ? "bg-purple-100 text-purple-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isTranscribed ? (
                            <FlaskConical className="h-6 w-6" />
                          ) : (
                            <FileText className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-card-foreground leading-tight">{doc.title}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] py-0 h-4">
                              {doc.type}
                            </Badge>
                            {isTranscribed && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] py-0 h-4 font-bold">
                                Transcrito
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Excerpt if transcribed text */}
                    {isTranscribed && doc.description && (
                      <div className="mt-3 rounded-xl bg-muted/40 p-2.5 text-xs text-muted-foreground line-clamp-3 font-mono leading-relaxed border border-border/50">
                        {doc.description}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      {formatDateGT(doc.created_at)}
                    </span>

                    <div className="flex items-center gap-1">
                      {isTranscribed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingTextDoc(doc)}
                          className="h-8 rounded-lg text-xs gap-1 text-purple-700 border-purple-300 hover:bg-purple-50 font-bold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver Resultados
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenExamInNewTab(doc.file_url)}
                            className="h-8 rounded-lg text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10 font-semibold"
                            title="Abrir examen en nueva pestaña"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setPreviewPdf(doc)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Vista previa integrada"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <a href={doc.file_url} download={doc.file_name || "examen.pdf"}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              title="Descargar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </>
                      )}

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
              )
            })}

            {documents.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No hay exámenes registrados.</p>
                <p className="text-xs text-muted-foreground/70">Presiona &quot;Agregar Examen&quot; para transcribir resultados o subir un archivo.</p>
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
                      <p className="text-sm font-medium text-card-foreground">{a.reason || "Consulta"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeGT(a.scheduled_at)}
                      </p>
                    </div>
                    <Badge variant="secondary">{a.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay citas registradas
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL PARA EDITAR CONSULTA ANTERIOR (REQUERIMIENTO 9) */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 border-none bg-transparent shadow-none max-h-[95vh] overflow-y-auto">
          <DialogTitle className="sr-only">Editar Consulta Médica Anterior</DialogTitle>
          {editingRecord && (
            <FichaClinicaForm
              patient={patient}
              doctorId={editingRecord.doctor_id || userDoctorId || DOCTOR_ID}
              initialRecord={editingRecord}
              isEditing={true}
              onCancel={() => setEditingRecord(null)}
              onPatientUpdate={(updated) => setPatient((prev: any) => ({ ...prev, ...updated }))}
              onSuccess={() => {
                setEditingRecord(null)
                reloadRecords()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL PARA EDITAR DATOS PERSONALES DEL PACIENTE (REQUERIMIENTO 8) */}
      <Dialog open={editPatientOpen} onOpenChange={setEditPatientOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Editar Datos del Paciente
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePatientData} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-primary">Nombres *</Label>
                <Input
                  required
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-primary">Apellidos *</Label>
                <Input
                  required
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-primary">Fecha de Nacimiento</Label>
                <Input
                  type="date"
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="h-10 rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  Modificar la fecha no alterará las edades registradas en consultas anteriores.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-primary">Sexo / Género</Label>
                <Select value={editGender} onValueChange={setEditGender}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-primary">Teléfono (Opcional)</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Ej: 5555-1234"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-primary">Correo Electrónico</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="paciente@correo.com"
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase text-primary">Dirección de Residencia</Label>
                <Input
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  placeholder="Panajachel, Sololá..."
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase text-primary">Alergias o Condiciones Especiales</Label>
                <Input
                  value={editAlergias}
                  onChange={(e) => setEditAlergias(e.target.value)}
                  placeholder="Penicilina, sulfas, AINES..."
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase text-primary">Notas / Contacto de Emergencia</Label>
                <Textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Nombre y teléfono de familiar de emergencia..."
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-primary">Estado del Paciente</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">🟢 Activo</SelectItem>
                    <SelectItem value="Inactivo">⚪ Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPatientOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingPatient}
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6"
              >
                {savingPatient ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL PARA VER RESULTADO DE EXAMEN TRANSCRITO (TEXTO) */}
      <Dialog open={!!viewingTextDoc} onOpenChange={(open) => !open && setViewingTextDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-6 flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-600" />
                <span className="text-base font-bold text-foreground">
                  {viewingTextDoc?.title}
                </span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-bold">
                  {viewingTextDoc?.type}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {viewingTextDoc && (
            <div className="space-y-4 pt-2 overflow-y-auto flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
                <span>Paciente: <strong className="text-foreground">{patient.first_name} {patient.last_name}</strong></span>
                <span>Fecha: <strong className="text-foreground">{formatDateGT(viewingTextDoc.created_at)}</strong></span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary">
                  Resultados del Examen:
                </Label>
                <div className="p-4 rounded-xl border border-border bg-card whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground shadow-xs">
                  {viewingTextDoc.description}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewingTextDoc?.description) {
                  navigator.clipboard.writeText(
                    `EXAMEN: ${viewingTextDoc.title}\nFECHA: ${formatDateGT(viewingTextDoc.created_at)}\nPACIENTE: ${patient.first_name} ${patient.last_name}\n\nRESULTADOS:\n${viewingTextDoc.description}`
                  )
                  alert("Resultados copiados al portapapeles")
                }
              }}
              className="rounded-xl text-xs gap-1.5"
            >
              Copiar Resultados
            </Button>

            <Button
              type="button"
              onClick={() => setViewingTextDoc(null)}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-6"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF PREVIEW MODAL */}
      <Dialog open={!!previewPdf} onOpenChange={(open) => !open && setPreviewPdf(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-4 flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                <span>{previewPdf?.title} ({previewPdf?.type})</span>
              </div>
              {previewPdf?.file_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenExamInNewTab(previewPdf.file_url)}
                  className="mr-6 text-xs gap-1 text-primary border-primary/30"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir en pestaña nueva
                </Button>
              )}
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

function SummaryCell({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
  const strVal = typeof value === "string" ? value : String(value ?? "")
  const isAlert = strVal.startsWith("⚠️")
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-primary flex items-center">
        {icon}
        {label}
      </p>
      <p className={`mt-0.5 text-sm leading-tight truncate ${isAlert ? "text-red-600 dark:text-red-400 font-bold" : "text-card-foreground font-medium"}`}>
        {strVal || "—"}
      </p>
    </div>
  )
}

function ClinicalRecordCard({
  record,
  patient,
  canEdit = false,
  onEditClick,
}: {
  record: any
  patient: any
  canEdit?: boolean
  onEditClick?: () => void
}) {
  const hasVitals =
    record.respiracion ||
    record.temperatura ||
    record.pulso ||
    record.presion_arterial ||
    record.peso ||
    record.talla

  // Calculate historical age: saved or fallback at consultation date
  const historicalAge = (() => {
    if (record.age !== undefined && record.age !== null) return record.age
    const calc = calculateAgeAtDate(patient?.birth_date, record.created_at)
    if (calc !== null) return calc
    return patient?.age ?? null
  })()

  // Safe checks for GMT and TX (even if GMT is 0)
  const hasGmt = record.gmt !== null && record.gmt !== undefined && record.gmt !== ""
  const hasTx = record.tx !== null && record.tx !== undefined && record.tx !== ""

  return (
    <div className="rounded-2xl border border-primary/30 overflow-hidden shadow-sm bg-card">
      {/* CARD HEADER */}
      <div className="flex flex-wrap items-center justify-between bg-primary/10 border-b border-primary/20 px-5 py-3 gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Consulta Médica
          </span>
          {historicalAge !== null && (
            <Badge variant="outline" className="bg-card text-primary font-bold text-[10px] border-primary/30 ml-2">
              Edad en consulta: {historicalAge} años
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-semibold">
            {formatDateGT(record.created_at)}
          </span>

          {canEdit && onEditClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEditClick}
              className="h-7 rounded-lg text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 font-bold print:hidden"
            >
              <Edit className="h-3.5 w-3.5" />
              Editar Consulta
            </Button>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {/* SIGNOS VITALES */}
        {hasVitals && (
          <div className="bg-primary/5 px-5 py-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              Signos Vitales Registrados
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {record.respiracion && <VitalDisplay label="Resp." value={record.respiracion} unit="rpm" />}
              {record.temperatura && <VitalDisplay label="Temp." value={record.temperatura} unit="°C" />}
              {record.pulso && <VitalDisplay label="Pulso" value={record.pulso} unit="lpm" />}
              {record.presion_arterial && <VitalDisplay label="P.A." value={record.presion_arterial} unit="mmHg" />}
              {record.peso && <VitalDisplay label="Peso" value={record.peso} unit="" />}
              {record.talla && <VitalDisplay label="Talla" value={record.talla} unit="" />}
            </div>
          </div>
        )}

        {/* MOTIVO DE CONSULTA */}
        {(record.motivo_consulta || record.symptoms) && (
          <RecordSection
            label="Motivo de Consulta e Historia de la Enfermedad Actual"
            value={record.motivo_consulta || record.symptoms}
          />
        )}

        {/* SECCIONES GMT Y TX SEPARADAS (REQUERIMIENTO 5) */}
        {(hasTx || hasGmt) && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-primary/5">
            {hasTx && (
              <div className="px-5 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  TX (Tratamiento Previo / Esquema)
                </p>
                <p className="text-sm text-card-foreground whitespace-pre-wrap">{record.tx}</p>
              </div>
            )}
            {hasGmt && (
              <div className="px-5 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  GMT (Glucosa / Notas GMT)
                </p>
                <p className="text-sm text-card-foreground whitespace-pre-wrap">{String(record.gmt)}</p>
              </div>
            )}
          </div>
        )}

        {/* RECUADRO LABS EN HISTORIAL (REQUERIMIENTO 1) */}
        {record.labs && (
          <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-950/20">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              LABS (Laboratorios y Exámenes)
            </p>
            <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">{record.labs}</p>
          </div>
        )}

        {/* DIAGNÓSTICO */}
        {record.diagnosis && (
          <div className="px-5 py-3 bg-muted/20">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Diagnóstico
            </p>
            <p className="text-sm font-semibold text-card-foreground whitespace-pre-wrap">{record.diagnosis}</p>
          </div>
        )}

        {/* CONDUCTA A SEGUIR */}
        {(record.conducta_a_seguir || record.treatment) && (
          <RecordSection
            label="Conducta a Seguir / Tratamiento Prescrito"
            value={record.conducta_a_seguir || record.treatment}
          />
        )}

        {/* PRÓXIMA CITA */}
        {record.proxima_cita && (
          <div className="flex items-center gap-3 bg-primary/5 px-5 py-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase">Próxima Cita de Control:</span>
            <span className="text-sm text-card-foreground font-bold">
              {formatDateGT(record.proxima_cita, { includeWeekday: true, monthFormat: "long" })}
            </span>
          </div>
        )}

        {/* AUDITORÍA */}
        {record.updated_at && (
          <div className="px-5 py-1.5 bg-muted/30 text-[10px] text-muted-foreground text-right">
            Modificado: {formatDateGT(record.updated_at)}
          </div>
        )}
      </div>
    </div>
  )
}

function VitalDisplay({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-[10px] font-bold text-primary uppercase">{label}</span>
      <span className="font-extrabold text-card-foreground">{value}</span>
      {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
    </div>
  )
}

function RecordSection({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">{label}</p>
      <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}
