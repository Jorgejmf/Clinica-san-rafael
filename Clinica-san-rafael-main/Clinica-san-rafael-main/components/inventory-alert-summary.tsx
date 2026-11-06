"use client"

import { useState } from "react"
import Link from "next/link"

import {
  PackageOpen,
  Pill,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  CircleCheck,
} from "lucide-react"

type Product = {
  id: string

  name?: string | null
  nombre?: string | null

  stock?: number | null
  cantidad?: number | null

  min_stock?: number | null
  minimo?: number | null
}

type InventoryAlertSummaryProps = {
  // Recibe la lista que tu dashboard ya calcula.
  // Aquí no cambiamos las reglas de stock bajo.
  lowStockItems: Product[]
  hasError?: boolean
}

export function InventoryAlertSummary({
  lowStockItems,
  hasError = false,
}: InventoryAlertSummaryProps) {
  const [expanded, setExpanded] = useState(false)

  const total = lowStockItems.length

  const visibleProducts = lowStockItems.slice(
    0,
    expanded ? 6 : 3
  )

  const additionalPreviewCount = Math.min(
    3,
    Math.max(0, total - 3)
  )

  return (
    <section
      className="inventory-summary"
      aria-labelledby="inventory-summary-title"
    >
      <header className="inventory-summary-header">
        <div className="inventory-summary-heading">
          <div className="inventory-summary-icon">
            <PackageOpen aria-hidden="true" />
          </div>

          <div>
            <h2 id="inventory-summary-title">
              Inventario por revisar
            </h2>

            <p>
              Un vistazo a los productos que necesitan
              atención.
            </p>
          </div>
        </div>

        {!hasError && (
          <div
            className="inventory-summary-total"
            aria-label={`${total} productos con alerta`}
          >
            <strong>{total}</strong>
            <span>{total === 1 ? "alerta" : "alertas"}</span>
          </div>
        )}
      </header>

      {hasError ? (
        <div
          className="inventory-summary-empty"
          role="status"
        >
          <h3>No pudimos cargar el inventario</h3>

          <p>
            Actualiza la página para volver a intentarlo.
          </p>
        </div>
      ) : total === 0 ? (
        <div className="inventory-summary-empty">
          <CircleCheck aria-hidden="true" />

          <div>
            <h3>Todo en orden</h3>

            <p>
              No hay productos con alertas de stock.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="inventory-summary-list"
          id="inventory-summary-products"
        >
          {visibleProducts.map((product) => {
            const name =
              product.name ||
              product.nombre ||
              "Producto sin nombre"

            const stock =
              product.stock ?? product.cantidad ?? 0

            const minimum =
              product.min_stock ?? product.minimo ?? 5

            const outOfStock = stock <= 0

            return (
              <article
                className="inventory-summary-row"
                key={product.id}
              >
                <div className="inventory-summary-product">
                  <span className="inventory-product-icon">
                    <Pill aria-hidden="true" />
                  </span>

                  <div>
                    <h3>{name}</h3>

                    <p>
                      Mínimo configurado: {minimum}
                    </p>
                  </div>
                </div>

                <div className="inventory-summary-quantity">
                  <strong>{stock}</strong>

                  <span>
                    {stock === 1
                      ? "disponible"
                      : "disponibles"}
                  </span>
                </div>

                <span
                  className={`inventory-summary-badge ${
                    outOfStock
                      ? "inventory-summary-badge-empty"
                      : "inventory-summary-badge-low"
                  }`}
                >
                  {outOfStock
                    ? "Sin existencias"
                    : "Stock bajo"}
                </span>
              </article>
            )
          })}
        </div>
      )}

      <footer className="inventory-summary-footer">
        <div className="inventory-summary-preview">
          {!hasError && total > 0 && (
            <p aria-live="polite">
              Mostrando {visibleProducts.length} de{" "}
              {total} productos
            </p>
          )}

          {!hasError && total > 3 && (
            <button
              type="button"
              className="inventory-summary-toggle"
              aria-expanded={expanded}
              aria-controls="inventory-summary-products"
              onClick={() => {
                setExpanded((current) => !current)
              }}
            >
              {expanded
                ? "Mostrar menos"
                : `Ver ${additionalPreviewCount} más`}

              {expanded ? (
                <ChevronUp aria-hidden="true" />
              ) : (
                <ChevronDown aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        <Link
          href="/inventario"
          className="inventory-summary-link"
        >
          Revisar inventario completo
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </footer>
    </section>
  )
}
