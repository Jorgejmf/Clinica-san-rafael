// scratch/test_verification.js
const { hashPassword, verifyPassword } = require('../lib/crypto');
const { getTodayGT, formatDateGT, formatTimeGT, formatDateTimeGT, isTodayGT, calculateAgeAtDate, normalizePhoneNumber } = require('../lib/date-utils');

function runTests() {
  console.log('=== INICIANDO PRUEBAS AUTOMATIZADAS DEL SISTEMA CLÍNICO ===\n');

  // Test 1: Crypto Hashing
  console.log('--- Test 1: Hashing y Verificación de Contraseñas ---');
  const password = 'miPasswordSeguro123';
  const hashed = hashPassword(password);
  console.log('Hash generado:', hashed);
  const isValid = verifyPassword(password, hashed);
  const isInvalid = verifyPassword('wrongPass', hashed);
  console.log('Verificación contraseña correcta:', isValid ? 'PASÓ (OK)' : 'FALLÓ');
  console.log('Verificación contraseña incorrecta rechazada:', !isInvalid ? 'PASÓ (OK)' : 'FALLÓ');
  if (!isValid || isInvalid) throw new Error('Fallo en test de crypto');

  // Test 2: Guatemala Timezone y Fechas
  console.log('\n--- Test 2: Fechas y Zona Horaria Guatemala (America/Guatemala) ---');
  const todayGT = getTodayGT();
  console.log('Hoy en Guatemala (YYYY-MM-DD):', todayGT);
  const formattedToday = formatDateGT(todayGT);
  console.log('Formato dd/mm/aaaa:', formattedToday);
  const isTodayValid = isTodayGT(`${todayGT}T14:30:00`);
  console.log('isTodayGT detecta correctamente fecha de hoy:', isTodayValid ? 'PASÓ (OK)' : 'FALLÓ');
  if (!isTodayValid) throw new Error('Fallo en test de isTodayGT');

  // Test 3: Normalización Telefónica (Requerimiento 5)
  console.log('\n--- Test 3: Normalización de Teléfonos ---');
  const testPhones = [
    { input: '5222-0371', expected: '52220371' },
    { input: '+502 5222 0371', expected: '52220371' },
    { input: '(502) 5998-7658', expected: '59987658' },
    { input: '5998 7658', expected: '59987658' },
  ];

  testPhones.forEach(({ input, expected }) => {
    const normalized = normalizePhoneNumber(input);
    const passed = normalized === expected;
    console.log(`Input: "${input}" -> Normalizado: "${normalized}" (Esperado: "${expected}"):`, passed ? 'PASÓ (OK)' : 'FALLÓ');
    if (!passed) throw new Error(`Fallo en normalización telefónica para ${input}`);
  });

  // Test 4: Edad Histórica en Fecha de Consulta (Requerimiento 7)
  console.log('\n--- Test 4: Cálculo de Edad Histórica en Consulta ---');
  const birthDate = '1990-05-15';
  const consultDate2010 = '2010-05-15'; // Exactamente 20 años
  const consultDate2020 = '2020-05-14'; // 29 años (un día antes de cumplir 30)
  const age2010 = calculateAgeAtDate(birthDate, consultDate2010);
  const age2020 = calculateAgeAtDate(birthDate, consultDate2020);
  console.log(`Nacimiento: ${birthDate} en Consulta ${consultDate2010} -> Edad calculada: ${age2010} (Esperado: 20):`, age2010 === 20 ? 'PASÓ (OK)' : 'FALLÓ');
  console.log(`Nacimiento: ${birthDate} en Consulta ${consultDate2020} -> Edad calculada: ${age2020} (Esperado: 29):`, age2020 === 29 ? 'PASÓ (OK)' : 'FALLÓ');
  if (age2010 !== 20 || age2020 !== 29) throw new Error('Fallo en cálculo de edad histórica');

  console.log('\n=== TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE (100%) ===\n');
}

runTests();
