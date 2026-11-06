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
    <div className="card-hover-lift group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-250 hover:shadow-lg hover:border-primary/20">
      {/* Specular green gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight text-card-foreground transition-colors duration-300 group-hover:text-primary">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground/80 font-medium">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
            variant === "warning"
              ? "bg-green-100 text-green-700 group-hover:bg-green-200 group-hover:shadow-green-200/50 dark:bg-green-950/30 dark:text-green-400"
              : "bg-primary/8 text-primary group-hover:bg-primary/14 group-hover:shadow-primary/15 dark:bg-primary/15"
          )}
        >
          <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-105" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-400 opacity-0 group-hover:opacity-100",
        variant === "warning"
          ? "bg-gradient-to-r from-green-500/70 via-green-400/40 to-transparent"
          : "bg-gradient-to-r from-primary/70 via-primary/35 to-transparent"
      )} />
    </div>
  )
}
