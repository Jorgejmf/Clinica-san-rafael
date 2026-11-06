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

export function buildClinicUser(username: string, customDisplay?: string, customRole?: ClinicUser["role"]): ClinicUser {
  const u = username.toLowerCase().trim()
  if (customRole) {
    let docId: string | undefined
    if (customRole === "doctor") docId = DOCTOR_ID
    if (customRole === "doctora") docId = DOCTORA_ID
    return {
      username: u,
      role: customRole,
      doctorId: docId,
      displayName: customDisplay || u,
      status: "Activo",
    }
  }

  switch (u) {
    case "admin":
      return { username: "admin", role: "admin", displayName: customDisplay || "Administrador", status: "Activo" }
    case "doctor":
      return { username: "doctor", role: "doctor", doctorId: DOCTOR_ID, displayName: customDisplay || "Dr. Médico", status: "Activo" }
    case "doctora":
      return { username: "doctora", role: "doctora", doctorId: DOCTORA_ID, displayName: customDisplay || "Dra. Médica", status: "Activo" }
    case "secretaria":
      return { username: "secretaria", role: "secretaria", displayName: customDisplay || "Secretaría", status: "Activo" }
    default:
      return { username: u, role: "secretaria", displayName: customDisplay || u, status: "Activo" }
  }
}
