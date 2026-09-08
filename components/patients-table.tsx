"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Filter, Trash2, MapPin, ChevronLeft, ChevronRight, UserCheck, UserX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { normalizePhoneNumber, calculateAgeAtDate } from "@/lib/date-utils"

type Patient = {
  id: string
  first_name: string
  last_name: string
  age?: number
  phone?: string | number
  direccion?: string
  birth_date?: string | null
  status?: string
  estado?: string
  no_expediente?: string
  created_at: string
}

export function PatientsTable({
  initialPatients,
  userRole = "secretaria",
}: {
  initialPatients: Patient[]
  userRole?: string
}) {
  const router = useRouter()
  const isAdmin = userRole === "admin"
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [search, setSearch] = useState("")
  const [filterBy, setFilterBy] = useState("nombre")
  const [ageCategory, setAgeCategory] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")

  // Pagination state (Requerimiento 5)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Reset to page 1 whenever search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterBy, ageCategory, statusFilter])

  const calculateAge = (p: Patient) => {
    if (typeof p.age === "number" && !isNaN(p.age)) return p.age
    if (p.birth_date) {
      const calc = calculateAgeAtDate(p.birth_date)
      if (calc !== null) return calc
    }
    return 0
  }

  const handleDeletePatient = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar al paciente ${name}? Esta acción borrará permanentemente su expediente.`)) return

    const { error } = await supabase.from("patients").delete().eq("id", id)
    if (!error) {
      setPatients(patients.filter((p) => p.id !== id))
      router.refresh()
    } else {
      alert("Error al eliminar paciente: " + error.message)
    }
  }

  // Filtrado exhaustivo con normalización telefónica sobre toda la base (Requerimiento 5)
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const query = search.trim().toLowerCase()
      const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase()
      const age = calculateAge(p)
      const pStatus = (p.status || p.estado || "Activo").toLowerCase()

      // Status Filter
      if (statusFilter === "activo" && pStatus !== "activo") return false
      if (statusFilter === "inactivo" && pStatus !== "inactivo") return false

      // Age Category Filter
      if (ageCategory === "nino" && (age < 0 || age > 11)) return false
      if (ageCategory === "adolescente" && (age < 12 || age > 17)) return false
      if (ageCategory === "adulto" && (age < 18 || age > 59)) return false
      if (ageCategory === "adulto_mayor" && age < 60) return false

      // Text Filter
      if (!query) return true

      switch (filterBy) {
        case "id":
          const exp = (p.no_expediente || p.id || "").toLowerCase()
          return exp.includes(query) || p.id.toLowerCase().includes(query)

        case "nombre":
          return fullName.includes(query)

        case "telefono": {
          const rawPhone = String(p.phone || "").toLowerCase()
          const normPhone = normalizePhoneNumber(p.phone)
          const normQuery = normalizePhoneNumber(query)
          // Normaliza espacios, guiones, paréntesis y prefijo 502
          if (normQuery && normPhone.includes(normQuery)) return true
          return rawPhone.includes(query)
        }

        case "direccion":
          return (p.direccion || "").toLowerCase().includes(query)

        default: {
          // Búsqueda general inteligente si no coincide
          const normPhone = normalizePhoneNumber(p.phone)
          const normQuery = normalizePhoneNumber(query)
          if (normQuery && normPhone.includes(normQuery)) return true
          return (
            fullName.includes(query) ||
            String(p.phone || "").includes(query) ||
            (p.no_expediente || "").toLowerCase().includes(query) ||
            (p.direccion || "").toLowerCase().includes(query)
          )
        }
      }
    })
  }, [patients, search, ageCategory, statusFilter, filterBy])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedPatients = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safeCurrentPage, pageSize])

  return (
    <div className="space-y-4">
      {/* Search & filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono normalizado (ej: 5222-0371), expediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="h-11 w-36 rounded-xl text-xs font-semibold">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Por Nombre</SelectItem>
              <SelectItem value="telefono">Por Teléfono</SelectItem>
              <SelectItem value="id">Por Expediente</SelectItem>
              <SelectItem value="direccion">Por Dirección</SelectItem>
            </SelectContent>
          </Select>

          {/* Age Category Filter */}
          <Select value={ageCategory} onValueChange={setAgeCategory}>
            <SelectTrigger className="h-11 w-40 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Edad: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Edad: Todas</SelectItem>
              <SelectItem value="nino">Niño (0-11 años)</SelectItem>
              <SelectItem value="adolescente">Adolescente (12-17)</SelectItem>
              <SelectItem value="adulto">Adulto (18-59)</SelectItem>
              <SelectItem value="adulto_mayor">Adulto Mayor (60+)</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-32 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Estado: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Estado: Todos</SelectItem>
              <SelectItem value="activo">🟢 Activos</SelectItem>
              <SelectItem value="inactivo">⚪ Inactivos</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/pacientes/nuevo">
            <Button className="h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-sm">
              + Agregar Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5 text-left">No. Expediente</th>
                <th className="px-5 py-3.5 text-left">Nombre Completo</th>
                <th className="px-5 py-3.5 text-left">Edad / Categoría</th>
                <th className="hidden px-5 py-3.5 text-left sm:table-cell">Teléfono</th>
                <th className="hidden px-5 py-3.5 text-left md:table-cell">Dirección</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPatients.map((p) => {
                const age = calculateAge(p)
                let catLabel = "Adulto"
                let catBadgeClass = "bg-blue-100 text-blue-700"

                if (age <= 11) {
                  catLabel = "Niño"
                  catBadgeClass = "bg-amber-100 text-amber-700"
                } else if (age <= 17) {
                  catLabel = "Adolescente"
                  catBadgeClass = "bg-purple-100 text-purple-700"
                } else if (age >= 60) {
                  catLabel = "Adulto Mayor"
                  catBadgeClass = "bg-emerald-100 text-emerald-700"
                }

                const statusVal = p.status || p.estado || "Activo"

                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-primary">
                      #{p.no_expediente || p.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-card-foreground">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-card-foreground">{age} años</span>
                        <Badge className={`text-[10px] py-0 h-4 font-bold ${catBadgeClass}`}>
                          {catLabel}
                        </Badge>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 font-medium text-card-foreground sm:table-cell">
                      {p.phone || "—"}
                    </td>
                    <td className="hidden px-5 py-3.5 text-muted-foreground md:table-cell max-w-xs truncate">
                      {p.direccion ? (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          {p.direccion}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge
                        className={`text-[10px] font-bold uppercase ${
                          statusVal === "Activo"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {statusVal}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/pacientes/${p.id}`}>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-xs h-8 px-3"
                          >
                            Expediente
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePatient(p.id, `${p.first_name} ${p.last_name}`)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Eliminar paciente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-muted-foreground space-y-1"
                  >
                    <p className="text-base font-semibold text-foreground">No se encontraron pacientes</p>
                    <p className="text-xs text-muted-foreground">
                      Intenta buscar con otro término, número telefónico o categoría.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN COMPLETA (REQUERIMIENTO 5) */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border px-5 py-3.5 bg-muted/20">
            <div className="text-xs text-muted-foreground font-medium">
              Mostrando <strong>{(safeCurrentPage - 1) * pageSize + 1}</strong> a{" "}
              <strong>{Math.min(safeCurrentPage * pageSize, filtered.length)}</strong> de{" "}
              <strong>{filtered.length}</strong> pacientes encontrados
            </div>

            <div className="flex items-center gap-2 self-center sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="h-8 rounded-xl text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>

              <span className="text-xs font-bold text-foreground px-2">
                Pág. {safeCurrentPage} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="h-8 rounded-xl text-xs gap-1"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
