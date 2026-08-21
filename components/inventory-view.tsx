"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Package, AlertTriangle, Search, Trash2, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Product = {
  id: string
  name: string
  stock: number
  min_stock: number
  price?: number
}

export function InventoryView({
  initialInventory,
  readOnly = false,
  userRole = "secretaria",
}: {
  initialInventory: Product[]
  readOnly?: boolean
  userRole?: string
}) {
  const router = useRouter()
  const isAdmin = userRole === "admin"
  const [inventory, setInventory] = useState<Product[]>(initialInventory)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  
  // Add Product Form State
  const [newName, setNewName] = useState("")
  const [newStock, setNewStock] = useState("0")
  const [newMinStock, setNewMinStock] = useState("0")
  const [newPrice, setNewPrice] = useState("0.00")

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [inventory, search])

  const lowStockCount = useMemo(() => {
    return inventory.filter((i) => i.stock <= i.min_stock).length
  }, [inventory])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const productData = {
      name: newName,
      stock: parseInt(newStock),
      min_stock: parseInt(newMinStock),
      price: parseFloat(newPrice) || 0,
    }

    const { data, error } = await supabase.from("products").insert([productData])

    setLoading(false)
    if (!error) {
      setDialogOpen(false)
      setNewName("")
      setNewStock("0")
      setNewMinStock("0")
      setNewPrice("0.00")
      router.refresh()
    } else {
      alert("Error: " + error.message)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setLoading(true)

    const { error } = await supabase
      .from("products")
      .update({
        name: editItem.name,
        stock: editItem.stock,
        min_stock: editItem.min_stock,
        price: editItem.price || 0,
      })
      .eq("id", editItem.id)

    setLoading(false)
    if (!error) {
      setEditDialogOpen(false)
      setEditItem(null)
      router.refresh()
    } else {
      alert("Error: " + error.message)
    }
  }

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar el producto ${name}?`)) return
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (!error) {
      setInventory(inventory.filter((i) => i.id !== id))
      router.refresh()
    } else {
      alert("Error al eliminar producto: " + error.message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary + add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Productos</p>
                <p className="text-xl font-bold text-card-foreground">
                  {inventory.length}
                </p>
              </div>
            </div>
          </div>
          {lowStockCount > 0 && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stock Bajo</p>
                  <p className="text-xl font-bold text-card-foreground">
                    {lowStockCount}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!readOnly && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Producto de Inventario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Nombre del Producto / Medicamento</Label>
                <Input
                  placeholder="Ej. Acetaminofén 500mg"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="h-11 rounded-xl text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Precio de Venta (Q)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                  className="h-11 rounded-xl text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Cantidad (Stock)</Label>
                  <Input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    required
                    min="0"
                    className="h-11 rounded-xl text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Mínimo Permitido</Label>
                  <Input
                    type="number"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    required
                    min="0"
                    className="h-11 rounded-xl text-base"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Guardando..." : "Agregar Producto"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-card border-border focus-visible:ring-primary text-base"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Producto</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Precio</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Cantidad</th>
                <th className="hidden px-5 py-3 text-center font-medium text-muted-foreground sm:table-cell">Mínimo</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Estado</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const isLowStock = item.stock <= item.min_stock
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isLowStock
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-card-foreground">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">
                      Q{(item.price || 0).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-card-foreground">
                      {item.stock}
                    </td>
                    <td className="hidden px-5 py-3 text-center text-muted-foreground sm:table-cell">
                      {item.min_stock}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge
                        variant={isLowStock ? "destructive" : "secondary"}
                        className={!isLowStock ? "bg-primary/15 text-primary hover:bg-primary/20" : ""}
                      >
                        {isLowStock ? "Stock Bajo" : "Normal"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {!readOnly && (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs"
                            onClick={() => {
                              setEditItem(item)
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(item.id, item.name)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                      {readOnly && <span className="text-xs text-muted-foreground">&mdash;</span>}
                    </td>
                  </tr>
                )
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    {search ? "No se encontraron productos que coincidan con la búsqueda." : "No hay productos en el inventario."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Producto de Inventario</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={handleEditProduct} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Nombre</Label>
                <Input
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="h-11 rounded-xl text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Precio de Venta (Q)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editItem.price || 0}
                  onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) || 0 })}
                  className="h-11 rounded-xl text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Cantidad (Stock)</Label>
                  <Input
                    type="number"
                    value={editItem.stock}
                    onChange={(e) => setEditItem({ ...editItem, stock: parseInt(e.target.value) || 0 })}
                    className="h-11 rounded-xl text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Mínimo</Label>
                  <Input
                    type="number"
                    value={editItem.min_stock}
                    onChange={(e) => setEditItem({ ...editItem, min_stock: parseInt(e.target.value) || 0 })}
                    className="h-11 rounded-xl text-base"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
