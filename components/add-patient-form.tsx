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

export function AddPatientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
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

    const newPatientData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      age: formData.age ? parseInt(formData.age) : null,
      gender: formData.gender,
      phone: formData.phone,
      direccion: formData.direccion || null,
      talla: formData.talla ? formData.talla : null,
      peso: formData.peso ? formData.peso : null,
      alergias: formData.alergias || null,
    }

    const { data, error } = await supabase.from("patients").insert([newPatientData])

    setLoading(false)

    if (error) {
      console.error(error)
      setErrorMsg(error.message)
    } else {
      router.push("/pacientes")
      router.refresh()
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
      {errorMsg && (
        <div className="mb-4 rounded-xl bg-destructive/15 p-4 text-sm text-destructive">
          Error: {errorMsg}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: First Name + Last Name */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-sm font-medium text-card-foreground">
              Nombre(s) *
            </Label>
            <Input
              id="first_name"
              placeholder="Juan"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-sm font-medium text-card-foreground">
              Apellido(s) *
            </Label>
            <Input
              id="last_name"
              placeholder="Perez"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Row 2: Age + Gender + Phone + Address */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-card-foreground">
              Edad *
            </Label>
            <Input
              id="age"
              type="number"
              min="0"
              placeholder="35"
              required
              value={formData.age}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-card-foreground">
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
            <Label htmlFor="phone" className="text-sm font-medium text-card-foreground">
              Teléfono *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0000-0000"
              required
              value={formData.phone}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-sm font-medium text-card-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Dirección
            </Label>
            <Input
              id="direccion"
              placeholder="Bo. San Juan, Managua"
              value={formData.direccion}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Row 3: Height (optional) + Weight (optional) + Allergies */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="talla" className="text-sm font-medium text-card-foreground">
                Talla (m)
              </Label>
              <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
            </div>
            <Input
              id="talla"
              type="number"
              step="0.01"
              min="0"
              placeholder="1.70 (opcional)"
              value={formData.talla}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="peso" className="text-sm font-medium text-card-foreground">
                Peso (lbs)
              </Label>
              <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
            </div>
            <Input
              id="peso"
              type="number"
              step="0.1"
              min="0"
              placeholder="150 (opcional)"
              value={formData.peso}
              onChange={handleChange}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alergias" className="text-sm font-medium text-card-foreground">
              Alergias
            </Label>
            <Input
              id="alergias"
              placeholder="Ej. Penicilina"
              value={formData.alergias}
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
            className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Save className="mr-2 h-5 w-5" />
            {loading ? "Guardando..." : "Guardar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  )
}
