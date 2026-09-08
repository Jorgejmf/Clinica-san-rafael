"use client"

import { useState } from "react"
import {
  Building2,
  KeyRound,
  UserCog,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  User,
  Shield,
  Clock,
  Sparkles,
  MapPin,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  changeMyPassword,
  adminResetUserPassword,
  adminToggleUserStatus,
  updateMyProfile,
} from "@/app/login/actions"
import { ClinicUser } from "@/lib/constants"

export function ConfiguracionView({
  currentUser,
  systemUsers = [],
}: {
  currentUser: ClinicUser | null
  systemUsers: any[]
}) {
  const isAdmin = currentUser?.role === "admin"

  // Profile Form state
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "")
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Change password form state
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [loadingPass, setLoadingPass] = useState(false)
  const [passMessage, setPassMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Admin reset password state
  const [targetUser, setTargetUser] = useState("doctor")
  const [adminNewPass, setAdminNewPass] = useState("")
  const [loadingAdminReset, setLoadingAdminReset] = useState(false)
  const [adminMessage, setAdminMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)

    if (!displayName.trim() || displayName.trim().length < 2) {
      setProfileMessage({ type: "error", text: "El nombre debe tener al menos 2 caracteres" })
      return
    }

    setLoadingProfile(true)
    const res = await updateMyProfile({ displayName: displayName.trim() })
    setLoadingProfile(false)

    if (res.success) {
      setProfileMessage({ type: "success", text: res.message })
    } else {
      setProfileMessage({ type: "error", text: res.message })
    }
  }

  // Handle own password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMessage(null)

    if (newPass.length < 6) {
      setPassMessage({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres" })
      return
    }

    if (newPass !== confirmPass) {
      setPassMessage({ type: "error", text: "Las contraseñas no coinciden" })
      return
    }

    setLoadingPass(true)
    const res = await changeMyPassword({ currentPass, newPass, confirmPass })
    setLoadingPass(false)

    if (res.success) {
      setPassMessage({ type: "success", text: res.message })
      setCurrentPass("")
      setNewPass("")
      setConfirmPass("")
    } else {
      setPassMessage({ type: "error", text: res.message })
    }
  }

  // Handle admin password reset
  const handleAdminReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminMessage(null)

    if (adminNewPass.length < 6) {
      setAdminMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" })
      return
    }

    if (!confirm(`¿Restablecer la contraseña para el usuario ${targetUser}?`)) return

    setLoadingAdminReset(true)
    const res = await adminResetUserPassword(targetUser, adminNewPass)
    setLoadingAdminReset(false)

    if (res.success) {
      setAdminMessage({ type: "success", text: res.message })
      setAdminNewPass("")
    } else {
      setAdminMessage({ type: "error", text: res.message })
    }
  }

  const handleToggleStatus = async (username: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Activo" ? "Inactivo" : "Activo"
    if (!confirm(`¿Cambiar estado del usuario ${username} a ${nextStatus}?`)) return

    const res = await adminToggleUserStatus(username, nextStatus as "Activo" | "Inactivo")
    if (res.success) {
      alert(res.message)
      window.location.reload()
    } else {
      alert(res.message)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Configuración y Perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión de cuenta personal, seguridad de credenciales y parámetros de la clínica
        </p>
      </div>

      {/* 1. PERFIL DE USUARIO ACTUAL */}
      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              Mi Perfil
            </h2>
            <p className="text-xs text-muted-foreground">
              Información de tu cuenta activa en el sistema clínico
            </p>
          </div>
        </div>

        {profileMessage && (
          <div
            className={`rounded-xl p-3 text-sm font-semibold flex items-center gap-2 ${
              profileMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-destructive/15 text-destructive border border-destructive/20"
            }`}
          >
            {profileMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-primary">
                Usuario del Sistema
              </Label>
              <Input
                value={currentUser?.username || "—"}
                readOnly
                disabled
                className="h-11 rounded-xl bg-muted font-mono font-bold text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-primary">
                Rol Asignado
              </Label>
              <div className="h-11 flex items-center px-4 rounded-xl border border-input bg-muted text-sm font-bold text-muted-foreground">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                {currentUser?.role?.toUpperCase() || "SECRETARIA"}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-primary">
                Nombre Visible / Display Name
              </Label>
              <Input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre y apellido"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loadingProfile}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 shadow-sm"
            >
              {loadingProfile ? "Guardando..." : "Guardar Cambios de Perfil"}
            </Button>
          </div>
        </form>
      </div>

      {/* 2. CAMBIO DE CONTRASEÑA PROPIA */}
      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              Cambiar Mi Contraseña
            </h2>
            <p className="text-xs text-muted-foreground">
              Actualiza tu clave de acceso. Se guardará de manera segura y encriptada (hash SHA-256).
            </p>
          </div>
        </div>

        {passMessage && (
          <div
            className={`mt-4 rounded-xl p-3 text-sm font-semibold flex items-center gap-2 ${
              passMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-destructive/15 text-destructive border border-destructive/20"
            }`}
          >
            {passMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{passMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-primary">
                Contraseña Actual
              </Label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-primary">
                Nueva Contraseña
              </Label>
              <Input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-primary">
                Confirmar Nueva Contraseña
              </Label>
              <Input
                type="password"
                required
                minLength={6}
                placeholder="Repite la nueva clave"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loadingPass}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 shadow-sm"
            >
              {loadingPass ? "Actualizando..." : "Actualizar Mi Contraseña"}
            </Button>
          </div>
        </form>
      </div>

      {/* 3. ADMINISTRACIÓN DE USUARIOS DEL SISTEMA (SÓLO ADMINISTRADOR) */}
      {isAdmin && (
        <div className="rounded-2xl border border-purple-200 bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-purple-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-card-foreground">
                Gestión y Restablecimiento de Usuarios del Sistema (Admin)
              </h2>
              <p className="text-xs text-muted-foreground">
                Restablece contraseñas de otros usuarios y gestiona su estado de acceso.
              </p>
            </div>
          </div>

          {/* Tabla de cuentas del sistema */}
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Nombre / Rol</th>
                  <th className="px-4 py-3 text-center">Estado de Acceso</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { username: "admin", role: "admin", display: "Administrador", status: "Activo" },
                  { username: "doctor", role: "doctor", display: "Dr. Médico", status: "Activo" },
                  { username: "doctora", role: "doctora", display: "Dra. Médica", status: "Activo" },
                  { username: "secretaria", role: "secretaria", display: "Secretaría", status: "Activo" },
                ].map((u) => {
                  const dbMatch = systemUsers.find((su) => su.username?.toLowerCase() === u.username.toLowerCase())
                  const currentStatus = dbMatch?.status || u.status

                  return (
                    <tr key={u.username} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{u.username}</td>
                      <td className="px-4 py-3 font-medium text-card-foreground">
                        {dbMatch?.display_name || u.display} <span className="text-xs text-muted-foreground">({u.role})</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold uppercase ${
                            currentStatus === "Activo"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {currentStatus === "Activo" ? <UserCheck className="h-3 w-3 mr-1 inline" /> : <UserX className="h-3 w-3 mr-1 inline" />}
                          {currentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.username !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(u.username, currentStatus)}
                            className="h-7 text-xs rounded-lg font-semibold"
                          >
                            {currentStatus === "Activo" ? "Desactivar" : "Reactivar"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Formulario de Restablecimiento Admin */}
          <div className="rounded-xl bg-purple-50/60 border border-purple-200 p-4 space-y-4">
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-700" />
              Restablecer Contraseña de Usuario
            </h3>

            {adminMessage && (
              <div
                className={`rounded-xl p-3 text-sm font-semibold flex items-center gap-2 ${
                  adminMessage.type === "success"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {adminMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{adminMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAdminReset} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-48 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-purple-900">Usuario Objetivo</Label>
                <Select value={targetUser} onValueChange={setTargetUser}>
                  <SelectTrigger className="h-10 rounded-xl bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">doctor (Dr. Médico)</SelectItem>
                    <SelectItem value="doctora">doctora (Dra. Médica)</SelectItem>
                    <SelectItem value="secretaria">secretaria (Secretaría)</SelectItem>
                    <SelectItem value="admin">admin (Administrador)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <Label className="text-xs font-bold uppercase text-purple-900">Nueva Contraseña para el Usuario</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Nueva clave segura (mín. 6 caracteres)"
                  value={adminNewPass}
                  onChange={(e) => setAdminNewPass(e.target.value)}
                  className="h-10 rounded-xl bg-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loadingAdminReset}
                className="h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 shrink-0"
              >
                {loadingAdminReset ? "Restableciendo..." : "Restablecer Clave"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* 4. INFORMACIÓN DE LA CLÍNICA Y ZONA HORARIA */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              Información de la Clínica
            </h2>
            <p className="text-xs text-muted-foreground">Datos de membrete, contacto y zona horaria</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Nombre de la Clínica
            </Label>
            <Input defaultValue="Clínica San Rafael" readOnly className="h-11 rounded-xl text-base font-semibold bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Teléfono de Contacto
            </Label>
            <Input defaultValue="7762-1234" readOnly className="h-11 rounded-xl text-base bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Ubicación y Dirección
            </Label>
            <Input defaultValue="Panajachel, Sololá, Guatemala" readOnly className="h-11 rounded-xl text-base bg-muted/40" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Zona Horaria Oficial
            </Label>
            <Input value="America/Guatemala (UTC-06:00, sin DST)" readOnly className="h-11 rounded-xl text-base bg-muted text-muted-foreground font-mono font-medium" />
          </div>
        </div>
      </div>
    </div>
  )
}
