export interface Patient {
  id: string
  nombre: string
  identificacion: string
  fechaNacimiento: string
  telefono: string
  direccion: string
  correo: string
  genero: "Masculino" | "Femenino" | "Otro"
  observaciones: string
  estado: "Activo" | "Inactivo"
  digitalizado: boolean
  fechaDigitalizacion?: string
}

export interface Appointment {
  id: string
  pacienteId: string
  pacienteNombre: string
  fecha: string
  hora: string
  estado: "Pendiente" | "Confirmada" | "Atendida" | "Cancelada"
  motivo: string
}

export interface Sale {
  id: string
  paciente: string
  monto: number
  descripcion: string
  fecha: string
}

export interface InventoryItem {
  id: string
  nombre: string
  cantidad: number
  minimo: number
  estado: "Normal" | "Stock Bajo"
}

export const patients: Patient[] = [
  {
    id: "EXP-001",
    nombre: "Maria Garcia Lopez",
    identificacion: "001-120385-0012A",
    fechaNacimiento: "1985-03-12",
    telefono: "8845-6721",
    direccion: "Bo. San Juan, Managua",
    correo: "maria.garcia@email.com",
    genero: "Femenino",
    observaciones: "Paciente con hipertension controlada",
    estado: "Activo",
    digitalizado: true,
    fechaDigitalizacion: "2025-11-15",
  },
  {
    id: "EXP-002",
    nombre: "Carlos Mendez Rivera",
    identificacion: "001-290790-0034K",
    fechaNacimiento: "1990-07-29",
    telefono: "8823-4455",
    direccion: "Col. Centroamerica, Managua",
    correo: "carlos.mendez@email.com",
    genero: "Masculino",
    observaciones: "",
    estado: "Activo",
    digitalizado: true,
    fechaDigitalizacion: "2025-12-01",
  },
  {
    id: "EXP-003",
    nombre: "Ana Sofia Ruiz",
    identificacion: "001-150278-0056L",
    fechaNacimiento: "1978-02-15",
    telefono: "8867-9900",
    direccion: "Res. Las Colinas, Managua",
    correo: "ana.ruiz@email.com",
    genero: "Femenino",
    observaciones: "Diabetes tipo 2. Tratamiento con metformina.",
    estado: "Activo",
    digitalizado: false,
  },
  {
    id: "EXP-004",
    nombre: "Jose Roberto Hernandez",
    identificacion: "001-050592-0078M",
    fechaNacimiento: "1992-05-05",
    telefono: "8812-3344",
    direccion: "Bo. Monimbo, Masaya",
    correo: "jose.hernandez@email.com",
    genero: "Masculino",
    observaciones: "",
    estado: "Activo",
    digitalizado: true,
    fechaDigitalizacion: "2026-01-10",
  },
  {
    id: "EXP-005",
    nombre: "Lucia Fernanda Martinez",
    identificacion: "001-220100-0091N",
    fechaNacimiento: "2000-01-22",
    telefono: "8890-1122",
    direccion: "Bo. El Calvario, Granada",
    correo: "lucia.martinez@email.com",
    genero: "Femenino",
    observaciones: "Embarazo en curso - 7 meses",
    estado: "Activo",
    digitalizado: false,
  },
  {
    id: "EXP-006",
    nombre: "Pedro Antonio Solano",
    identificacion: "001-180365-0023P",
    fechaNacimiento: "1965-03-18",
    telefono: "8834-5566",
    direccion: "Km 12 Carretera Norte, Managua",
    correo: "pedro.solano@email.com",
    genero: "Masculino",
    observaciones: "Paciente con marcapasos. Control cada 3 meses.",
    estado: "Inactivo",
    digitalizado: true,
    fechaDigitalizacion: "2025-10-20",
  },
  {
    id: "EXP-007",
    nombre: "Rosa Elena Vargas",
    identificacion: "001-090488-0045Q",
    fechaNacimiento: "1988-04-09",
    telefono: "8878-2233",
    direccion: "Altamira, Managua",
    correo: "rosa.vargas@email.com",
    genero: "Femenino",
    observaciones: "",
    estado: "Activo",
    digitalizado: true,
    fechaDigitalizacion: "2026-02-05",
  },
  {
    id: "EXP-008",
    nombre: "Fernando Jose Castillo",
    identificacion: "001-300195-0067R",
    fechaNacimiento: "1995-01-30",
    telefono: "8856-7788",
    direccion: "Los Robles, Managua",
    correo: "fernando.castillo@email.com",
    genero: "Masculino",
    observaciones: "Alergia a la penicilina",
    estado: "Activo",
    digitalizado: false,
  },
]

