"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, MapPin } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { normalizePhoneNumber } from "@/lib/date-utils"

export function AddPatientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    birth_date: "",
    gender: "Femenino",
    phone: "",
    direccion: "",
    talla: "",
    peso: "",
    alergias: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const cleanAllergies = formData.alergias.trim() || null
    const cleanPhone = formData.phone.trim() || null
    const cleanAddress = formData.direccion.trim() || null

    const newPatientData: any = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      age: formData.age ? parseInt(formData.age, 10) : null,
      birth_date: formData.birth_date || null,
      gender: formData.gender,
      phone: cleanPhone,
      direccion: cleanAddress,
      address: cleanAddress,
      talla: formData.talla ? formData.talla.trim() : null,
      peso: formData.peso ? formData.peso.trim() : null,
      alergias: cleanAllergies,
      allergies: cleanAllergies,
      status: "Activo",
    }

    try {
      const { error } = await supabase.from("patients").insert([newPatientData])
      if (error) {
        if (error.message?.includes("status")) {
          delete newPatientData.status
          const { error: retryError } = await supabase.from("patients").insert([newPatientData])
          if (retryError) throw retryError
        } else {
          throw error
        }
      }

      router.push("/pacientes")
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al guardar el paciente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
      {errorMsg && (
        <div className="mb-4 rounded-xl bg-destructive/15 p-4 text-sm text-destructive font-semibold">
          Error: {errorMsg}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: First Name + Last Name */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-sm font-bold text-card-foreground">
              Nombre(s) *
            </Label>
            <Input
              id="first_name"
              placeholder="Ej: María Alejandra"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-sm font-bold text-card-foreground">
              Apellido(s) *
            </Label>
            <Input
              id="last_name"
              placeholder="Ej: López Gómez"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Row 2: Age + Birth Date + Gender + Phone */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-bold text-card-foreground">
              Edad (Años) *
            </Label>
            <Input
              id="age"
              type="number"
              min="0"
              max="130"
              placeholder="35"
              required
              value={formData.age}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date" className="text-sm font-bold text-card-foreground">
              Fecha de Nacimiento
            </Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-card-foreground">
              Sexo / Género *
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(val) => setFormData({ ...formData, gender: val })}
            >
              <SelectTrigger className="h-11 rounded-xl text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Femenino">Femenino</SelectItem>
                <SelectItem value="Masculino">Masculino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-bold text-card-foreground">
              Teléfono (Opcional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej: 5222-0371"
              value={formData.phone}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Row 3: Address + Allergies */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-sm font-bold text-card-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Dirección
            </Label>
            <Input
              id="direccion"
              placeholder="Panajachel, Sololá"
              value={formData.direccion}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alergias" className="text-sm font-bold text-card-foreground">
              Alergias Conocidas
            </Label>
            <Input
              id="alergias"
              placeholder="Ej: Penicilina, AINES..."
              value={formData.alergias}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Row 4: Height + Weight */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="talla" className="text-sm font-bold text-card-foreground">
              Talla (m) <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
            </Label>
            <Input
              id="talla"
              type="text"
              placeholder="Ej: 1.65"
              value={formData.talla}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="peso" className="text-sm font-bold text-card-foreground">
              Peso (lbs) <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
            </Label>
            <Input
              id="peso"
              type="text"
              placeholder="Ej: 145"
              value={formData.peso}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-md"
          >
            <Save className="mr-2 h-5 w-5" />
            {loading ? "Guardando en base de datos..." : "Guardar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  )
}
