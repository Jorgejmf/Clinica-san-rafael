"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  MinusCircle,
  CalendarDays,
  Package,
  Trash2,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DebtorsView } from "./debtors-view"

type Transaction = {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  created_at: string
}

type Product = {
  id: string
  name: string
  stock: number
  price?: number
}

type Patient = {
  id: string
  first_name: string
  last_name: string
}

function ProductAutocomplete({
  inventory,
  selectedProductId,
  onSelect,
}: {
  inventory: Product[]
  selectedProductId: string
  onSelect: (productId: string) => void
}) {
  const selectedProd = inventory.find((p) => p.id === selectedProductId)
  const [query, setQuery] = useState(selectedProd ? selectedProd.name : "")
  const [isOpen, setIsOpen] = useState(false)

  // Keep query synced if selectedProductId changes or clears externally
  useEffect(() => {
    const prod = inventory.find((p) => p.id === selectedProductId)
    setQuery(prod ? prod.name : "")
  }, [selectedProductId, inventory])

  const filtered = query
    ? inventory.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : inventory

  const handleSelect = (prod: Product) => {
    setQuery(prod.name)
    setIsOpen(false)
    onSelect(prod.id)
  }

  const handleClear = () => {
    setQuery("")
    onSelect("")
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar medicamento por nombre..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            if (!e.target.value) onSelect("")
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="h-11 rounded-xl bg-card pr-10 text-sm font-semibold"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-[100] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
          {filtered.map((prod) => (
            <button
              key={prod.id}
              type="button"
              onMouseDown={() => handleSelect(prod)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-left hover:bg-accent hover:text-accent-foreground cursor-pointer font-medium border-b border-border/40 last:border-0"
            >
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-sm">{prod.name}</span>
                <span className="text-muted-foreground">Stock disponible: {prod.stock} unidades</span>
              </div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 font-bold text-xs">
                Q{(prod.price || 0).toFixed(2)}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && filtered.length === 0 && (
        <div className="absolute z-[100] mt-1 w-full rounded-xl border border-border bg-popover p-3 text-center text-xs text-muted-foreground shadow-lg">
          No se encontraron medicamentos con ese nombre.
        </div>
      )}
    </div>
  )
}

type SaleItem = {
  id: string
  type: "product" | "custom"
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export function SalesView({
  initialTransactions,
  inventory = [],
  patients = [],
  readOnly = false,
  userRole = "secretaria",
}: {
  initialTransactions: Transaction[]
  inventory?: Product[]
  patients?: Patient[]
  readOnly?: boolean
  userRole?: string
}) {
  const router = useRouter()
  const isAdmin = userRole === "admin"
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Filter states
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Helper create empty item
  const createEmptySaleItem = (type: "product" | "custom" = "custom"): SaleItem => ({
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    productId: "",
    description: type === "custom" ? "Consulta médica" : "",
    quantity: 1,
    unitPrice: 0,
    subtotal: 0,
  })

  // Sale form states with multiple line items
  const [saleDoctor, setSaleDoctor] = useState<"doctor" | "doctora" | "general">("general")
  const [salePaciente, setSalePaciente] = useState("")
  const [saleFecha, setSaleFecha] = useState(new Date().toISOString().split("T")[0])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([createEmptySaleItem("custom")])

  // Expense form
  const [expMonto, setExpMonto] = useState("")
  const [expDescripcion, setExpDescripcion] = useState("")
  const [expFecha, setExpFecha] = useState(new Date().toISOString().split("T")[0])

  // Sale item operations
  const handleAddSaleItem = (type: "product" | "custom" = "custom") => {
    setSaleItems((prev) => [...prev, createEmptySaleItem(type)])
  }

  const handleRemoveSaleItem = (id: string) => {
    setSaleItems((prev) => {
      if (prev.length <= 1) return [createEmptySaleItem("custom")]
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleUpdateItemType = (id: string, type: "product" | "custom") => {
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          type,
          productId: "",
          description: type === "custom" ? "Consulta médica" : "",
          unitPrice: 0,
          subtotal: 0,
        }
      })
    )
  }

  const handleUpdateItemProduct = (id: string, prodId: string) => {
    const prod = inventory.find((p) => p.id === prodId)
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const price = prod ? prod.price || 0 : 0
        const qty = item.quantity || 1
        return {
          ...item,
          productId: prodId,
          description: prod ? prod.name : "",
          unitPrice: price,
          subtotal: price * qty,
        }
      })
    )
  }

  const handleUpdateItemQuantity = (id: string, qty: number) => {
    const safeQty = Math.max(1, qty)
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          quantity: safeQty,
          subtotal: Number((safeQty * (item.unitPrice || 0)).toFixed(2)),
        }
      })
    )
  }

  const handleUpdateItemPrice = (id: string, price: number) => {
    const safePrice = Math.max(0, price)
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          unitPrice: safePrice,
          subtotal: Number(((item.quantity || 1) * safePrice).toFixed(2)),
        }
      })
    )
  }

  const handleUpdateItemDescription = (id: string, desc: string) => {
    setSaleItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description: desc } : item))
    )
  }

  const saleTotal = saleItems.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0)

  // Calendar logic & month/year extraction
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

  // Filter transactions by selected date or selected month
  const filteredTransactions = selectedDateFilter
    ? transactions.filter((t) => t.created_at?.startsWith(selectedDateFilter))
    : transactions.filter((t) => {
        if (!t.created_at) return false
        const d = new Date(t.created_at)
        return d.getFullYear() === year && d.getMonth() === month
      })

  // Calculate totals for selected month / filter
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpenses

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault()

    if (saleItems.length === 0) {
      alert("Debe agregar al menos un concepto a la venta.")
      return
    }

    // Check descriptions and stock
    for (const item of saleItems) {
      if (!item.description.trim()) {
        alert("Todos los conceptos deben tener una descripción o medicamento seleccionado.")
        return
      }
      if (item.type === "product" && item.productId) {
        const prod = inventory.find((p) => p.id === item.productId)
        if (prod && prod.stock < item.quantity) {
          const proceed = confirm(
            `El medicamento "${prod.name}" solo tiene ${prod.stock} unidades en stock (solicitado: ${item.quantity}). ¿Desea continuar de todos modos?`
          )
          if (!proceed) return
        }
      }
    }

    setLoading(true)

    let docTag = ""
    if (saleDoctor === "doctor") docTag = "[Dr. Médico]"
    else if (saleDoctor === "doctora") docTag = "[Dra. Médica]"

    const itemsSummary = saleItems
      .map((i) => {
        const qtyLabel = i.quantity > 1 ? ` (Cant: ${i.quantity})` : ""
        return `${i.description}${qtyLabel} [Q${i.subtotal.toFixed(2)}]`
      })
      .join(" + ")

    const fullCategory = `${docTag} ${salePaciente ? `[Paciente: ${salePaciente.trim()}] ` : ""}${itemsSummary}`.trim()
    const dateObj = new Date(saleFecha)

    const newTx = {
      type: "income" as const,
      amount: saleTotal,
      category: fullCategory,
      created_at: isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString(),
    }

    const { error } = await supabase.from("transactions").insert([newTx])

    // Deduct stock for all product items
    for (const item of saleItems) {
      if (item.type === "product" && item.productId) {
        const prod = inventory.find((p) => p.id === item.productId)
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity)
          await supabase.from("products").update({ stock: newStock }).eq("id", item.productId)
        }
      }
    }

    setLoading(false)
    if (!error) {
      setSaleDialogOpen(false)
      setSalePaciente("")
      setSaleItems([createEmptySaleItem("custom")])
      setSaleFecha(new Date().toISOString().split("T")[0])
      router.refresh()
    } else {
      alert("Error al registrar venta: " + error.message)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const dateObj = new Date(expFecha)
    const { error } = await supabase.from("transactions").insert([
      {
        type: "expense",
        amount: parseFloat(expMonto),
        category: expDescripcion,
        created_at: isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString(),
      },
    ])
    setLoading(false)
    if (!error) {
      setExpenseDialogOpen(false)
      setExpMonto("")
      setExpDescripcion("")
      setExpFecha(new Date().toISOString().split("T")[0])
      router.refresh()
    } else {
      alert("Error: " + error.message)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta transacción?")) return
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (!error) {
      setTransactions(transactions.filter((t) => t.id !== id))
      router.refresh()
    } else {
      alert("Error al eliminar transacción: " + error.message)
    }
  }

  const activePeriodLabel = selectedDateFilter
    ? `Día: ${selectedDateFilter}`
    : `${monthNames[month]} ${year}`

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Summary Cards */}
      <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Ingresos */}
        <div className="card-hover-lift rounded-2xl border theme-income-card p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl theme-income-icon shadow-xs">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold theme-income-label">
                Total Ingresos ({activePeriodLabel})
              </p>
              <p className="text-2xl font-black theme-income-amount">
                Q{totalIncome.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="card-hover-lift rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                Total Gastos ({activePeriodLabel})
              </p>
              <p className="text-2xl font-black text-red-800 dark:text-red-200">
                Q{totalExpenses.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className={`card-hover-lift rounded-2xl border p-4 shadow-sm transition-all duration-300 ${balance >= 0 ? "border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20" : "border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${balance >= 0 ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400" : "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400"}`}>
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold ${balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}`}>
                Balance General ({activePeriodLabel})
              </p>
              <p className={`text-2xl font-black ${balance >= 0 ? "text-blue-800 dark:text-blue-200" : "text-orange-800 dark:text-orange-200"}`}>
                {balance < 0 ? "-" : ""}Q{Math.abs(balance).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ventas" className="w-full">
        <TabsList className="rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="ventas" className="rounded-lg text-sm gap-2">
            <DollarSign className="h-4 w-4" />
            Registro de Ventas y Gastos
          </TabsTrigger>
          <TabsTrigger value="deudores" className="rounded-lg text-sm gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            Deudores (Personas con Deudas)
          </TabsTrigger>
        </TabsList>

        {/* VENTAS TAB */}
        <TabsContent value="ventas" className="mt-4 space-y-5">
          {/* Action Buttons & Calendar Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filtro por día:</span>
              {selectedDateFilter ? (
                <Badge className="bg-primary text-white flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {selectedDateFilter}
                  <button onClick={() => setSelectedDateFilter(null)} className="ml-1 font-bold">×</button>
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground italic">(Mostrando todas las ventas)</span>
              )}
            </div>

            {!readOnly && (
              <div className="flex flex-wrap gap-3">
                {/* Expense button */}
                <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl border-red-300 text-red-600 hover:bg-red-50">
                      <MinusCircle className="mr-2 h-4 w-4" />
                      Registrar Gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <MinusCircle className="h-5 w-5" />
                        Nuevo Gasto
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Descripción del Gasto</Label>
                        <Input
                          placeholder="Ej: Compra de medicamentos, luz, agua..."
                          required
                          value={expDescripcion}
                          onChange={(e) => setExpDescripcion(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monto (Q)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          required
                          min="0"
                          step="0.01"
                          value={expMonto}
                          onChange={(e) => setExpMonto(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input
                          type="date"
                          required
                          value={expFecha}
                          onChange={(e) => setExpFecha(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={loading} className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white px-6">
                          {loading ? "Guardando..." : "Registrar Gasto"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Sale button with Inventory Linking */}
                <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Venta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Registrar Venta (Múltiples Conceptos)
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddSale} className="space-y-4 pt-2">
                      {/* Doctor, Paciente y Fecha */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Asignar a Médico</Label>
                          <Select value={saleDoctor} onValueChange={(val: any) => setSaleDoctor(val)}>
                            <SelectTrigger className="h-10 rounded-xl text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">Ninguno / General</SelectItem>
                              <SelectItem value="doctor">
                                <span className="text-blue-600 font-semibold">Dr. Médico (Azul)</span>
                              </SelectItem>
                              <SelectItem value="doctora">
                                <span className="text-pink-600 font-semibold">Dra. Médica (Rosado)</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Paciente (Opcional)</Label>
                          <Input
                            placeholder="Nombre del paciente"
                            value={salePaciente}
                            onChange={(e) => setSalePaciente(e.target.value)}
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Fecha</Label>
                          <Input
                            type="date"
                            required
                            value={saleFecha}
                            onChange={(e) => setSaleFecha(e.target.value)}
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      {/* Header de Conceptos / Renglones */}
                      <div className="border-t border-border pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <Label className="text-sm font-bold text-foreground">
                            Conceptos de la Venta ({saleItems.length})
                          </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddSaleItem("custom")}
                              className="h-8 rounded-lg text-xs gap-1.5 font-semibold border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              + Consulta / Servicio
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddSaleItem("product")}
                              className="h-8 rounded-lg text-xs gap-1.5 font-semibold border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              <Package className="h-3.5 w-3.5" />
                              + Medicamento
                            </Button>
                          </div>
                        </div>

                        {/* Lista de Renglones */}
                        <div className="space-y-3">
                          {saleItems.map((item, idx) => {
                            const isProd = item.type === "product"
                            const selectedProd = isProd ? inventory.find((p) => p.id === item.productId) : null

                            return (
                              <div
                                key={item.id}
                                className="rounded-xl border border-border bg-card p-3 shadow-xs space-y-2.5 transition-all hover:border-primary/40"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-extrabold text-muted-foreground">
                                      {idx + 1}
                                    </span>
                                    <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemType(item.id, "custom")}
                                        className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                          !isProd
                                            ? "bg-white text-primary shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`}
                                      >
                                        Consulta / Servicio
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemType(item.id, "product")}
                                        className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                          isProd
                                            ? "bg-purple-600 text-white shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                        }`}
                                      >
                                        Medicamento (Inventario)
                                      </button>
                                    </div>
                                  </div>

                                  {saleItems.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveSaleItem(item.id)}
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      title="Quitar este concepto"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>

                                {isProd ? (
                                  <div className="space-y-2">
                                    <div>
                                      <ProductAutocomplete
                                        inventory={inventory}
                                        selectedProductId={item.productId || ""}
                                        onSelect={(prodId) => handleUpdateItemProduct(item.id, prodId)}
                                      />
                                      {selectedProd && (
                                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                                          <span>Stock: <strong>{selectedProd.stock}</strong> unidades</span>
                                          <span>•</span>
                                          <span>Precio catálogo: <strong>Q{(selectedProd.price || 0).toFixed(2)}</strong></span>
                                        </p>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground font-semibold">Cantidad</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={item.quantity}
                                          onChange={(e) =>
                                            handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)
                                          }
                                          className="h-9 text-xs font-bold rounded-lg"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground font-semibold">Precio Unit. (Q)</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={item.unitPrice}
                                          onChange={(e) =>
                                            handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)
                                          }
                                          className="h-9 text-xs font-bold rounded-lg"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-muted-foreground font-semibold">Subtotal (Q)</Label>
                                        <div className="h-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                                          Q{item.subtotal.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                    <div className="sm:col-span-6">
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Descripción del Concepto</Label>
                                      <Input
                                        placeholder="Ej: Consulta médica general, Ultrasonido..."
                                        value={item.description}
                                        onChange={(e) => handleUpdateItemDescription(item.id, e.target.value)}
                                        className="h-9 text-xs font-semibold rounded-lg"
                                        required
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Cant.</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)
                                        }
                                        className="h-9 text-xs font-bold rounded-lg text-center"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Precio (Q)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={item.unitPrice || ""}
                                        onChange={(e) =>
                                          handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)
                                        }
                                        className="h-9 text-xs font-bold rounded-lg"
                                        required
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Subtotal</Label>
                                      <div className="h-9 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
                                        Q{item.subtotal.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Total Bar and Submit */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Venta:</span>
                          <span className="text-xl font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                            Q{saleTotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSaleDialogOpen(false)}
                            className="h-11 rounded-xl flex-1 sm:flex-none"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={loading || saleTotal <= 0}
                            className="h-11 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90 font-bold flex-1 sm:flex-none shadow-sm"
                          >
                            {loading ? "Guardando..." : `Registrar Venta (Q${saleTotal.toFixed(2)})`}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Interactive Sales Calendar Component */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1))} className="h-8 w-8 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h4 className="text-sm font-bold text-card-foreground">
                Calendario de Ventas: {monthNames[month]} {year}
              </h4>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1))} className="h-8 w-8 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-1">
              <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const hasSales = transactions.some((t) => t.created_at?.startsWith(dayStr))
                const isSelected = selectedDateFilter === dayStr

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDateFilter(isSelected ? null : dayStr)}
                    className={`h-8 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white"
                        : hasSales
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                          : "text-card-foreground hover:bg-muted"
                    }`}
                  >
                    {day}
                    {hasSales && !isSelected && <span className="h-1 w-1 rounded-full bg-emerald-600 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Transactions Table with Color-coding by Doctor */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Médico Asignado</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Monto</th>
                    <th className="hidden px-5 py-3 text-left font-medium text-muted-foreground sm:table-cell">Descripción</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                    {isAdmin && <th className="px-5 py-3 text-center font-medium text-muted-foreground">Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => {
                    const isDoctor = t.category.includes("[Dr. Médico]")
                    const isDoctora = t.category.includes("[Dra. Médica]")

                    let rowClass = "hover:bg-muted/30"
                    let badgeClass = "theme-income-badge"
                    let doctorBadge = "General / Sin Dr."
                    let doctorStyle = "bg-muted text-muted-foreground border-border"

                    if (isDoctor) {
                      rowClass = "bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                      doctorBadge = "Dr. Médico"
                      doctorStyle = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                    } else if (isDoctora) {
                      rowClass = "bg-pink-50/40 hover:bg-pink-50/70 dark:bg-pink-950/20 dark:hover:bg-pink-950/40"
                      doctorBadge = "Dra. Médica"
                      doctorStyle = "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800"
                    }

                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-border last:border-0 transition-colors ${rowClass}`}
                      >
                        <td className="px-5 py-3">
                          {t.type === "income" ? (
                            <Badge className={badgeClass}>
                              Ingreso
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
                              Gasto
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${doctorStyle}`}>
                            {doctorBadge}
                          </Badge>
                        </td>
                        <td className={`px-5 py-3 font-bold ${t.type === "income" ? "theme-income-cell-text" : "text-red-700"}`}>
                          {t.type === "expense" ? "-" : ""}Q{Number(t.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="hidden max-w-xs truncate px-5 py-3 text-muted-foreground sm:table-cell">
                          {t.category}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("es-GT")}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-10 text-center text-muted-foreground">
                        No hay transacciones registradas para el filtro actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* DEUDORES TAB */}
        <TabsContent value="deudores" className="mt-4">
          <DebtorsView
            patients={patients}
            userRole={userRole}
            onAddTransaction={(amt, desc) => {
              setTransactions([
                {
                  id: `tx-${Date.now()}`,
                  type: "income",
                  amount: amt,
                  category: desc,
                  created_at: new Date().toISOString(),
                },
                ...transactions,
              ])
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
