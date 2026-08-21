import { ClinicSidebar } from "@/components/clinic-sidebar"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-background">
      <ClinicSidebar userRole={user?.role ?? "secretaria"} displayName={user?.displayName ?? ""} />
      <main className="pt-14 md:ml-64 md:pt-0">
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
