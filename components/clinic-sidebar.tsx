"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/app/login/actions"
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarDays,
  DollarSign,
  Package,
  Settings,
  LogOut,
  Cross,
  Menu,
  X,
  AlertCircle,
} from "lucide-react"
import { useState } from "react"

type Role = "admin" | "doctor" | "doctora" | "secretaria"

const ALL_NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Pacientes", href: "/pacientes", icon: Users, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Agregar Paciente", href: "/pacientes/nuevo", icon: UserPlus, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Citas", href: "/citas", icon: CalendarDays, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Ventas", href: "/ventas", icon: DollarSign, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Inventario", href: "/inventario", icon: Package, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Configuracion", href: "/configuracion", icon: Settings, roles: ["admin"] },
]

export function ClinicSidebar({ userRole = "secretaria", displayName = "" }: { userRole?: Role; displayName?: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  const roleLabel: Record<Role, string> = {
    admin: "Administrador",
    doctor: "Doctor",
    doctora: "Doctora",
    secretaria: "Secretaría",
  }

  const roleBadgeColor: Record<Role, string> = {
    admin: "bg-purple-500/20 text-purple-300",
    doctor: "bg-blue-500/20 text-blue-300",
    doctora: "bg-pink-500/20 text-pink-300",
    secretaria: "bg-pink-500/20 text-pink-300",
  }

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-sidebar px-4 py-3 md:hidden print:hidden">
        <div className="flex items-center gap-2">
          <Cross className="h-5 w-5 text-sidebar-primary" />
          <span className="text-base font-bold text-sidebar-foreground">
            Clinica San Rafael
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-sidebar transition-transform duration-300 md:translate-x-0 print:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Cross className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-sidebar-foreground">
              Clinica
            </h1>
            <p className="text-sm font-medium leading-tight text-sidebar-primary">
              San Rafael
            </p>
          </div>
        </div>

        {/* User badge */}
        <div className="mx-4 mb-3">
          <div className={cn("rounded-lg px-3 py-2 text-xs font-medium", roleBadgeColor[userRole])}>
            {roleLabel[userRole]}{displayName ? ` — ${displayName}` : ""}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-sidebar-border" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
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
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="mx-4 border-t border-sidebar-border" />
        <div className="px-3 py-4">
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
              <LogOut className="h-5 w-5 shrink-0" />
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
