import { PatientsTable } from "@/components/patients-table"
import { PapanicolaouView } from "@/components/papanicolaou-view"
import { EmbarazosView } from "@/components/embarazos-view"
import { NinosView } from "@/components/ninos-view"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileCheck, HeartPulse, Baby, Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function PacientesPage() {
  const currentUser = await getCurrentUser()

  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching patients:", error)
  }

  const patientList = patients || []

  return (
    <div className="max-w-[1450px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-6 text-xs text-[#809279] print:hidden">
        <span>Mi clínica</span>
        <span className="mx-1">/</span>
        <strong className="text-[#42664a] font-semibold">Pacientes y controles</strong>
      </div>

      {/* Encabezado de página */}
      <header className="flex items-center justify-between gap-6 mb-7 flex-wrap print:hidden">
        <div>
          <h1 className="m-0 mb-1 text-[clamp(28px,3vw,38px)] font-extrabold leading-tight tracking-[-1.7px] text-[#194d32]">
            Pacientes y controles
          </h1>
        </div>

        <Link
          href="/pacientes/nuevo"
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-white bg-[#16834d] shadow-[0_7px_16px_#16834d18] text-[13px] font-bold whitespace-nowrap no-underline hover:bg-[#11733f] hover:-translate-y-0.5 hover:shadow-[0_9px_18px_#16834d25] active:translate-y-0 active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="h-4 w-4 stroke-[2.8]" aria-hidden="true" />
          <span>Agregar paciente</span>
        </Link>
      </header>

      {/* Pestañas de navegación */}
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="print:hidden h-auto p-1.5 border border-[#e0ebd8] bg-[#eef6e9] rounded-2xl flex flex-wrap gap-1.5 w-fit max-w-full mb-6">
          <TabsTrigger
            value="lista"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#698263] text-xs font-semibold whitespace-nowrap cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-[#197d45] data-[state=active]:shadow-[0_2px_8px_#254b2912] data-[state=active]:font-extrabold"
          >
            <Users className="h-4 w-4" />
            <span>Lista de pacientes</span>
          </TabsTrigger>
          <TabsTrigger
            value="papanicolaou"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#698263] text-xs font-semibold whitespace-nowrap cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-[#197d45] data-[state=active]:shadow-[0_2px_8px_#254b2912] data-[state=active]:font-extrabold"
          >
            <FileCheck className="h-4 w-4" />
            <span>Papanicolaou (PP)</span>
          </TabsTrigger>
          <TabsTrigger
            value="embarazos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#698263] text-xs font-semibold whitespace-nowrap cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-[#197d45] data-[state=active]:shadow-[0_2px_8px_#254b2912] data-[state=active]:font-extrabold"
          >
            <HeartPulse className="h-4 w-4" />
            <span>Embarazos</span>
          </TabsTrigger>
          <TabsTrigger
            value="ninos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#698263] text-xs font-semibold whitespace-nowrap cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-[#197d45] data-[state=active]:shadow-[0_2px_8px_#254b2912] data-[state=active]:font-extrabold"
          >
            <Baby className="h-4 w-4" />
            <span>Niños · Crecimiento</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-0">
          <PatientsTable
            initialPatients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>

        <TabsContent value="papanicolaou" className="mt-0">
          <PapanicolaouView
            patients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>

        <TabsContent value="embarazos" className="mt-0">
          <EmbarazosView
            patients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>

        <TabsContent value="ninos" className="mt-0">
          <NinosView
            patients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
