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
  Syringe,
  Building2,
  Eye,
  Printer,
  ArrowUpDown,
  Banknote,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DebtorsView } from "./debtors-view"
import { CashReconciliationView } from "./cash-reconciliation-view"
import { formatDateGT, formatDateTimeGT } from "@/lib/date-utils"

export type Transaction = {
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

export type SaleClassification = "consulta" | "inyeccion" | "medicamento" | "otros" | "gasto"

export function classifySale(category: string, type: "income" | "expense"): {
  classification: SaleClassification
  label: string
  boxClasses: string
  textColor: string
  icon: any
} {
  if (type === "expense") {
    return {
      classification: "gasto",
      label: "Gasto",
      boxClasses: "border-2 border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-600",
      textColor: "text-red-700 dark:text-red-300",
      icon: MinusCircle,
    }
  }

  const catLower = (category || "").toLowerCase()

  // 1. PRIORIZAR CONSULTA SI HAY VARIAS COSAS EN LA VENTA -> Verde
  if (
    catLower.includes("consulta") ||
    catLower.includes("control") ||
    catLower.includes("visita") ||
    catLower.includes("evaluacion")
  ) {
    return {
      classification: "consulta",
      label: "Consulta",
      boxClasses: "border-2 border-emerald-500 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-600",
      textColor: "text-emerald-800 dark:text-emerald-300",
      icon: Stethoscope,
    }
  }

  // 2. Inyección -> Morado
  if (
    catLower.includes("inyecc") ||
    catLower.includes("inyec") ||
    catLower.includes("inyección") ||
    catLower.includes("inyeccion") ||
    catLower.includes("ampolla")
  ) {
    return {
      classification: "inyeccion",
      label: "Inyección",
      boxClasses: "border-2 border-purple-500 bg-purple-50 text-purple-900 font-extrabold shadow-2xs dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-600",
      textColor: "text-purple-800 dark:text-purple-300",
      icon: Syringe,
    }
  }

  // 3. Medicamento u otros -> Azul
  const isMed =
    catLower.includes("medicamento") ||
    catLower.includes("receta") ||
    catLower.includes("fármaco") ||
    catLower.includes("farmaco")
  return {
    classification: isMed ? "medicamento" : "otros",
    label: isMed ? "Medicamento" : "Medicamento / Otros",
    boxClasses: "border-2 border-blue-500 bg-blue-50 text-blue-900 font-extrabold shadow-2xs dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-600",
    textColor: "text-blue-800 dark:text-blue-300",
    icon: Package,
  }
}

export function isTransactionDeposited(category: string): boolean {
  const lower = (category || "").toLowerCase()
  return (
    lower.includes("[depositado/transferido]") ||
    lower.includes("depositado") ||
    lower.includes("transferencia") ||
    lower.includes("transferido") ||
    lower.includes("depósito") ||
    lower.includes("deposito")
  )
}

export function parseTransactionDetails(t: Transaction) {
  const cat = t.category || ""

  // Extract Doctor
  let doctor = "General / Sin Dr."
  if (cat.includes("[Dr. Médico]")) doctor = "Dr. Médico"
  else if (cat.includes("[Dra. Médica]")) doctor = "Dra. Médica"

  // Extract Patient
  const patientMatch = cat.match(/\[Paciente:\s*([^\]]+)\]/i)
  const patientName = patientMatch ? patientMatch[1].trim() : "Paciente General"

  // Extract Deposited
  const isDeposited = isTransactionDeposited(cat)

  // Clean description: strip doctor, patient, and deposit tags
  let cleanDesc = cat
    .replace(/\[Dr\.\s*Médico\]\s*/gi, "")
    .replace(/\[Dra\.\s*Médica\]\s*/gi, "")
    .replace(/\[Paciente:\s*[^\]]+\]\s*/gi, "")
    .replace(/\[Depositado\/Transferido\]\s*/gi, "")
    .replace(/\(Depositado\)\s*/gi, "")
    .trim()

  if (!cleanDesc) cleanDesc = t.type === "expense" ? "Gasto registrado" : "Venta registrada"

  return {
    doctor,
    patientName,
    isDeposited,
    cleanDesc,
  }
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

  // Report modal state
  const [selectedSaleForReport, setSelectedSaleForReport] = useState<Transaction | null>(null)

  // Filter & sort states
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sortOrder, setSortOrder] = useState<"ingreso_desc" | "ingreso_asc" | "monto_desc" | "monto_asc">("ingreso_desc")

  // Helper create empty item with presets (Precio predeterminado de Q120 según requerimiento)
  const createEmptySaleItem = (
    type: "product" | "custom" = "custom",
    defaultDescription: string = "Consulta médica",
    defaultPrice: number = 120
  ): SaleItem => {
    const isCustom = type === "custom"
    const price = isCustom ? defaultPrice : 0
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      productId: "",
      description: isCustom ? defaultDescription : "",
      quantity: 1,
      unitPrice: price,
      subtotal: price,
    }
  }

  // Sale form states with multiple line items
  const [saleDoctor, setSaleDoctor] = useState<"doctor" | "doctora" | "general">("general")
  const [salePaciente, setSalePaciente] = useState("")
  const [saleFecha, setSaleFecha] = useState(new Date().toISOString().split("T")[0])
  const [saleIsDeposit, setSaleIsDeposit] = useState(false)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([createEmptySaleItem("custom", "Consulta médica", 120)])

  // Expense form
  const [expMonto, setExpMonto] = useState("")
  const [expDescripcion, setExpDescripcion] = useState("")
  const [expFecha, setExpFecha] = useState(new Date().toISOString().split("T")[0])

  // Sale item operations
  const handleAddSaleItem = (
    type: "product" | "custom" = "custom",
    desc: string = "Consulta médica",
    price: number = 120
  ) => {
    setSaleItems((prev) => [...prev, createEmptySaleItem(type, desc, price)])
  }

  const handleRemoveSaleItem = (id: string) => {
    setSaleItems((prev) => {
      if (prev.length <= 1) return [createEmptySaleItem("custom", "Consulta médica", 120)]
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleUpdateItemType = (id: string, type: "product" | "custom") => {
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const price = type === "custom" ? 120 : 0
        const qty = item.quantity || 1
        return {
          ...item,
          type,
          productId: "",
          description: type === "custom" ? "Consulta médica" : "",
          unitPrice: price,
          subtotal: price * qty,
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
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  // Filter transactions by selected date or selected month
  const rawFilteredTransactions = selectedDateFilter
    ? transactions.filter((t) => t.created_at?.startsWith(selectedDateFilter))
    : transactions.filter((t) => {
        if (!t.created_at) return false
        const d = new Date(t.created_at)
        return d.getFullYear() === year && d.getMonth() === month
      })

  // ORDENAR SEGÚN EL INGRESO (Requerimiento: "en el apartado de ventas ordenalas segun el ingreso")
  const filteredTransactions = [...rawFilteredTransactions].sort((a, b) => {
    if (sortOrder === "monto_desc") {
      return Number(b.amount) - Number(a.amount)
    }
    if (sortOrder === "monto_asc") {
      return Number(a.amount) - Number(b.amount)
    }
    if (sortOrder === "ingreso_asc") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    // "ingreso_desc" (Predeterminado): según el ingreso más reciente
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Calculate totals for selected month / filter
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Desglose de ingresos: Depositado/Transferido vs Efectivo
  const totalDeposited = filteredTransactions
    .filter((t) => t.type === "income" && isTransactionDeposited(t.category))
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalCashIncome = totalIncome - totalDeposited

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpenses

  // Apartado de ganancias exclusivo para usuaria secretaria (Q10 por cada consulta)
  const isSecretaria = userRole === "secretaria"
  const consultationSales = filteredTransactions.filter(
    (t) => t.type === "income" && classifySale(t.category, t.type).classification === "consulta"
  )
  const totalConsultationsCount = consultationSales.length
  const secretaryEarnings = totalConsultationsCount * 10

  // Toggle deposit participation on existing transaction
  const handleToggleDeposit = async (t: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const currentlyDeposited = isTransactionDeposited(t.category)
    let updatedCategory = t.category

    if (currentlyDeposited) {
      updatedCategory = updatedCategory
        .replace(/\[Depositado\/Transferido\]\s*/gi, "")
        .replace(/\(Depositado\)\s*/gi, "")
        .trim()
    } else {
      updatedCategory = `[Depositado/Transferido] ${updatedCategory}`.trim()
    }

    const { error } = await supabase
      .from("transactions")
      .update({ category: updatedCategory })
      .eq("id", t.id)

    if (!error) {
      setTransactions((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, category: updatedCategory } : item))
      )
      if (selectedSaleForReport?.id === t.id) {
        setSelectedSaleForReport({ ...selectedSaleForReport, category: updatedCategory })
      }
    } else {
      alert("Error al actualizar estado de depósito: " + error.message)
    }
  }

  // ADD SALE (Validación obligatoria de nombre de paciente y botón depositado/transferido)
  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Requerimiento: Paciente OBLIGATORIO
    if (!salePaciente.trim()) {
      alert("El nombre del paciente es OBLIGATORIO para registrar la venta.")
      return
    }

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

    // 2. Requerimiento: Botón depositado/transferido para participar en ingresos
    const depositTag = saleIsDeposit ? "[Depositado/Transferido] " : ""
    const fullCategory = `${docTag} [Paciente: ${salePaciente.trim()}] ${depositTag}${itemsSummary}`.trim()

    // Mantener la hora actual de registro para orden cronológico estricto de ingreso
    const currentTime = new Date().toTimeString().split(" ")[0] || "12:00:00"
    const timestamp = `${saleFecha}T${currentTime}`

    const newTx = {
      type: "income" as const,
      amount: saleTotal,
      category: fullCategory,
      created_at: timestamp,
    }

    const { data: inserted, error } = await supabase.from("transactions").insert([newTx]).select()

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
      if (inserted && inserted.length > 0) {
        setTransactions((prev) => [inserted[0] as Transaction, ...prev])
      }
      setSaleDialogOpen(false)
      setSalePaciente("")
      setSaleIsDeposit(false)
      setSaleItems([createEmptySaleItem("custom", "Consulta médica", 120)])
      setSaleFecha(new Date().toISOString().split("T")[0])
      router.refresh()
    } else {
      alert("Error al registrar venta: " + error.message)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const currentTime = new Date().toTimeString().split(" ")[0] || "12:00:00"
    const timestamp = `${expFecha}T${currentTime}`

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert([
        {
          type: "expense",
          amount: parseFloat(expMonto),
          category: expDescripcion,
          created_at: timestamp,
        },
      ])
      .select()

    setLoading(false)
    if (!error) {
      if (inserted && inserted.length > 0) {
        setTransactions((prev) => [inserted[0] as Transaction, ...prev])
      }
      setExpenseDialogOpen(false)
      setExpMonto("")
      setExpDescripcion("")
      setExpFecha(new Date().toISOString().split("T")[0])
      router.refresh()
    } else {
      alert("Error: " + error.message)
    }
  }

  const handleDeleteTransaction = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm("¿Está seguro de eliminar esta transacción?")) return
    const { error } = await supabase.from("transactions").delete().eq("id", id)
    if (!error) {
      setTransactions(transactions.filter((t) => t.id !== id))
      if (selectedSaleForReport?.id === id) {
        setSelectedSaleForReport(null)
      }
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
      <div className={`stagger-children grid grid-cols-1 gap-4 ${isSecretaria ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
        {/* Total Ingresos */}
        <div className="card-hover-lift rounded-2xl border theme-income-card p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl theme-income-icon shadow-xs">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold theme-income-label">
                Total Ingresos ({activePeriodLabel})
              </p>
              <p className="text-2xl font-black theme-income-amount">
                Q{totalIncome.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] font-bold">
                <span className="text-emerald-700 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Efectivo: Q{totalCashIncome.toFixed(2)}
                </span>
                <span className="text-blue-700 bg-blue-100/70 dark:bg-blue-950/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Depósitos: Q{totalDeposited.toFixed(2)}
                </span>
              </div>
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
              <p className="text-[11px] text-red-600/80 mt-1 font-medium">
                Egresos operativos y suministros
              </p>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div
          className={`card-hover-lift rounded-2xl border p-4 shadow-sm transition-all duration-300 ${
            balance >= 0
              ? "border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20"
              : "border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                balance >= 0
                  ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                  : "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400"
              }`}
            >
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p
                className={`text-xs font-semibold ${
                  balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
                }`}
              >
                Balance General ({activePeriodLabel})
              </p>
              <p
                className={`text-2xl font-black ${
                  balance >= 0 ? "text-blue-800 dark:text-blue-200" : "text-orange-800 dark:text-orange-200"
                }`}
              >
                {balance < 0 ? "-" : ""}Q
                {Math.abs(balance).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                Ingresos netos − Gastos
              </p>
            </div>
          </div>
        </div>

        {/* Apartado Exclusivo para Secretaria: Ganancias por Consultas (Q10 por consulta) */}
        {isSecretaria && (
          <div className="card-hover-lift rounded-2xl border-2 border-amber-300 dark:border-amber-600 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/60 dark:from-amber-950/50 dark:to-yellow-950/30 p-4 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Ganancias Secretaría
                </p>
                <p className="text-2xl font-black text-amber-950 dark:text-amber-100">
                  Q{secretaryEarnings.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold mt-1">
                  +Q10.00 × {totalConsultationsCount} {totalConsultationsCount === 1 ? "consulta" : "consultas"} ({activePeriodLabel})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Principales: Ventas, Arqueo de Billetes Guatemala, Deudores */}
      <Tabs defaultValue="ventas" className="w-full">
        <TabsList className="rounded-xl bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="ventas" className="rounded-lg text-sm gap-2">
            <DollarSign className="h-4 w-4" />
            Registro de Ventas y Gastos
          </TabsTrigger>
          <TabsTrigger value="arqueo" className="rounded-lg text-sm gap-2 font-bold text-emerald-800 dark:text-emerald-300">
            <Banknote className="h-4 w-4 text-emerald-600" />
            Arqueo de Billetes & Cuadre de Caja
          </TabsTrigger>
          <TabsTrigger value="deudores" className="rounded-lg text-sm gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            Deudores (Personas con Deudas)
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: REGISTRO DE VENTAS Y GASTOS */}
        {/* ========================================================================= */}
        <TabsContent value="ventas" className="mt-4 space-y-5">
          {/* Action Buttons, Ordenamiento & Filtros */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Filtro por día:</span>
              {selectedDateFilter ? (
                <Badge className="bg-primary text-white flex items-center gap-1 font-bold">
                  <CalendarDays className="h-3 w-3" />
                  {selectedDateFilter}
                  <button onClick={() => setSelectedDateFilter(null)} className="ml-1 font-bold hover:text-red-200">
                    ×
                  </button>
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground italic">(Mes completo)</span>
              )}

              {/* Selector de Ordenamiento según el ingreso */}
              <div className="flex items-center gap-1.5 ml-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
                  <SelectTrigger className="h-8 rounded-lg text-xs font-bold border-border bg-card">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso_desc">
                      <span className="font-semibold text-primary">Ingreso: Más recientes primero</span>
                    </SelectItem>
                    <SelectItem value="ingreso_asc">
                      <span>Ingreso: Más antiguos primero</span>
                    </SelectItem>
                    <SelectItem value="monto_desc">
                      <span>Monto: Mayor a menor</span>
                    </SelectItem>
                    <SelectItem value="monto_asc">
                      <span>Monto: Menor a mayor</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!readOnly && (
              <div className="flex flex-wrap gap-2.5">
                {/* Gasto button */}
                <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-xl border-red-300 text-red-600 hover:bg-red-50">
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

                {/* Venta Button */}
                <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm">
                      <Plus className="mr-1.5 h-4 w-4" />
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
                      {/* Doctor, Paciente (Obligatorio) y Fecha */}
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

                        {/* PACIENTE OBLIGATORIO */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                            Paciente <span className="text-red-500 font-black">* (Obligatorio)</span>
                          </Label>
                          <Input
                            list="patients-datalist"
                            placeholder="Nombre del paciente..."
                            required
                            value={salePaciente}
                            onChange={(e) => setSalePaciente(e.target.value)}
                            className="h-10 rounded-xl text-xs font-bold border-primary/40 focus:border-primary"
                          />
                          <datalist id="patients-datalist">
                            {patients.map((p) => (
                              <option key={p.id} value={`${p.first_name} ${p.last_name}`} />
                            ))}
                          </datalist>
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

                      {/* BOTÓN DEPOSITADO / TRANSFERIDO (Participa en Ingresos) */}
                      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          Método de Cobro (Participación en Ingresos)
                        </Label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <Button
                            type="button"
                            onClick={() => setSaleIsDeposit(!saleIsDeposit)}
                            variant={saleIsDeposit ? "default" : "outline"}
                            className={`h-10 rounded-xl text-xs font-bold px-4 transition-all gap-2 ${
                              saleIsDeposit
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-emerald-600"
                                : "border-border hover:bg-muted text-foreground"
                            }`}
                          >
                            <Building2 className="h-4 w-4" />
                            {saleIsDeposit
                              ? "✓ Depositado / Transferido (Participa en Ingresos)"
                              : "💵 Cobro en Efectivo (Clic para marcar Depositado/Transferido)"}
                          </Button>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {saleIsDeposit
                              ? "Esta venta sumará a ingresos y se clasificará como Depósito Bancario."
                              : "Esta venta sumará a ingresos y se clasificará como Efectivo de Caja."}
                          </span>
                        </div>
                      </div>

                      {/* Header de Conceptos / Renglones */}
                      <div className="border-t border-border pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <Label className="text-sm font-bold text-foreground">
                            Conceptos de la Venta ({saleItems.length})
                          </Label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddSaleItem("custom", "Consulta médica")}
                              className="h-8 rounded-lg text-xs gap-1 font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                              title="Agregar concepto de Consulta (Recuadro Verde)"
                            >
                              <Stethoscope className="h-3.5 w-3.5" />
                              + Consulta
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddSaleItem("custom", "Inyección")}
                              className="h-8 rounded-lg text-xs gap-1 font-bold border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100"
                              title="Agregar concepto de Inyección (Recuadro Morado)"
                            >
                              <Syringe className="h-3.5 w-3.5" />
                              + Inyección
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddSaleItem("product")}
                              className="h-8 rounded-lg text-xs gap-1 font-bold border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-100"
                              title="Agregar Medicamento de inventario (Recuadro Azul)"
                            >
                              <Package className="h-3.5 w-3.5" />
                              + Medicamento
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddSaleItem("custom", "Servicio médico")}
                              className="h-8 rounded-lg text-xs gap-1 font-bold border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              + Otro
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
                                        Consulta / Servicio / Inyección
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemType(item.id, "product")}
                                        className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                          isProd
                                            ? "bg-blue-600 text-white shadow-xs font-bold"
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
                                          <span>
                                            Stock: <strong>{selectedProd.stock}</strong> unidades
                                          </span>
                                          <span>•</span>
                                          <span>
                                            Precio catálogo: <strong>Q{(selectedProd.price || 0).toFixed(2)}</strong>
                                          </span>
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
                                      <Label className="text-[10px] text-muted-foreground font-semibold">
                                        Descripción del Concepto
                                      </Label>
                                      <Input
                                        placeholder="Ej: Consulta médica general, Inyección, Ultrasonido..."
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
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Total Venta:
                          </span>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(new Date(year, month - 1))}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h4 className="text-sm font-bold text-card-foreground">
                Calendario de Ventas: {monthNames[month]} {year}
              </h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(new Date(year, month + 1))}
                className="h-8 w-8 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-1">
              <span>Dom</span>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
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

          {/* Transactions Table: Recuadro Verde (Consulta), Morado (Inyecciones), Azul (Medicamento u Otros) */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3.5 text-left">Tipo & Clasificación</th>
                    <th className="px-4 py-3.5 text-left">Paciente</th>
                    <th className="px-4 py-3.5 text-left">Método de Cobro</th>
                    <th className="px-4 py-3.5 text-left">Médico</th>
                    <th className="px-4 py-3.5 text-left">Monto</th>
                    <th className="hidden px-4 py-3.5 text-left sm:table-cell">Descripción</th>
                    <th className="px-4 py-3.5 text-left">Fecha de Ingreso</th>
                    <th className="px-4 py-3.5 text-center">Informe</th>
                    {isAdmin && <th className="px-4 py-3.5 text-center">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((t) => {
                    const isDoctor = t.category.includes("[Dr. Médico]")
                    const isDoctora = t.category.includes("[Dra. Médica]")
                    const details = parseTransactionDetails(t)
                    const classification = classifySale(t.category, t.type)
                    const isDeposited = details.isDeposited
                    const ClassIcon = classification.icon

                    let doctorBadge = "General"
                    let doctorStyle = "bg-muted text-muted-foreground border-border"

                    if (isDoctor) {
                      doctorBadge = "Dr. Médico"
                      doctorStyle = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                    } else if (isDoctora) {
                      doctorBadge = "Dra. Médica"
                      doctorStyle = "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800"
                    }

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedSaleForReport(t)}
                        className="hover:bg-muted/40 transition-colors cursor-pointer group"
                        title="Haz clic para abrir el informe detallado de esta venta"
                      >
                        {/* RECUADRO DE COLOR SEGÚN REQUERIMIENTO:
                            - Verde: Consulta
                            - Morado: Inyecciones
                            - Azul: Medicamento u otros
                        */}
                        <td className="px-4 py-3.5">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-black ${classification.boxClasses}`}>
                            <ClassIcon className="h-3.5 w-3.5" />
                            <span>{classification.label}</span>
                          </div>
                        </td>

                        {/* Paciente */}
                        <td className="px-4 py-3.5 font-bold text-foreground">
                          {details.patientName}
                        </td>

                        {/* Método de Cobro (Depositado/Transferido vs Efectivo) */}
                        <td className="px-4 py-3.5">
                          {t.type === "income" ? (
                            <button
                              type="button"
                              onClick={(e) => handleToggleDeposit(t, e)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isDeposited
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
                              }`}
                              title="Haz clic para alternar entre Efectivo y Depositado/Transferido"
                            >
                              {isDeposited ? (
                                <Building2 className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <DollarSign className="h-3 w-3" />
                              )}
                              <span>{isDeposited ? "Depositado / Transferido" : "Efectivo"}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">—</span>
                          )}
                        </td>

                        {/* Médico Asignado */}
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${doctorStyle}`}>
                            {doctorBadge}
                          </Badge>
                        </td>

                        {/* Monto */}
                        <td
                          className={`px-4 py-3.5 font-black text-sm ${
                            t.type === "income" ? "theme-income-cell-text" : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {t.type === "expense" ? "-" : ""}Q
                          {Number(t.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Descripción Limpia */}
                        <td className="hidden max-w-xs truncate px-4 py-3.5 text-muted-foreground sm:table-cell text-xs">
                          {details.cleanDesc}
                        </td>

                        {/* Fecha y Hora de Ingreso */}
                        <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                          {formatDateTimeGT(t.created_at)}
                        </td>

                        {/* Botón Ver Informe */}
                        <td className="px-4 py-3.5 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSaleForReport(t)
                            }}
                            className="h-8 rounded-lg text-xs gap-1 font-bold text-primary hover:bg-primary/10"
                            title="Ver informe completo"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Informe</span>
                          </Button>
                        </td>

                        {/* Acción Eliminar (Admin) */}
                        {isAdmin && (
                          <td className="px-4 py-3.5 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteTransaction(t.id, e)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Eliminar transacción"
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
                      <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-muted-foreground">
                        No hay transacciones registradas para el filtro actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 2: ARQUEO DE BILLETES DE GUATEMALA Y CUADRE DE CAJA */}
        {/* ========================================================================= */}
        <TabsContent value="arqueo" className="mt-4">
          <CashReconciliationView
            selectedDate={selectedDateFilter}
            suggestedDeposits={totalDeposited}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 3: DEUDORES */}
        {/* ========================================================================= */}
        <TabsContent value="deudores" className="mt-4">
          <DebtorsView
            patients={patients}
            userRole={userRole}
            onAddTransaction={(amt, desc) => {
              const currentTime = new Date().toTimeString().split(" ")[0] || "12:00:00"
              const todayStr = new Date().toISOString().split("T")[0]
              setTransactions([
                {
                  id: `tx-${Date.now()}`,
                  type: "income",
                  amount: amt,
                  category: desc,
                  created_at: `${todayStr}T${currentTime}`,
                },
                ...transactions,
              ])
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* MODAL / DIALOG: INFORME DETALLADO DE VENTA AL DARLE CLIC A UNA TRANSACCIÓN */}
      {/* ========================================================================= */}
      {selectedSaleForReport && (() => {
        const t = selectedSaleForReport
        const details = parseTransactionDetails(t)
        const classification = classifySale(t.category, t.type)
        const ClassIcon = classification.icon

        return (
          <Dialog
            open={!!selectedSaleForReport}
            onOpenChange={(open) => !open && setSelectedSaleForReport(null)}
          >
            <DialogContent className="rounded-2xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Informe Detallado de Venta / Comprobante</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-black border-2 ${classification.boxClasses}`}>
                    <ClassIcon className="h-3.5 w-3.5 inline mr-1" />
                    {classification.label}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2 print:p-0">
                {/* Header de la Clínica */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center space-y-1">
                  <h3 className="text-base font-black uppercase text-foreground tracking-wide">
                    Clínica Médica Familiar San Rafael
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Panajachel, Sololá, Guatemala • Tel: 5801-6387
                  </p>
                  <p className="text-[11px] font-mono text-primary font-bold">
                    Folio / ID: {t.id}
                  </p>
                </div>

                {/* Datos del Paciente y Registro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <span className="text-muted-foreground font-semibold uppercase text-[10px]">
                      Paciente
                    </span>
                    <p className="font-extrabold text-sm text-foreground">
                      {details.patientName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <span className="text-muted-foreground font-semibold uppercase text-[10px]">
                      Fecha y Hora de Ingreso
                    </span>
                    <p className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {formatDateTimeGT(t.created_at)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <span className="text-muted-foreground font-semibold uppercase text-[10px]">
                      Médico Asignado
                    </span>
                    <p className="font-bold text-foreground">
                      {details.doctor}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <span className="text-muted-foreground font-semibold uppercase text-[10px]">
                      Método de Cobro
                    </span>
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <Badge
                        className={`text-xs font-bold ${
                          details.isDeposited
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-blue-100 text-blue-800 border-blue-300"
                        }`}
                      >
                        {details.isDeposited ? "💳 Depositado / Transferido" : "💵 Efectivo"}
                      </Badge>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggleDeposit(t, e)}
                        className="h-6 text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                      >
                        Alternar a {details.isDeposited ? "Efectivo" : "Depositado"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desglose de Conceptos */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Desglose de Conceptos Registrados
                  </span>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed border border-border/50">
                    {details.cleanDesc}
                  </div>
                </div>

                {/* Ganancia Secretaría si es Consulta */}
                {isSecretaria && classification.classification === "consulta" && (
                  <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/20 p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
                          Ganancia de Secretaría por Consulta
                        </span>
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                          Participa con +Q10.00 de ganancia por consulta médica
                        </span>
                      </div>
                    </div>
                    <span className="text-base font-black text-amber-900 dark:text-amber-100 bg-amber-200/70 dark:bg-amber-900/60 px-3 py-1 rounded-xl border border-amber-300">
                      +Q10.00
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                      Total de la Transacción
                    </span>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                      Monto liquidado y registrado en el sistema
                    </p>
                  </div>
                  <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                    Q{Number(t.amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border print:hidden">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-10 rounded-xl text-xs gap-1.5 font-bold"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Comprobante
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSelectedSaleForReport(null)}
                    className="h-10 rounded-xl text-xs px-5 bg-primary text-primary-foreground font-bold"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}