export const appointments: Appointment[] = [
  {
    id: "CIT-001",
    pacienteId: "EXP-001",
    pacienteNombre: "Maria Garcia Lopez",
    fecha: "2026-02-20",
    hora: "09:00",
    estado: "Confirmada",
    motivo: "Control de presion arterial",
  },
  {
    id: "CIT-002",
    pacienteId: "EXP-003",
    pacienteNombre: "Ana Sofia Ruiz",
    fecha: "2026-02-20",
    hora: "10:30",
    estado: "Pendiente",
    motivo: "Control de glucosa",
  },
  {
    id: "CIT-003",
    pacienteId: "EXP-005",
    pacienteNombre: "Lucia Fernanda Martinez",
    fecha: "2026-02-20",
    hora: "11:00",
    estado: "Atendida",
    motivo: "Control prenatal",
  },
  {
    id: "CIT-004",
    pacienteId: "EXP-002",
    pacienteNombre: "Carlos Mendez Rivera",
    fecha: "2026-02-21",
    hora: "08:30",
    estado: "Pendiente",
    motivo: "Consulta general",
  },
  {
    id: "CIT-005",
    pacienteId: "EXP-007",
    pacienteNombre: "Rosa Elena Vargas",
    fecha: "2026-02-21",
    hora: "14:00",
    estado: "Confirmada",
    motivo: "Examen de laboratorio",
  },
  {
    id: "CIT-006",
    pacienteId: "EXP-004",
    pacienteNombre: "Jose Roberto Hernandez",
    fecha: "2026-02-22",
    hora: "09:30",
    estado: "Cancelada",
    motivo: "Dolor abdominal",
  },
]

export const sales: Sale[] = [
  {
    id: "VEN-001",
    paciente: "Maria Garcia Lopez",
    monto: 850.0,
    descripcion: "Consulta medica general + examenes",
    fecha: "2026-02-20",
  },
  {
    id: "VEN-002",
    paciente: "Carlos Mendez Rivera",
    monto: 1200.0,
    descripcion: "Consulta especialista + medicamentos",
    fecha: "2026-02-19",
  },
  {
    id: "VEN-003",
    paciente: "Ana Sofia Ruiz",
    monto: 450.0,
    descripcion: "Control de glucosa",
    fecha: "2026-02-19",
  },
  {
    id: "VEN-004",
    paciente: "Lucia Fernanda Martinez",
    monto: 1500.0,
    descripcion: "Control prenatal + ultrasonido",
    fecha: "2026-02-18",
  },
  {
    id: "VEN-005",
    paciente: "Sin paciente",
    monto: 320.0,
    descripcion: "Venta de medicamentos",
    fecha: "2026-02-18",
  },
]

export const inventory: InventoryItem[] = [
  {
    id: "INV-001",
    nombre: "Acetaminofen 500mg",
    cantidad: 250,
    minimo: 50,
    estado: "Normal",
  },
  {
    id: "INV-002",
    nombre: "Ibuprofeno 400mg",
    cantidad: 180,
    minimo: 40,
    estado: "Normal",
  },
  {
    id: "INV-003",
    nombre: "Amoxicilina 500mg",
    cantidad: 15,
    minimo: 30,
    estado: "Stock Bajo",
  },
  {
    id: "INV-004",
    nombre: "Jeringas desechables 5ml",
    cantidad: 500,
    minimo: 100,
    estado: "Normal",
  },
  {
    id: "INV-005",
    nombre: "Guantes latex (caja)",
    cantidad: 8,
    minimo: 10,
    estado: "Stock Bajo",
  },
  {
    id: "INV-006",
    nombre: "Alcohol etilico 70%",
    cantidad: 45,
    minimo: 20,
    estado: "Normal",
  },
  {
    id: "INV-007",
    nombre: "Gasas esteriles (paquete)",
    cantidad: 5,
    minimo: 15,
    estado: "Stock Bajo",
  },
  {
    id: "INV-008",
    nombre: "Metformina 850mg",
    cantidad: 120,
    minimo: 30,
    estado: "Normal",
  },
]
