import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getCurrentUser } from '@/lib/auth'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['300','400','500','600','700','800'] })

export const metadata: Metadata = {
  title: 'Clinica San Rafael - Sistema de Gestion',
  description: 'Sistema administrativo para la Clinica San Rafael. Gestion de pacientes, citas, ventas e inventario.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#16834D',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()
  const isSecretaria = user?.role === 'secretaria'

  return (
    <html lang="es" suppressHydrationWarning className={`bg-background ${isSecretaria ? 'theme-secretaria' : ''}`}>
      <body className={`${manrope.variable} font-sans antialiased selection:bg-primary/20 selection:text-primary`}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
