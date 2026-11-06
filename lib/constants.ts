// Shared constants — safe to import from both client and server components

export type ClinicUser = {
  username: string
  role: "admin" | "doctor" | "doctora" | "secretaria"
  doctorId?: string
  displayName: string
  status?: "Activo" | "Inactivo"
}

export const DOCTOR_ID = "00000000-0000-0000-0000-000000000001"
export const DOCTORA_ID = "00000000-0000-0000-0000-000000000002"
