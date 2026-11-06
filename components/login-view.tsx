"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import {
  HeartPulse,
  Sun,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { login } from "@/app/login/actions"

interface LoginViewProps {
  message?: string
}

export function LoginView({ message: initialMessage }: LoginViewProps) {
  const [errorMessage, setErrorMessage] = useState(initialMessage || "")
  const [showPassword, setShowPassword] = useState(false)
  const [artOffset, setArtOffset] = useState({ x: 0, y: 0 })
  const [isPending, startTransition] = useTransition()
  const storyRef = useRef<HTMLElement>(null)

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || !storyRef.current) return
    const bounds = storyRef.current.getBoundingClientRect()
    const x = ((e.clientX - bounds.left) / bounds.width - 0.5) * 14
    const y = ((e.clientY - bounds.top) / bounds.height - 0.5) * 12
    setArtOffset({ x, y })
  }

  const handlePointerLeave = () => {
    setArtOffset({ x: 0, y: 0 })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage("")
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const result = await login(formData)
        if (result?.error) {
          setErrorMessage(result.error)
        }
      } catch (err: any) {
        // En Next.js redirect lanza un error NEXT_REDIRECT que debe permitirse
        if (err?.message?.includes("NEXT_REDIRECT")) {
          throw err
        }
        setErrorMessage(err?.message || "Ocurrió un error al iniciar sesión.")
      }
    })
  }

  return (
    <div className="login-page-body">
      <main className="login-card-container">
        {/* Identidad de la clínica */}
        <section
          ref={storyRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="login-story"
          id="story"
        >
          <div className="relative z-10 w-[170px] max-w-full">

          </div>

          <div className="login-story-copy">
            <p className="login-eyebrow">


            </p>

            <h2 className="login-slogan">
              Cerca de ti,
              <br />
              <span>
                en cada
                <br />
                etapa.
              </span>
            </h2>



          </div>

          <div
            className="login-art"
            id="art"
            aria-hidden="true"
            style={
              {
                "--move-x": `${artOffset.x}px`,
                "--move-y": `${artOffset.y}px`,
              } as React.CSSProperties
            }
          >
            <div className="login-ring" />
            <div className="login-ring" />
            <div className="login-ring" />

            <div className="login-cross" />
            <div className="login-ball" />


          </div>

          <div className="login-story-footer">


          </div>
        </section>

        {/* Zona del formulario */}
        <section className="login-access" aria-label="Acceso al sistema">
          <div className="login-form-card">
            <div className="login-form-kicker">
              <div className="login-kicker-icon flex items-center justify-center">
                <Sun className="h-4 w-4" aria-hidden="true" />
              </div>

            </div>

            <h1 className="login-title">
              Bienvenido
              <br />
              de nuevo.
            </h1>




            {errorMessage && (
              <div className="login-alert-message mb-5 flex items-start gap-2.5" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-fields-form" autoComplete="off">
              <div className="login-field-item">
                <label htmlFor="username">Usuario</label>
                <div className="login-input-wrapper">
                  <UserRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Tu usuario"
                    autoComplete="off"
                    spellCheck="false"
                    required
                  />
                </div>
              </div>

              <div className="login-field-item">
                <label htmlFor="password">Contraseña</label>
                <div className="login-input-wrapper">
                  <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-toggle-btn"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="login-btn-submit"
              >
                <span>{isPending ? "Iniciando sesión..." : "Iniciar sesión"}</span>
                <div className="login-arrow-icon">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-white" aria-hidden="true" />
                  )}
                </div>
              </button>
            </form>


          </div>


        </section>
      </main>
    </div>
  )
}
