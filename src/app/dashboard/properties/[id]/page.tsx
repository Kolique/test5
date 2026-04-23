import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { ArrowLeft, ExternalLink, Code2 } from 'lucide-react'
import PropertyEditor from '@/components/PropertyEditor'

export default async function PropertyPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireUser()

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      rooms: {
        orderBy: { order: 'asc' },
        include: {
          photos: { orderBy: { order: 'asc' } },
          hotspots: { include: { target: true } },
        },
      },
    },
  })
  if (!property) notFound()
  if (property.userId !== user.id) redirect('/dashboard')

  const tourUrl = `/tour/${property.slug}`

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Mes biens
        </Link>
        <div className="flex gap-2">
          <Link
            href={tourUrl}
            target="_blank"
            className="btn-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir la visite
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{property.title}</h1>
        {property.address && (
          <p className="text-sm text-slate-500 mt-1">{property.address}</p>
        )}
      </div>

      <PropertyEditor property={JSON.parse(JSON.stringify(property))} />
    </div>
  )
}
