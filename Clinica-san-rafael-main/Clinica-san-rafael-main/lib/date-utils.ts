// lib/date-utils.ts
// Utilidades centrales de fecha y hora para Clínica San Rafael en Panajachel, Sololá, Guatemala
// Zona horaria IANA: America/Guatemala | UTC/GMT: UTC-06:00 | Sin horario de verano (DST)
// Formatos visibles estándar: Fecha 'dd/mm/aaaa' | Hora 24 hrs 'HH:mm'

export const GUATEMALA_TIMEZONE = "America/Guatemala"
export const GUATEMALA_OFFSET_HOURS = -6

/**
 * Obtiene la fecha actual en Guatemala en formato 'YYYY-MM-DD'
 * Evita cualquier desfase de medianoche causado por conversiones a UTC o zona horaria local del navegador.
 */
export function getTodayGT(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: GUATEMALA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return formatter.format(new Date()) // Retorna 'YYYY-MM-DD'
}

/**
 * Obtiene la hora actual en Guatemala en formato 24 horas 'HH:mm'
 */
export function getCurrentTimeGT(): string {
  const formatter = new Intl.DateTimeFormat("es-GT", {
    timeZone: GUATEMALA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return formatter.format(new Date())
}

/**
 * Formatea una fecha a 'dd/mm/aaaa' en hora de Guatemala
 */
export function formatDateGT(
  value: string | number | Date | null | undefined,
  options?: { monthFormat?: "2-digit" | "numeric" | "short" | "long"; includeWeekday?: boolean }
): string {
  if (!value) return "—"
  try {
    let date: Date
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Formato 'YYYY-MM-DD' puro (evitar que JavaScript lo interprete en UTC y reste horas)
      const [y, m, d] = value.split("-").map(Number)
      date = new Date(y, m - 1, d, 12, 0, 0)
    } else {
      date = new Date(value)
    }

    if (isNaN(date.getTime())) return String(value)

    const formatter = new Intl.DateTimeFormat("es-GT", {
      timeZone: GUATEMALA_TIMEZONE,
      day: "2-digit",
      month: options?.monthFormat || "2-digit",
      year: "numeric",
      weekday: options?.includeWeekday ? "long" : undefined,
    })
    return formatter.format(date)
  } catch {
    return String(value)
  }
}

/**
 * Formatea una hora en formato de 24 horas 'HH:mm' en hora de Guatemala
 */
export function formatTimeGT(value: string | number | Date | null | undefined): string {
  if (!value) return "—"
  try {
    if (typeof value === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
      return value.substring(0, 5)
    }
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)

    const formatter = new Intl.DateTimeFormat("es-GT", {
      timeZone: GUATEMALA_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    return formatter.format(date)
  } catch {
    return String(value)
  }
}

/**
 * Formatea fecha y hora combinadas: 'dd/mm/aaaa HH:mm'
 */
export function formatDateTimeGT(value: string | number | Date | null | undefined): string {
  if (!value) return "—"
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)

    const dateStr = formatDateGT(date)
    const timeStr = formatTimeGT(date)
    return `${dateStr} ${timeStr}`
  } catch {
    return String(value)
  }
}

/**
 * Combina una fecha 'YYYY-MM-DD' y una hora 'HH:mm' en hora de Guatemala
 * y genera una cadena ISO segura o string compatible 'YYYY-MM-DDTHH:mm:00'
 */
export function combineDateTimeGT(dateStr: string, timeStr: string): string {
  if (!dateStr) dateStr = getTodayGT()
  if (!timeStr) timeStr = "09:00"
  const cleanTime = timeStr.length === 5 ? timeStr : timeStr.substring(0, 5)
  return `${dateStr}T${cleanTime}:00`
}

/**
 * Comprueba si una fecha dada en string ISO/Scheduled_at corresponde a la fecha de hoy en Guatemala
 */
export function isTodayGT(dateString: string | null | undefined): boolean {
  if (!dateString) return false
  const todayGT = getTodayGT()
  
  if (dateString.startsWith(todayGT)) return true

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return false
    const dGT = new Intl.DateTimeFormat("en-CA", {
      timeZone: GUATEMALA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
    return dGT === todayGT
  } catch {
    return false
  }
}

/**
 * Comprueba si una cita médica está en el futuro respecto a la fecha y hora actual de Guatemala
 */
export function isFutureGT(dateString: string | Date | null | undefined): boolean {
  if (!dateString) return false
  try {
    let apptDate: Date
    if (typeof dateString === "string" && !dateString.includes("Z") && !dateString.includes("+") && !dateString.includes("-", 10)) {
      // Local datetime string like '2026-09-04T15:30:00'
      // Treat as Guatemala local time (UTC-6)
      apptDate = new Date(`${dateString}-06:00`)
    } else {
      apptDate = new Date(dateString)
    }

    if (isNaN(apptDate.getTime())) return false
    return apptDate.getTime() >= Date.now()
  } catch {
    return false
  }
}

/**
 * Calcula la edad precisa que tenía el paciente en la fecha de la consulta
 * Considera año, mes y día exacto.
 */
export function calculateAgeAtDate(
  birthDate: string | Date | null | undefined,
  consultationDate: string | Date | null | undefined = new Date()
): number | null {
  if (!birthDate) return null
  try {
    let bDate: Date
    if (typeof birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      const [y, m, d] = birthDate.split("-").map(Number)
      bDate = new Date(y, m - 1, d)
    } else {
      bDate = new Date(birthDate)
    }

    let cDate: Date
    if (!consultationDate) {
      cDate = new Date()
    } else if (typeof consultationDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(consultationDate)) {
      const [y, m, d] = consultationDate.split("-").map(Number)
      cDate = new Date(y, m - 1, d)
    } else {
      cDate = new Date(consultationDate)
    }

    if (isNaN(bDate.getTime()) || isNaN(cDate.getTime())) return null

    let age = cDate.getFullYear() - bDate.getFullYear()
    const monthDiff = cDate.getMonth() - bDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && cDate.getDate() < bDate.getDate())) {
      age--
    }
    return age >= 0 ? age : 0
  } catch {
    return null
  }
}

/**
 * Normaliza un número de teléfono eliminando espacios, guiones, paréntesis y prefijo +502
 */
export function normalizePhoneNumber(phone: string | number | null | undefined): string {
  if (!phone) return ""
  let digits = String(phone).replace(/\D/g, "")
  if (digits.startsWith("502") && digits.length > 8) {
    digits = digits.substring(3)
  }
  return digits
}
