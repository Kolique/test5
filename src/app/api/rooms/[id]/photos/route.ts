import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { prisma } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { saveUpload } from '@/lib/storage'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser()
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: { property: true },
    })
    if (!room || room.property.userId !== user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const form = await req.formData()
    const files = form.getAll('files') as File[]
    if (files.length === 0)
      return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })

    const existingCount = await prisma.photo.count({ where: { roomId: room.id } })
    const saved: { url: string; order: number }[] = []

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (!f.type.startsWith('image/')) continue
      const raw = Buffer.from(await f.arrayBuffer())
      // Normalize: auto-rotate, resize to max 2400px, convert to jpeg for consistency
      const processed = await sharp(raw)
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer()

      const { url } = await saveUpload(
        `properties/${room.propertyId}/${room.id}`,
        processed,
        '.jpg'
      )
      saved.push({ url, order: existingCount + i })
    }

    await prisma.photo.createMany({
      data: saved.map((s) => ({
        roomId: room.id,
        url: s.url,
        order: s.order,
      })),
    })

    return NextResponse.json({ ok: true, uploaded: saved.length })
  } catch (err: any) {
    console.error('Upload error', err)
    if (err?.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    return NextResponse.json({ error: 'Erreur upload' }, { status: 500 })
  }
}
