import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { buildPanorama } from '@/lib/stitching'
import { saveUpload, fetchAsBuffer, removeUpload } from '@/lib/storage'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
        property: true,
        photos: { orderBy: { order: 'asc' } },
      },
    })
    if (!room || room.property.userId !== user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (room.photos.length < 2)
      return NextResponse.json(
        { error: 'Ajoutez au moins 2 photos' },
        { status: 400 }
      )

    await prisma.room.update({
      where: { id: room.id },
      data: { status: 'processing' },
    })

    const previousPano = room.panoramaUrl
    const previousThumb = room.thumbnailUrl

    try {
      const photoBuffers = await Promise.all(
        room.photos.map((p) => fetchAsBuffer(p.url))
      )

      const { panoramaBuffer, thumbnailBuffer, width, height } =
        await buildPanorama(photoBuffers)

      const subdir = `properties/${room.propertyId}/${room.id}/pano`
      const [pano, thumb] = await Promise.all([
        saveUpload(subdir, panoramaBuffer, '.jpg'),
        saveUpload(subdir, thumbnailBuffer, '.jpg'),
      ])

      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: 'ready',
          panoramaUrl: pano.url,
          thumbnailUrl: thumb.url,
          width,
          height,
        },
      })

      // Best-effort cleanup of the previous panorama/thumbnail blobs
      if (previousPano) removeUpload(previousPano).catch(() => {})
      if (previousThumb) removeUpload(previousThumb).catch(() => {})
    } catch (err) {
      console.error('Stitching failed', err)
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'failed' },
      })
      return NextResponse.json(
        { error: 'Échec de la génération' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
