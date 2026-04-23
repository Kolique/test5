import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Compass } from 'lucide-react'
import { prisma } from '@/lib/db'
import TourViewer from '@/components/TourViewer'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const property = await prisma.property.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true, address: true },
  })
  if (!property) return {}
  return {
    title: `${property.title} — Visite 360°`,
    description:
      property.description ||
      `Visite virtuelle 360° : ${property.title}${property.address ? ` · ${property.address}` : ''}`,
  }
}

export default async function TourPage({
  params,
}: {
  params: { slug: string }
}) {
  const property = await prisma.property.findUnique({
    where: { slug: params.slug },
    include: {
      user: { select: { name: true, agencyName: true } },
      rooms: {
        where: { status: 'ready' },
        orderBy: { order: 'asc' },
        include: {
          hotspots: {
            include: { target: { select: { id: true, name: true } } },
          },
        },
      },
    },
  })
  if (!property || property.rooms.length === 0) notFound()

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div className="flex-1 relative">
        <TourViewer property={JSON.parse(JSON.stringify(property))} />
      </div>
      <footer className="bg-slate-950 text-white/70 text-xs px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="h-3.5 w-3.5" />
          <span>Visite virtuelle par TourVista</span>
        </div>
        <Link href="/" className="hover:text-white transition">
          Créer une visite 360° →
        </Link>
      </footer>
    </div>
  )
}
