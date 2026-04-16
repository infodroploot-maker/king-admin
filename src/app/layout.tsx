import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Autofficina King — Dashboard',
  description: 'Pannello di gestione appuntamenti e lavori',
  manifest: '/manifest.json',
  themeColor: '#C2410C',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
