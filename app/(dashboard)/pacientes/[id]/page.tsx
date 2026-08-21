import { PatientRecord } from "@/components/patient-record"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Get current user role
  const currentUser = await getCurrentUser()

  // Fetch patient, appointments, and medical records in parallel
  const [
    { data: patient },
    { data: appointments },
    { data: medicalRecords }
  ] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).single(),
    supabase.from("appointments").select("*").eq("patient_id", id).order("scheduled_at", { ascending: false }),
    supabase.from("medical_records").select("*").eq("patient_id", id).order("created_at", { ascending: false })
  ])

  if (!patient) notFound()

  return (
    <PatientRecord
      patient={patient}
      appointments={appointments || []}
      medicalRecords={medicalRecords || []}
      userRole={currentUser?.role || "secretaria"}
      userDoctorId={currentUser?.doctorId}
    />
  )
}
