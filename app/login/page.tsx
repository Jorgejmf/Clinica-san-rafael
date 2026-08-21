import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Clínica San Rafael</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
        {message && (
          <div className="mb-4 rounded-xl bg-destructive/15 p-3 text-sm text-destructive text-center font-medium">
            {message}
          </div>
        )}
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input id="username" name="username" type="text" placeholder="Ej: admin" required className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required className="h-11 rounded-xl" />
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button formAction={login} className="h-11 rounded-xl">
              Iniciar Sesión
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
