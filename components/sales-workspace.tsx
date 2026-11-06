"use client"

import {
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  Banknote,
  Calculator,
  ReceiptText,
  Users,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Save,
  CheckCircle2,
} from "lucide-react"

/* Los importes deben ser positivos.
   El tipo determina si suman o restan. */
export type SalesMovement = {
  id: string
  date: string // YYYY-MM-DD, en hora de Guatemala
  type: "income" | "expense"
  amount: number
  paymentMethod: "cash" | "transfer" | "unknown"
}

export type SalesWorkspaceProps = {
  movements: SalesMovement[]
  selectedDate: string
  onDateChange: (date: string) => void
  secretaryProfit?: number
  onRegisterSale?: () => void
  onRegisterExpense?: () => void
  transactionsContent: ReactNode
  debtorsContent: ReactNode
  readOnly?: boolean
}

const BILL_VALUES = [200, 100, 50, 20, 10, 5, 1]

function money(cents: number) {
  return `Q ${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function parseMoney(value: string) {
  const text = value.trim()
  if (text === "") return 0
  if (!/^\d+(\.\d{0,2})?$/.test(text)) {
    return NaN
  }
  const result = Math.round(Number(text) * 100)
  return Number.isSafeInteger(result) ? result : NaN
}

function amountInCents(amount: number) {
  return Math.round(amount * 100)
}

export function SalesWorkspace({
  movements,
  selectedDate,
  onDateChange,
  secretaryProfit = 0,
  onRegisterSale,
  onRegisterExpense,
  transactionsContent,
  debtorsContent,
  readOnly = false,
}: SalesWorkspaceProps) {
  const [tab, setTab] = useState<"transactions" | "cash" | "debtors">("transactions")

  const dailyMovements = movements.filter(
    (movement) => movement.date === selectedDate
  )

  const income = dailyMovements
    .filter((movement) => movement.type === "income")
    .reduce(
      (total, movement) =>
        total + amountInCents(movement.amount),
      0
    )

  const expenses = dailyMovements
    .filter((movement) => movement.type === "expense")
    .reduce(
      (total, movement) =>
        total + amountInCents(movement.amount),
      0
    )

  const metrics = [
    {
      label: "Ingresos del día",
      value: income,
      icon: TrendingUp,
    },
    {
      label: "Gastos del día",
      value: expenses,
      icon: TrendingDown,
    },
    {
      label: "Balance del día",
      value: income - expenses,
      icon: Wallet,
    },
    {
      label: "Ganancias secretaría",
      value: amountInCents(secretaryProfit),
      icon: Sparkles,
    },
  ]

  const tabs = [
    {
      id: "transactions" as const,
      label: "Ventas y gastos",
      icon: ReceiptText,
    },
    {
      id: "cash" as const,
      label: "Arqueo y cuadre de caja",
      icon: Calculator,
    },
    {
      id: "debtors" as const,
      label: "Deudores",
      icon: Users,
    },
  ]

  return (
    <section className="sales-workspace">
      <header className="sales-heading">
        <div>
          <p className="sales-eyebrow">
            Administración de la clínica
          </p>

          <h1>Ventas, gastos y deudores</h1>

          <p className="sales-description">
            Movimientos y cuadre de caja en un mismo espacio.
          </p>
        </div>

        <label className="sales-date">
          <span>Fecha de consulta</span>

          <input
            type="date"
            value={selectedDate}
            required
            onChange={(event) => {
              if (event.target.value) {
                onDateChange(event.target.value)
              }
            }}
          />
        </label>
      </header>

      <div className="sales-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <article
              className="sales-metric"
              key={metric.label}
            >
              <div className="sales-metric-heading">
                <span>{metric.label}</span>
                <Icon aria-hidden="true" />
              </div>

              <strong>{money(metric.value)}</strong>
            </article>
          )
        })}
      </div>

      <div
        className="sales-tabs"
        role="tablist"
        aria-label="Secciones de ventas"
      >
        {tabs.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.id}
              id={`sales-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`sales-panel-${item.id}`}
              onClick={() => setTab(item.id)}
            >
              <Icon aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>

      <section
        id="sales-panel-transactions"
        role="tabpanel"
        aria-labelledby="sales-tab-transactions"
        hidden={tab !== "transactions"}
      >
        <div className="sales-register-heading">
          <div>
            <h2>Registro de movimientos</h2>

            <p className="sales-description">
              Ventas y gastos de la fecha seleccionada.
            </p>
          </div>

          {!readOnly && (
            <div className="sales-buttons">
              <button
                type="button"
                className="sales-button"
                onClick={onRegisterExpense}
              >
                <Minus aria-hidden="true" />
                Registrar gasto
              </button>

              <button
                type="button"
                className="sales-button sales-button-primary"
                onClick={onRegisterSale}
              >
                <Plus aria-hidden="true" />
                Registrar venta
              </button>
            </div>
          )}
        </div>

        {/* Tu tabla y formularios reales */}
        {transactionsContent}
      </section>

      <section
        id="sales-panel-cash"
        role="tabpanel"
        aria-labelledby="sales-tab-cash"
        hidden={tab !== "cash"}
      >
        <CashReconciliationTable
          key={selectedDate}
          date={selectedDate}
          movements={dailyMovements}
        />
      </section>

      <section
        id="sales-panel-debtors"
        role="tabpanel"
        aria-labelledby="sales-tab-debtors"
        hidden={tab !== "debtors"}
      >
        {debtorsContent}
      </section>
    </section>
  )
}

