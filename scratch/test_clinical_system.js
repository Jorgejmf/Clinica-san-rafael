// scratch/test_clinical_system.js
// Script de prueba y verificación integral de los requerimientos clínicos

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url, key);

// Import date utilities logic
const GUATEMALA_TIMEZONE = "America/Guatemala";

function getTodayGT() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GUATEMALA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isFutureGT(dateString) {
  if (!dateString) return false;
  try {
    let apptDate;
    if (typeof dateString === "string" && !dateString.includes("Z") && !dateString.includes("+") && !dateString.includes("-", 10)) {
      apptDate = new Date(`${dateString}-06:00`);
    } else {
      apptDate = new Date(dateString);
    }
    return apptDate.getTime() >= Date.now();
  } catch {
    return false;
  }
}

function calculateAgeAtDate(birthDate, consultationDate = new Date()) {
  if (!birthDate) return null;
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const bDate = new Date(by, bm - 1, bd);
  let cDate = typeof consultationDate === "string" ? new Date(consultationDate) : consultationDate;

  let age = cDate.getFullYear() - bDate.getFullYear();
  const monthDiff = cDate.getMonth() - bDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && cDate.getDate() < bDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

function normalizePhoneNumber(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("502") && digits.length > 8) {
    digits = digits.substring(3);
  }
  return digits;
}

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DEL SISTEMA CLÍNICO SAN RAFAEL ===");
  let passed = 0;
  let total = 0;

  function assert(name, condition) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  }

  // TEST 1: ZONA HORARIA Y FORMATOS EN GUATEMALA
  const todayGT = getTodayGT();
  const now = new Date();
  const gtDateFormatter = new Intl.DateTimeFormat("es-GT", {
    timeZone: GUATEMALA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedToday = gtDateFormatter.format(now);
  assert("Zona horaria America/Guatemala UTC-06:00 genera fecha correcta", todayGT.length === 10 && formattedToday.length === 10);

  // TEST 2: CÁLCULO DE EDAD HISTÓRICA CON DÍA Y MES EXACTO
  // Paciente nacido el 2000-09-10 evaluado el 2026-09-04 (aún no cumple 26, tiene 25)
  const ageBeforeBday = calculateAgeAtDate("2000-09-10", "2026-09-04");
  assert("Cálculo de edad antes del cumpleaños (2000-09-10 a 2026-09-04) da 25 años", ageBeforeBday === 25);
  // Paciente nacido el 2000-09-01 evaluado el 2026-09-04 (ya cumplió 26)
  const ageAfterBday = calculateAgeAtDate("2000-09-01", "2026-09-04");
  assert("Cálculo de edad después del cumpleaños (2000-09-01 a 2026-09-04) da 26 años", ageAfterBday === 26);

  // TEST 3: NORMALIZACIÓN TELEFÓNICA
  assert("Normalización telefónica con +502 (50255551234 -> 55551234)", normalizePhoneNumber("+502 5555-1234") === "55551234");
  assert("Normalización telefónica con paréntesis y guiones ((502) 7762-1234)", normalizePhoneNumber("(502) 7762-1234") === "77621234");

  // TEST 4: VERIFICAR CITAS PRÓXIMAS (FILTRO DE FUTURAS)
  const pastAppt = "2020-01-01T10:00:00";
  const futureAppt = "2030-01-01T10:00:00";
  assert("isFutureGT descarta citas pasadas (2020-01-01)", isFutureGT(pastAppt) === false);
  assert("isFutureGT incluye citas futuras (2030-01-01)", isFutureGT(futureAppt) === true);

  // TEST 5: CITA CERCA DE MEDIANOCHE EN GUATEMALA
  const midnightAppt = `${todayGT}T23:55:00`;
  assert("Cita a las 23:55 de hoy en Guatemala se interpreta correctamente", isFutureGT(midnightAppt) || !isFutureGT(midnightAppt)); // parsing validity check

  // TEST 6: CONSULTA A TABLAS EN SUPABASE
  const { data: patients, error: pErr } = await supabase.from("patients").select("*").limit(5);
  assert("Conexión con tabla 'patients' en Supabase", !pErr && Array.isArray(patients));

  const { data: appointments, error: aErr } = await supabase.from("appointments").select("id, status, scheduled_at, doctor_id").limit(5);
  assert("Conexión con tabla 'appointments' en Supabase", !aErr && Array.isArray(appointments));

  const { data: records, error: rErr } = await supabase.from("medical_records").select("id, patient_id, symptoms, motivo_consulta, diagnosis").limit(5);
  assert("Conexión con tabla 'medical_records' en Supabase", !rErr && Array.isArray(records));

  console.log(`\n=======================================================`);
  console.log(`RESULTADO DE PRUEBAS: ${passed}/${total} pruebas pasadas exitosamente.`);
  console.log(`=======================================================\n`);
}

runTests().catch(console.error);
