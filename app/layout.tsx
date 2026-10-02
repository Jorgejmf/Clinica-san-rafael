import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getCurrentUser } from '@/lib/auth'
import { ThemeProvider } from '@/components/theme-provider'
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
  themeColor: '#0c1017',
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
      <body className={`${inter.variable} font-sans antialiased selection:bg-primary/20 selection:text-primary`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
