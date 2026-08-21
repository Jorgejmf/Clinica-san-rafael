"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { buildClinicUser } from "@/lib/auth"

// Whitelisted users and their passwords
const WHITELIST: Record<string, string> = {
  admin: "admin123",
  doctor: "doctor123",
  doctora: "doctora123",
  secretaria: "secretaria123",
}

export async function login(formData: FormData) {
  const username = ((formData.get("username") as string) || "").toLowerCase()
  const password = (formData.get("password") as string) || ""

  if (!WHITELIST[username] || WHITELIST[username] !== password) {
    redirect(
      "/login?message=Credenciales inválidas. Verifica tu usuario y contraseña"
    )
  }

  const user = buildClinicUser(username)
  const cookieStore = await cookies()
  cookieStore.set("clinic_user", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
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
