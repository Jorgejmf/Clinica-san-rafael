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
  Moon,
  Sun,
  Sparkles,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

type Role = "admin" | "doctor" | "doctora" | "secretaria"

const ALL_NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Pacientes", href: "/pacientes", icon: Users, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Agregar Paciente", href: "/pacientes/nuevo", icon: UserPlus, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Citas", href: "/citas", icon: CalendarDays, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Ventas", href: "/ventas", icon: DollarSign, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Inventario", href: "/inventario", icon: Package, roles: ["admin", "secretaria", "doctor", "doctora"] },
  { label: "Configuración & Perfil", href: "/configuracion", icon: Settings, roles: ["admin", "secretaria", "doctor", "doctora"] },
]

export function ClinicSidebar({ userRole = "secretaria", displayName = "" }: { userRole?: Role; displayName?: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  const roleLabel: Record<Role, string> = {
    admin: "Administrador",
    doctor: "Dr. Médico",
    doctora: "Dra. Médica",
    secretaria: "Secretaría",
  }

  const roleBadgeColor: Record<Role, string> = {
    admin: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    doctor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    doctora: "bg-pink-500/20 text-pink-300 border border-pink-500/30",
    secretaria: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  }

  const isDarkMode = mounted ? (theme === "dark" || (!theme && true)) : true

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-sidebar/90 backdrop-blur-xl border-b border-sidebar-border/40 px-4 py-3 md:hidden print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30 shadow-sm shadow-sidebar-primary/20">
            <Cross className="h-4 w-4" />
          </div>
          <span className="text-base font-bold text-sidebar-foreground">
            Clínica San Rafael
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden print:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-sidebar/90 backdrop-blur-2xl border-r border-sidebar-border/40 transition-transform duration-300 md:translate-x-0 print:hidden shadow-2xl shadow-black/20",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary to-emerald-400 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25 border border-white/20">
            <Cross className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-extrabold leading-tight text-sidebar-foreground tracking-tight">
                Clínica
              </h1>
              <Sparkles className="h-3.5 w-3.5 text-sidebar-primary opacity-80" />
            </div>
            <p className="text-xs font-bold leading-tight text-sidebar-primary tracking-wide uppercase">
              San Rafael
            </p>
          </div>
        </div>

        {/* User badge */}
        <div className="mx-4 mb-3">
          <div className={cn("rounded-xl px-3 py-2 text-xs font-semibold backdrop-blur-sm", roleBadgeColor[userRole])}>
            {roleLabel[userRole] || userRole}{displayName ? ` — ${displayName}` : ""}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-sidebar-border/40" />

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
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
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent/80 text-sidebar-primary font-bold shadow-sm shadow-sidebar-primary/20 border border-sidebar-primary/25"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground hover:translate-x-0.5"
                )}
              >
                {isActive && (
                  <span className="absolute left-1.5 h-2 w-2 rounded-full bg-sidebar-primary shadow-sm shadow-sidebar-primary animate-pulse" />
                )}
                <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-sidebar-primary ml-1.5" : "text-sidebar-foreground/60")} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Theme switcher toggle & Bottom Actions */}
        <div className="mx-4 border-t border-sidebar-border/40" />
        <div className="p-3 space-y-1.5">
          {/* Toggle Noche Cutie Pie / Modo Día */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(isDarkMode ? "light" : "dark")}
              className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-all duration-200 border border-sidebar-border/30 hover:border-sidebar-primary/30"
              title="Alternar entre modo Noche Cutie Pie y Modo Día"
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" />
                )}
                <span>{isDarkMode ? "Noche Cutie Pie" : "Modo Día"}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/20">
                {isDarkMode ? "🌙 ON" : "☀️ OFF"}
              </span>
            </button>
          )}

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-sidebar-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 shrink-0 opacity-70" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
