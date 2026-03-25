import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mapstash Backend',
  description: 'Dedicated Next.js backend for the Mapstash app.',
}

type RootLayoutProps = Readonly<{
  children: React.ReactNode
}>

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
