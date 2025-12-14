import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Risk Battle Simulator',
  description: 'AI-powered tactical battle simulations for Risk board games',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

