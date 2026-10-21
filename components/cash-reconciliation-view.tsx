"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Banknote,
  DollarSign,
  Calculator,
  RotateCcw,
  Printer,
  Save,
  CheckCircle2,
  Building2,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react"

type DenominationRow = {
  denom: number
  label: string
  color: string
}

const GUATEMALA_DENOMINATIONS: DenominationRow[] = [
  { denom: 200, label: "Billete de Q200 (Bicolor Azul/Cian)", color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200" },
  { denom: 100, label: "Billete de Q100 (Café Sepia)", color: "text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200" },
  { denom: 50, label: "Billete de Q50 (Naranja)", color: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200" },
  { denom: 20, label: "Billete de Q20 (Azul Oscuro)", color: "text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200" },
  { denom: 10, label: "Billete de Q10 (Rojo Guinda)", color: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200" },
  { denom: 5, label: "Billete de Q5 (Morado)", color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200" },
  { denom: 1, label: "Billete de Q1 (Verde Quetzal)", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" },
]

export function CashReconciliationView({
  selectedDate,
  suggestedDeposits = 0,
}: {
  selectedDate?: string | null
  suggestedDeposits?: number
}) {
  const activeDate = selectedDate || new Date().toISOString().split("T")[0]
  const storageKey = `arqueo_billetes_gt_${activeDate}`

  // Counts of each bill denomination
  const [counts, setCounts] = useState<Record<number, number>>({
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
  })

  // Deposited amount per denomination row
  const [deposits, setDeposits] = useState<Record<number, number>>({
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
  })

  // Editable "Caja" (base/fondo de caja)
  const [caja, setCaja] = useState<number>(0)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Load from localStorage for the active date
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.counts) setCounts(data.counts)
        if (data.deposits) setDeposits(data.deposits)
        if (data.caja !== undefined) setCaja(Number(data.caja) || 0)
      } else {
        // Reset defaults
        setCounts({ 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 })
        setDeposits({ 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 })
        setCaja(0)
      }
    } catch {
      // Ignorar errores de parsing
    }
  }, [storageKey])

  const handleCountChange = (denom: number, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0)
    setCounts((prev) => ({ ...prev, [denom]: num }))
  }

  const handleDepositChange = (denom: number, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0)
    setDeposits((prev) => ({ ...prev, [denom]: num }))
  }

  // Cálculos matemáticos
  // 1. Total de billetes (suma de cantidad * denominación)
  const totalBilletes = GUATEMALA_DENOMINATIONS.reduce(
    (sum, d) => sum + d.denom * (counts[d.denom] || 0),
    0
  )

  // Total depositado
  const totalDepositado = Object.values(deposits).reduce((sum, v) => sum + (Number(v) || 0), 0)

  // 2. La diferencia según lo que hay en todos los billetes
  const diferencia = totalBilletes - caja

  // 3. El total del día (la resta de caja a la diferencia: diferencia - caja)
  const totalDelDia = diferencia - caja

  const handleSave = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: activeDate,
          counts,
          deposits,
          caja,
          savedAt: new Date().toISOString(),
        })
      )
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (e) {
      alert("Error al guardar localmente: " + String(e))
    }
  }

  const handleReset = () => {
    if (confirm(`¿Está seguro de reiniciar el arqueo de billetes del día ${activeDate}?`)) {
      setCounts({ 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 })
      setDeposits({ 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 })
      setCaja(0)
      localStorage.removeItem(storageKey)
    }
  }

  const handleAutoFillSuggestedDeposit = () => {
    if (suggestedDeposits > 0) {
      setDeposits((prev) => ({
        ...prev,
        100: Number(suggestedDeposits.toFixed(2)),
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
                Arqueo de Billetes de Guatemala & Cuadre de Caja
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Fecha del Cuadre: <strong>{activeDate}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {suggestedDeposits > 0 && totalDepositado === 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoFillSuggestedDeposit}
                className="h-9 rounded-xl text-xs gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                title="Cargar total de transferencias/depósitos registrados en ventas de hoy"
              >
                <Building2 className="h-3.5 w-3.5" />
                Cargar Depósitos de Ventas (Q{suggestedDeposits.toFixed(2)})
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 rounded-xl text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-9 rounded-xl text-xs gap-1"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="h-9 rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground font-bold shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Guardar Conteo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Denominaciones */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5 text-left">Denominación (Billetes de Guatemala)</th>
                <th className="px-5 py-3.5 text-center w-40">Cantidad de Billetes</th>
                <th className="px-5 py-3.5 text-right w-44">Suma de Denominaciones</th>
                <th className="px-5 py-3.5 text-right w-44">Depositado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {GUATEMALA_DENOMINATIONS.map((d) => {
                const count = counts[d.denom] || 0
                const subtotal = d.denom * count
                const depositVal = deposits[d.denom] || 0

                return (
                  <tr key={d.denom} className="hover:bg-muted/30 transition-colors">
                    {/* Denominación */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center font-black text-sm px-3 py-1 rounded-xl border ${d.color}`}>
                          Q{d.denom}.00
                        </span>
                        <span className="font-semibold text-foreground text-xs hidden sm:inline">
                          {d.label}
                        </span>
                      </div>
                    </td>

                    {/* Cantidad de Billetes (Editable) */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={count === 0 ? "" : count}
                          placeholder="0"
                          onChange={(e) => handleCountChange(d.denom, e.target.value)}
                          className="h-10 w-28 text-center text-sm font-extrabold rounded-xl border-border focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                        />
                      </div>
                    </td>

                    {/* Suma de las denominaciones */}
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-black text-sm ${subtotal > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        Q{subtotal.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Columna: Depositado (Editable) */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end">
                        <div className="relative w-36">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                            Q
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={depositVal === 0 ? "" : depositVal}
                            placeholder="0.00"
                            onChange={(e) => handleDepositChange(d.denom, e.target.value)}
                            className="h-10 w-full pl-7 text-right text-sm font-bold rounded-xl border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60 font-black">
                <td className="px-5 py-4 text-foreground text-sm uppercase tracking-wide">
                  Totales por Columna
                </td>
                <td className="px-5 py-4 text-center text-xs text-muted-foreground">
                  {Object.values(counts).reduce((s, v) => s + (v || 0), 0)} billetes
                </td>
                <td className="px-5 py-4 text-right text-base text-emerald-800 dark:text-emerald-300">
                  Q{totalBilletes.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 text-right text-base text-blue-800 dark:text-blue-300">
                  Q{totalDepositado.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECCIÓN DE RESUMEN REQUERIDA POR EL USUARIO:
          - Total de billetes
          - Caja (modificable por el usuario)
          - La diferencia según lo que hay en todos los billetes
          - El total del día que sea la resta de caja a la diferencia
      */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="text-base font-black text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Resumen Oficial del Cuadre de Caja
          </h4>
          <Badge variant="outline" className="text-xs font-bold text-muted-foreground">
            Fórmulas de Cuadre
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total de Billetes */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                1. Total de Billetes
              </span>
              <Banknote className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
              Q{totalBilletes.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
              Suma de todas las denominaciones
            </p>
          </div>

          {/* 2. Caja (Modificable por el usuario) */}
          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/20 p-4 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                2. Caja (Modificable)
              </span>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm font-bold text-purple-900 dark:text-purple-200">Q</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={caja === 0 ? "" : caja}
                placeholder="0.00"
                onChange={(e) => setCaja(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-10 text-lg font-black rounded-xl border-purple-300 bg-white dark:bg-purple-950/50 text-purple-950 dark:text-purple-100 focus:border-purple-600"
              />
            </div>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-400">
              Fondo base o monto fijo de caja
            </p>
          </div>

          {/* 3. La Diferencia según lo que hay en todos los billetes */}
          <div className={`rounded-2xl border p-4 shadow-2xs space-y-1.5 ${
            diferencia >= 0
              ? "border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20"
              : "border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                diferencia >= 0 ? "text-blue-800 dark:text-blue-300" : "text-amber-800 dark:text-amber-300"
              }`}>
                3. Diferencia
              </span>
              <Calculator className={`h-4 w-4 ${diferencia >= 0 ? "text-blue-600" : "text-amber-600"}`} />
            </div>
            <p className={`text-2xl font-black ${
              diferencia >= 0 ? "text-blue-900 dark:text-blue-200" : "text-amber-900 dark:text-amber-200"
            }`}>
              {diferencia < 0 ? "-" : ""}Q{Math.abs(diferencia).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-[11px] ${diferencia >= 0 ? "text-blue-700/80 dark:text-blue-400" : "text-amber-700/80 dark:text-amber-400"}`}>
              Billetes (Q{totalBilletes.toFixed(2)}) − Caja (Q{caja.toFixed(2)})
            </p>
          </div>

          {/* 4. Total del Día (la resta de caja a la diferencia) */}
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                4. Total del Día
              </span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-black text-foreground">
              {totalDelDia < 0 ? "-" : ""}Q{Math.abs(totalDelDia).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">
              Diferencia (Q{diferencia.toFixed(2)}) − Caja (Q{caja.toFixed(2)})
            </p>
          </div>
        </div>

        {/* Resumen Adicional de Depósitos */}
        {totalDepositado > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Total de Dinero Depositado / Transferido:</span>
            </div>
            <span className="text-base font-black text-blue-800">
              Q{totalDepositado.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
