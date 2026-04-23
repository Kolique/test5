import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import TourViewer from '@/components/TourViewer'

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function EmbedPage({
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
    <div className="fixed inset-0 bg-black">
      <TourViewer property={JSON.parse(JSON.stringify(property))} embed />
    </div>
  )
}
