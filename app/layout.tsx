import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getCurrentUser } from '@/lib/auth'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Clinica San Rafael - Sistema de Gestion',
  description: 'Sistema administrativo para la Clinica San Rafael. Gestion de pacientes, citas, ventas e inventario.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#84cc16',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()
  const isSecretaria = user?.role === 'secretaria'

  return (
    <html lang="es" className={`bg-background ${isSecretaria ? 'theme-secretaria' : ''}`}>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
