import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  variant?: "default" | "warning"
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: StatCardProps) {
  return (
    <div className="card-hover-lift group relative overflow-hidden rounded-2xl border border-border/90 bg-card/90 backdrop-blur-xl p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30">
      {/* Specular white gradient light overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight text-card-foreground transition-colors duration-300 group-hover:text-primary">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground font-medium">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
            variant === "warning"
              ? "bg-destructive/10 text-destructive group-hover:bg-destructive/20 group-hover:shadow-destructive/20"
              : "bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:shadow-primary/20"
          )}
        >
          <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-500 opacity-0 group-hover:opacity-100",
        variant === "warning"
          ? "bg-gradient-to-r from-destructive/70 via-destructive/40 to-transparent"
          : "bg-gradient-to-r from-primary/70 via-primary/40 to-transparent"
      )} />
    </div>
  )
}
