"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { buildClinicUser, getCurrentUser } from "@/lib/auth"
import { hashPassword, verifyPassword } from "@/lib/crypto"
import { supabase } from "@/lib/supabase"

// Default initial accounts for seamless setup
const INITIAL_USERS: Record<string, { role: "admin" | "doctor" | "doctora" | "secretaria"; displayName: string; defaultPlain: string }> = {
  admin: { role: "admin", displayName: "Administrador", defaultPlain: "admin123" },
  doctor: { role: "doctor", displayName: "Dr. Médico", defaultPlain: "doctor123" },
  doctora: { role: "doctora", displayName: "Dra. Médica", defaultPlain: "doctora123" },
  secretaria: { role: "secretaria", displayName: "Secretaría", defaultPlain: "secretaria123" },
}

export async function login(formData: FormData) {
  const username = ((formData.get("username") as string) || "").toLowerCase().trim()
  const password = (formData.get("password") as string) || ""

  if (!username || !password) {
    redirect("/login?message=Ingresa tu usuario y contraseña")
  }

  // 1. Check in system_users table if available
  let dbUser: any = null
  try {
    const { data, error } = await supabase
      .from("system_users")
      .select("*")
      .eq("username", username)
      .maybeSingle()

    if (!error && data) {
      dbUser = data
    }
  } catch {}

  let isValid = false
  let userRole: "admin" | "doctor" | "doctora" | "secretaria" = "secretaria"
  let userDisplay = username
  let userStatus = "Activo"

  if (dbUser) {
    userStatus = dbUser.status || "Activo"
    if (userStatus === "Inactivo") {
      redirect("/login?message=Usuario inactivo. Contacta al administrador para habilitar tu acceso.")
    }
    isValid = verifyPassword(password, dbUser.password_hash)
    userRole = dbUser.role || "secretaria"
    userDisplay = dbUser.display_name || username
  } else if (INITIAL_USERS[username]) {
    // Fallback to initial user definition
    const init = INITIAL_USERS[username]
    isValid = password === init.defaultPlain
    userRole = init.role
    userDisplay = init.displayName

    // Auto-create in system_users if table exists so it gets hashed immediately
    try {
      if (isValid) {
        await supabase.from("system_users").insert([
          {
            username,
            display_name: userDisplay,
            role: userRole,
            password_hash: hashPassword(password),
            status: "Activo",
          },
        ])
      }
    } catch {}
  }

  if (!isValid) {
    redirect("/login?message=Credenciales inválidas. Verifica tu usuario y contraseña")
  }

  const user = buildClinicUser(username, userDisplay, userRole)
  const cookieStore = await cookies()
  cookieStore.set("clinic_user", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
  redirect("/")
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("clinic_user")
  redirect("/login")
}

export async function updateMyProfile(data: { displayName: string }) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, message: "Sesión no válida o expirada" }
  }

  const cleanName = (data.displayName || "").trim()
  if (!cleanName || cleanName.length < 2) {
    return { success: false, message: "El nombre debe tener al menos 2 caracteres" }
  }

  try {
    // Update in system_users
    await supabase
      .from("system_users")
      .update({
        display_name: cleanName,
        updated_at: new Date().toISOString(),
      })
      .eq("username", currentUser.username)

    // Update session cookie
    const updatedUser = {
      ...currentUser,
      displayName: cleanName,
    }
    const cookieStore = await cookies()
    cookieStore.set("clinic_user", JSON.stringify(updatedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
      path: "/",
      sameSite: "lax",
    })

    revalidatePath("/configuracion")
    revalidatePath("/", "layout")
    return { success: true, message: "Perfil actualizado correctamente" }
  } catch (err: any) {
    return { success: false, message: "Error al actualizar perfil: " + (err?.message || "Error") }
  }
}

