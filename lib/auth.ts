import { cookies } from "next/headers"
import { ClinicUser, DOCTOR_ID, DOCTORA_ID } from "./constants"

export type { ClinicUser }
export { DOCTOR_ID, DOCTORA_ID }

export async function getCurrentUser(): Promise<ClinicUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get("clinic_user")?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as ClinicUser
  } catch {
    return null
  }
}

export function buildClinicUser(username: string): ClinicUser {
  switch (username.toLowerCase()) {
    case "admin":
      return { username: "admin", role: "admin", displayName: "Administrador" }
    case "doctor":
      return { username: "doctor", role: "doctor", doctorId: DOCTOR_ID, displayName: "Dr. Médico" }
    case "doctora":
      return { username: "doctora", role: "doctora", doctorId: DOCTORA_ID, displayName: "Dra. Médica" }
    case "secretaria":
      return { username: "secretaria", role: "secretaria", displayName: "Secretaría" }
    default:
      return { username, role: "secretaria", displayName: username }
  }
}
