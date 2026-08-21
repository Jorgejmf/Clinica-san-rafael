"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Filter, Trash2, MapPin } from "lucide-react"
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

type Patient = {
  id: string
  first_name: string
  last_name: string
  age: number
  phone: string
  direccion?: string
  birth_date: string | null
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

  const calculateAge = (p: Patient) => {
    if (typeof p.age === "number" && !isNaN(p.age)) return p.age
    if (p.birth_date) {
      return new Date().getFullYear() - new Date(p.birth_date).getFullYear()
    }
    return 0
  }

  const handleDeletePatient = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar al paciente ${name}? Esta acción borrará su expediente.`)) return

    const { error } = await supabase.from("patients").delete().eq("id", id)
    if (!error) {
      setPatients(patients.filter((p) => p.id !== id))
      router.refresh()
    } else {
      alert("Error al eliminar paciente: " + error.message)
    }
  }

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const query = search.toLowerCase()
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
      const age = calculateAge(p)

      // Age Category Filter
      if (ageCategory === "nino" && (age < 0 || age > 11)) return false
      if (ageCategory === "adolescente" && (age < 12 || age > 17)) return false
      if (ageCategory === "adulto" && (age < 18 || age > 59)) return false
      if (ageCategory === "adulto_mayor" && age < 60) return false

      // Text Filter
      if (!query) return true
      switch (filterBy) {
        case "id":
          return p.id.toLowerCase().includes(query)
        case "nombre":
          return fullName.includes(query)
        case "telefono":
          return p.phone?.includes(query)
        case "direccion":
          return p.direccion?.toLowerCase().includes(query)
        default:
          return true
      }
    })
  }, [patients, search, ageCategory, filterBy])

  return (
    <div className="space-y-4">
      {/* Search & filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl pl-10 text-base"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="h-11 w-40 rounded-xl">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Por Nombre</SelectItem>
              <SelectItem value="id">Por ID</SelectItem>
              <SelectItem value="telefono">Por Teléfono</SelectItem>
              <SelectItem value="direccion">Por Dirección</SelectItem>
            </SelectContent>
          </Select>

          {/* Age Category Filter */}
          <Select value={ageCategory} onValueChange={setAgeCategory}>
            <SelectTrigger className="h-11 w-44 rounded-xl">
              <SelectValue placeholder="Edad: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Edad: Todos</SelectItem>
              <SelectItem value="nino">Niño (0-11 años)</SelectItem>
              <SelectItem value="adolescente">Adolescente (12-17)</SelectItem>
              <SelectItem value="adulto">Adulto (18-59 años)</SelectItem>
              <SelectItem value="adulto_mayor">Adulto Mayor (60+)</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/pacientes/nuevo">
            <Button className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              Agregar
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                  ID
                </th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                  Nombre
                </th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                  Edad / Categoría
                </th>
                <th className="hidden px-5 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Teléfono
                </th>
                <th className="hidden px-5 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Dirección
                </th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
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

                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {p.id.substring(0, 8)}...
                    </td>
                    <td className="px-5 py-3 font-semibold text-card-foreground">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-card-foreground">{age} años</span>
                        <Badge className={`text-[10px] py-0 h-5 font-semibold ${catBadgeClass}`}>
                          {catLabel}
                        </Badge>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">
                      {p.phone || "—"}
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground md:table-cell max-w-xs truncate">
                      {p.direccion ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          {p.direccion}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/pacientes/${p.id}`}>
                          <Button
                            type="button"
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs"
                          >
                            Ver
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePatient(p.id, `${p.first_name} ${p.last_name}`)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
                    colSpan={6}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    No se encontraron pacientes para el filtro seleccionado
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
