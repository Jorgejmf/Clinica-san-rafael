// lib/clinical-utils.ts
// Utilidades para parsing, codificación y persistencia segura de campos clínicos (TX, GMT, LABS)

/**
 * Limpia cualquier tag previo [TX], [GMT] o [SO2] del motivo de consulta o de campos
 */
export function cleanMotivoText(motivo: string): string {
  if (!motivo) return ""
  return motivo
    .replace(/\[TX\]:[\s\S]*?(?=\[GMT\]:|\[SO2\]:|$)/gi, "")
    .replace(/\[GMT\]:[\s\S]*?(?=\[TX\]:|\[SO2\]:|$)/gi, "")
    .replace(/\[SO2\]:[\s\S]*?(?=\[TX\]:|\[GMT\]:|$)/gi, "")
    .trim()
}

/**
 * Limpia cualquier tag previo [SO2] de los campos de texto
 */
export function cleanSo2Tag(text: string): string {
  if (!text) return ""
  return text.replace(/\[SO2\]:\s*[^;\n]+/gi, "").trim()
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
  let so2 = record.so2 !== undefined && record.so2 !== null ? String(record.so2) : ""

  // Si SO2 no vino en columna, extraer de respiracion, gmt o motivo
  if (!so2) {
    const rawSources = [record.respiracion, record.gmt, rawMotivo].join(" ")
    const so2Match = rawSources.match(/\[SO2\]:\s*([^;\n]+)/i) || rawSources.match(/SO2:\s*([0-9]+%?)/i)
    if (so2Match && so2Match[1]) {
      so2 = so2Match[1].trim()
    }
  }

  // Si TX no vino como columna separada, extraer de rawMotivo
  if (!tx && rawMotivo) {
    const txMatch = rawMotivo.match(/\[TX\]:\s*([\s\S]*?)(?=\n\s*\[GMT\]:|\n\s*\[SO2\]:|$)/i)
    if (txMatch && txMatch[1]) {
      tx = txMatch[1].trim()
    }
  }

  // Si GMT no vino como columna separada, extraer de rawMotivo
  if (!gmt && rawMotivo) {
    const gmtMatch = rawMotivo.match(/\[GMT\]:\s*([\s\S]*?)(?=\n\s*\[TX\]:|\n\s*\[SO2\]:|$)/i)
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
  const cleanRespiracion = cleanSo2Tag(record.respiracion || "")

  return {
    ...record,
    respiracion: cleanRespiracion,
    motivo_consulta: cleanMotivo,
    symptoms: cleanMotivo,
    tx,
    gmt,
    so2,
    conducta_a_seguir: cleanConducta,
    treatment: cleanConducta,
    labs,
    // age_at_visit: nueva columna. Fallback a columna legacy 'age' para registros viejos
    age_at_visit: record.age_at_visit ?? record.age ?? null,
  }
}