export function CashReconciliationTable({
  movements,
  date,
}: {
  movements: SalesMovement[]
  date?: string
}) {
  const activeDate = date || new Date().toISOString().split("T")[0]
  const storageKey = `cuadre_digital_gt_${activeDate}`

  const [counts, setCounts] = useState<Record<number, string>>(
    () =>
      Object.fromEntries(
        BILL_VALUES.map((value) => [value, "0"])
      )
  )

  const [base, setBase] = useState("1000")
  const [manualExpenses, setManualExpenses] = useState("0")
  const [manualTransfers, setManualTransfers] = useState("0")
  const [reviewed, setReviewed] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Cargar datos guardados para esta fecha desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.counts) setCounts(parsed.counts)
        if (parsed.base !== undefined) setBase(String(parsed.base))
        else setBase("1000")
        if (parsed.manualExpenses !== undefined) setManualExpenses(String(parsed.manualExpenses))
        if (parsed.manualTransfers !== undefined) setManualTransfers(String(parsed.manualTransfers))
        if (parsed.reviewed !== undefined) setReviewed(Boolean(parsed.reviewed))
      } else {
        setCounts(Object.fromEntries(BILL_VALUES.map((value) => [value, "0"])))
        setBase("1000")
        setManualExpenses("0")
        setManualTransfers("0")
        setReviewed(false)
      }
    } catch {
      // Ignorar errores de parsing
    }
  }, [storageKey])

  const saveToStorage = (
    newCounts = counts,
    newBase = base,
    newExpenses = manualExpenses,
    newTransfers = manualTransfers,
    newReviewed = reviewed
  ) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          date: activeDate,
          counts: newCounts,
          base: newBase,
          manualExpenses: newExpenses,
          manualTransfers: newTransfers,
          reviewed: newReviewed,
          savedAt: new Date().toISOString(),
        })
      )
    } catch {
      // Ignorar errores de storage
    }
  }

  const handleSave = () => {
    saveToStorage(counts, base, manualExpenses, manualTransfers, reviewed)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const baseCents = parseMoney(base)
  const expensesManualCents = parseMoney(manualExpenses)
  const transfersManualCents = parseMoney(manualTransfers)

  const validCounts = BILL_VALUES.every((value) => {
    const count = Number(counts[value])
    return Number.isSafeInteger(count) && count >= 0
  })

  const validManualAmounts = [
    baseCents,
    expensesManualCents,
    transfersManualCents,
  ].every(Number.isFinite)

  const validMovements = movements.every(
    (movement) =>
      Number.isFinite(movement.amount) &&
      movement.amount >= 0
  )

  const valid =
    validCounts &&
    validManualAmounts &&
    validMovements

  const unclassifiedMovements = movements.filter(
    (movement) => movement.paymentMethod === "unknown"
  )

  const sum = (
    type: SalesMovement["type"],
    method?: SalesMovement["paymentMethod"]
  ) =>
    movements
      .filter(
        (movement) =>
          movement.type === type &&
          (!method || movement.paymentMethod === method)
      )
      .reduce(
        (total, movement) =>
          total + amountInCents(movement.amount),
        0
      )

  const cashIncome = sum("income", "cash")
  const cashExpenses = sum("expense", "cash")
  const transferIncome = sum("income", "transfer")

  const totalIncome = sum("income")
  const totalExpenses = sum("expense")

  const physicalCash = BILL_VALUES.reduce(
    (total, denomination) => {
      const count = Number(counts[denomination])

      if (!Number.isSafeInteger(count) || count < 0) {
        return total
      }

      return total + denomination * 100 * count
    },
    0
  )

  const billCount = BILL_VALUES.reduce(
    (total, denomination) => {
      const count = Number(counts[denomination])

      return total + (
        Number.isSafeInteger(count) && count >= 0
          ? count
          : 0
      )
    },
    0
  )

  const canCompare =
    valid && unclassifiedMovements.length === 0

  const expectedCash = canCompare
    ? baseCents + cashIncome - cashExpenses
    : null

  const manualClosingTotal =
    physicalCash + transfersManualCents

  const expectedClosingTotal =
    expectedCash === null
      ? null
      : expectedCash + transferIncome

  const comparisons = [
    {
      label: "Efectivo en caja",
      manual: physicalCash,
      digital: expectedCash,
    },
    {
      label: "Comprobantes de gastos",
      manual: expensesManualCents,
      digital: valid ? totalExpenses : null,
    },
    {
      label: "Transferencias recibidas",
      manual: transfersManualCents,
      digital: canCompare ? transferIncome : null,
    },
    {
      label: "Total del cierre",
      manual: manualClosingTotal,
      digital: expectedClosingTotal,
    },
  ]

  const hasDifferences = comparisons.some(
    (item) =>
      item.digital !== null &&
      item.manual !== item.digital
  )

  function updateCount(
    denomination: number,
    value: string
  ) {
    setCounts((previous) => {
      const updated = {
        ...previous,
        [denomination]: value,
      }
      saveToStorage(updated, base, manualExpenses, manualTransfers, false)
      return updated
    })
    setReviewed(false)
  }

  function editableAmount(
    label: string,
    value: string,
    setter: (value: string) => void,
    field: "base" | "expenses" | "transfers"
  ) {
    return (
      <input
        className="cash-money-input"
        type="number"
        min="0"
        step="0.01"
        value={value}
        aria-label={`${label} en quetzales`}
        onChange={(event) => {
          const val = event.target.value
          setter(val)
          setReviewed(false)
          if (field === "base") {
            saveToStorage(counts, val, manualExpenses, manualTransfers, false)
          } else if (field === "expenses") {
            saveToStorage(counts, base, val, manualTransfers, false)
          } else if (field === "transfers") {
            saveToStorage(counts, base, manualExpenses, val, false)
          }
        }}
      />
    )
  }

  const summaries = [
    {
      label: "Cantidad de billetes",
      manual: valid ? `${billCount} billetes` : "—",
      digital: "—",
    },
    {
      label: "Fondo inicial",
      manual: editableAmount("Fondo inicial", base, setBase, "base"),
      digital: "—",
    },
    {
      label: "Comprobantes de gastos",
      manual: editableAmount(
        "Comprobantes de gastos",
        manualExpenses,
        setManualExpenses,
        "expenses"
      ),
      digital: valid ? money(totalExpenses) : "—",
    },
    {
      label: "Efectivo en caja",
      manual: valid ? money(physicalCash) : "—",
      digital:
        expectedCash === null
          ? "Por revisar"
          : money(expectedCash),
    },
    {
      label: "Transferencias recibidas",
      manual: editableAmount(
        "Transferencias verificadas",
        manualTransfers,
        setManualTransfers,
        "transfers"
      ),
      digital: canCompare
        ? money(transferIncome)
        : "Por revisar",
    },
    {
      label: "Ventas / cobros del día",
      manual: "—",
      digital: valid ? money(totalIncome) : "—",
    },
    {
      label: "Total caja + transferencias",
      manual: valid ? money(manualClosingTotal) : "—",
      digital:
        expectedClosingTotal === null
          ? "Por revisar"
          : money(expectedClosingTotal),
    },
  ]

  return (
    <div className="cash-section">
      <div className="cash-heading">
        <div>
          <h2>Arqueo y cuadre de caja</h2>

          <p className="sales-description">
            Solo billetes de Q200 a Q1 · Fecha: {activeDate}
          </p>
        </div>

        <button
          type="button"
          className="sales-button sales-button-primary"
          onClick={handleSave}
          title="Guardar el cuadre de caja en este dispositivo"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 aria-hidden="true" />
              ¡Guardado!
            </>
          ) : (
            <>
              <Save aria-hidden="true" />
              Guardar cuadre
            </>
          )}
        </button>
      </div>

      <div className="cash-sheet">
        <table className="cash-table">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>

          <thead>
            <tr className="cash-group-heading">
              <th colSpan={3} scope="colgroup">
                Billetes · Q200 a Q1
              </th>

              <th colSpan={3} scope="colgroup">
                Resumen de caja y transferencias
              </th>
            </tr>

            <tr>
              <th scope="col">Valor</th>
              <th scope="col">Cant.</th>
              <th scope="col">Total</th>
              <th scope="col">Concepto</th>
              <th scope="col">Manual / base</th>
              <th scope="col">Digital</th>
            </tr>
          </thead>

          <tbody>
            {BILL_VALUES.map((denomination, index) => {
              const count = Number(counts[denomination])

              const rowIsValid =
                Number.isSafeInteger(count) &&
                count >= 0

              const summary = summaries[index]

              return (
                <tr key={denomination}>
                  <td className="cash-denomination">
                    Q{denomination}
                  </td>

                  <td>
                    <input
                      className="cash-count-input"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={counts[denomination]}
                      aria-invalid={!rowIsValid}
                      aria-label={
                        `Cantidad de billetes de Q${denomination}`
                      }
                      onChange={(event) => {
                        updateCount(
                          denomination,
                          event.target.value
                        )
                      }}
                    />
                  </td>

                  <td>
                    {rowIsValid
                      ? money(denomination * 100 * count)
                      : "—"}
                  </td>

                  <td className="cash-summary-label">
                    {summary.label}
                  </td>

                  <td>{summary.manual}</td>

                  <td>{summary.digital}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Diferencias debajo, nunca como columna extra */}
        <section
          className="cash-differences"
          aria-label="Diferencias automáticas"
        >
          <h3>Diferencias automáticas</h3>

          <div className="cash-difference-grid">
            {comparisons.map((item) => {
              const difference =
                item.digital === null || !valid
                  ? null
                  : item.manual - item.digital

              const className =
                difference === null
                  ? ""
                  : difference < 0
                    ? "is-short"
                    : difference > 0
                      ? "is-over"
                      : "is-balanced"

              return (
                <div
                  className="cash-difference-item"
                  key={item.label}
                >
                  <span>{item.label}</span>

                  <strong className={className}>
                    {difference === null
                      ? "Por revisar"
                      : difference === 0
                        ? "Cuadra"
                        : `${difference < 0 ? "Faltan" : "Sobran"} ${
                            money(Math.abs(difference))
                          }`}
                  </strong>
                </div>
              )
            })}
          </div>
        </section>

        <p className="cash-equation">
          Efectivo esperado = fondo inicial
          + ventas en efectivo
          − gastos pagados en efectivo.
          Las transferencias recibidas se suman aparte.
        </p>
      </div>

      {unclassifiedMovements.length > 0 && (
        <p className="cash-warning" role="status">
          Hay {unclassifiedMovements.length} movimiento(s)
          sin medio de pago identificado.
          Clasifícalos antes de confirmar el cuadre.
        </p>
      )}

      <footer className="cash-footer">
        <p role="status">
          {!valid
            ? "Revisa las cantidades y los montos."
            : !canCompare
              ? "Cuadre pendiente de clasificación."
              : hasDifferences
                ? reviewed
                  ? "Revisión realizada: hay diferencias."
                  : "Diferencias provisionales mientras cuentas."
                : reviewed
                  ? "Revisión realizada: todo cuadra."
                  : "Todo cuadra · Conteo en curso."}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="sales-button sales-button-primary"
            onClick={handleSave}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 aria-hidden="true" />
                ¡Guardado!
              </>
            ) : (
              <>
                <Save aria-hidden="true" />
                Guardar cuadre
              </>
            )}
          </button>

          <button
            type="button"
            className="sales-button"
            disabled={!canCompare}
            onClick={() => {
              setReviewed(true)
              saveToStorage(counts, base, manualExpenses, manualTransfers, true)
            }}
          >
            Finalizar revisión
          </button>
        </div>
      </footer>

      <p className="cash-footnote">
        El conteo incluye el fondo inicial.
        “Finalizar revisión” solo marca la revisión en pantalla;
        no guarda un cierre en la base de datos.
      </p>
    </div>
  )
}
