"use client"

import Link from "next/link"
import Image from "next/image"
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
  Menu,
  X,
  Moon,
  Sun,
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
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-sidebar/95 backdrop-blur-2xl border-b border-sidebar-border/40 px-4 py-3 md:hidden print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-xl overflow-hidden bg-white p-0.5 shadow-sm ring-1 ring-white/30">
            <Image
              src="/logo.png"
              alt="Clínica San Rafael"
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
          <span className="text-base font-bold text-sidebar-foreground tracking-tight">
            Clínica San Rafael
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 active:scale-95"
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
          "fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-sidebar/95 backdrop-blur-2xl border-r border-sidebar-border/40 transition-transform duration-300 md:translate-x-0 print:hidden shadow-2xl shadow-black/20",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Decorative diffused elements fading towards WHITE */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-white/10 blur-3xl animate-pulse-white" />
          <div className="absolute top-1/2 -left-20 w-36 h-36 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-20 -right-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Brand area with logo */}
        <div className="relative sidebar-logo-container px-4 py-5">
          <div className="flex items-center gap-3">
            {/* Logo image container with crisp white card backdrop */}
            <div className="logo-container relative flex-shrink-0">
              <div className="relative h-12 w-12 rounded-2xl bg-white p-1 shadow-lg shadow-black/10 ring-2 ring-white/25 transition-all duration-300 hover:scale-105 hover:ring-white/50">
                <Image
                  src="/logo.png"
                  alt="Clínica San Rafael"
                  fill
                  className="object-contain"
                  sizes="48px"
                  priority
                />
              </div>
            </div>

            {/* Brand text */}
            <div className="min-w-0">
              <h1 className="text-[14px] font-extrabold leading-tight text-sidebar-foreground tracking-tight">
                Clínica Médica
              </h1>
              <p className="text-xs font-bold leading-tight text-sidebar-primary tracking-widest uppercase mt-0.5">
                San Rafael
              </p>
              <p className="text-[9px] font-medium text-sidebar-foreground/50 tracking-wide mt-0.5">
                Familiar
              </p>
            </div>
          </div>
        </div>

        {/* User badge */}
        <div className="mx-4 mb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className={cn(
            "rounded-xl px-3 py-2 text-xs font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] shadow-sm",
            roleBadgeColor[userRole]
          )}>
            {roleLabel[userRole] || userRole}{displayName ? ` — ${displayName}` : ""}
          </div>
        </div>

        {/* Divider with subtle white gradient */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item, index) => {
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
                  "sidebar-nav-item group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent/90 text-sidebar-primary font-bold shadow-md shadow-black/10 border border-white/15"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground hover:translate-x-1"
                )}
                style={{ animationDelay: `${0.04 * (index + 1)}s` }}
              >
                {isActive && (
                  <span className="absolute left-1.5 h-2 w-2 rounded-full bg-sidebar-primary shadow-sm shadow-sidebar-primary animate-pulse" />
                )}
                <item.icon className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-all duration-300 group-hover:scale-110",
                  isActive ? "text-sidebar-primary ml-1.5" : "text-sidebar-foreground/60 group-hover:text-sidebar-primary/90"
                )} />
                <span className="truncate">{item.label}</span>
                {/* Hover indicator dot */}
                <span className={cn(
                  "absolute right-2.5 h-1.5 w-1.5 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-sidebar-primary scale-100 opacity-100"
                    : "bg-white/40 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                )} />
              </Link>
            )
          })}
        </nav>

        {/* Divider with subtle white gradient */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Theme switcher toggle & Bottom Actions */}
        <div className="p-3 space-y-1.5">
          {/* Toggle Noche Cutie Pie / Modo Día */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(isDarkMode ? "light" : "dark")}
              className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-all duration-300 border border-white/10 hover:border-white/25 group"
              title="Alternar entre modo Noche Cutie Pie y Modo Día"
            >
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-primary transition-transform duration-500 group-hover:rotate-[20deg]" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500 transition-transform duration-500 group-hover:rotate-45" />
                )}
                <span>{isDarkMode ? "Noche Cutie Pie" : "Modo Día"}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/20 transition-all duration-300 group-hover:bg-sidebar-primary/25">
                {isDarkMode ? "🌙 ON" : "☀️ OFF"}
              </span>
            </button>
          )}

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-sidebar-foreground/70 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group"
            >
              <LogOut className="h-4 w-4 shrink-0 opacity-70 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Cerrar sesión
            </button>
          </form>
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-sidebar-primary/70 via-white/30 to-sidebar-primary/30" />
      </aside>
    </>
  )
}
