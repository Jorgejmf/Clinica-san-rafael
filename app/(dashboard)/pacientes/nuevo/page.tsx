import { AddPatientForm } from "@/components/add-patient-form"

export default function NuevoPacientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl text-balance">
          Agregar Paciente
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra un nuevo paciente en el sistema
        </p>
      </div>
      <AddPatientForm />
    </div>
  )
}
