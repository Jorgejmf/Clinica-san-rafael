// lib/clinical-utils.ts
// Utilidades para parsing, codificación y persistencia segura de campos clínicos (TX, GMT, LABS)

/**
 * Limpia cualquier tag previo [TX] o [GMT] del motivo de consulta
 */
export function cleanMotivoText(motivo: string): string {
  if (!motivo) return ""
  return motivo
    .replace(/\[TX\]:[\s\S]*?(?=\[GMT\]:|$)/gi, "")
    .replace(/\[GMT\]:[\s\S]*?(?=\[TX\]:|$)/gi, "")
    .trim()
}

/**
 * Limpia cualquier tag previo [LABS] de la conducta a seguir
 */
export function cleanConductaText(conducta: string): string {
  if (!conducta) return ""
  return conducta.replace(/\[LABS\]:[\s\S]*$/gi, "").trim()
}

/**
 * Codifica TX y GMT dentro del motivo de consulta para garantizar 100% de persistencia
 */
export function encodeMotivoWithTxGmt(motivo: string, tx?: string | null, gmt?: string | number | null): string {
  let clean = cleanMotivoText(motivo || "")
  const txVal = tx !== undefined && tx !== null ? String(tx).trim() : ""
  const gmtVal = gmt !== undefined && gmt !== null ? String(gmt).trim() : ""

  if (txVal) {
    clean += `\n\n[TX]: ${txVal}`
  }
  if (gmtVal) {
    clean += `\n\n[GMT]: ${gmtVal}`
  }
  return clean.trim()
}

/**
 * Codifica LABS dentro de conducta a seguir para garantizar 100% de persistencia
 */
export function encodeConductaWithLabs(conducta: string, labs?: string | null): string {
  let clean = cleanConductaText(conducta || "")
  const labsVal = labs !== undefined && labs !== null ? String(labs).trim() : ""

  if (labsVal) {
    clean += `\n\n[LABS]: ${labsVal}`
  }
  return clean.trim()
}

/**
 * Extrae y normaliza TX, GMT, LABS y textos limpios desde cualquier registro clínico
 */
export function parseClinicalRecord(record: any): any {
  if (!record) return record

  const rawMotivo = record.motivo_consulta || record.symptoms || ""
  const rawConducta = record.conducta_a_seguir || record.treatment || ""

  let tx = record.tx !== undefined && record.tx !== null ? String(record.tx) : ""
  let gmt = record.gmt !== undefined && record.gmt !== null ? String(record.gmt) : ""
  let labs = record.labs !== undefined && record.labs !== null ? String(record.labs) : ""

  // Si TX no vino como columna separada, extraer de rawMotivo
  if (!tx && rawMotivo) {
    const txMatch = rawMotivo.match(/\[TX\]:\s*([\s\S]*?)(?=\n\s*\[GMT\]:|$)/i)
    if (txMatch && txMatch[1]) {
      tx = txMatch[1].trim()
    }
  }

  // Si GMT no vino como columna separada, extraer de rawMotivo
  if (!gmt && rawMotivo) {
    const gmtMatch = rawMotivo.match(/\[GMT\]:\s*([\s\S]*?)(?=\n\s*\[TX\]:|$)/i)
    if (gmtMatch && gmtMatch[1]) {
      gmt = gmtMatch[1].trim()
    }
  }

  // Si LABS no vino como columna separada, extraer de rawConducta
  if (!labs && rawConducta) {
    const labsMatch = rawConducta.match(/\[LABS\]:\s*([\s\S]*)$/i)
    if (labsMatch && labsMatch[1]) {
      labs = labsMatch[1].trim()
    }
  }

  const cleanMotivo = cleanMotivoText(rawMotivo)
  const cleanConducta = cleanConductaText(rawConducta)

  return {
    ...record,
    motivo_consulta: cleanMotivo,
    symptoms: cleanMotivo,
    tx,
    gmt,
    conducta_a_seguir: cleanConducta,
    treatment: cleanConducta,
    labs,
    // age_at_visit: nueva columna. Fallback a columna legacy 'age' para registros viejos
    age_at_visit: record.age_at_visit ?? record.age ?? null,
  }
}

