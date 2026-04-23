import { NextResponse } from 'next/server'
import path from 'path'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { buildPanorama } from '@/lib/stitching'
import { ensureUploadDir, publicUrl, localPathFromUrl } from '@/lib/storage'
import { shortId } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 120

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

    // Mark processing synchronously, then run stitching in-band (fast enough for MVP)
    await prisma.room.update({
      where: { id: room.id },
      data: { status: 'processing' },
    })

    // Run the stitch
    try {
      const subdir = `properties/${room.propertyId}/${room.id}/pano`
      const outDir = await ensureUploadDir(subdir)
      const panoFilename = `pano-${shortId()}.jpg`
      const thumbFilename = `thumb-${shortId()}.jpg`
      const outputPath = path.join(outDir, panoFilename)
      const thumbPath = path.join(outDir, thumbFilename)

      const photoPaths = room.photos.map((p) => localPathFromUrl(p.url))

      const { width, height } = await buildPanorama(
        photoPaths,
        outputPath,
        thumbPath
      )

      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: 'ready',
          panoramaUrl: publicUrl(subdir, panoFilename),
          thumbnailUrl: publicUrl(subdir, thumbFilename),
          width,
          height,
        },
      })
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
