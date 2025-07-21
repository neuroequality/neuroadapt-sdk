'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { PreferenceProvider } from '@/components/providers/preference-provider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NeuroAdapt SDK - Accessibility for Everyone</title>
        <meta name="description" content="Interactive demo and documentation for the NeuroAdapt SDK" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <a href="#main-content" className="neuroadapt-skip-link">
          Skip to main content
        </a>
        <PreferenceProvider>
          {children}
        </PreferenceProvider>
      </body>
    </html>
  )
}