import { AppointmentsView } from "@/components/appointments-view"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function CitasPage() {
  const currentUser = await getCurrentUser()

  const [
    { data: appointments },
    { data: patients }
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(id, first_name, last_name, age, birth_date, phone)")
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("patients")
      .select("id, first_name, last_name, age, birth_date, phone, no_expediente")
      .order("first_name", { ascending: true })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl text-balance">
          Citas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra las citas de la clínica
        </p>
      </div>
      <AppointmentsView
        initialAppointments={appointments || []}
        patients={patients || []}
        userRole={currentUser?.role || "secretaria"}
        userDoctorId={currentUser?.doctorId}
      />
    </div>
  )
}