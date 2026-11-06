import { Settings, Building2, Users, Bell, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl text-balance">
          Configuracion
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajustes del sistema
        </p>
      </div>

      {/* Clinic info */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Informacion de la Clinica
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-card-foreground">
              Nombre de la Clinica
            </Label>
            <Input
              defaultValue="Clinica San Rafael"
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-card-foreground">Telefono</Label>
            <Input
              defaultValue="2255-8800"
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-card-foreground">Direccion</Label>
            <Input
              defaultValue="Panajachel, Guatemala"
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-card-foreground">Correo</Label>
            <Input
              defaultValue="info@clinicasanrafael.com"
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Notificaciones
          </h2>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Alertas de inventario bajo
              </p>
              <p className="text-xs text-muted-foreground">
                Recibir alerta cuando un producto tenga stock bajo
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Recordatorio de citas
              </p>
              <p className="text-xs text-muted-foreground">
                Enviar recordatorio antes de cada cita
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Resumen diario
              </p>
              <p className="text-xs text-muted-foreground">
                Recibir resumen de actividad al final del dia
              </p>
            </div>
            <Switch />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-card-foreground">
            Seguridad
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-card-foreground">
              Contrasena Actual
            </Label>
            <Input
              type="password"
              placeholder="********"
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-card-foreground">
              Nueva Contrasena
            </Label>
            <Input
              type="password"
              placeholder="********"
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="h-12 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/90">
          <Settings className="mr-2 h-5 w-5" />
          Guardar Configuracion
        </Button>
      </div>
    </div>
  )
}