export async function changeMyPassword(data: { currentPass: string; newPass: string; confirmPass: string }) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, message: "Sesión no válida o expirada" }
  }

  if (!data.newPass || data.newPass.length < 6) {
    return { success: false, message: "La nueva contraseña debe tener al menos 6 caracteres" }
  }

  if (data.newPass !== data.confirmPass) {
    return { success: false, message: "La confirmación de la nueva contraseña no coincide" }
  }

  // Verify current password
  let dbUser: any = null
  try {
    const { data: userRecord } = await supabase
      .from("system_users")
      .select("*")
      .eq("username", currentUser.username)
      .maybeSingle()
    dbUser = userRecord
  } catch {}

  let isCurrentValid = false
  if (dbUser) {
    isCurrentValid = verifyPassword(data.currentPass, dbUser.password_hash)
  } else if (INITIAL_USERS[currentUser.username]) {
    isCurrentValid = data.currentPass === INITIAL_USERS[currentUser.username].defaultPlain
  }

  if (!isCurrentValid) {
    return { success: false, message: "La contraseña actual es incorrecta" }
  }

  const newHash = hashPassword(data.newPass)

  try {
    if (dbUser) {
      const { error } = await supabase
        .from("system_users")
        .update({
          password_hash: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq("username", currentUser.username)

      if (error) throw error
    } else {
      const { error } = await supabase.from("system_users").upsert([
        {
          username: currentUser.username,
          display_name: currentUser.displayName,
          role: currentUser.role,
          password_hash: newHash,
          status: "Activo",
        },
      ])
      if (error) throw error
    }

    return { success: true, message: "Contraseña actualizada exitosamente" }
  } catch (err: any) {
    return { success: false, message: "Error al actualizar contraseña: " + (err?.message || "Error desconocido") }
  }
}

export async function adminResetUserPassword(targetUsername: string, newPass: string) {
  const currentUser = await getCurrentUser()
  if (currentUser?.role !== "admin") {
    return { success: false, message: "Permisos insuficientes: sólo el Administrador puede restablecer contraseñas" }
  }

  if (!newPass || newPass.length < 6) {
    return { success: false, message: "La contraseña debe tener al menos 6 caracteres" }
  }

  const newHash = hashPassword(newPass)

  try {
    const { error } = await supabase.from("system_users").upsert(
      [
        {
          username: targetUsername.toLowerCase().trim(),
          display_name: INITIAL_USERS[targetUsername]?.displayName || targetUsername,
          role: INITIAL_USERS[targetUsername]?.role || "secretaria",
          password_hash: newHash,
          status: "Activo",
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "username" }
    )

    if (error) throw error
    revalidatePath("/configuracion")
    return { success: true, message: `Contraseña de ${targetUsername} restablecida correctamente` }
  } catch (err: any) {
    return { success: false, message: "Error al restablecer contraseña: " + (err?.message || "Error") }
  }
}

export async function adminToggleUserStatus(targetUsername: string, newStatus: "Activo" | "Inactivo") {
  const currentUser = await getCurrentUser()
  if (currentUser?.role !== "admin") {
    return { success: false, message: "Permisos insuficientes" }
  }

  if (targetUsername.toLowerCase() === "admin" && newStatus === "Inactivo") {
    return { success: false, message: "No se puede desactivar la cuenta de Administrador principal" }
  }

  try {
    const { error } = await supabase.from("system_users").upsert(
      [
        {
          username: targetUsername.toLowerCase().trim(),
          display_name: INITIAL_USERS[targetUsername]?.displayName || targetUsername,
          role: INITIAL_USERS[targetUsername]?.role || "secretaria",
          password_hash: hashPassword("temp1234"),
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "username" }
    )

    if (error) throw error
    revalidatePath("/configuracion")
    return { success: true, message: `Usuario ${targetUsername} ahora está ${newStatus}` }
  } catch (err: any) {
    return { success: false, message: "Error al actualizar estado: " + (err?.message || "Error") }
  }
}
