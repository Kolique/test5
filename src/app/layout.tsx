import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TourVista — Visites virtuelles 360° pour agents immobiliers',
  description:
    'Transformez vos photos classiques en visites virtuelles 360° interactives en quelques minutes. Parfait pour SeLoger, Leboncoin et votre site d\'agence.',
  openGraph: {
    title: 'TourVista — Visites virtuelles 360°',
    description: 'Des photos à une visite 360° en quelques minutes.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
