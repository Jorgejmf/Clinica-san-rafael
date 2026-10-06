import { ClinicSidebar } from "@/components/clinic-sidebar"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="relative min-h-screen bg-background dot-pattern overflow-x-hidden">
      {/* Ambient luminous white diffusion layer */}
      <div className="ambient-white-glow" />
      
      {/* Soft floating white diffuse light orbs in background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="diffuse-orb-white-lg top-10 right-[10%] w-96 h-96 animate-float-slow opacity-60" />
        <div className="diffuse-orb-white-sm bottom-20 left-[15%] w-72 h-72 animate-float-slow opacity-50" style={{ animationDelay: '3s' }} />
      </div>

      <ClinicSidebar userRole={user?.role ?? "secretaria"} displayName={user?.displayName ?? ""} />
      
      <main className="relative z-10 pt-14 md:ml-64 md:pt-0">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
