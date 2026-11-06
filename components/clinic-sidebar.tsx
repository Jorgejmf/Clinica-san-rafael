"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/app/login/actions"
import {
  LayoutGrid,
  Users,
  UserPlus,
  CalendarDays,
  CreditCard,
  Package,
  SlidersHorizontal,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react"
import { useState } from "react"

type Role = "admin" | "doctor" | "doctora" | "secretaria"

interface NavItem {
  label: string
  href: string
  icon: any
  roles: Role[]
  badge?: string | number
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/", icon: LayoutGrid, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Pacientes", href: "/pacientes", icon: Users, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Agregar Paciente", href: "/pacientes/nuevo", icon: UserPlus, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Citas", href: "/citas", icon: CalendarDays, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Ventas", href: "/ventas", icon: CreditCard, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Inventario", href: "/inventario", icon: Package, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Configuración", href: "/configuracion", icon: SlidersHorizontal, roles: ["admin", "secretaria", "doctor", "doctora"] },
]

export function ClinicSidebar({
  userRole = "secretaria",
  displayName = "",
}: {
  userRole?: Role
  displayName?: string
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  const roleLabel: Record<Role, string> = {
    admin: "Administrador",
    doctor: "Dr. Médico",
    doctora: "Dra. Médica",
    secretaria: "Secretaría",
  }

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-[#E3EDE5] px-4 py-3 md:hidden print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#125938] text-white shadow-sm">
            <Plus className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="leading-tight">
            <span className="block text-[9px] font-bold tracking-[0.18em] text-[#5C7967] uppercase">CLÍNICA MÉDICA</span>
            <span className="block text-sm font-extrabold text-[#0D3B23]">San Rafael</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-[#0D3B23] hover:bg-[#EAF5EC] transition-all"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden print:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-white border-r border-[#E5EFE7] transition-transform duration-300 md:translate-x-0 print:hidden",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Brand Area */}
        <div className="px-6 pt-7 pb-4">
          <Link href="/" className="group flex items-center gap-3.5">
            {/* Brand symbol with lime shadow and -6deg tilt */}
            <div className="brand-symbol">
              <Plus className="h-6 w-6 stroke-[2.8]" />
            </div>

            {/* Typography */}
            <div className="flex flex-col">
              <small className="block text-[10px] font-bold tracking-[1.5px] text-[#617b68] uppercase leading-[1.8] mb-[2px]">
                CLÍNICA MÉDICA
              </small>
              <strong className="text-[19px] font-extrabold text-[#194d32] tracking-[-1px] leading-tight">
                San Rafael
              </strong>
            </div>
          </Link>
        </div>

        {/* Section title */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#859E8F]">
            ESPACIO DE TRABAJO
          </p>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1.5 px-3.5 py-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-[#DCF2DE] text-[#0D3B23] font-bold shadow-xs"
                    : "text-[#556F5E] hover:bg-[#F2F8F3] hover:text-[#0D3B23] font-medium"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-[#0D3B23] stroke-[2.3]" : "text-[#556F5E] stroke-[2]"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {/* Right Indicator: Green dot for active item, or badge count if present */}
                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-[#125938] shrink-0" />
                ) : item.badge ? (
                  <span className="text-xs font-semibold text-[#859E8F] shrink-0">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* User Card & Logout at bottom */}
        <div className="p-4 border-t border-[#E8F2EA] space-y-2">
          <div className="flex items-center justify-between rounded-2xl bg-[#F4F9F5] p-3 border border-[#E3EFE5]">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#125938] text-white text-xs font-bold">
                {displayName ? displayName.substring(0, 2).toUpperCase() : userRole.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[#0D3B23]">
                  {displayName || roleLabel[userRole]}
                </p>
                <p className="text-[10px] font-medium text-[#658372]">
                  {roleLabel[userRole]}
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#186D42]" title="Conectado" />
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold text-[#6E8878] hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 opacity-70" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
