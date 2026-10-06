import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams
  
  return (
    <div className="login-bg flex min-h-screen items-center justify-center bg-muted/20 p-4">
      {/* Decorative ambient background elements fading towards pure WHITE */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-24 w-80 h-80 rounded-full bg-white/70 dark:bg-white/10 blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full bg-white/60 dark:bg-white/10 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-white/50 dark:bg-white/5 blur-3xl pointer-events-none" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Card with elegant glassmorphism and white border glow */}
        <div className="rounded-3xl border border-white/60 dark:border-white/10 bg-card/95 backdrop-blur-2xl p-8 shadow-2xl shadow-black/5 dark:shadow-black/40">
          {/* Logo and branding */}
          <div className="mb-8 text-center">
            {/* Logo in crisp container */}
            <div className="mx-auto mb-5 relative w-28 h-28 animate-fade-in-down">
              <div className="relative w-full h-full rounded-2xl bg-white p-2.5 overflow-hidden ring-2 ring-black/5 dark:ring-white/15 shadow-xl shadow-black/5 transition-all duration-500 hover:scale-105 hover:ring-primary/30 hover:shadow-2xl">
                <Image
                  src="/logo.png"
                  alt="Clínica San Rafael - Logo"
                  fill
                  className="object-contain p-1"
                  sizes="112px"
                  priority
                />
              </div>
              {/* White diffuse halo behind logo */}
              <div className="absolute inset-0 rounded-2xl bg-white/60 dark:bg-white/15 blur-xl -z-10 animate-pulse-white" />
            </div>

            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Clínica San Rafael
            </h1>
            <p className="mt-1 text-xs font-bold text-primary tracking-widest uppercase">
              Clínica Médica Familiar
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {message && (
            <div className="mb-4 rounded-xl bg-destructive/15 p-3 text-sm text-destructive text-center font-medium animate-fade-in-up border border-destructive/20">
              {message}
            </div>
          )}

          <form className="space-y-6">
            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Ej: admin"
                required
                className="h-11 rounded-xl transition-all duration-200 focus:shadow-md focus:shadow-primary/10 border-border/80"
              />
            </div>
            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.16s' }}>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-11 rounded-xl transition-all duration-200 focus:shadow-md focus:shadow-primary/10 border-border/80"
              />
            </div>
            <div className="flex flex-col gap-3 pt-4 animate-fade-in-up" style={{ animationDelay: '0.24s' }}>
              <Button
                formAction={login}
                className="h-11 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                Iniciar Sesión
              </Button>
            </div>
          </form>

          {/* Bottom text */}
          <p className="mt-8 text-center text-[10px] text-muted-foreground/60 tracking-wide font-medium">
            Sistema de Gestión Médica v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
