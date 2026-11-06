"use client"

import { useEffect, useRef, useState } from "react"

const messages = [
  {
    title: "Cada cuidado,",
    subtitle: "un paso adelante.",
  },
  {
    title: "Tu dedicación",
    subtitle: "transforma vidas.",
  },
  {
    title: "Hoy también",
    subtitle: "haces la diferencia.",
  },
  {
    title: "Pequeños cuidados,",
    subtitle: "grandes cambios.",
  },
  {
    title: "Escuchar también",
    subtitle: "es cuidar.",
  },
  {
    title: "Una sonrisa,",
    subtitle: "un nuevo comienzo.",
  },
  {
    title: "Cuidamos juntos,",
    subtitle: "avanzamos juntos.",
  },
  {
    title: "Tu compromiso",
    subtitle: "deja huella.",
  },
]

const STORAGE_KEY = "san-rafael-last-motivation"

export function MotivationalMessage() {
  const [message, setMessage] = useState(messages[0])

  // Evita elegir dos veces en el modo de desarrollo de React.
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let previousIndex = -1

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)

      if (stored !== null) {
        previousIndex = Number(stored)
      }
    } catch {
      // El mensaje funciona aunque el navegador bloquee
      // el almacenamiento.
    }

    // Evita repetir el mensaje anterior.
    const availableIndexes = messages
      .map((_, index) => index)
      .filter((index) => index !== previousIndex)

    const selectedIndex =
      availableIndexes[
      Math.floor(Math.random() * availableIndexes.length)
      ]

    setMessage(messages[selectedIndex])

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        String(selectedIndex)
      )
    } catch {
      // No afecta al resto del dashboard.
    }
  }, [])

  return (
    <h2 className="hero-title">
      {message.title}
      <br />
      <span>{message.subtitle}</span>
    </h2>
  )
}
