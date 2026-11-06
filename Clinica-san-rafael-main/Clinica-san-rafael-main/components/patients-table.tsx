"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  MapPin,
  ArrowUpRight,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

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
    if (
      !confirm(
        `¿Está seguro de eliminar al paciente ${name}? Esta acción borrará permanentemente su expediente.`
      )
    )
      return

    const { error } = await supabase.from("patients").delete().eq("id", id)
    if (!error) {
      setPatients(patients.filter((p) => p.id !== id))
      router.refresh()
    } else {
      alert("Error al eliminar paciente: " + error.message)
    }
  }

  // Filtrado exhaustivo con normalización telefónica sobre toda la base
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
        case "id": {
          const exp = (p.no_expediente || p.id || "").toLowerCase()
          return exp.includes(query) || p.id.toLowerCase().includes(query)
        }

        case "nombre":
          return fullName.includes(query)

        case "telefono": {
          const rawPhone = String(p.phone || "").toLowerCase()
          const normPhone = normalizePhoneNumber(p.phone)
          const normQuery = normalizePhoneNumber(query)
          if (normQuery && normPhone.includes(normQuery)) return true
          return rawPhone.includes(query)
        }

        case "direccion":
          return (p.direccion || "").toLowerCase().includes(query)

        default: {
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

  const selectClass =
    "h-9 px-3 pr-8 rounded-xl border border-[#dce8d4] bg-white text-[#42664a] text-xs font-semibold outline-none cursor-pointer appearance-none bg-no-repeat focus:border-[#16834d] focus:ring-2 focus:ring-[#16834d]/20 transition-all"

  return (
    <div className="overflow-hidden border border-[#e1ebda] rounded-[25px_25px_32px_25px] bg-white shadow-[0_9px_30px_#1c503006]">
      {/* Barra de herramientas / Toolbar */}
      <div className="grid gap-3 p-5 border-b border-[#edf4e7] bg-[#faFcf8]" style={{gridTemplateColumns:"1fr auto auto auto"}}>
        <label className="flex items-center gap-2 h-9 px-3 rounded-xl border border-[#dce8d4] bg-white text-[#42664a] text-xs focus-within:border-[#16834d] focus-within:ring-2 focus-within:ring-[#16834d]/20 transition-all">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#86a87c]" aria-hidden="true" />
          <input
            id="search"
            placeholder="Buscar paciente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar pacientes"
            autoComplete="off"
            className="flex-1 bg-transparent outline-none placeholder:text-[#a8c09a] text-xs"
          />
        </label>

        <select
          className={selectClass}
          id="search-field"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          aria-label="Buscar por"
        >
          <option value="nombre">Por nombre</option>
          <option value="telefono">Por teléfono</option>
          <option value="id">Por expediente</option>
          <option value="direccion">Por dirección</option>
        </select>

        <select
          className={selectClass}
          id="age-filter"
          value={ageCategory}
          onChange={(e) => setAgeCategory(e.target.value)}
          aria-label="Filtrar por edad"
        >
          <option value="todos">Edad: todas</option>
          <option value="nino">Niños</option>
          <option value="adolescente">Adolescentes</option>
          <option value="adulto">Adultos</option>
          <option value="adulto_mayor">Adultos mayores</option>
        </select>

        <select
          className={selectClass}
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por estado"
        >
          <option value="todos">Estado: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Barra de conteo de resultados */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#edf4e7] bg-[#f6faf3] text-xs text-[#89997e]">
        <span>
          <strong className="text-[#42664a] font-bold">{filtered.length}</strong> pacientes
        </span>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" aria-label="Lista de pacientes">
          <thead>
            <tr className="border-b border-[#edf4e7]">
              <th scope="col" className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#89997e] bg-[#f9fcf7]">Paciente / expediente</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#89997e] bg-[#f9fcf7]">Edad</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#89997e] bg-[#f9fcf7]">Teléfono</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#89997e] bg-[#f9fcf7]">Dirección</th>
              <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#89997e] bg-[#f9fcf7]">Estado</th>
              <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#89997e] bg-[#f9fcf7]">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedPatients.map((p) => {
              const age = calculateAge(p)
              let catLabel = "Adulto"
              if (age <= 11) catLabel = "Niño"
              else if (age <= 17) catLabel = "Adolescente"
              else if (age >= 60) catLabel = "Adulto mayor"

              const statusVal = p.status || p.estado || "Activo"
              const isInactive = statusVal.toLowerCase() === "inactivo"
              const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Paciente"
              const code = p.no_expediente || p.id.substring(0, 8).toUpperCase()
              const initials =
                fullName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase() || "P"

              // Avatar color based on first letter
              const avatarColors: Record<string, string> = {
                A: "bg-[#dcf5e7] text-[#1a6b3c]",
                B: "bg-[#edfae3] text-[#2d5924]",
                C: "bg-[#e4f5dc] text-[#2d5924]",
                D: "bg-[#dff0d8] text-[#2e6328]",
                E: "bg-[#dcf5e7] text-[#1a6b3c]",
                F: "bg-[#e8f5dc] text-[#3d6b2a]",
                default: "bg-[#e4f5dc] text-[#2d6b1a]",
              }
              const avatarClass = avatarColors[initials[0]] || avatarColors.default

              return (
                <tr
                  key={p.id}
                  className="border-b border-[#f0f7eb] hover:bg-[#faFdf7] transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-9 h-9 rounded-[11px] text-[11px] font-bold shrink-0 ${avatarClass}`}
                        aria-hidden="true"
                      >
                        {initials}
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1e4528]">{fullName}</div>
                        <div className="text-[11px] text-[#8aab80] mt-0.5">#{code}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="block text-[13px] font-semibold text-[#2c5a35]">{age} años</span>
                    <div className="text-[11px] text-[#8aab80] mt-0.5">{catLabel}</div>
                  </td>

                  <td className="px-4 py-3.5 text-[13px] text-[#4a6b52] font-medium">{p.phone || "—"}</td>

                  <td className="px-4 py-3.5">
                    <span className="flex items-start gap-1.5 text-[12px] text-[#7e9074] max-w-[200px]">
                      <MapPin className="h-3 w-3 shrink-0 text-[#16834d] mt-0.5" aria-hidden="true" />
                      <span>{p.direccion || "—"}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                        isInactive
                          ? "bg-[#f1f3ee] text-[#89917f]"
                          : "bg-[#edf7e6] text-[#3e7b3c]"
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${isInactive ? "bg-[#89917f]" : "bg-[#3e7b3c]"}`} />
                      {statusVal}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/pacientes/${encodeURIComponent(p.id)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-[#eef7e7] text-[#2e6e33] text-[11px] font-bold whitespace-nowrap no-underline hover:bg-[#dcf0ce] hover:translate-x-0.5 transition-all duration-150"
                        aria-label={`Ver expediente de ${fullName}`}
                      >
                        <span>Expediente</span>
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </Link>

                      {isAdmin && (
                        <button
                          type="button"
                          className="grid place-items-center w-8 h-8 p-0 border-0 rounded-[9px] text-[#9aab91] bg-transparent cursor-pointer hover:text-[#b85a4a] hover:bg-[#fff2ed] transition-all duration-150"
                          onClick={() => handleDeletePatient(p.id, fullName)}
                          title={`Eliminar paciente ${fullName}`}
                          aria-label={`Eliminar a ${fullName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#869879]">
                  No hay coincidencias con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filtered.length > 0 && (
        <footer className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#eaf0e3] bg-[#fbfdf9] text-[11px] text-[#89997e]">
          <span>
            Mostrando {(safeCurrentPage - 1) * pageSize + 1}–
            {Math.min(safeCurrentPage * pageSize, filtered.length)} de{" "}
            {filtered.length} pacientes
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid place-items-center w-8 h-8 border border-[#e2ecd9] rounded-[10px] text-[#729568] bg-white cursor-pointer text-xs font-bold transition-all hover:bg-[#f2f8ee] hover:border-[#cde0c3] disabled:opacity-35 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <span className="grid place-items-center w-8 h-8 border border-transparent rounded-[10px] text-[#48713e] bg-[#e6f2da] text-xs font-extrabold" aria-current="page">
              {safeCurrentPage}
            </span>

            <button
              type="button"
              className="grid place-items-center w-8 h-8 border border-[#e2ecd9] rounded-[10px] text-[#729568] bg-white cursor-pointer text-xs font-bold transition-all hover:bg-[#f2f8ee] hover:border-[#cde0c3] disabled:opacity-35 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
