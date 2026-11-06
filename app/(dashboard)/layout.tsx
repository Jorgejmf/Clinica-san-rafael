import { ClinicSidebar } from "@/components/clinic-sidebar"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="relative min-h-screen bg-[#F4F7F4] text-[#0D3B23] overflow-x-hidden">
      {/* Luz ambiental sutil en esquinas */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#E3F4E5]/60 blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-[#EBF6EC]/50 blur-3xl" />
      </div>

      <ClinicSidebar userRole={user?.role ?? "secretaria"} displayName={user?.displayName ?? ""} />
      
      <main className="relative z-10 pt-14 md:ml-64 md:pt-0">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}

