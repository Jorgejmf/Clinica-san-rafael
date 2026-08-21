import { PatientsTable } from "@/components/patients-table"
import { PapanicolaouView } from "@/components/papanicolaou-view"
import { EmbarazosView } from "@/components/embarazos-view"
import { NinosView } from "@/components/ninos-view"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileCheck, HeartPulse, Baby } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PacientesPage() {
  const currentUser = await getCurrentUser()

  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching patients:", error);
  }

  const patientList = patients || []

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl text-balance">
          Pacientes, Exámenes y Controles Especializados
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona expedientes, Papanicolaou (PP), controles de Embarazos y seguimiento de Niños
        </p>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="flex flex-wrap h-auto rounded-xl bg-muted/50 p-1 gap-1 print:hidden">
          <TabsTrigger value="lista" className="rounded-lg text-sm gap-2">
            <Users className="h-4 w-4" />
            Lista de Pacientes
          </TabsTrigger>
          <TabsTrigger value="papanicolaou" className="rounded-lg text-sm gap-2">
            <FileCheck className="h-4 w-4 text-purple-600" />
            Exámenes Papanicolaou (PP)
          </TabsTrigger>
          <TabsTrigger value="embarazos" className="rounded-lg text-sm gap-2">
            <HeartPulse className="h-4 w-4 text-pink-600" />
            Embarazos
          </TabsTrigger>
          <TabsTrigger value="ninos" className="rounded-lg text-sm gap-2">
            <Baby className="h-4 w-4 text-purple-600" />
            Niños (Curva de Crecimiento)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4">
          <PatientsTable
            initialPatients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>

        <TabsContent value="papanicolaou" className="mt-4">
          <PapanicolaouView
            patients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>

        <TabsContent value="embarazos" className="mt-4">
          <EmbarazosView
            patients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>

        <TabsContent value="ninos" className="mt-4">
          <NinosView
            patients={patientList}
            userRole={currentUser?.role || "secretaria"}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
